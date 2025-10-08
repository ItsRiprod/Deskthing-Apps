import { promises as fs } from 'fs';
import path from 'path';

const loudnessExeSrc = path.resolve(
  'node_modules',
  'loudness',
  'impl',
  'windows',
  'adjust_get_current_system_volume_vista_plus.exe'
);
const loudnessExeDest = path.resolve(
  'dist',
  'server',
  'adjust_get_current_system_volume_vista_plus.exe'
);

export default {
  plugins: [
    {
      name: 'copy-loudness-exe',
      setup(build) {
        build.onEnd(async () => {
          try {
            await fs.copyFile(loudnessExeSrc, loudnessExeDest);
            console.log('Copied loudness .exe to dist/server');
          } catch (err) {
            console.warn('Could not copy loudness .exe:', err.message);
          }
        });
      }
    }
  ]
};