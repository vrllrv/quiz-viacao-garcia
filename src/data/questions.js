export const QUIZ_CONFIG = {
  title: "Quiz Viação Garcia",
  basePoints: 100,
}

export const DEFAULT_QUESTIONS = [
  {
    id: 1,
    text: "Em que ano a Viação Garcia foi fundada?",
    options: [
      { key: "A", text: "1940" },
      { key: "B", text: "1950" },
      { key: "C", text: "1960" },
      { key: "D", text: "1970" },
    ],
    correct: "B",
    timeLimit: 30,
  },
  {
    id: 2,
    text: "Qual é a sede da Viação Garcia?",
    options: [
      { key: "A", text: "São Paulo" },
      { key: "B", text: "Curitiba" },
      { key: "C", text: "Londrina" },
      { key: "D", text: "Maringá" },
    ],
    correct: "C",
    timeLimit: 30,
  },
  {
    id: 3,
    text: "Quantos estados brasileiros a Viação Garcia atende?",
    options: [
      { key: "A", text: "3 estados" },
      { key: "B", text: "5 estados" },
      { key: "C", text: "7 estados" },
      { key: "D", text: "10 estados" },
    ],
    correct: "B",
    timeLimit: 30,
  },
  {
    id: 4,
    text: "Qual é o principal valor da empresa?",
    options: [
      { key: "A", text: "Velocidade" },
      { key: "B", text: "Preço baixo" },
      { key: "C", text: "Segurança e conforto" },
      { key: "D", text: "Tecnologia" },
    ],
    correct: "C",
    timeLimit: 30,
  },
  {
    id: 5,
    text: "Qual serviço a Viação Garcia oferece além de transporte de passageiros?",
    options: [
      { key: "A", text: "Fretamento" },
      { key: "B", text: "Táxi" },
      { key: "C", text: "Aluguel de carros" },
      { key: "D", text: "Transporte aéreo" },
    ],
    correct: "A",
    timeLimit: 30,
  },
]

// Default quiz template
const DEFAULT_QUIZ = {
  id: 'default',
  name: 'Quiz Viação Garcia',
  description: 'Quiz sobre a história e valores da Viação Garcia',
  isActive: true,
  speedBonus: 50, // Default speed bonus percentage (0-100)
  showCorrectAnswer: true, // Show correct answer after each question
  createdAt: new Date().toISOString(),
  questions: DEFAULT_QUESTIONS,
}

// Get all quizzes
export function getQuizzes() {
  const stored = localStorage.getItem('quizzes')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return [DEFAULT_QUIZ]
    }
  }
  return [DEFAULT_QUIZ]
}

// Save all quizzes
export function saveQuizzes(quizzes) {
  localStorage.setItem('quizzes', JSON.stringify(quizzes))
}

// Get active quiz
export function getActiveQuiz() {
  const quizzes = getQuizzes()
  return quizzes.find(q => q.isActive) || quizzes[0] || DEFAULT_QUIZ
}

// Set active quiz by ID
export function setActiveQuiz(quizId) {
  const quizzes = getQuizzes()
  const updated = quizzes.map(q => ({
    ...q,
    isActive: q.id === quizId,
  }))
  saveQuizzes(updated)
}

// Get quiz by ID
export function getQuizById(quizId) {
  const quizzes = getQuizzes()
  return quizzes.find(q => q.id === quizId)
}

// Create a new quiz
export function createQuiz(quiz) {
  const quizzes = getQuizzes()
  const newQuiz = {
    ...quiz,
    id: quiz.id || `quiz-${Date.now()}`,
    createdAt: new Date().toISOString(),
    questions: quiz.questions || [],
    isActive: false,
  }
  quizzes.push(newQuiz)
  saveQuizzes(quizzes)
  return newQuiz
}

// Update a quiz
export function updateQuiz(quizId, updates) {
  const quizzes = getQuizzes()
  const index = quizzes.findIndex(q => q.id === quizId)
  if (index !== -1) {
    quizzes[index] = { ...quizzes[index], ...updates }
    saveQuizzes(quizzes)
    return quizzes[index]
  }
  return null
}

// Delete a quiz
export function deleteQuiz(quizId) {
  const quizzes = getQuizzes()
  const filtered = quizzes.filter(q => q.id !== quizId)
  // Ensure at least one quiz remains active
  if (filtered.length > 0 && !filtered.some(q => q.isActive)) {
    filtered[0].isActive = true
  }
  saveQuizzes(filtered)
  return filtered
}

// Duplicate a quiz
export function duplicateQuiz(quizId) {
  const quiz = getQuizById(quizId)
  if (!quiz) return null

  const newQuiz = {
    ...quiz,
    id: `quiz-${Date.now()}`,
    name: `${quiz.name} (Cópia)`,
    isActive: false,
    createdAt: new Date().toISOString(),
    questions: quiz.questions.map(q => ({ ...q, id: Date.now() + Math.random() })),
  }

  const quizzes = getQuizzes()
  quizzes.push(newQuiz)
  saveQuizzes(quizzes)
  return newQuiz
}

// Legacy support - get questions from active quiz
export function getQuestions() {
  const activeQuiz = getActiveQuiz()
  return activeQuiz.questions || DEFAULT_QUESTIONS
}

// Legacy support - save questions to active quiz
export function saveQuestions(questions) {
  const activeQuiz = getActiveQuiz()
  updateQuiz(activeQuiz.id, { questions })
}
