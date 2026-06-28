import { useLayoutEffect, useState, type RefObject } from "react"

interface UseFitRowsOptions {
  hardMax: number
  rowSelector: string
  listSelector: string
  initial?: number
}

// computes how many rows fit below the list's top in the container, recomputed on resize
export function useFitRows(
  containerRef: RefObject<HTMLElement | null>,
  { hardMax, rowSelector, listSelector, initial = 6 }: UseFitRowsOptions,
): number {
  const [fitCount, setFitCount] = useState(initial)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const measure = () => {
      const list = container.querySelector<HTMLElement>(listSelector)
      const row = container.querySelector<HTMLElement>(rowSelector)
      if (!list || !row) return

      const containerRect = container.getBoundingClientRect()
      const listTop = list.getBoundingClientRect().top - containerRect.top
      const available = container.clientHeight - listTop
      if (available <= 0) return

      const rowGap = parseFloat(getComputedStyle(list).rowGap) || 0
      const rowUnit = row.offsetHeight + rowGap
      if (rowUnit <= 0) return

      const count = Math.floor((available + rowGap) / rowUnit)
      setFitCount(Math.max(1, Math.min(hardMax, count)))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => { observer.disconnect(); }
  }, [containerRef, hardMax, rowSelector, listSelector])

  return fitCount
}
