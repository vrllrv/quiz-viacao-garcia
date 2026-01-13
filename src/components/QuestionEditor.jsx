import { useState } from 'react'

const EMPTY_QUESTION = {
  text: '',
  options: [
    { key: 'A', text: '' },
    { key: 'B', text: '' },
    { key: 'C', text: '' },
    { key: 'D', text: '' },
  ],
  correct: 'A',
  timeLimit: 30,
  points: 100,
  speedBonus: null, // null = use quiz default, number = override
}

export default function QuestionEditor({ question, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState(question || { ...EMPTY_QUESTION, id: Date.now() })
  const [errors, setErrors] = useState({})

  const isNew = !question

  const handleTextChange = (e) => {
    setForm({ ...form, text: e.target.value })
  }

  const handleOptionChange = (key, value) => {
    setForm({
      ...form,
      options: form.options.map(opt =>
        opt.key === key ? { ...opt, text: value } : opt
      ),
    })
  }

  const handleCorrectChange = (e) => {
    setForm({ ...form, correct: e.target.value })
  }

  const handleTimeLimitChange = (e) => {
    setForm({ ...form, timeLimit: parseInt(e.target.value) || 30 })
  }

  const handlePointsChange = (e) => {
    setForm({ ...form, points: parseInt(e.target.value) || 100 })
  }

  const handleSpeedBonusChange = (e) => {
    const value = e.target.value
    if (value === '' || value === 'default') {
      setForm({ ...form, speedBonus: null })
    } else {
      setForm({ ...form, speedBonus: Math.max(0, Math.min(100, parseInt(value) || 0)) })
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!form.text.trim()) {
      newErrors.text = 'Pergunta é obrigatória'
    }
    form.options.forEach(opt => {
      if (!opt.text.trim()) {
        newErrors[`option_${opt.key}`] = `Opção ${opt.key} é obrigatória`
      }
    })
    if (form.timeLimit < 5 || form.timeLimit > 120) {
      newErrors.timeLimit = 'Tempo deve ser entre 5 e 120 segundos'
    }
    const points = form.points || 100
    if (points < 10 || points > 1000) {
      newErrors.points = 'Pontos devem ser entre 10 e 1000'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSave(form)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {isNew ? 'Nova Pergunta' : 'Editar Pergunta'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pergunta
            </label>
            <textarea
              value={form.text}
              onChange={handleTextChange}
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 ${
                errors.text ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Digite a pergunta..."
            />
            {errors.text && <p className="text-red-500 text-sm mt-1">{errors.text}</p>}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Opções
            </label>
            {form.options.map((option) => (
              <div key={option.key} className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  form.correct === option.key
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {option.key}
                </span>
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => handleOptionChange(option.key, e.target.value)}
                  className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 ${
                    errors[`option_${option.key}`] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={`Opção ${option.key}`}
                />
                <label className="flex items-center gap-1 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="correct"
                    value={option.key}
                    checked={form.correct === option.key}
                    onChange={handleCorrectChange}
                    className="w-4 h-4 text-green-500"
                  />
                  Correta
                </label>
              </div>
            ))}
          </div>

          {/* Time Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tempo Limite (segundos)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={form.timeLimit}
                onChange={handleTimeLimitChange}
                min={5}
                max={120}
                className={`w-24 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 ${
                  errors.timeLimit ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex gap-2">
                {[15, 30, 45, 60].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, timeLimit: t })}
                    className={`px-3 py-1 rounded text-sm ${
                      form.timeLimit === t
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            </div>
            {errors.timeLimit && <p className="text-red-500 text-sm mt-1">{errors.timeLimit}</p>}
          </div>

          {/* Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pontos
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={form.points || 100}
                onChange={handlePointsChange}
                min={10}
                max={1000}
                step={10}
                className={`w-24 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 ${
                  errors.points ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex gap-2">
                {[50, 100, 150, 200].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm({ ...form, points: p })}
                    className={`px-3 py-1 rounded text-sm ${
                      (form.points || 100) === p
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            {errors.points && <p className="text-red-500 text-sm mt-1">{errors.points}</p>}
          </div>

          {/* Speed Bonus Override */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bonus de Velocidade (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={form.speedBonus ?? ''}
                onChange={handleSpeedBonusChange}
                min={0}
                max={100}
                step={5}
                placeholder="Padrão"
                className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, speedBonus: null })}
                  className={`px-3 py-1 rounded text-sm ${
                    form.speedBonus === null
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  Padrão
                </button>
                {[0, 25, 50, 100].map((b) => (
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
              Deixe em "Padrão" para usar o bonus do quiz, ou defina um valor específico para esta pergunta.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <div>
              {!isNew && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(form.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  Excluir
                </button>
              )}
            </div>
            <div className="flex gap-3">
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
          </div>
        </form>
      </div>
    </div>
  )
}
