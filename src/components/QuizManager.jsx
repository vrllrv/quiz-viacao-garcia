import { useState } from 'react'
import {
  getQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  duplicateQuiz,
  setActiveQuiz,
} from '../data/questions'

export default function QuizManager({ onSelectQuiz }) {
  const [quizzes, setQuizzes] = useState(getQuizzes())
  const [editingQuiz, setEditingQuiz] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const refreshQuizzes = () => {
    setQuizzes(getQuizzes())
  }

  const handleCreate = () => {
    setEditingQuiz(null)
    setShowForm(true)
  }

  const handleEdit = (quiz) => {
    setEditingQuiz(quiz)
    setShowForm(true)
  }

  const handleSave = (formData) => {
    if (editingQuiz) {
      updateQuiz(editingQuiz.id, formData)
    } else {
      createQuiz(formData)
    }
    refreshQuizzes()
    setShowForm(false)
    setEditingQuiz(null)
  }

  const handleDelete = (quizId) => {
    if (quizzes.length <= 1) {
      alert('Você precisa manter pelo menos um quiz.')
      return
    }
    if (confirm('Tem certeza que deseja excluir este quiz?')) {
      deleteQuiz(quizId)
      refreshQuizzes()
    }
  }

  const handleDuplicate = (quizId) => {
    duplicateQuiz(quizId)
    refreshQuizzes()
  }

  const handleSetActive = (quizId) => {
    setActiveQuiz(quizId)
    refreshQuizzes()
  }

  const handleManageQuestions = (quiz) => {
    // First set this quiz as active so questions tab edits it
    setActiveQuiz(quiz.id)
    refreshQuizzes()
    if (onSelectQuiz) {
      onSelectQuiz(quiz)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Gerenciar Quizzes</h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <span>+</span> Novo Quiz
        </button>
      </div>

      {/* Quiz List */}
      <div className="space-y-3">
        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            className={`p-4 rounded-xl border-2 transition ${
              quiz.isActive
                ? 'bg-green-50 border-green-500'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-800 truncate">{quiz.name}</h3>
                  {quiz.isActive && (
                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {quiz.description || 'Sem descrição'}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span>{quiz.questions?.length || 0} perguntas</span>
                  <span>Bonus: {quiz.speedBonus ?? 50}%</span>
                  <span>Criado em {new Date(quiz.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {!quiz.isActive && (
                  <button
                    onClick={() => handleSetActive(quiz.id)}
                    className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                    title="Ativar quiz"
                  >
                    Ativar
                  </button>
                )}
                <button
                  onClick={() => handleManageQuestions(quiz)}
                  className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                  title="Gerenciar perguntas"
                >
                  Perguntas
                </button>
                <button
                  onClick={() => handleEdit(quiz)}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  title="Editar quiz"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDuplicate(quiz.id)}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  title="Duplicar quiz"
                >
                  Duplicar
                </button>
                <button
                  onClick={() => handleDelete(quiz.id)}
                  className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                  title="Excluir quiz"
                  disabled={quizzes.length <= 1}
                >
                  Excluir
                </button>
              </div>
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

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!form.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSave(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {quiz ? 'Editar Quiz' : 'Novo Quiz'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Quiz *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Descrição opcional do quiz..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bonus de Velocidade (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={form.speedBonus}
                onChange={(e) => setForm({ ...form, speedBonus: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                min={0}
                max={100}
                step={5}
                className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
              <div className="flex gap-2">
                {[0, 25, 50, 75, 100].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setForm({ ...form, speedBonus: b })}
                    className={`px-3 py-1 rounded text-sm ${
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
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.showCorrectAnswer}
                onChange={(e) => setForm({ ...form, showCorrectAnswer: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Mostrar resposta correta</span>
                <p className="text-xs text-gray-500">
                  Exibe a resposta correta após o participante responder cada pergunta.
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
