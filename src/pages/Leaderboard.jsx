import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { QUIZ_CONFIG } from '../data/questions'

const LIMIT_OPTIONS = [10, 50, 100, 500, 800]
const ITEMS_PER_PAGE = 50

export default function Leaderboard() {
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [limit, setLimit] = useState(100)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [departments, setDepartments] = useState([])
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)
  const lastUpdateRef = useRef(Date.now())

  // Debounced fetch to avoid hammering DB on realtime updates
  const fetchLeaderboard = useCallback(async () => {
    if (!supabase) {
      // Demo data for testing without Supabase
      const demoData = Array.from({ length: 150 }, (_, i) => ({
        id: i + 1,
        full_name: `Participante ${i + 1}`,
        matricula: `${10000 + i}`,
        departamento: ['TI', 'RH', 'Comercial', 'Financeiro', 'Operações'][i % 5],
        total_score: Math.max(0, 1000 - i * 5 + Math.floor(Math.random() * 20)),
      }))
      setParticipants(demoData)
      setTotalCount(demoData.length)
      setDepartments(['TI', 'RH', 'Comercial', 'Financeiro', 'Operações'])
      setLoading(false)
      return
    }

    try {
      // Build query
      let query = supabase
        .from('participants')
        .select('id, full_name, matricula, departamento, total_score', { count: 'exact' })
        .eq('completed', true)
        .order('total_score', { ascending: false })
        .limit(limit)

      if (departmentFilter) {
        query = query.eq('departamento', departmentFilter)
      }

      if (searchTerm) {
        query = query.ilike('full_name', `%${searchTerm}%`)
      }

      const { data, error, count } = await query

      if (error) throw error
      setParticipants(data || [])
      setTotalCount(count || 0)

      // Fetch unique departments for filter
      if (departments.length === 0) {
        const { data: deptData } = await supabase
          .from('participants')
          .select('departamento')
          .eq('completed', true)

        if (deptData) {
          const uniqueDepts = [...new Set(deptData.map(d => d.departamento))].filter(Boolean).sort()
          setDepartments(uniqueDepts)
        }
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
    } finally {
      setLoading(false)
    }
  }, [limit, searchTerm, departmentFilter])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  useEffect(() => {
    if (!supabase) return

    // Throttled realtime updates (max once per 3 seconds)
    const channel = supabase
      .channel('leaderboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        () => {
          const now = Date.now()
          if (now - lastUpdateRef.current > 3000) {
            lastUpdateRef.current = now
            fetchLeaderboard()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLeaderboard])

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE)
  }, [limit, searchTerm, departmentFilter])

  const handleLoadMore = () => {
    setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, participants.length))
  }

  const displayedParticipants = participants.slice(0, displayCount)
  const hasMore = displayCount < participants.length

  const getPositionStyle = (index) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500'
    if (index === 1) return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400'
    if (index === 2) return 'bg-gradient-to-r from-orange-600/20 to-orange-700/20 border-orange-600'
    return 'bg-gray-800/50 border-gray-700'
  }

  const getPositionEmoji = (index) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `${index + 1}º`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            🏆 Leaderboard
          </h1>
          <p className="text-xl text-gray-400">{QUIZ_CONFIG.title}</p>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Department Filter */}
            <div className="md:w-48">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos departamentos</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Limit */}
            <div className="md:w-36">
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {LIMIT_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>Top {opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex justify-between text-sm text-gray-400">
            <span>
              Mostrando {displayedParticipants.length} de {participants.length}
              {totalCount > participants.length && ` (${totalCount} total)`}
            </span>
            <span className="text-green-400">● Atualização automática</span>
          </div>
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">
            Carregando...
          </div>
        ) : displayedParticipants.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            {searchTerm || departmentFilter ? 'Nenhum resultado encontrado' : 'Nenhum participante ainda'}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {displayedParticipants.map((participant, index) => (
                <div
                  key={participant.id}
                  className={`flex items-center p-3 md:p-4 rounded-xl border-2 transition-all ${getPositionStyle(index)}`}
                >
                  {/* Position */}
                  <div className="w-14 text-center">
                    <span className={`text-xl md:text-2xl ${index < 3 ? '' : 'text-gray-400'}`}>
                      {getPositionEmoji(index)}
                    </span>
                  </div>

                  {/* Name, Matricula & Department */}
                  <div className="flex-1 ml-3 min-w-0">
                    <p className={`font-bold text-base md:text-lg truncate ${index < 3 ? 'text-white' : 'text-gray-300'}`}>
                      {participant.full_name}
                    </p>
                    <p className="text-xs md:text-sm text-gray-400 truncate">
                      <span className="text-gray-500">#{participant.matricula}</span>
                      {participant.departamento && ` · ${participant.departamento}`}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right ml-2">
                    <p className={`text-xl md:text-2xl font-bold ${
                      index === 0 ? 'text-yellow-400' :
                      index === 1 ? 'text-gray-300' :
                      index === 2 ? 'text-orange-400' :
                      'text-gray-400'
                    }`}>
                      {participant.total_score}
                    </p>
                    <p className="text-xs text-gray-500">pts</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Carregar mais ({participants.length - displayCount} restantes)
                </button>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Total: {totalCount} participantes</p>
        </div>
      </div>
    </div>
  )
}
