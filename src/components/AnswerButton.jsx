export default function AnswerButton({ option, selected, correct, showResult, showCorrectAnswer = true, onClick, disabled, index = 0 }) {
  const getButtonStyle = () => {
    if (!showResult) {
      if (selected) {
        return 'bg-gradient-to-r from-emerald-600 to-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]'
      }
      return 'bg-gray-800/80 border-gray-600 text-white hover:bg-gray-700/90 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 hover:scale-[1.01]'
    }

    // Show result state
    const isCorrect = option.key === correct
    const isWrongSelection = selected && !isCorrect

    // Always show correct answer in green if showCorrectAnswer is true
    if (isCorrect && showCorrectAnswer) {
      return 'bg-gradient-to-r from-emerald-600 to-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30 animate-correct'
    }
    // Show selected wrong answer in red
    if (isWrongSelection) {
      return 'bg-gradient-to-r from-red-600 to-red-500 border-red-400 text-white shadow-lg shadow-red-500/30 animate-wrong'
    }
    // If showCorrectAnswer is false but this was selected correctly, show green
    if (isCorrect && selected) {
      return 'bg-gradient-to-r from-emerald-600 to-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30 animate-correct'
    }
    return 'bg-gray-800/60 border-gray-700 text-gray-500 opacity-60'
  }

  return (
    <button
      onClick={() => onClick(option.key)}
      disabled={disabled || showResult}
      className={`
        w-full p-3 sm:p-4 rounded-xl border-2 text-left
        transition-all duration-300 ease-out
        text-sm sm:text-base backdrop-blur-sm
        transform-gpu
        ${getButtonStyle()}
        disabled:cursor-not-allowed
        active:scale-[0.98]
      `}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <span className="font-bold mr-2 sm:mr-3 inline-block min-w-[1.5rem]">{option.key})</span>
      <span>{option.text}</span>
    </button>
  )
}
