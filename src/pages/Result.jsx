import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Result() {
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [position, setPosition] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('quizResults')
    if (!stored) {
      navigate('/')
      return
    }

    const data = JSON.parse(stored)
    setResults(data)

    // Get position in leaderboard (filtered by quiz)
    const fetchPosition = async () => {
      const participantId = localStorage.getItem('participantId')
      const quizName = localStorage.getItem('participantQuiz')
      if (supabase && participantId && !participantId.startsWith('demo-')) {
        try {
          let query = supabase
            .from('participants')
            .select('id, total_score')
            .eq('completed', true)
            .order('total_score', { ascending: false })

          if (quizName) {
            query = query.eq('quiz_name', quizName)
          }

          const { data: participants } = await query

          const pos = participants?.findIndex(p => p.id === participantId)
          if (pos !== -1) {
            setPosition(pos + 1)
          }
        } catch (err) {
          console.error('Error fetching position:', err)
        }
      } else {
        setPosition(1) // Demo mode
      }
      setLoading(false)
    }

    fetchPosition()
  }, [navigate])

  if (!results) return null

  const percentage = Math.round((results.correctCount / results.totalQuestions) * 100)

  const getPositionEmoji = (pos) => {
    if (pos === 1) return '🥇'
    if (pos === 2) return '🥈'
    if (pos === 3) return '🥉'
    return '🏅'
  }

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-5 sm:p-8 w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="bg-[#333] rounded-lg px-3 py-1.5 sm:px-4 sm:py-2">
            <img src="/logo_garcia.svg" alt="Viação Garcia" className="h-5 sm:h-6" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Quiz Finalizado!</h1>

        <div className="my-5 sm:my-8">
          <p className="text-gray-400 text-sm sm:text-base mb-1 sm:mb-2">Sua pontuação</p>
          <p className="text-5xl sm:text-6xl font-bold text-[#5a6e3a]">
            {results.totalScore}
          </p>
          <p className="text-gray-400 text-sm sm:text-base mt-1 sm:mt-2">pontos</p>
        </div>

        {!loading && position && (
          <div className="mb-5 sm:mb-8 p-3 sm:p-4 bg-gray-700/50 rounded-xl">
            <p className="text-gray-400 text-sm mb-0.5 sm:mb-1">Você ficou em</p>
            <p className="text-3xl sm:text-4xl font-bold text-white">
              {getPositionEmoji(position)} {position}º lugar
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-8">
          <div className="bg-gray-700/50 p-3 sm:p-4 rounded-xl">
            <p className="text-xl sm:text-2xl font-bold text-green-400">{results.correctCount}/{results.totalQuestions}</p>
            <p className="text-xs sm:text-sm text-gray-400">Acertos</p>
          </div>
          <div className="bg-gray-700/50 p-3 sm:p-4 rounded-xl">
            <p className="text-xl sm:text-2xl font-bold text-blue-400">{percentage}%</p>
            <p className="text-xs sm:text-sm text-gray-400">Aproveitamento</p>
          </div>
        </div>

        <Link
          to="/leaderboard"
          className="block w-full bg-[#5a6e3a] text-white py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-[#4a5a2a] transition"
        >
          Ver Ranking
        </Link>

        <p className="text-gray-500 mt-4 sm:mt-6 text-xs sm:text-sm">
          Obrigado por participar!
        </p>
      </div>
    </div>
  )
}
