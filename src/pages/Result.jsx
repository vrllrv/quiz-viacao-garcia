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

    // Get position in leaderboard
    const fetchPosition = async () => {
      const participantId = localStorage.getItem('participantId')
      if (supabase && participantId && !participantId.startsWith('demo-')) {
        try {
          const { data: participants } = await supabase
            .from('participants')
            .select('id, total_score')
            .eq('completed', true)
            .order('total_score', { ascending: false })

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Quiz Finalizado!</h1>

        <div className="my-8">
          <p className="text-gray-400 mb-2">Sua pontuação</p>
          <p className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            {results.totalScore}
          </p>
          <p className="text-gray-400 mt-2">pontos</p>
        </div>

        {!loading && position && (
          <div className="mb-8 p-4 bg-gray-700/50 rounded-xl">
            <p className="text-gray-400 mb-1">Você ficou em</p>
            <p className="text-4xl font-bold text-white">
              {getPositionEmoji(position)} {position}º lugar
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-700/50 p-4 rounded-xl">
            <p className="text-2xl font-bold text-green-400">{results.correctCount}/{results.totalQuestions}</p>
            <p className="text-sm text-gray-400">Acertos</p>
          </div>
          <div className="bg-gray-700/50 p-4 rounded-xl">
            <p className="text-2xl font-bold text-blue-400">{percentage}%</p>
            <p className="text-sm text-gray-400">Aproveitamento</p>
          </div>
        </div>

        <Link
          to="/leaderboard"
          className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition"
        >
          Ver Leaderboard
        </Link>

        <p className="text-gray-500 mt-6 text-sm">
          Obrigado por participar!
        </p>
      </div>
    </div>
  )
}
