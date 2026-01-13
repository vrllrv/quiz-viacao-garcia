export default function AnswerButton({ option, selected, correct, showResult, showCorrectAnswer = true, onClick, disabled }) {
  const getButtonStyle = () => {
    if (!showResult) {
      if (selected) {
        return 'bg-blue-600 border-blue-400 text-white'
      }
      return 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:border-gray-500'
    }

    // Show result state
    const isCorrect = option.key === correct
    const isWrongSelection = selected && !isCorrect

    // Always show correct answer in green if showCorrectAnswer is true
    if (isCorrect && showCorrectAnswer) {
      return 'bg-green-600 border-green-400 text-white'
    }
    // Show selected wrong answer in red
    if (isWrongSelection) {
      return 'bg-red-600 border-red-400 text-white'
    }
    // If showCorrectAnswer is false but this was selected correctly, show green
    if (isCorrect && selected) {
      return 'bg-green-600 border-green-400 text-white'
    }
    return 'bg-gray-800 border-gray-600 text-gray-400'
  }

  return (
    <button
      onClick={() => onClick(option.key)}
      disabled={disabled || showResult}
      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${getButtonStyle()} disabled:cursor-not-allowed`}
    >
      <span className="font-bold mr-3">{option.key})</span>
      <span>{option.text}</span>
    </button>
  )
}
