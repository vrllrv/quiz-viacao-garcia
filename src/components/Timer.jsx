export default function Timer({ timeLeft, totalTime }) {
  const percentage = (timeLeft / totalTime) * 100
  const isLow = timeLeft <= 5

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1 sm:mb-2">
        <span className="text-xs sm:text-sm text-gray-400">Tempo</span>
        <span className={`text-xl sm:text-2xl font-bold ${isLow ? 'text-yellow-400 animate-pulse' : 'text-white'}`}>
          {timeLeft}s
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 sm:h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
            isLow ? 'bg-yellow-500' : 'bg-[#5a6e3a]'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
