/**
 * demoResponses.js
 * Pre-built mock AI responses used when DEMO_MODE=true.
 * All AI features work without any IBM Cloud credentials.
 */

const DEMO_SUMMARY = `## Overview
This study material covers the fundamental principles and core concepts of the subject. The content is organized to help students understand key ideas and apply them effectively in exams.

## Key Concepts
- **Core Principle 1**: The foundational theory that underpins all other concepts in this topic
- **Core Principle 2**: A complementary framework used to analyze problems systematically
- **Core Principle 3**: Practical application methods derived from the theory above
- **Core Principle 4**: Common exceptions and edge cases to be aware of

## Important Takeaways
1. Always approach problems by first identifying which core principle applies
2. The relationship between concepts is often more important than the concepts themselves
3. Practice with past exam questions to solidify understanding
4. Review definitions carefully — exam questions frequently test precise terminology`;

const DEMO_DETAILED_NOTES = `# Detailed Study Notes

## 1. Main Concepts with Explanations

### Concept A: Foundational Theory
The foundational theory establishes the basis for understanding all subsequent topics. It states that every system can be analyzed in terms of its inputs, processes, and outputs. This framework applies universally across problem types.

### Concept B: Analytical Framework
The analytical framework provides a step-by-step method for breaking down complex problems. Key steps include: (1) identify the problem domain, (2) list known variables, (3) apply relevant formulas, (4) verify results.

### Concept C: Applied Methods
Applied methods translate theoretical knowledge into practical solutions. They require understanding both the "what" and the "why" behind each step.

## 2. Key Definitions
- **Term A**: The primary unit of analysis in this subject; defined as the smallest indivisible component of the system
- **Term B**: A measurable quantity that changes in response to external conditions
- **Term C**: The boundary condition that constrains the solution space
- **Term D**: An iterative process used to approximate solutions when direct methods are unavailable

## 3. Important Formulas
- **Formula 1**: Result = (Input × Factor) / Constant
- **Formula 2**: Rate = Change / Time
- **Formula 3**: Efficiency = Output / Input × 100%

## 4. Examples
**Example 1**: Given Input = 50 and Factor = 2, Result = (50 × 2) / 10 = 10
**Example 2**: If Change = 30 and Time = 5, Rate = 30 / 5 = 6 units per second

## 5. Points to Remember for Exams
- Always state assumptions before solving
- Show each step — partial marks are awarded
- Units must be consistent throughout your working
- Double-check boundary conditions
- Revise definitions — 20% of marks typically test terminology`;

const DEMO_KEY_POINTS = `# Key Points

## Key Points
1. The subject is built on three foundational pillars: theory, analysis, and application
2. Every problem type has a corresponding solution strategy — identify the type first
3. Relationships between variables are often more testable than isolated facts
4. Exceptions to rules are frequently tested in exams
5. Time management during exams: allocate marks-per-minute as your guide

## Important Definitions
- **Principle**: A fundamental truth that serves as the foundation for reasoning
- **Variable**: A quantity that can change and whose value affects the outcome
- **Constant**: A fixed quantity that does not change across different scenarios
- **Hypothesis**: A testable prediction derived from theory
- **Analysis**: The process of breaking a complex topic into understandable parts

## Formulas
- Core Formula: Y = mX + c (linear relationship)
- Rate Formula: R = ΔV / Δt
- Efficiency: η = (Useful Output / Total Input) × 100

## Quick Revision Points
- Start exam answers with given data and what is being asked
- Diagrams often earn marks even if calculations are wrong
- Re-read the question after writing your answer
- Key terms must match the textbook definitions exactly
- Prioritise topics with highest mark weightage`;

const DEMO_IMPORTANT_QUESTIONS = `# Important Questions for Exam Preparation

## Very Important Questions (6+ marks each)
1. Explain the foundational theory in detail with diagrams and practical examples
2. Compare and contrast the two main analytical frameworks used in this subject
3. Derive the core formula from first principles and explain each term
4. Discuss the real-world applications of the key concepts with case studies
5. Critically evaluate the limitations of the standard approach and suggest improvements

## Important Short Questions (2–4 marks each)
1. Define the key terms: Term A, Term B, and Term C
2. State and explain the three core principles
3. What are the boundary conditions for Formula 1?
4. List four common exceptions to the general rule
5. Briefly explain the difference between Method X and Method Y

## Definitions to Remember
- Term A, Term B, Term C, Term D (see detailed notes for exact definitions)
- Always write definitions in the format: "X is defined as..."

## Numerical/Problem-solving Questions
1. Given Input = 80 and Factor = 3, calculate the Result using Formula 1
2. A system has Efficiency = 75%. If Input = 200 units, find the useful Output
3. Calculate the Rate when Change = 45 units occurs over 9 seconds`;

