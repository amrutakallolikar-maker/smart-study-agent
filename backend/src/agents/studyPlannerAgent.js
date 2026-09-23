/**
 * Study Planner Agent
 * Creates personalized study schedules based on student profile and performance.
 */
const { generateText } = require('../utils/granite');
const db = require('../database');

async function generateStudyPlan(profileId) {
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profileId);
  if (!profile) throw new Error('Profile not found');

  const subjects = db.prepare('SELECT * FROM subjects WHERE profile_id = ?').all(profileId);
  const topics = subjects.flatMap(s => {
    const t = db.prepare('SELECT * FROM topics WHERE subject_id = ?').all(s.id);
    return t.map(tp => ({ ...tp, subject_name: s.name }));
  });

  // Get quiz performance per topic/subject
  const quizResults = db.prepare(`
    SELECT qs.subject_id, s.name as subject_name, 
           AVG(CAST(qs.score AS REAL) / NULLIF(qs.total_questions, 0) * 100) as avg_score,
           COUNT(*) as quiz_count
    FROM quiz_sessions qs
    LEFT JOIN subjects s ON qs.subject_id = s.id
    WHERE qs.profile_id = ? AND qs.completed = 1
    GROUP BY qs.subject_id
  `).all(profileId);

  const weakSubjects = quizResults.filter(r => r.avg_score < 60).map(r => r.subject_name);
  const strongSubjects = quizResults.filter(r => r.avg_score >= 80).map(r => r.subject_name);

  const examDate = profile.exam_date ? new Date(profile.exam_date) : null;
  const daysUntilExam = examDate
    ? Math.max(0, Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  const subjectList = subjects
    .map(s => `- ${s.name} (difficulty: ${s.difficulty}, priority: ${s.priority === 1 ? 'high' : s.priority === 3 ? 'low' : 'medium'})`)
    .join('\n');

  const topicList = topics
    .filter(t => !t.is_completed)
    .map(t => `- ${t.subject_name}: ${t.name} (${t.difficulty})`)
    .join('\n');

  const prompt = `You are an expert academic study planner. Create a personalized study plan for the following student.

Student: ${profile.name}
Course: ${profile.course || 'N/A'} - ${profile.branch || 'N/A'}
Semester: ${profile.semester || 'N/A'}
Available study hours per day: ${profile.study_hours_per_day}
${daysUntilExam !== null ? `Days until exam: ${daysUntilExam}` : 'Exam date: Not set'}

Subjects:
${subjectList || 'No subjects added yet'}

Pending Topics:
${topicList || 'No pending topics'}

${weakSubjects.length > 0 ? `Weak areas (need more focus): ${weakSubjects.join(', ')}` : ''}
${strongSubjects.length > 0 ? `Strong areas: ${strongSubjects.join(', ')}` : ''}

Create a detailed ${daysUntilExam !== null && daysUntilExam <= 14 ? 'daily' : 'weekly'} study plan that:
1. Allocates time based on subject difficulty and priority
2. Gives more time to weak areas
3. Includes revision sessions
4. Is realistic given ${profile.study_hours_per_day} hours/day
5. Includes specific activities (read, practice, revise, quiz)

Format with clear Day/Week headings, time allocations, and activities.`;

  const plan = await generateText(prompt, { max_new_tokens: 1500 });

  // Save plan to database
  db.prepare('INSERT INTO study_plan (profile_id, plan_content) VALUES (?, ?)').run(profileId, plan);

  return plan;
}

module.exports = { generateStudyPlan };
