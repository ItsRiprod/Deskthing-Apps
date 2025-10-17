import { useUIStore } from '../stores/UIStore'
import { useCallback } from 'react'

/**
 * Hook to get and set a boolean flag from the UIStore.
 * @param key The flag key to use.
 * @returns [flagState, setFlag]
 */
export function useFlags(key: string): [boolean, (value: boolean) => void] {
  const flagState = useUIStore((state) => state.getFlag(key))
  const setFlag = useUIStore((state) => state.setFlag)
  const setFlagForKey = useCallback((value: boolean) => setFlag(key, value), [key, setFlag])
  return [flagState, setFlagForKey]
}