const DEMO_FLASHCARDS = [
  { front: "What is the foundational theory of this subject?", back: "The foundational theory states that every system can be analyzed in terms of its inputs, processes, and outputs — providing a universal framework for problem-solving.", difficulty: "medium" },
  { front: "Define a Variable in the context of this subject", back: "A variable is a measurable quantity that changes in response to external conditions and whose value directly affects the system's output.", difficulty: "easy" },
  { front: "State the Core Formula and explain each term", back: "Result = (Input × Factor) / Constant. Input is the given quantity, Factor is the multiplier, and Constant is the fixed divisor specific to the problem domain.", difficulty: "medium" },
  { front: "What is Efficiency and how is it calculated?", back: "Efficiency measures how well a system converts input to useful output. Formula: Efficiency = (Useful Output / Total Input) × 100%", difficulty: "easy" },
  { front: "What are the four steps of the Analytical Framework?", back: "1. Identify the problem domain, 2. List all known variables, 3. Apply the relevant formula, 4. Verify the result against boundary conditions.", difficulty: "medium" },
  { front: "What is a Boundary Condition?", back: "A boundary condition is a constraint that limits the valid solution space — it defines the range within which a solution is physically or mathematically meaningful.", difficulty: "hard" },
  { front: "How does Rate differ from Efficiency?", back: "Rate measures how quickly a change occurs (Rate = ΔV/Δt), while Efficiency measures how much useful output is produced relative to total input. They are independent metrics.", difficulty: "hard" },
  { front: "What is a Hypothesis?", back: "A hypothesis is a testable prediction derived from theory. It specifies the expected relationship between variables before an experiment or analysis is conducted.", difficulty: "easy" },
];

const DEMO_MCQS = [
  {
    question: "Which formula correctly expresses the relationship between Input, Factor, and Result?",
    options: ["A. Result = Input + Factor", "B. Result = (Input × Factor) / Constant", "C. Result = Input / (Factor × Constant)", "D. Result = Factor - Input"],
    correct_answer: "B",
    explanation: "The core formula is Result = (Input × Factor) / Constant, where the Constant normalises the product to the correct unit scale."
  },
  {
    question: "A system has an Efficiency of 80% and a Total Input of 500 units. What is the Useful Output?",
    options: ["A. 400 units", "B. 625 units", "C. 300 units", "D. 80 units"],
    correct_answer: "A",
    explanation: "Useful Output = Efficiency × Total Input / 100 = 80 × 500 / 100 = 400 units."
  },
  {
    question: "What does a Boundary Condition define in a problem?",
    options: ["A. The rate of change of a variable", "B. The efficiency of a system", "C. The valid range within which a solution is meaningful", "D. The relationship between two constants"],
    correct_answer: "C",
    explanation: "A boundary condition constrains the solution space by defining the limits within which a solution is physically or mathematically valid."
  },
  {
    question: "Which of the following BEST describes the Analytical Framework?",
    options: ["A. A formula for computing efficiency", "B. A four-step method for systematically solving problems", "C. A definition of key terms", "D. A list of exceptions to the core theory"],
    correct_answer: "B",
    explanation: "The Analytical Framework is a four-step method: identify the domain, list variables, apply formulas, and verify results."
  },
  {
    question: "If Change = 60 units and Time = 12 seconds, what is the Rate?",
    options: ["A. 720 units/s", "B. 48 units/s", "C. 5 units/s", "D. 0.2 units/s"],
    correct_answer: "C",
    explanation: "Rate = ΔV / Δt = 60 / 12 = 5 units per second."
  },
];

