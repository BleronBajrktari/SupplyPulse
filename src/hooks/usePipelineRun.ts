import { useEffect, useState } from 'react'
import { getPipelineSnapshot, pipelineRunBus, resetPipelineRun, startPipelineRun } from '../mocks/pipelineRun'
import type { PipelineRunSnapshot } from '../mocks/pipelineRun'

export function usePipelineRun() {
  const [snapshot, setSnapshot] = useState<PipelineRunSnapshot>(getPipelineSnapshot)

  useEffect(() => {
    function handleChange(event: Event) {
      setSnapshot((event as CustomEvent<PipelineRunSnapshot>).detail)
    }
    pipelineRunBus.addEventListener('change', handleChange)
    return () => pipelineRunBus.removeEventListener('change', handleChange)
  }, [])

  return { ...snapshot, run: startPipelineRun, reset: resetPipelineRun }
}
