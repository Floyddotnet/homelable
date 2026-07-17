import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAutosave } from '../useAutosave'

interface Args {
  enabled?: boolean
  delaySeconds?: number
  hasUnsavedChanges?: boolean
  activeDesignId?: string | null
  changeSignals?: unknown[]
  getActiveDesignId?: () => string | null
  onSave?: (designId: string) => void
}

function args(over: Args = {}) {
  const activeDesignId = 'activeDesignId' in over ? (over.activeDesignId ?? null) : 'design-a'
  return {
    enabled: over.enabled ?? true,
    delaySeconds: over.delaySeconds ?? 5,
    hasUnsavedChanges: over.hasUnsavedChanges ?? true,
    activeDesignId,
    changeSignals: over.changeSignals ?? [[], []],
    getActiveDesignId: over.getActiveDesignId ?? (() => activeDesignId),
    onSave: over.onSave ?? vi.fn(),
  }
}

describe('useAutosave', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('saves after the inactivity delay when enabled with unsaved changes', () => {
    const onSave = vi.fn()
    renderHook(() => useAutosave(args({ onSave, delaySeconds: 5 })))
    expect(onSave).not.toHaveBeenCalled()
    vi.advanceTimersByTime(4999)
    expect(onSave).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onSave).toHaveBeenCalledExactlyOnceWith('design-a')
  })

  it('does nothing when disabled', () => {
    const onSave = vi.fn()
    renderHook(() => useAutosave(args({ onSave, enabled: false })))
    vi.advanceTimersByTime(60_000)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('does nothing when there are no unsaved changes', () => {
    const onSave = vi.fn()
    renderHook(() => useAutosave(args({ onSave, hasUnsavedChanges: false })))
    vi.advanceTimersByTime(60_000)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('does nothing when there is no active design', () => {
    const onSave = vi.fn()
    renderHook(() => useAutosave(args({ onSave, activeDesignId: null })))
    vi.advanceTimersByTime(60_000)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('debounces: a change before the delay resets the timer', () => {
    const onSave = vi.fn()
    const { rerender } = renderHook((p: Args) => useAutosave(args(p)), {
      initialProps: { onSave, changeSignals: [1] },
    })
    vi.advanceTimersByTime(4000)
    rerender({ onSave, changeSignals: [2] }) // edit resets debounce
    vi.advanceTimersByTime(4000)
    expect(onSave).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(onSave).toHaveBeenCalledExactlyOnceWith('design-a')
  })

  it('skips the save if the active design changed while the timer was pending', () => {
    const onSave = vi.fn()
    // Pinned at arm time = 'design-a', but live id has moved on to 'design-b'.
    renderHook(() =>
      useAutosave(args({ onSave, activeDesignId: 'design-a', getActiveDesignId: () => 'design-b' })),
    )
    vi.advanceTimersByTime(5000)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('saves under the pinned design id, not the live one, when they still match', () => {
    const onSave = vi.fn()
    renderHook(() =>
      useAutosave(args({ onSave, activeDesignId: 'design-a', getActiveDesignId: () => 'design-a' })),
    )
    vi.advanceTimersByTime(5000)
    expect(onSave).toHaveBeenCalledExactlyOnceWith('design-a')
  })
})