const DEMO_SHORT_ANSWERS = [
  { question: "Define the term 'Variable' and give one example.", answer: "A variable is a measurable quantity that changes in response to external conditions. For example, temperature is a variable that changes with the heating input applied to a system.", marks: 2 },
  { question: "State the three core principles of this subject.", answer: "The three core principles are: (1) Every system has inputs, processes, and outputs; (2) Variables interact according to defined relationships; (3) Boundary conditions constrain valid solutions. Each principle builds on the previous one.", marks: 3 },
  { question: "What is the difference between a Constant and a Variable?", answer: "A constant has a fixed value that does not change across scenarios, while a variable can take different values depending on conditions. Constants simplify formulas by reducing the number of unknowns.", marks: 2 },
  { question: "Briefly explain why Efficiency can never exceed 100%.", answer: "Efficiency = (Useful Output / Total Input) × 100%. Since Useful Output can never be greater than Total Input (energy/matter cannot be created), the ratio cannot exceed 1, making the maximum efficiency 100%.", marks: 3 },
  { question: "Describe one real-world application of the Rate formula.", answer: "The Rate formula (R = ΔV/Δt) is used in speed calculation — if a car travels 120 km in 2 hours, its speed (rate) = 120/2 = 60 km/h. The same formula applies to data transfer rates in computing.", marks: 2 },
  { question: "What is a hypothesis and how does it relate to theory?", answer: "A hypothesis is a testable prediction derived from theory. While a theory provides a broad explanatory framework, a hypothesis makes a specific, measurable prediction that can be tested through experiment or analysis.", marks: 3 },
];

const DEMO_STUDY_PLAN = `# 📚 Personalized Study Plan

## Overview
Based on your profile, available study hours, and subject priorities, here is your optimized study schedule. Weak areas receive more time, and revision sessions are built in throughout.

---

## Week 1 — Foundation & Understanding

### Day 1 (Today)
- ⏰ **Hour 1–2**: Read core concepts for Subject 1 — focus on definitions and theory
- ⏰ **Hour 3–4**: Summarize key points in your own words (active recall technique)

### Day 2
- ⏰ **Hour 1–2**: Subject 2 — read and annotate notes
- ⏰ **Hour 3**: Create 10 flashcards for Subject 1 definitions
- ⏰ **Hour 4**: Take a 5-question quiz on Subject 1

### Day 3
- ⏰ **Hour 1–2**: Subject 3 (weak area) — spend extra time here
- ⏰ **Hour 3–4**: Practice problems for Subject 2

### Day 4
- ⏰ **Hour 1**: Review Subject 1 flashcards
- ⏰ **Hour 2–3**: Subject 3 practice problems
- ⏰ **Hour 4**: AI Tutor session — ask questions on weak topics

### Day 5
- ⏰ **Hour 1–2**: Full revision of Week 1 notes
- ⏰ **Hour 3–4**: Mixed quiz across all subjects

### Day 6 — Light Study
- ⏰ **Hour 1–2**: Review incorrect quiz answers and re-read explanations
- Rest and recharge

### Day 7 — Rest Day
- Optional: 30-minute flashcard review only

---

## Week 2 — Practice & Reinforcement

### Days 8–10: Deep Practice
- 2 hours per subject on problem-solving
- 1 hour daily on flashcard review
- Take one full quiz per subject

### Days 11–12: Weak Area Sprint
- Dedicate 3 hours/day to your lowest-scoring subject
- Use AI Tutor to clarify doubts

### Days 13–14: Full Revision
- Revise all subjects
- Attempt full-length mock tests
- Review all generated study materials

---

## 💡 Study Tips
1. **Pomodoro Technique**: Study for 25 min, break for 5 min — repeat 4 times, then take a 20-min break
2. **Active Recall**: Don't just re-read; close the notes and write what you remember
3. **Spaced Repetition**: Review flashcards daily; hard cards more frequently
4. **Quiz yourself** before each session to identify gaps
5. **Sleep**: 7–8 hours is non-negotiable — memory consolidation happens during sleep`;

const DEMO_RECOMMENDATIONS = `# 🎯 Personalized AI Recommendations

## 1. Priority Study Areas
Based on your current progress, focus on the following in order of urgency:
- **High Priority**: Topics with less than 50% completion — these need immediate attention
- **Medium Priority**: Subjects where quiz scores are below 70% — practice more problems
- **Lower Priority**: Well-understood subjects — maintain with weekly revision only

## 2. Study Strategies for Weak Subjects
- **Chunking**: Break difficult topics into smaller 15-minute study blocks instead of marathon sessions
- **Teach-Back Method**: Explain the concept aloud as if teaching someone — gaps in understanding become immediately obvious
- **Error Analysis**: After every quiz, spend equal time reviewing wrong answers as you spent taking the quiz
- **Multiple Resources**: If one explanation doesn't click, try another resource (video, textbook, AI Tutor)

## 3. Time Management Advice
- Allocate **60% of study time** to weak subjects, 30% to medium, and 10% to strong subjects for maintenance
- Study the hardest subject first when your energy is highest (typically morning)
- Use the last 15 minutes of each session for a quick review of what you just learned
- Schedule your study plan into your calendar as fixed appointments — treat them like classes

## 4. Exam Preparation Tips
- Start past-paper practice at least 2 weeks before the exam
- Simulate exam conditions: no notes, timed, sitting at a desk
- Write down your own summary sheets — the act of writing reinforces memory
- Focus on understanding *why* answers are correct, not just *what* they are
- On exam day: read every question fully before answering, start with what you know best

## 5. Motivational Guidance
You are building real knowledge that will serve you beyond this exam. Every hour of focused study compounds — the student who studies consistently for 2 weeks outperforms one who studies 3× as hard in the final 2 days.

**Your next action**: Pick one weak topic right now and spend 25 focused minutes on it. Progress is built one session at a time. 💪`;

