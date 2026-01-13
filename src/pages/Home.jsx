import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { QUIZ_CONFIG, getActiveQuiz } from '../data/questions'

export default function Home() {
  const navigate = useNavigate()
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [formData, setFormData] = useState({
    fullName: '',
    matricula: '',
    departamento: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setActiveQuiz(getActiveQuiz())
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.fullName || !formData.matricula || !formData.departamento) {
      setError('Preencha todos os campos')
      setLoading(false)
      return
    }

    try {
      if (supabase) {
        const { data, error: dbError } = await supabase
          .from('participants')
          .insert({
            full_name: formData.fullName,
            matricula: formData.matricula,
            departamento: formData.departamento,
          })
          .select()
          .single()

        if (dbError) throw dbError

        localStorage.setItem('participantId', data.id)
        localStorage.setItem('participantName', data.full_name)
      } else {
        // Demo mode - generate fake ID
        const fakeId = 'demo-' + Date.now()
        localStorage.setItem('participantId', fakeId)
        localStorage.setItem('participantName', formData.fullName)
      }

      navigate('/quiz')
    } catch (err) {
      console.error(err)
      setError('Erro ao registrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {activeQuiz?.name || QUIZ_CONFIG.title}
          </h1>
          {activeQuiz?.description && (
            <p className="text-gray-500 text-sm mb-2">{activeQuiz.description}</p>
          )}
          <p className="text-gray-600">Preencha seus dados para começar</p>
          {activeQuiz && (
            <p className="text-xs text-gray-400 mt-2">
              {activeQuiz.questions?.length || 0} perguntas
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900"
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Matrícula
            </label>
            <input
              type="text"
              name="matricula"
              value={formData.matricula}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900"
              placeholder="Sua matrícula"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Departamento
            </label>
            <input
              type="text"
              name="departamento"
              value={formData.departamento}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900"
              placeholder="Seu departamento"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Participar do Quiz'}
          </button>
        </form>
      </div>
    </div>
  )
}
