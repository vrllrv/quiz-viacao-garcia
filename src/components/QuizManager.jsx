import { useState, useEffect } from 'react'
import {
  getQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  duplicateQuiz,
  setActiveQuiz,
} from '../data/questions'

export default function QuizManager({ onSelectQuiz }) {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingQuiz, setEditingQuiz] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    refreshQuizzes()
  }, [])

  const refreshQuizzes = async () => {
    setLoading(true)
    const data = await getQuizzes()
    setQuizzes(data)
    setLoading(false)
  }

  const handleCreate = () => {
    setEditingQuiz(null)
    setShowForm(true)
  }

  const handleEdit = (quiz) => {
    setEditingQuiz(quiz)
    setShowForm(true)
  }

  const handleSave = async (formData) => {
    if (editingQuiz) {
      await updateQuiz(editingQuiz.id, formData)
    } else {
      await createQuiz(formData)
    }
    await refreshQuizzes()
    setShowForm(false)
    setEditingQuiz(null)
  }

  const handleDelete = async (quizId) => {
    if (quizzes.length <= 1) {
      alert('Você precisa manter pelo menos um quiz.')
      return
    }
    if (confirm('Tem certeza que deseja excluir este quiz?')) {
      await deleteQuiz(quizId)
      await refreshQuizzes()
    }
  }

  const handleDuplicate = async (quizId) => {
    await duplicateQuiz(quizId)
    await refreshQuizzes()
  }

  const handleSetActive = async (quizId) => {
    await setActiveQuiz(quizId)
    await refreshQuizzes()
  }

  const handleManageQuestions = async (quiz) => {
    // First set this quiz as active so questions tab edits it
    await setActiveQuiz(quiz.id)
    await refreshQuizzes()
    if (onSelectQuiz) {
      onSelectQuiz(quiz)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        Carregando quizzes...
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-lg md:text-xl font-bold text-gray-800">Gerenciar Quizzes</h2>
        <button
          onClick={handleCreate}
          className="w-full sm:w-auto px-4 py-2 bg-[#5a6e3a] text-white rounded-lg hover:bg-[#4a5a2a] transition flex items-center justify-center gap-2"
        >
          <span>+</span> Novo Quiz
        </button>
      </div>

      {/* Quiz List */}
      <div className="space-y-3">
        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            className={`p-3 md:p-4 rounded-xl border-2 transition ${
              quiz.isActive
                ? 'bg-green-50 border-green-500'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Quiz Info */}
            <div className="flex-1 min-w-0 mb-3">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-bold text-gray-800">{quiz.name}</h3>
                {quiz.isActive && (
                  <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                    Ativo
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">
                {quiz.description || 'Sem descrição'}
              </p>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2 text-xs text-gray-400">
                <span>{quiz.questions?.length || 0} perguntas</span>
                <span>Bonus: {quiz.speedBonus ?? 50}%</span>
                <span className="hidden sm:inline">Criado em {new Date(quiz.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            {/* Action Buttons - Grid on mobile, flex on desktop */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              {!quiz.isActive && (
                <button
                  onClick={() => handleSetActive(quiz.id)}
                  className="px-3 py-2 sm:py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-center"
                  title="Ativar quiz"
                >
                  Ativar
                </button>
              )}
              <button
                onClick={() => handleManageQuestions(quiz)}
                className="px-3 py-2 sm:py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-center"
                title="Gerenciar perguntas"
              >
                Perguntas
              </button>
              <button
                onClick={() => handleEdit(quiz)}
                className="px-3 py-2 sm:py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-center"
                title="Editar quiz"
              >
                Editar
              </button>
              <button
                onClick={() => handleDuplicate(quiz.id)}
                className="px-3 py-2 sm:py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-center"
                title="Duplicar quiz"
              >
                Duplicar
              </button>
              <button
                onClick={() => handleDelete(quiz.id)}
                className="px-3 py-2 sm:py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-center col-span-2 sm:col-span-1"
                title="Excluir quiz"
                disabled={quizzes.length <= 1}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {quizzes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhum quiz cadastrado.</p>
          <button
            onClick={handleCreate}
            className="mt-4 text-blue-600 hover:underline"
          >
            Criar primeiro quiz
          </button>
        </div>
      )}

      {/* Quiz Form Modal */}
      {showForm && (
        <QuizForm
          quiz={editingQuiz}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false)
            setEditingQuiz(null)
          }}
        />
      )}
    </div>
  )
}

function QuizForm({ quiz, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: quiz?.name || '',
    description: quiz?.description || '',
    speedBonus: quiz?.speedBonus ?? 50,
    showCorrectAnswer: quiz?.showCorrectAnswer ?? true,
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!form.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            {quiz ? 'Editar Quiz' : 'Novo Quiz'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Quiz *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#5a6e3a] focus:border-transparent text-gray-900 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: Quiz de Integração 2024"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a6e3a] focus:border-transparent text-gray-900"
              placeholder="Descrição opcional do quiz..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bonus de Velocidade (%)
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <input
                type="number"
                value={form.speedBonus}
                onChange={(e) => setForm({ ...form, speedBonus: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                min={0}
                max={100}
                step={5}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a6e3a] focus:border-transparent text-gray-900"
              />
              <div className="flex flex-wrap gap-2">
                {[0, 25, 50, 75, 100].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setForm({ ...form, speedBonus: b })}
                    className={`px-3 py-1.5 sm:py-1 rounded text-sm ${
                      form.speedBonus === b
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {b}%
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Bonus máximo para respostas rápidas. Ex: 50% = resposta de 100pts pode valer até 150pts.
            </p>
          </div>

          <div>
            <label className="flex items-start sm:items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.showCorrectAnswer}
                onChange={(e) => setForm({ ...form, showCorrectAnswer: e.target.checked })}
                className="w-5 h-5 mt-0.5 sm:mt-0 rounded border-gray-300 text-[#5a6e3a] focus:ring-[#5a6e3a]"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Mostrar resposta correta</span>
                <p className="text-xs text-gray-500">
                  Exibe a resposta correta após o participante responder cada pergunta.
                </p>
              </div>
            </label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2 bg-[#5a6e3a] text-white rounded-lg hover:bg-[#4a5a2a] transition disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