const DEMO_TUTOR_ANSWER = (question) =>
  `Great question! Based on your study materials and the topic you're asking about:

**Answer to: "${question}"**

This concept is one of the core ideas in your subject. Here's a clear explanation:

The key thing to understand is that the concept works by relating the input conditions to the expected output through a defined process. When you apply the standard formula or framework, you get a predictable result that can be verified.

**Key points to remember:**
- The relationship between variables follows the pattern established in the foundational theory
- Always check whether boundary conditions apply before finalising your answer
- In exam scenarios, clearly state your assumptions and show each working step

**Practical tip**: Try creating a flashcard for this concept — front side: the question you just asked; back side: this explanation in your own words. Active recall is the most effective study technique for retaining this type of material.

Is there a specific part of this you'd like me to explain in more detail?`;

const DEMO_QUIZ = (subject = 'General', count = 5) => {
  const pool = [
    {
      question: `Which of the following BEST describes the core principle of ${subject}?`,
      options: ["A. It relies solely on memorization", "B. It applies a systematic framework to analyze inputs and outputs", "C. It focuses only on theoretical knowledge with no practical use", "D. It is only relevant to advanced students"],
      correct_answer: "B",
      explanation: "The core principle of most academic subjects involves applying a systematic analytical framework, not mere memorization."
    },
    {
      question: "What is the first step of the standard problem-solving Analytical Framework?",
      options: ["A. Apply the relevant formula", "B. Verify the result", "C. Identify the problem domain", "D. List all unknowns"],
      correct_answer: "C",
      explanation: "The first step is always to identify the problem domain — this determines which framework and formulas are applicable."
    },
    {
      question: "A system produces 350 units of useful output from 500 units of input. What is its efficiency?",
      options: ["A. 57%", "B. 70%", "C. 142.8%", "D. 150 units"],
      correct_answer: "B",
      explanation: "Efficiency = (350 / 500) × 100 = 70%."
    },
    {
      question: "Which study technique is most effective for long-term retention of factual knowledge?",
      options: ["A. Re-reading notes multiple times", "B. Highlighting key sentences", "C. Active recall and spaced repetition", "D. Watching lecture videos"],
      correct_answer: "C",
      explanation: "Active recall (testing yourself) combined with spaced repetition (reviewing at increasing intervals) produces the strongest long-term memory retention."
    },
    {
      question: "What does a boundary condition specify in a mathematical or scientific problem?",
      options: ["A. The exact numerical answer", "B. The formula to use", "C. The valid range within which the solution is meaningful", "D. The number of variables in the equation"],
      correct_answer: "C",
      explanation: "Boundary conditions define the limits of applicability — a solution outside these limits is physically or mathematically invalid."
    },
    {
      question: "If Rate = ΔV / Δt, and ΔV = 90 and Δt = 15, what is the Rate?",
      options: ["A. 1350", "B. 75", "C. 6", "D. 105"],
      correct_answer: "C",
      explanation: "Rate = 90 / 15 = 6 units per time period."
    },
    {
      question: "Which of the following is the correct definition of a Hypothesis?",
      options: ["A. A proven fact supported by multiple experiments", "B. A testable prediction derived from theory", "C. A formula used to compute results", "D. A summary of all variables in a system"],
      correct_answer: "B",
      explanation: "A hypothesis is a specific, testable prediction made before an experiment or analysis, derived from the broader theoretical framework."
    },
  ];

  return pool.slice(0, Math.min(count, pool.length));
};

module.exports = {
  DEMO_SUMMARY,
  DEMO_DETAILED_NOTES,
  DEMO_KEY_POINTS,
  DEMO_IMPORTANT_QUESTIONS,
  DEMO_FLASHCARDS,
  DEMO_MCQS,
  DEMO_SHORT_ANSWERS,
  DEMO_STUDY_PLAN,
  DEMO_RECOMMENDATIONS,
  DEMO_TUTOR_ANSWER,
  DEMO_QUIZ,
};
