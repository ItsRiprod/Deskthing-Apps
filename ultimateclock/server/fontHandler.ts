import { DeskThing } from "@deskthing/server";
import { DESKTHING_EVENTS, SETTING_TYPES } from "@deskthing/types";
import { ClockSettingIDs } from "../shared/settings";
import * as fs from 'fs';
import * as path from 'path';

const fontPath = process.env.NODE_ENV == 'development'
  ? path.join(process.cwd(), 'public', 'fonts')
  : path.join(__dirname, '..', 'client', 'fonts');

const VALID_FONT_EXTENSIONS = ['.ttf', '.otf', '.woff', '.woff2'];

export const initFontHandling = () => {
  console.log(`Font path: ${fontPath}`);

  // Ensure fonts directory exists
  if (!fs.existsSync(fontPath)) {
    fs.mkdirSync(fontPath, { recursive: true });
  }

  // Load existing fonts and update font options
  updateFontOptions();
}

const updateFontOptions = async (newFontUrl?: string) => {
  try {
    const files = fs.readdirSync(fontPath);
    const fontFiles = files.filter(file =>
      VALID_FONT_EXTENSIONS.includes(path.extname(file).toLowerCase())
    );

    const fontOptions = fontFiles.map(file => ({
      label: path.basename(file, path.extname(file)),
      value: `./fonts/${file}`
    }))

    const recentlyAddedFont = newFontUrl ? `./fonts/${path.basename(newFontUrl)}` : null;

    if (recentlyAddedFont) {
      await DeskThing.setSettings({
        [ClockSettingIDs.FONT_SELECTION]: {
          id: ClockSettingIDs.FONT_SELECTION,
          type: SETTING_TYPES.SELECT,
          description: 'Select a font for the clock display. If you upload a new font, select it here.',
          label: 'Select Font',
          value: recentlyAddedFont, // Default to recently added font if available
          options: fontOptions
        }
      });
    } else {
      DeskThing.setSettingOptions(ClockSettingIDs.FONT_SELECTION, fontOptions);
    }
  } catch (error) {
    console.error('Error updating font options:', error);
  }
};

DeskThing.on(DESKTHING_EVENTS.SETTINGS, async (setting) => {
  const fontFile = setting.payload[ClockSettingIDs.FONT]?.value as string;

  // Handle new font upload
  if (fontFile && typeof fontFile == 'string' && fontFile !== '') {
    // reset first so it doesnt overwrite anything
    await DeskThing.setSettings({
      ...setting.payload,
      [ClockSettingIDs.FONT]: {
        id: ClockSettingIDs.FONT,
        type: SETTING_TYPES.FILE,
        label: 'Upload Font',
        value: '', // Resets the value of the setting after upload
        fileTypes: [
          {
            name: 'Font Files',
            extensions: ['ttf', 'otf', 'woff', 'woff2'] //
          }
        ]
      }
    })

    // then upload the font
    await handleFontUpload(fontFile);
  }
});

const handleFontUpload = async (fontFilePath: string) => {
  try {
    if (!fs.existsSync(fontFilePath)) {
      console.error('Font file does not exist:', fontFilePath);
      return;
    }

    const fileName = path.basename(fontFilePath);
    const ext = path.extname(fileName).toLowerCase();

    if (!VALID_FONT_EXTENSIONS.includes(ext)) {
      console.error('Invalid font format:', ext);
      return;
    }

    const destinationPath = path.join(fontPath, fileName);

    // Copy font to public fonts directory
    fs.copyFileSync(fontFilePath, destinationPath);

    console.log(`Font copied to: ${destinationPath}`);

    // Update font options
    await updateFontOptions(destinationPath);
  } catch (error) {
    console.error('Error handling font upload:', error);
  }
};