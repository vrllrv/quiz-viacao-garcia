import { useState, useEffect, useCallback } from 'react'

export function useTimer(initialTime, onTimeout) {
  const [timeLeft, setTimeLeft] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          onTimeout?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning, timeLeft, onTimeout])

  const start = useCallback(() => {
    setIsRunning(true)
  }, [])

  const stop = useCallback(() => {
    setIsRunning(false)
  }, [])

  const reset = useCallback((newTime = initialTime) => {
    setTimeLeft(newTime)
    setIsRunning(false)
  }, [initialTime])

  return { timeLeft, isRunning, start, stop, reset }
}
