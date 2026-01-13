import { supabase } from '../lib/supabase'

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
  is_active: true,
  speed_bonus: 50,
  show_correct_answer: true,
  created_at: new Date().toISOString(),
  questions: DEFAULT_QUESTIONS,
}

// Helper to convert DB format to app format
function dbToApp(quiz) {
  if (!quiz) return null
  return {
    id: quiz.id,
    name: quiz.name,
    description: quiz.description,
    isActive: quiz.is_active,
    speedBonus: quiz.speed_bonus,
    showCorrectAnswer: quiz.show_correct_answer,
    createdAt: quiz.created_at,
    questions: quiz.questions || [],
  }
}

// Helper to convert app format to DB format
function appToDb(quiz) {
  return {
    id: quiz.id,
    name: quiz.name,
    description: quiz.description || '',
    is_active: quiz.isActive ?? false,
    speed_bonus: quiz.speedBonus ?? 50,
    show_correct_answer: quiz.showCorrectAnswer ?? true,
    questions: quiz.questions || [],
  }
}

// Get all quizzes from Supabase
export async function getQuizzes() {
  if (!supabase) return [DEFAULT_QUIZ]

  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // If no quizzes exist, create the default one
    if (!data || data.length === 0) {
      const created = await createQuiz(DEFAULT_QUIZ)
      return created ? [dbToApp(created)] : [DEFAULT_QUIZ]
    }

    return data.map(dbToApp)
  } catch (err) {
    console.error('Error fetching quizzes:', err)
    return [DEFAULT_QUIZ]
  }
}

// Get active quiz from Supabase
export async function getActiveQuiz() {
  if (!supabase) return DEFAULT_QUIZ

  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error

    if (data) {
      return dbToApp(data)
    }

    // No active quiz - get first quiz or create default
    const { data: firstQuiz } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (firstQuiz) {
      // Set it as active
      await setActiveQuiz(firstQuiz.id)
      return dbToApp({ ...firstQuiz, is_active: true })
    }

    // No quizzes at all - create default
    const created = await createQuiz({ ...DEFAULT_QUIZ, isActive: true })
    return created ? dbToApp(created) : DEFAULT_QUIZ
  } catch (err) {
    console.error('Error fetching active quiz:', err)
    return DEFAULT_QUIZ
  }
}

// Set active quiz by ID
export async function setActiveQuiz(quizId) {
  if (!supabase) return false

  try {
    // First, deactivate all quizzes
    await supabase
      .from('quizzes')
      .update({ is_active: false })
      .neq('id', 'placeholder')

    // Then activate the selected one
    const { error } = await supabase
      .from('quizzes')
      .update({ is_active: true })
      .eq('id', quizId)

    if (error) throw error
    return true
  } catch (err) {
    console.error('Error setting active quiz:', err)
    return false
  }
}

// Get quiz by ID
export async function getQuizById(quizId) {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .maybeSingle()

    if (error) throw error
    return dbToApp(data)
  } catch (err) {
    console.error('Error fetching quiz:', err)
    return null
  }
}

// Create a new quiz
export async function createQuiz(quiz) {
  if (!supabase) return null

  try {
    const newQuiz = {
      ...appToDb(quiz),
      id: quiz.id || `quiz-${Date.now()}`,
      is_active: quiz.isActive ?? false,
    }

    const { data, error } = await supabase
      .from('quizzes')
      .insert(newQuiz)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error creating quiz:', err)
    return null
  }
}

// Update a quiz
export async function updateQuiz(quizId, updates) {
  if (!supabase) return null

  try {
    const dbUpdates = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
    if (updates.speedBonus !== undefined) dbUpdates.speed_bonus = updates.speedBonus
    if (updates.showCorrectAnswer !== undefined) dbUpdates.show_correct_answer = updates.showCorrectAnswer
    if (updates.questions !== undefined) dbUpdates.questions = updates.questions

    const { data, error } = await supabase
      .from('quizzes')
      .update(dbUpdates)
      .eq('id', quizId)
      .select()
      .single()

    if (error) throw error
    return dbToApp(data)
  } catch (err) {
    console.error('Error updating quiz:', err)
    return null
  }
}

// Delete a quiz
export async function deleteQuiz(quizId) {
  if (!supabase) return []

  try {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId)

    if (error) throw error

    // Get remaining quizzes
    const remaining = await getQuizzes()

    // If no quizzes remain or none are active, activate the first one
    if (remaining.length > 0 && !remaining.some(q => q.isActive)) {
      await setActiveQuiz(remaining[0].id)
      remaining[0].isActive = true
    }

    return remaining
  } catch (err) {
    console.error('Error deleting quiz:', err)
    return []
  }
}

// Duplicate a quiz
export async function duplicateQuiz(quizId) {
  if (!supabase) return null

  try {
    const quiz = await getQuizById(quizId)
    if (!quiz) return null

    const newQuiz = {
      id: `quiz-${Date.now()}`,
      name: `${quiz.name} (Cópia)`,
      description: quiz.description,
      isActive: false,
      speedBonus: quiz.speedBonus,
      showCorrectAnswer: quiz.showCorrectAnswer,
      questions: quiz.questions.map(q => ({ ...q, id: Date.now() + Math.random() })),
    }

    return await createQuiz(newQuiz)
  } catch (err) {
    console.error('Error duplicating quiz:', err)
    return null
  }
}

// Legacy support - get questions from active quiz (async)
export async function getQuestions() {
  const activeQuiz = await getActiveQuiz()
  return activeQuiz?.questions || DEFAULT_QUESTIONS
}

// Legacy support - save questions to active quiz (async)
export async function saveQuestions(questions) {
  const activeQuiz = await getActiveQuiz()
  if (activeQuiz) {
    await updateQuiz(activeQuiz.id, { questions })
  }
}
