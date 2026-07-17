import { useEffect, useRef } from 'react'

interface UseAutosaveOptions {
  /** Whether autosave is enabled (user opt-in). */
  enabled: boolean
  /** Inactivity delay in seconds before firing a save. */
  delaySeconds: number
  /** True when the canvas has edits not yet persisted. */
  hasUnsavedChanges: boolean
  /** The design the in-memory canvas currently belongs to. */
  activeDesignId: string | null
  /**
   * Values that represent canvas edits (e.g. nodes, edges). Any change to one
   * of these resets the debounce timer, so the save only fires after a quiet
   * period. Kept separate from the trigger flags so the caller controls exactly
   * what counts as "activity".
   */
  changeSignals: unknown[]
  /**
   * Reads the *live* active design id at fire time. Used to detect that the user
   * switched designs while the timer was pending — if so, the in-memory canvas
   * now belongs to a different design and saving it under the pinned id would
   * clobber the wrong design, so the save is skipped.
   */
  getActiveDesignId: () => string | null
  /** Persist the canvas under the given design id. */
  onSave: (designId: string) => void
}

/**
 * Debounced canvas autosave. Fires `onSave(designId)` after `delaySeconds` of
 * inactivity when enabled and there are unsaved changes. Opt-in only — the
 * caller decides whether `enabled` is set (see ADR: autosave defaults to off).
 */
export function useAutosave({
  enabled,
  delaySeconds,
  hasUnsavedChanges,
  activeDesignId,
  changeSignals,
  getActiveDesignId,
  onSave,
}: UseAutosaveOptions): void {
  // Keep the latest callbacks in refs so the timer always calls the current
  // versions without re-arming (which would reset the debounce) on every render.
  const onSaveRef = useRef(onSave)
  const getActiveDesignIdRef = useRef(getActiveDesignId)
  useEffect(() => {
    onSaveRef.current = onSave
    getActiveDesignIdRef.current = getActiveDesignId
  })

  useEffect(() => {
    if (!enabled || !hasUnsavedChanges || !activeDesignId) return
    const designId = activeDesignId
    const t = setTimeout(() => {
      // Skip if the active design changed while the timer was pending.
      if (getActiveDesignIdRef.current() !== designId) return
      onSaveRef.current(designId)
    }, delaySeconds * 1000)
    return () => clearTimeout(t)
    // changeSignals is spread so any canvas edit resets the debounce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, delaySeconds, hasUnsavedChanges, activeDesignId, ...changeSignals])
}
