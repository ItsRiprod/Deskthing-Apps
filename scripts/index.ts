import { exec, execSync } from "node:child_process";
import { stat, readFile, writeFile, mkdir, rm, readdir, rename } from "node:fs/promises";
import { join } from "node:path";

import { GitRepoUrl, MultiReleaseJSONLatest } from '@deskthing/types'

const RELEASE_FOLDER_PATH = join(process.cwd(), "build", "releases");


const MAINTAINED_APPS = [
  "discord",
  "image",
  "settingstest",
  "spotify",
  /* "system", not updated yet */
  "vinylplayer",
  "weather",
  "weatherwaves",
  "audio",
  "gamething"
];

const COMMUNITY_REPOS: GitRepoUrl[] = [
  'https://github.com/espeon/LyrThing',
  'https://github.com/TylStres/DeskThing-Timer',
  'https://github.com/dakota-kallas/DeskThing-GitHub',
  'https://github.com/dakota-kallas/DeskThing-MarketHub',
  'https://github.com/dakota-kallas/DeskThing-SportsHub',
  'https://github.com/ankziety/DeskThingDiscord',
  'https://github.com/grahamplace/pomodoro-thing',
  'https://github.com/Jarsa132/deskthing-volctrl',
  'https://github.com/nwo122383/sonos-webapp',
  'https://github.com/RandomDebugGuy/DeskThing-GMP',
]

const ensureCLIDownload = async () => {
  const cliPath = join(process.cwd(), "node_modules", "@deskthing", "cli");
  try {
    await stat(cliPath);
    console.log("\x1b[32m\x1b[1m✓ @deskthing/cli is installed\x1b[0m\n");
  } catch (e) {
    console.log("\n\x1b[33m\x1b[1m⚡ Installing @deskthing/cli dependency...\x1b[0m\n");
    execSync("npm install @deskthing/cli@latest --no-save", {
      stdio: "inherit",
    });
  }
};

const copyAppToReleaseFolder = async (appName: string) => {
  const appPath = join(process.cwd(), appName);
  try {
    const distPath = join(appPath, "dist");
    const files = await readdir(distPath);
    const zipFile = files.find(file => file.endsWith('.zip'));

    if (zipFile) {
      const sourcePath = join(distPath, zipFile);
      const destPath = join(RELEASE_FOLDER_PATH, zipFile);
      await rename(sourcePath, destPath);
      console.log(`\x1b[36m\x1b[1m📦 Moved ${zipFile} to releases folder\x1b[0m`);
    } else {
      console.log(`\x1b[33m\x1b[1m⚠ No zip file found in ${appName}/dist. Found ${files.join(", ")}\x1b[0m`);
    }
  } catch (e) {
    console.error(`\x1b[31m\x1b[1m❌ Error processing ${appName}: ${e}\x1b[0m`);
    throw e;
  }
};

const copyAppLatestJson = async (appName: string) => {
  try {
    console.log(`\x1b[35m\x1b[1m📄 Copying ${appName} latest.json as ${appName}.json...\x1b[0m`);
    const latestJsonPath = join(process.cwd(), appName, "dist", "latest.json");
    const destJsonPath = join(RELEASE_FOLDER_PATH, `${appName}.json`);

    const latestJsonContent = await readFile(latestJsonPath, "utf8");
    await writeFile(destJsonPath, latestJsonContent);

    console.log(`\x1b[36m\x1b[1m✓ Created ${appName}.json in releases folder\x1b[0m`);
    return true;
  } catch (error) {
    console.error(`\x1b[31m\x1b[1m❌ Error copying latest.json for ${appName}: ${error}\x1b[0m`);
    return false;
  }
};

