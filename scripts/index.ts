import { exec, execSync } from "node:child_process";
import { stat, readFile, writeFile, mkdir, rm, readdir, rename } from "node:fs/promises";
import { join } from "node:path";

const RELEASE_FOLDER_PATH = join(process.cwd(), "build", "releases");


const MAINTAINED_APPS = [
  "discord",
  "image",
  "settingstest",
  "spotify",
/*  "system", not updated yet */
  "vinylplayer",
  "weather",
  "waveweather",
];

const ensureCLIDownload = async () => {
  const cliPath = join(process.cwd(), "node_modules", "@deskthing", "cli");
  try {
    await stat(cliPath);
    console.log("\x1b[32m\x1b[1m✓ @deskthing/cli is installed\x1b[0m\n");
  } catch (e) {
    console.log("\n\x1b[33m\x1b[1m⚡ Installing @deskthing/cli dependency...\x1b[0m\n");
    execSync("npm install @deskthing/cli --no-save", {
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
      console.log(`\x1b[33m\x1b[1m⚠ No zip file found in ${appName}/dist\x1b[0m`);
    }
  } catch (e) {
    console.error(`\x1b[31m\x1b[1m❌ Error processing ${appName}: ${e}\x1b[0m`);
    throw e;
  }};

const buildApp = async (appName: string) => {
  try {
    const appPath = join(process.cwd(), appName);
    console.log(`\x1b[34m\x1b[1m🔨 Building ${appName} ${appPath}...\x1b[0m`);
    const child = exec("npm run build", { cwd: appPath });
    await new Promise((resolve) => child.on("close", resolve));
    console.log(`\x1b[36m\x1b[1m🛠️ ${appName} built successfully!\x1b[0m`);
  } catch (error) {
    console.error(`\x1b[31m\x1b[1m❌ Error building ${appName}: ${error}\x1b[0m`);
    throw error;
  }
};

const combineLatestJson = async () => {
  const releases = [];
  for (const appName of MAINTAINED_APPS) {
    try {
      console.log(`\x1b[35m\x1b[1mAdding ${appName} to latest.json...\x1b[0m`);
      const latestJsonPath = join(process.cwd(), appName, "dist", "latest.json");
      const latestJson = JSON.parse(await readFile(latestJsonPath, "utf8"));
      releases.push(latestJson);
    } catch (error) {
      console.error(`\x1b[31m\x1b[1m❌ Error reading latest.json for ${appName}: ${error}\x1b[0m`);
    }
  }

  let thisVersion = "0.10.4"

  try {
    const packageJsonPath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    thisVersion = packageJson.version;
    console.log(`\x1b[32m\x1b[1m✓ package.json version found: ${thisVersion}\x1b[0m`);
  } catch (error) {
    console.error(`\x1b[31m\x1b[1m❌ Error reading package.json: ${error}\x1b[0m`);
  }

  const combinedJson = {
    version: thisVersion,
    id: "deskthing-apps",
    type: "multi",
    repository: "https://github.com/itsriprod/deskthing-apps",
    releases
  };

  return combinedJson;
};

const buildAllApps = async () => {
  const results = await Promise.all(MAINTAINED_APPS.map(async (appName) => {
    try {
      await buildApp(appName);
      await copyAppToReleaseFolder(appName);
      console.log(`\x1b[32m\x1b[1m🚀 ${appName} published\x1b[0m\n\n`);
      return { appName, success: true };    } catch (error) {
      return { 
        appName, 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      };    }
  }));
  
  const failures = results.filter(result => !result.success);
  
  if (failures.length > 0) {
    console.error("\x1b[31m\x1b[1m❌ The following apps failed to build:\x1b[0m");
    failures.forEach(failure => {
      console.error(`\x1b[31m\x1b[1m  ⨯ ${failure.appName}: ${failure.error}\x1b[0m`);
    });
  } else {
    console.log("\x1b[32m\x1b[1m🎉 All apps built successfully!\x1b[0m");
  }
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
  await buildAllApps();
  console.log(`\n\n\x1b[36m\x1b[1m🔄 Combining latest.json files...\x1b[0m`);
  const combinedJson = await combineLatestJson();
  await writeFile(
    join(RELEASE_FOLDER_PATH, "latest.json"),
    JSON.stringify(combinedJson, null, 2)
  );
  console.log("\n\n\x1b[32m\x1b[1m✅ Build process completed successfully!\x1b[0m\n");
};
Main();