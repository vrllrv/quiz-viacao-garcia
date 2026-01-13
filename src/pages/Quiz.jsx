import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getActiveQuiz, QUIZ_CONFIG } from '../data/questions'
import { useTimer } from '../hooks/useTimer'
import Timer from '../components/Timer'
import AnswerButton from '../components/AnswerButton'

function calculateScore(isCorrect, timeTakenMs, timeLimit = 30000, basePoints = 100, speedBonusPct = 50) {
  if (!isCorrect) return 0
  const timeRatio = 1 - (timeTakenMs / timeLimit)
  const speedBonus = Math.floor(basePoints * (speedBonusPct / 100) * Math.max(0, timeRatio))
  return basePoints + speedBonus
}

export default function Quiz() {
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [totalScore, setTotalScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [answers, setAnswers] = useState([])
  const [isReady, setIsReady] = useState(false)

  const currentQuestion = questions[currentIndex]
  const timeLimit = currentQuestion?.timeLimit || 30

  const handleTimeout = useCallback(() => {
    if (!showResult && isReady) {
      processAnswer(null)
    }
  }, [showResult, isReady])

  const { timeLeft, start, stop, reset } = useTimer(timeLimit, handleTimeout)

  useEffect(() => {
    const participantId = localStorage.getItem('participantId')
    if (!participantId) {
      navigate('/')
      return
    }

    const activeQuiz = getActiveQuiz()
    if (!activeQuiz || !activeQuiz.questions || activeQuiz.questions.length === 0) {
      alert('Nenhuma pergunta configurada!')
      navigate('/')
      return
    }

    setQuiz(activeQuiz)
    setQuestions(activeQuiz.questions)
    setIsReady(true)
  }, [navigate])

  useEffect(() => {
    if (isReady && currentQuestion) {
      setQuestionStartTime(Date.now())
      reset(currentQuestion.timeLimit || 30)
      start()
    }
  }, [isReady, currentIndex])

  const processAnswer = async (answer) => {
    stop()
    setSelectedAnswer(answer)
    setShowResult(true)

    const timeTaken = Date.now() - questionStartTime
    const isCorrect = answer === currentQuestion.correct
    const questionTimeLimit = (currentQuestion.timeLimit || 30) * 1000
    const questionPoints = currentQuestion.points || 100
    // Use question-specific speedBonus if set, otherwise use quiz default
    const speedBonusPct = currentQuestion.speedBonus ?? quiz?.speedBonus ?? 50
    const points = calculateScore(isCorrect, timeTaken, questionTimeLimit, questionPoints, speedBonusPct)

    const newAnswer = {
      questionIndex: currentIndex,
      selectedOption: answer || 'TIMEOUT',
      isCorrect,
      timeTakenMs: timeTaken,
      pointsEarned: points,
    }

    setAnswers((prev) => [...prev, newAnswer])

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1)
    }
    setTotalScore((prev) => prev + points)

    // Save to Supabase
    const participantId = localStorage.getItem('participantId')
    const quizName = localStorage.getItem('participantQuiz') || quiz?.name || 'Quiz'
    if (supabase && participantId && !participantId.startsWith('demo-')) {
      try {
        await supabase.from('answers').insert({
          participant_id: participantId,
          question_index: currentIndex,
          selected_option: answer || 'TIMEOUT',
          is_correct: isCorrect,
          time_taken_ms: timeTaken,
          points_earned: points,
          quiz_name: quizName,
        })
      } catch (err) {
        console.error('Error saving answer:', err)
      }
    }
  }

  const handleSelectAnswer = (answer) => {
    if (showResult || selectedAnswer) return
    processAnswer(answer)
  }

  const nextQuestion = async () => {
    if (currentIndex + 1 >= questions.length) {
      // Quiz finished - save final results
      const participantId = localStorage.getItem('participantId')
      const finalScore = totalScore
      const finalCorrect = correctCount

      if (supabase && participantId && !participantId.startsWith('demo-')) {
        try {
          await supabase
            .from('participants')
            .update({
              total_score: finalScore,
              correct_count: finalCorrect,
              answers_count: questions.length,
              completed: true,
            })
            .eq('id', participantId)
        } catch (err) {
          console.error('Error saving final score:', err)
        }
      }

      // Store results for result page
      localStorage.setItem('quizResults', JSON.stringify({
        totalScore: finalScore,
        correctCount: finalCorrect,
        totalQuestions: questions.length,
        answers,
      }))

      navigate('/result')
      return
    }

    setCurrentIndex((prev) => prev + 1)
    setSelectedAnswer(null)
    setShowResult(false)
  }

  useEffect(() => {
    if (showResult) {
      const timer = setTimeout(nextQuestion, 2500)
      return () => clearTimeout(timer)
    }
  }, [showResult])

  if (!isReady || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <p className="text-white text-xl">Carregando...</p>
      </div>
    )
  }

  const lastAnswer = answers[answers.length - 1]

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col p-4">
      {/* Header */}
      <div className="max-w-2xl w-full mx-auto mb-6">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="bg-[#333] rounded-lg px-4 py-2">
            <img src="/logo_garcia.svg" alt="Viação Garcia" className="h-6" />
          </div>
        </div>
        <div className="flex justify-between items-center text-gray-400 mb-4">
          <span>Pergunta {currentIndex + 1} de {questions.length}</span>
          <span className="font-bold text-[#5a6e3a]">{totalScore} pts</span>
        </div>
        <Timer timeLeft={timeLeft} totalTime={timeLimit} />
      </div>

      {/* Question */}
      <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col">
        <div className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-white">
            {currentQuestion.text}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option) => (
            <AnswerButton
              key={option.key}
              option={option}
              selected={selectedAnswer === option.key}
              correct={currentQuestion.correct}
              showResult={showResult}
              showCorrectAnswer={quiz?.showCorrectAnswer ?? true}
              onClick={handleSelectAnswer}
              disabled={showResult}
            />
          ))}
        </div>

        {/* Result Feedback */}
        {showResult && (
          <div className={`text-center p-6 rounded-xl ${
            lastAnswer?.isCorrect ? 'bg-green-900/50' : 'bg-red-900/50'
          }`}>
            {lastAnswer?.isCorrect ? (
              <>
                <p className="text-3xl font-bold text-green-400 mb-2">Correto!</p>
                <p className="text-xl text-green-300">+{lastAnswer.pointsEarned} pontos</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-red-400 mb-2">
                  {lastAnswer?.selectedOption === 'TIMEOUT' ? 'Tempo esgotado!' : 'Incorreto!'}
                </p>
                {(quiz?.showCorrectAnswer ?? true) && (
                  <p className="text-gray-300">
                    Resposta correta: <span className="font-bold">{currentQuestion.correct}</span>
                  </p>
                )}
              </>
            )}
            <p className="text-gray-400 mt-4 text-sm">Próxima pergunta em instantes...</p>
          </div>
        )}
      </div>
    </div>
  )
}