const buildApp = async (appName: string) => {
  try {
    const appPath = join(process.cwd(), appName);
    console.log(`\x1b[34m\x1b[1m🔨 Building ${appName} ${appPath}...\x1b[0m`);
    const child = exec("npx @deskthing/cli@latest package", { 
      cwd: appPath
    });

    child.stderr?.on('data', (data) => {
      console.error(data.toString());
    });

    await new Promise((resolve) => child.on("close", resolve));
    console.log(`\x1b[36m\x1b[1m🛠️ ${appName} built successfully!\x1b[0m`);
  } catch (error) {
    console.error(`\x1b[31m\x1b[1m❌ Error building ${appName}: ${error}\x1b[0m`);
    throw error;
  }
};
const createMultiReleaseJson = async (successfulApps: string[]): Promise<MultiReleaseJSONLatest> => {
  let thisVersion = "0.11.8";

  try {
    const packageJsonPath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    thisVersion = packageJson.version;
    console.log(`\x1b[32m\x1b[1m✓ package.json version found: ${thisVersion}\x1b[0m`);
  } catch (error) {
    console.error(`\x1b[31m\x1b[1m❌ Error reading package.json: ${error}\x1b[0m`);
  }

  const multiReleaseJson: MultiReleaseJSONLatest = {
    meta_version: "0.11.8",
    meta_type: "multi",
    repositories: COMMUNITY_REPOS,
    repository: "https://api.github.com/repos/itsriprod/deskthing-apps",
    fileIds: successfulApps
  };

  return multiReleaseJson;
};

const buildAllApps = async () => {
  const results = await Promise.all(MAINTAINED_APPS.map(async (appName) => {
    try {
      await buildApp(appName);
      await copyAppToReleaseFolder(appName);
      const latestJsonSuccess = await copyAppLatestJson(appName);
      if (latestJsonSuccess) {
        console.log(`\x1b[32m\x1b[1m🚀 ${appName} published successfully\x1b[0m\n\n`);
        return { appName, success: true };
      } else {
        return { appName, success: false, error: "Failed to copy latest.json" };
      }
    } catch (error) {
      return {
        appName,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }));

  const failures = results.filter(result => !result.success);
  const successes = results.filter(result => result.success).map(result => result.appName);

  if (failures.length > 0) {
    console.error("\x1b[31m\x1b[1m❌ The following apps failed to build:\x1b[0m");
    failures.forEach(failure => {
      console.error(`\x1b[31m\x1b[1m  ⨯ ${failure.appName}: ${failure.error}\x1b[0m`);
    });
  }

  if (successes.length > 0) {
    console.log(`\x1b[32m\x1b[1m🎉 ${successes.length} apps built successfully!\x1b[0m`);
  }

  return successes
};

const ensureReleasesFolderExists = async (clean: boolean = false) => {
  try {
    await stat(RELEASE_FOLDER_PATH);
    console.log(`\x1b[36m\x1b[1m📁 Releases folder already exists\x1b[0m`);
    if (clean) {
      console.log(`\x1b[33m\x1b[1m🧹 Cleaning releases folder...\x1b[0m`);
      await rm(RELEASE_FOLDER_PATH, { recursive: true, force: true });
      await mkdir(RELEASE_FOLDER_PATH, { recursive: true });
    }
  } catch (e) {
    console.log(`\x1b[36m\x1b[1m📁 Creating releases folder...\x1b[0m`);
    await mkdir(RELEASE_FOLDER_PATH, { recursive: true });
  }
};

const Main = async () => {
  console.log(`\n\n\x1b[36m\x1b[1m📁 Ensuring releases folder exists...\x1b[0m`);
  await ensureReleasesFolderExists(true)
  console.log(`\n\n\x1b[34m\x1b[1m⬇️ Installing @deskthing/cli dependency...\x1b[0m`);
  await ensureCLIDownload();
  console.log(`\n\n\x1b[33m\x1b[1m🔨 Building all apps...\x1b[0m`);
  const successfulApps = await buildAllApps();
  console.log(`\n\n\x1b[36m\x1b[1m🔄 Combining latest.json files...\x1b[0m`);
  const multiReleaseJson = await createMultiReleaseJson(successfulApps);
  await writeFile(
    join(RELEASE_FOLDER_PATH, "latest.json"),
    JSON.stringify(multiReleaseJson, null, 2)
  );
  console.log("\n\n\x1b[32m\x1b[1m✅ Build process completed successfully!\x1b[0m\n");
  console.log(`\x1b[36m\x1b[1m📋 Successfully processed apps: ${successfulApps.join(", ")}\x1b[0m`);

};
Main();