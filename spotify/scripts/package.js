import { createWriteStream } from "fs";
import { join, resolve } from "path";
import archiver from "archiver";
import { readdir, stat } from "fs/promises";

async function addFilesToArchive(archive, folderPath, baseFolder = "") {
  const files = await readdir(folderPath);

  for (const file of files) {
    const filePath = join(folderPath, file);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      await addFilesToArchive(archive, filePath, join(baseFolder, file));
    } else {
      archive.file(filePath, { name: join(baseFolder, file) });
    }
  }
}

async function createPackage() {
  const packageName = process.env.npm_package_name;
  const version = process.env.npm_package_version;
  const distPath = resolve("dist");
  const outputFile = join(distPath, `${packageName}-v${version}.zip`);

  const output = createWriteStream(outputFile);
  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  archive.pipe(output);

  await addFilesToArchive(archive, distPath);

  await archive.finalize();
}

createPackage().catch(console.error);
