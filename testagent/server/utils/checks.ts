import { valid, lt } from 'semver';
import { DeskThing } from '@deskthing/server'; // Adjust import path as needed

export function checkVersionAndNotify() {
  const minimumVersion = '0.11.17';
  
  const version = process.env.DESKTHING_VERSION;

  if (!version || !valid(version) || lt(version, minimumVersion)) {
    DeskThing.sendNotification({
      id: `version-error-testagent`,
      title: 'Critical Version Error',
      description: `TestAgent requires DeskThing v${minimumVersion} or newer. Current version: ${version ?? 'unknown'}`,
      type: 'error'
    });
    return false;
  }
  
  return true;
}