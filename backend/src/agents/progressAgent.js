/**
 * Progress & Recommendation Agent
 * Analyzes performance and provides personalized recommendations.
 */
const { generateText } = require('../utils/granite');
const db = require('../database');

function getProgressData(profileId) {
  const subjects = db.prepare('SELECT * FROM subjects WHERE profile_id = ?').all(profileId);

  const subjectProgress = subjects.map(s => {
    const allTopics = db.prepare('SELECT * FROM topics WHERE subject_id = ?').all(s.id);
    const completedTopics = allTopics.filter(t => t.is_completed).length;

    const quizStats = db.prepare(`
      SELECT AVG(CAST(score AS REAL) / NULLIF(total_questions, 0) * 100) as avg_score,
             COUNT(*) as quiz_count,
             SUM(score) as total_correct,
             SUM(total_questions) as total_questions
      FROM quiz_sessions
      WHERE profile_id = ? AND subject_id = ? AND completed = 1
    `).get(profileId, s.id);

    const studyHours = db.prepare(`
      SELECT COALESCE(SUM(hours), 0) as total_hours
      FROM study_sessions
      WHERE profile_id = ? AND subject_id = ?
    `).get(profileId, s.id);

    const flashcardCount = db.prepare(`
      SELECT COUNT(*) as count FROM flashcards WHERE profile_id = ? AND subject_id = ?
    `).get(profileId, s.id);

    return {
      subject: s,
      totalTopics: allTopics.length,
      completedTopics,
      progressPercent: allTopics.length > 0 ? Math.round((completedTopics / allTopics.length) * 100) : 0,
      avgQuizScore: Math.round(quizStats?.avg_score || 0),
      quizCount: quizStats?.quiz_count || 0,
      studyHours: studyHours?.total_hours || 0,
      flashcardCount: flashcardCount?.count || 0,
    };
  });

  // Overall stats
  const totalQuizzes = db.prepare(`
    SELECT COUNT(*) as count FROM quiz_sessions WHERE profile_id = ? AND completed = 1
  `).get(profileId);

  const overallScore = db.prepare(`
    SELECT AVG(CAST(score AS REAL) / NULLIF(total_questions, 0) * 100) as avg
    FROM quiz_sessions WHERE profile_id = ? AND completed = 1
  `).get(profileId);

  const totalStudyHours = db.prepare(`
    SELECT COALESCE(SUM(hours), 0) as total FROM study_sessions WHERE profile_id = ?
  `).get(profileId);

  const totalFlashcards = db.prepare(`
    SELECT COUNT(*) as count FROM flashcards WHERE profile_id = ?
  `).get(profileId);

  const recentQuizzes = db.prepare(`
    SELECT qs.*, s.name as subject_name,
           ROUND(CAST(qs.score AS REAL) / NULLIF(qs.total_questions, 0) * 100, 1) as percentage
    FROM quiz_sessions qs
    LEFT JOIN subjects s ON qs.subject_id = s.id
    WHERE qs.profile_id = ? AND qs.completed = 1
    ORDER BY qs.created_at DESC LIMIT 10
  `).all(profileId);

  return {
    subjectProgress,
    totalQuizzes: totalQuizzes?.count || 0,
    overallAvgScore: Math.round(overallScore?.avg || 0),
    totalStudyHours: Math.round((totalStudyHours?.total || 0) * 10) / 10,
    totalFlashcards: totalFlashcards?.count || 0,
    recentQuizzes,
  };
}

async function generateRecommendations(profileId) {
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profileId);
  if (!profile) throw new Error('Profile not found');

  const progress = getProgressData(profileId);

  const weakSubjects = progress.subjectProgress
    .filter(s => s.avgQuizScore > 0 && s.avgQuizScore < 60)
    .map(s => `${s.subject.name} (avg score: ${s.avgQuizScore}%)`);

  const neglectedSubjects = progress.subjectProgress
    .filter(s => s.studyHours < 1 && s.totalTopics > 0)
    .map(s => s.subject.name);

  const incompleteSubjects = progress.subjectProgress
    .filter(s => s.progressPercent < 50)
    .map(s => `${s.subject.name} (${s.progressPercent}% topics complete)`);

  const examDate = profile.exam_date ? new Date(profile.exam_date) : null;
  const daysUntilExam = examDate
    ? Math.max(0, Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  const prompt = `You are an AI academic advisor. Analyze the student's study performance and provide personalized recommendations.

Student: ${profile.name}
Overall quiz score: ${progress.overallAvgScore}%
Total study hours: ${progress.totalStudyHours}
Total quizzes completed: ${progress.totalQuizzes}
Flashcards created: ${progress.totalFlashcards}
${daysUntilExam !== null ? `Days until exam: ${daysUntilExam}` : ''}

${weakSubjects.length > 0 ? `Weak subjects (low quiz scores):\n${weakSubjects.map(s => `- ${s}`).join('\n')}` : 'No weak subjects identified yet.'}

${neglectedSubjects.length > 0 ? `Neglected subjects (very little study time):\n${neglectedSubjects.map(s => `- ${s}`).join('\n')}` : ''}

${incompleteSubjects.length > 0 ? `Subjects with incomplete topics:\n${incompleteSubjects.map(s => `- ${s}`).join('\n')}` : ''}

Provide specific, actionable recommendations:
1. Priority study areas
2. Study strategies for weak subjects
3. Time management advice
4. Exam preparation tips
5. Motivational guidance

Be specific, empathetic, and practical. Avoid generic advice.`;

  const recommendations = await generateText(prompt, { max_new_tokens: 1000 });

  return {
    recommendations,
    weakSubjects,
    neglectedSubjects,
    incompleteSubjects,
    progress,
  };
}

module.exports = { getProgressData, generateRecommendations };
