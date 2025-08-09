import { ClockSettings, CondensedClockSettings } from '../../shared/settings'

/**
 * Converts the full ClockSettings object into a condensed key-value map.
 * Only includes the `value` for each setting.
 */
export function getCondensedSettings(settings: ClockSettings): CondensedClockSettings {
  const condensed = {} as CondensedClockSettings
  for (const key in settings) {
    condensed[key] = settings[key].value || undefined
  }
  return condensed
}