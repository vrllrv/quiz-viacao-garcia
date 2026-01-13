import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getQuestions, saveQuestions, DEFAULT_QUESTIONS, getActiveQuiz } from '../data/questions'
import QuestionEditor from '../components/QuestionEditor'
import QuizManager from '../components/QuizManager'

const ITEMS_PER_PAGE = 50
const ADMIN_PASSWORD = 'garcia2024'
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1u2S_Pw-PpIj5sGcoRkdlHNYcMzN6Lxm1iR20mI8LWoM/edit'
// Active users = participants who started in the last 10 minutes and haven't completed
const ACTIVE_THRESHOLD_MINUTES = 10

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [activeTab, setActiveTab] = useState('participants')
  const [participants, setParticipants] = useState([])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [showEditor, setShowEditor] = useState(false)
  const [activeQuiz, setActiveQuizState] = useState(null)

  // Pagination & Filters
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [quizFilter, setQuizFilter] = useState('')
  const [departments, setDepartments] = useState([])
  const [quizNames, setQuizNames] = useState([])
  const [stats, setStats] = useState({ total: 0, completed: 0, avgScore: 0 })
  const [activeUsers, setActiveUsers] = useState(0)

  const refreshQuizData = () => {
    const quiz = getActiveQuiz()
    setActiveQuizState(quiz)
    setQuestions(quiz.questions || [])
  }

  // Check if already authenticated
  useEffect(() => {
    const stored = sessionStorage.getItem('adminAuth')
    if (stored === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      refreshQuizData()
      fetchStats()
      fetchDepartments()
      fetchQuizNames()
      fetchActiveUsers()
    }
  }, [isAuthenticated])

  // Fetch active users (in progress within last X minutes)
  const fetchActiveUsers = async () => {
    if (!supabase) {
      setActiveUsers(0)
      return
    }

    try {
      const cutoffTime = new Date(Date.now() - ACTIVE_THRESHOLD_MINUTES * 60 * 1000).toISOString()

      const { count } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('completed', false)
        .gte('created_at', cutoffTime)

      setActiveUsers(count || 0)
    } catch (err) {
      console.error('Error fetching active users:', err)
    }
  }

  // Real-time subscription for active users
  useEffect(() => {
    if (!supabase || !isAuthenticated) return

    const channel = supabase
      .channel('admin-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        () => {
          // Refresh stats and active users on any participant change
          fetchStats()
          fetchActiveUsers()
          fetchParticipants()
        }
      )
      .subscribe()

    // Also poll every 30 seconds for active users (in case of stale connections)
    const interval = setInterval(fetchActiveUsers, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [isAuthenticated])

  const handleLogin = (e) => {
    e.preventDefault()
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      sessionStorage.setItem('adminAuth', 'true')
      setPasswordError('')
    } else {
      setPasswordError('Senha incorreta')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('adminAuth')
  }

  useEffect(() => {
    fetchParticipants()
  }, [currentPage, searchTerm, statusFilter, departmentFilter, quizFilter])

  const fetchQuizNames = async () => {
    if (!supabase) return

    try {
      const { data } = await supabase
        .from('participants')
        .select('quiz_name')

      if (data) {
        const uniqueQuizzes = [...new Set(data.map(d => d.quiz_name))].filter(Boolean).sort()
        setQuizNames(uniqueQuizzes)
      }
    } catch (err) {
      console.error('Error fetching quiz names:', err)
    }
  }

  const fetchStats = async () => {
    if (!supabase) {
      setStats({ total: 0, completed: 0, avgScore: 0 })
      return
    }

    try {
      // Get total count
      const { count: total } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })

      // Get completed count
      const { count: completed } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true)

      // Get average score
      const { data: scoreData } = await supabase
        .from('participants')
        .select('total_score')
        .eq('completed', true)

      const avgScore = scoreData && scoreData.length > 0
        ? Math.round(scoreData.reduce((sum, p) => sum + (p.total_score || 0), 0) / scoreData.length)
        : 0

      setStats({ total: total || 0, completed: completed || 0, avgScore })
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const fetchDepartments = async () => {
    if (!supabase) return

    try {
      const { data } = await supabase
        .from('participants')
        .select('departamento')

      if (data) {
        const uniqueDepts = [...new Set(data.map(d => d.departamento))].filter(Boolean).sort()
        setDepartments(uniqueDepts)
      }
    } catch (err) {
      console.error('Error fetching departments:', err)
    }
  }

  const fetchParticipants = useCallback(async () => {
    if (!supabase) {
      setParticipants([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE

      let query = supabase
        .from('participants')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1)

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,matricula.ilike.%${searchTerm}%`)
      }

      if (statusFilter === 'completed') {
        query = query.eq('completed', true)
      } else if (statusFilter === 'in_progress') {
        query = query.eq('completed', false)
      }

      if (departmentFilter) {
        query = query.eq('departamento', departmentFilter)
      }

      if (quizFilter) {
        query = query.eq('quiz_name', quizFilter)
      }

      const { data, error, count } = await query

      if (error) throw error
      setParticipants(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error('Error fetching participants:', err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, statusFilter, departmentFilter, quizFilter])

  const clearParticipants = async () => {
    if (!confirm('Tem certeza que deseja LIMPAR TODOS OS PARTICIPANTES?\n\nEsta ação irá apagar:\n- Todos os participantes\n- Todas as respostas\n\nEsta ação não pode ser desfeita!')) {
      return
    }

    // Double confirmation for production safety
    if (!confirm('CONFIRMAÇÃO FINAL:\n\nVocê está prestes a apagar ' + stats.total + ' participantes.\n\nDigite OK para confirmar.')) {
      return
    }

    setResetting(true)
    if (supabase) {
      try {
        // Delete answers first (foreign key constraint)
        const { error: answersError } = await supabase.from('answers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        if (answersError) throw answersError

        // Then delete participants
        const { error: participantsError } = await supabase.from('participants').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        if (participantsError) throw participantsError

        setCurrentPage(1)
        setDepartments([])
        setQuizNames([])
        await fetchParticipants()
        await fetchStats()
        alert('Dados limpos com sucesso!\n\nLembre-se de limpar a planilha do Google Sheets manualmente.')
      } catch (err) {
        console.error('Error clearing participants:', err)
        alert('Erro ao limpar dados: ' + err.message)
      }
    }
    setResetting(false)
  }

  const openGoogleSheet = () => {
    window.open(GOOGLE_SHEET_URL, '_blank')
  }

  // Question management
  const handleAddQuestion = () => {
    setEditingQuestion(null)
    setShowEditor(true)
  }

  const handleEditQuestion = (question) => {
    setEditingQuestion(question)
    setShowEditor(true)
  }

  const handleSaveQuestion = (question) => {
    let newQuestions
    if (editingQuestion) {
      newQuestions = questions.map(q => q.id === question.id ? question : q)
    } else {
      newQuestions = [...questions, { ...question, id: Date.now() }]
    }
    setQuestions(newQuestions)
    saveQuestions(newQuestions)
    setShowEditor(false)
    setEditingQuestion(null)
  }

  const handleDeleteQuestion = (questionId) => {
    if (!confirm('Tem certeza que deseja excluir esta pergunta?')) return
    const newQuestions = questions.filter(q => q.id !== questionId)
    setQuestions(newQuestions)
    saveQuestions(newQuestions)
    setShowEditor(false)
    setEditingQuestion(null)
  }

  const handleResetQuestions = () => {
    if (!confirm('Restaurar perguntas padrão? As perguntas atuais serão perdidas.')) return
    setQuestions(DEFAULT_QUESTIONS)
    saveQuestions(DEFAULT_QUESTIONS)
  }

  const moveQuestion = (index, direction) => {
    const newQuestions = [...questions]
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= questions.length) return
    ;[newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]]
    setQuestions(newQuestions)
    saveQuestions(newQuestions)
  }

  // Pagination
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const canGoPrev = currentPage > 1
  const canGoNext = currentPage < totalPages

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setDepartmentFilter('')
    setQuizFilter('')
    setCurrentPage(1)
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen min-h-dvh bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="bg-[#333] rounded-xl p-4">
              <img src="/logo_garcia.svg" alt="Viação Garcia" className="h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Admin</h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a6e3a] focus:border-transparent text-gray-900"
                placeholder="Digite a senha"
                autoFocus
              />
            </div>
            {passwordError && (
              <p className="text-red-500 text-sm mb-4">{passwordError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-[#5a6e3a] text-white py-3 rounded-lg font-semibold hover:bg-[#4a5a2a] transition"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-dvh bg-gray-100 p-2 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 md:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Admin - Quiz</h1>
            <p className="text-sm sm:text-base text-gray-600">Gerenciamento do quiz</p>
          </div>
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={openGoogleSheet}
              className="bg-[#5a6e3a] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-[#4a5a2a] transition flex items-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="hidden sm:inline">Planilha</span>
            </button>
            <button
              onClick={clearParticipants}
              disabled={resetting || stats.total === 0}
              className="bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden sm:inline">{resetting ? 'Limpando...' : 'Limpar'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-600 transition text-sm sm:text-base"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Tabs - scrollable on mobile */}
        <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab('participants')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'participants'
                ? 'bg-[#5a6e3a] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Participantes ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'quizzes'
                ? 'bg-[#5a6e3a] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Quizzes
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'questions'
                ? 'bg-[#5a6e3a] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Perguntas ({questions.length})
          </button>
        </div>

        {/* Active Quiz indicator */}
        {activeQuiz && (
          <div className="bg-[#5a6e3a]/10 border border-[#5a6e3a]/30 rounded-lg p-2 sm:p-3 mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-sm sm:text-base">
              <span className="text-[#5a6e3a]">Quiz ativo:</span>
              <span className="ml-2 font-medium text-[#4a5a2a]">{activeQuiz.name}</span>
            </div>
            <button
              onClick={() => setActiveTab('quizzes')}
              className="text-sm text-[#5a6e3a] hover:text-[#4a5a2a] hover:underline self-start sm:self-auto"
            >
              Alterar
            </button>
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div className="bg-white rounded-xl shadow p-3 sm:p-4 md:p-6">
            <QuizManager
              onSelectQuiz={(quiz) => {
                refreshQuizData()
                setActiveTab('questions')
              }}
            />
          </div>
        )}

        {activeTab === 'participants' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 md:mb-6">
              <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow">
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#5a6e3a]">{stats.total}</p>
                <p className="text-xs sm:text-sm md:text-base text-gray-600">Total</p>
              </div>
              <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow">
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-xs sm:text-sm md:text-base text-gray-600">Finalizados</p>
              </div>
              <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow relative">
                <div className="flex items-center gap-2">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-500">{activeUsers}</p>
                  {activeUsers > 0 && (
                    <span className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full animate-pulse"></span>
                  )}
                </div>
                <p className="text-xs sm:text-sm md:text-base text-gray-600">Ao vivo</p>
              </div>
              <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow">
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">{stats.avgScore}</p>
                <p className="text-xs sm:text-sm md:text-base text-gray-600">Média pts</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow p-3 sm:p-4 mb-4 md:mb-6">
              <div className="flex flex-col gap-3 md:gap-4">
                {/* Search - full width on all */}
                <div className="w-full">
                  <input
                    type="text"
                    placeholder="Buscar por nome ou matrícula..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a6e3a] focus:border-transparent text-gray-900 text-sm sm:text-base"
                  />
                </div>

                {/* Filter row */}
                <div className="grid grid-cols-2 md:flex gap-2 md:gap-4">

                {/* Status Filter */}
                <div className="md:w-40">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a6e3a] focus:border-transparent text-gray-900 text-sm sm:text-base"
                  >
                    <option value="">Status</option>
                    <option value="completed">Finalizados</option>
                    <option value="in_progress">Em andamento</option>
                  </select>
                </div>

                {/* Department Filter */}
                <div className="md:w-48">
                  <select
                    value={departmentFilter}
                    onChange={(e) => {
                      setDepartmentFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a6e3a] focus:border-transparent text-gray-900 text-sm sm:text-base"
                  >
                    <option value="">Departamento</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Quiz Filter */}
                <div className="md:w-48">
                  <select
                    value={quizFilter}
                    onChange={(e) => {
                      setQuizFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a6e3a] focus:border-transparent text-gray-900 text-sm sm:text-base"
                  >
                    <option value="">Quiz</option>
                    {quizNames.map(quiz => (
                      <option key={quiz} value={quiz}>{quiz}</option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                {(searchTerm || statusFilter || departmentFilter || quizFilter) && (
                  <button
                    onClick={handleClearFilters}
                    className="col-span-2 md:col-span-1 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition text-sm sm:text-base"
                  >
                    Limpar filtros
                  </button>
                )}
                </div>
              </div>

              {/* Results count */}
              <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-500">
                Mostrando {participants.length} de {totalCount} participantes
                {(searchTerm || statusFilter || departmentFilter || quizFilter) && ' (filtrado)'}
              </div>
            </div>

            {/* Table - Cards on mobile, table on desktop */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Matrícula
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dept
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pontos
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                          Carregando...
                        </td>
                      </tr>
                    ) : participants.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                          {searchTerm || statusFilter || departmentFilter
                            ? 'Nenhum resultado encontrado'
                            : 'Nenhum participante ainda'}
                        </td>
                      </tr>
                    ) : (
                      participants.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 text-sm">
                            {p.full_name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-sm">
                            {p.matricula}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-sm">
                            {p.departamento}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className="font-bold text-[#5a6e3a]">{p.total_score || 0}</span>
                            <span className="text-gray-400 text-xs ml-1">
                              ({p.correct_count || 0}/{questions.length})
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {p.completed ? (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                OK
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                ...
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs">
                            {new Date(p.created_at).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {loading ? (
                  <div className="px-4 py-12 text-center text-gray-500">Carregando...</div>
                ) : participants.length === 0 ? (
                  <div className="px-4 py-12 text-center text-gray-500">
                    {searchTerm || statusFilter || departmentFilter
                      ? 'Nenhum resultado encontrado'
                      : 'Nenhum participante ainda'}
                  </div>
                ) : (
                  participants.map((p) => (
                    <div key={p.id} className="p-3 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium text-gray-900 text-sm">{p.full_name}</div>
                        <span className="font-bold text-[#5a6e3a]">{p.total_score || 0} pts</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span>#{p.matricula}</span>
                        {p.departamento && <span>· {p.departamento}</span>}
                        <span>· {p.correct_count || 0}/{questions.length} acertos</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-400">
                          {new Date(p.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        {p.completed ? (
                          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Finalizado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            Em andamento
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-3 sm:px-6 py-3 sm:py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="text-xs sm:text-sm text-gray-500">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex gap-1 sm:gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={!canGoPrev}
                      className="px-2 sm:px-3 py-1 rounded border text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => p - 1)}
                      disabled={!canGoPrev}
                      className="px-2 sm:px-3 py-1 rounded border text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      ‹ Ant
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={!canGoNext}
                      className="px-2 sm:px-3 py-1 rounded border text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Próx ›
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={!canGoNext}
                      className="px-2 sm:px-3 py-1 rounded border text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'questions' && (
          <>
            {/* Questions Header */}
            <div className="flex flex-col gap-3 mb-4">
              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm sm:text-base text-gray-600">
                  {questions.length} pergunta{questions.length !== 1 ? 's' : ''}
                </p>
                <span className="text-xs sm:text-sm text-purple-600 bg-purple-100 px-2 sm:px-3 py-1 rounded-full font-medium">
                  {questions.reduce((sum, q) => sum + (q.points || 100), 0)} pts
                  <span className="hidden sm:inline"> (max: {Math.round(questions.reduce((sum, q) => {
                    const pts = q.points || 100
                    const bonus = q.speedBonus ?? activeQuiz?.speedBonus ?? 50
                    return sum + pts * (1 + bonus / 100)
                  }, 0))})</span>
                </span>
                <span className="text-xs sm:text-sm text-orange-600 bg-orange-100 px-2 sm:px-3 py-1 rounded-full font-medium">
                  Bonus: {activeQuiz?.speedBonus ?? 50}%
                </span>
              </div>
              {/* Actions row */}
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={handleResetQuestions}
                  className="text-gray-600 hover:text-gray-800 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-200 transition text-sm sm:text-base"
                >
                  Restaurar Padrão
                </button>
                <button
                  onClick={handleAddQuestion}
                  className="bg-[#5a6e3a] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-[#4a5a2a] transition text-sm sm:text-base"
                >
                  + Nova Pergunta
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-2 sm:space-y-3">
              {questions.length === 0 ? (
                <div className="bg-white rounded-xl p-8 sm:p-12 text-center text-gray-500 text-sm sm:text-base">
                  Nenhuma pergunta configurada. Clique em "Nova Pergunta" para começar.
                </div>
              ) : (
                questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="bg-white rounded-xl p-3 sm:p-4 shadow hover:shadow-md transition"
                  >
                    <div className="flex items-start gap-2 sm:gap-4">
                      {/* Order controls */}
                      <div className="flex flex-col gap-0.5 sm:gap-1">
                        <button
                          onClick={() => moveQuestion(index, -1)}
                          disabled={index === 0}
                          className="p-0.5 sm:p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <span className="text-center text-xs sm:text-sm font-bold text-gray-400">{index + 1}</span>
                        <button
                          onClick={() => moveQuestion(index, 1)}
                          disabled={index === questions.length - 1}
                          className="p-0.5 sm:p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Question content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 mb-2 text-sm sm:text-base">{question.text}</p>
                        <div className="flex flex-wrap gap-1 sm:gap-2 text-xs sm:text-sm">
                          {question.options.map(opt => (
                            <span
                              key={opt.key}
                              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${
                                opt.key === question.correct
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {opt.key}) <span className="hidden sm:inline">{opt.text}</span><span className="sm:hidden">{opt.text.substring(0, 15)}{opt.text.length > 15 ? '...' : ''}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Time, Points, Bonus and actions */}
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2">
                        <span className="text-xs sm:text-sm text-purple-600 bg-purple-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium">
                          {question.points || 100}p
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                          {question.timeLimit}s
                        </span>
                        {question.speedBonus !== null && question.speedBonus !== undefined && (
                          <span className="hidden sm:inline text-xs sm:text-sm text-orange-600 bg-orange-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium">
                            +{question.speedBonus}%
                          </span>
                        )}
                        <button
                          onClick={() => handleEditQuestion(question)}
                          className="text-[#5a6e3a] hover:text-[#4a5a2a] p-1.5 sm:p-2 rounded-lg hover:bg-[#5a6e3a]/10 transition"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Question Editor Modal */}
      {showEditor && (
        <QuestionEditor
          question={editingQuestion}
          onSave={handleSaveQuestion}
          onCancel={() => {
            setShowEditor(false)
            setEditingQuestion(null)
          }}
          onDelete={handleDeleteQuestion}
        />
      )}
    </div>
  )
}
