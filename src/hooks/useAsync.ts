import { useCallback, useEffect, useRef, useState } from 'react'
import type { ApiError } from '../types/api'

/**
 * Shared data-fetching hook: tracks loading/error/data and exposes `retry`.
 * `depsKey` (e.g. a scanId) is the only reactive value that should trigger a refetch;
 * `fetcher` is read from a ref so callers can pass a fresh closure each render.
 */
export function useAsync<T>(fetcher: () => Promise<T>, depsKey: string) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [lastAttempt, setLastAttempt] = useState(attempt)

  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  if (attempt !== lastAttempt) {
    setLastAttempt(attempt)
    setIsLoading(true)
    setError(null)
  }

  useEffect(() => {
    let cancelled = false

    fetcherRef.current()
      .then((response) => {
        if (!cancelled) setData(response)
      })
      .catch((err: ApiError) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [attempt, depsKey])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  return { data, error, isLoading, retry }
}
