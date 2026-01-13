export default function AnswerButton({ option, selected, correct, showResult, showCorrectAnswer = true, onClick, disabled }) {
  const getButtonStyle = () => {
    if (!showResult) {
      if (selected) {
        return 'bg-emerald-600 border-emerald-400 text-white'
      }
      return 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:border-emerald-500'
    }

    // Show result state
    const isCorrect = option.key === correct
    const isWrongSelection = selected && !isCorrect

    if (isCorrect && showCorrectAnswer) {
      return 'bg-emerald-600 border-emerald-400 text-white'
    }
    if (isWrongSelection) {
      return 'bg-red-600 border-red-400 text-white'
    }
    if (isCorrect && selected) {
      return 'bg-emerald-600 border-emerald-400 text-white'
    }
    return 'bg-gray-800 border-gray-600 text-gray-500'
  }

  return (
    <button
      onClick={() => onClick(option.key)}
      disabled={disabled || showResult}
      className={`w-full p-3 sm:p-4 rounded-xl border-2 text-left transition-all duration-200 text-sm sm:text-base ${getButtonStyle()} disabled:cursor-not-allowed`}
    >
      <span className="font-bold mr-2 sm:mr-3">{option.key})</span>
      <span>{option.text}</span>
    </button>
  )
}
