export default function Timer({ timeLeft, totalTime }) {
  const percentage = (timeLeft / totalTime) * 100
  const isLow = timeLeft <= 5
  const isCritical = timeLeft <= 3

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1 sm:mb-2">
        <span className="text-xs sm:text-sm text-gray-400 font-medium">Tempo</span>
        <span
          className={`text-xl sm:text-2xl font-bold tabular-nums transition-all duration-300 ${
            isCritical
              ? 'text-red-400 scale-110 animate-pulse'
              : isLow
                ? 'text-amber-400 animate-pulse'
                : 'text-white'
          }`}
        >
          {timeLeft}s
        </span>
      </div>
      <div className="w-full bg-gray-700/50 rounded-full h-2.5 sm:h-3.5 overflow-hidden backdrop-blur-sm shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear relative ${
            isCritical
              ? 'animate-pulse'
              : ''
          }`}
          style={{
            width: `${percentage}%`,
            background: isCritical
              ? 'linear-gradient(90deg, #ef4444 0%, #f87171 50%, #ef4444 100%)'
              : isLow
                ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)'
                : 'linear-gradient(90deg, #22c55e 0%, #4ade80 25%, #86efac 50%, #4ade80 75%, #22c55e 100%)',
            boxShadow: isCritical
              ? '0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3)'
              : isLow
                ? '0 0 15px rgba(245, 158, 11, 0.5), 0 0 30px rgba(245, 158, 11, 0.2)'
                : '0 0 12px rgba(34, 197, 94, 0.5), 0 0 24px rgba(34, 197, 94, 0.2)',
          }}
        >
          {/* Shimmer effect */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              animation: 'shimmer 2s infinite',
            }}
          />
        </div>
      </div>
    </div>
  )
}
