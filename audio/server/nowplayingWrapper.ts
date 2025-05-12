// @ts-nocheck

import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import type { NowPlaying as NowPlayingType } from 'node-nowplaying'

import { createRequire } from 'module';
const dkRequire = createRequire(import.meta.url);

let nativeBinding = null
const loadErrors: Error[] = []

const isMusl = async () => {
  let musl: boolean | null = false
  if (process.platform === 'linux') {
    musl = isMuslFromFilesystem()
    if (musl === null) {
      musl = isMuslFromReport()
    }
    if (musl === null) {
      musl = await isMuslFromChildProcess()
    }
  }
  return musl
}

const isFileMusl = (f) => f.includes('libc.musl-') || f.includes('ld-musl-')

const isMuslFromFilesystem = () => {
  try {
    return readFileSync('/usr/bin/ldd', 'utf-8').includes('musl')
  } catch {
    return null
  }
}

const isMuslFromReport = () => {
  const report: any = typeof process.report.getReport === 'function' ? process.report.getReport() : null
  if (!report) {
    return null
  }


  if (report.header && report.header.glibcVersionRuntime) {
    return false
  }
  if (Array.isArray(report.sharedObjects)) {
    if (report.sharedObjects.some(isFileMusl)) {
      return true
    }
  }
  return false
}

const isMuslFromChildProcess = async () => {
  try {
    return await execSync('ldd --version', { encoding: 'utf8' }).includes('musl')
  } catch (e) {
    // If we reach this case, we don't know if the system is musl or not, so is better to just fallback to false
    return false
  }
}

async function importNative() {
  if (process.env.NAPI_RS_NATIVE_LIBRARY_PATH) {
    try {
      nativeBinding = await import(process.env.NAPI_RS_NATIVE_LIBRARY_PATH);
    } catch (err) {
      loadErrors.push(err);
    }
  } else if (process.platform === 'android') {
    if (process.arch === 'arm64') {
      try {
        return dkRequire('./n-nowplaying.android-arm64.node')
      } catch (e) {
        loadErrors.push(e)
      }
      try {
        return dkRequire('nowplaying-android-arm64')
      } catch (e) {
        loadErrors.push(e)
      }

    } else if (process.arch === 'arm') {
      try {
        return dkRequire('./n-nowplaying.android-arm-eabi.node')
      } catch (e) {
        loadErrors.push(e)
      }
      try {
        return dkRequire('nowplaying-android-arm-eabi')
      } catch (e) {
        loadErrors.push(e)
      }

    } else {
      loadErrors.push(new Error(`Unsupported architecture on Android ${process.arch}`))
    }
  } else if (process.platform === 'win32') {
    if (process.arch === 'x64') {
      try {
        return dkRequire('./n-nowplaying.win32-x64-msvc.node')
      } catch (e) {
        loadErrors.push(e)
      }
      try {
        return dkRequire('nowplaying-win32-x64-msvc')
      } catch (e) {
        loadErrors.push(e)
      }

    } else if (process.arch === 'ia32') {
      try {
        return dkRequire('./n-nowplaying.win32-ia32-msvc.node')
      } catch (e) {
        loadErrors.push(e)
      }
      try {
        return dkRequire('nowplaying-win32-ia32-msvc')
      } catch (e) {
        loadErrors.push(e)
      }

    } else if (process.arch === 'arm64') {
      try {
        return dkRequire('./n-nowplaying.win32-arm64-msvc.node')
      } catch (e) {
        loadErrors.push(e)
      }
      try {
        return dkRequire('nowplaying-win32-arm64-msvc')
      } catch (e) {
        loadErrors.push(e)
      }

    } else {
      loadErrors.push(new Error(`Unsupported architecture on Windows: ${process.arch}`))
    }
  } else if (process.platform === 'darwin') {
    try {
        return dkRequire('./n-nowplaying.darwin-universal.node')
      } catch (e) {
        loadErrors.push(e)
      }
      try {
        return dkRequire('nowplaying-darwin-universal')
      } catch (e) {
        loadErrors.push(e)
      }

    if (process.arch === 'x64') {
      try {
        return dkRequire('./n-nowplaying.darwin-x64.node')
      } catch (e) {
        loadErrors.push(e)
      }
      try {
        return dkRequire('nowplaying-darwin-x64')
      } catch (e) {
        loadErrors.push(e)
      }

    } else if (process.arch === 'arm64') {
      try {
        return dkRequire('./n-nowplaying.darwin-arm64.node')
      } catch (e) {
        loadErrors.push(e)
      }
      try {
        return dkRequire('nowplaying-darwin-arm64')
      } catch (e) {
        loadErrors.push(e)
      }

    } else {
      loadErrors.push(new Error(`Unsupported architecture on macOS: ${process.arch}`))
    }
  } else if (process.platform === 'freebsd') {
    if (process.arch === 'x64') {
      try {
        return dkRequire('./n-nowplaying.freebsd-x64.node')
      } catch (e) {
        loadErrors.push(e)
      }
      try {
        return dkRequire('nowplaying-freebsd-x64')
      } catch (e) {
        loadErrors.push(e)
      }

    } else if (process.arch === 'arm64') {
      try {
        return dkRequire('./n-nowplaying.freebsd-arm64.node')
      } catch (e) {
        loadErrors.push(e)
      }
      try {
        return dkRequire('nowplaying-freebsd-arm64')
      } catch (e) {
        loadErrors.push(e)
      }

    } else {
      loadErrors.push(new Error(`Unsupported architecture on FreeBSD: ${process.arch}`))
    }
  } else if (process.platform === 'linux') {
    if (process.arch === 'x64') {
      if (await isMusl()) {
        try {
        return dkRequire('./n-nowplaying.linux-x64-musl.node')
      } catch (e) {
        loadErrors.push(e)
      }
      try {
        return dkRequire('nowplaying-linux-x64-musl')
      } catch (e) {
        loadErrors.push(e)
      }

      } else {
        try {
        return dkRequire('./n-nowplaying.linux-x64-gnu.node')
      } catch (e) {
        loadErrors.push(e)
      }
      try {
        return dkRequire('nowplaying-linux-x64-gnu')
      } catch (e) {
        loadErrors.push(e)
      }

      }
    } else if (process.arch === 'arm64') {
      if (await isMusl()) {
        try {
        return dkRequire('./n-nowplaying.linux-arm64-musl.node')
      } catch (e) {
        loadErrors.push(e)
      }
      try {
        return dkRequire('nowplaying-linux-arm64-musl')
      } catch (e) {
        loadErrors.push(e)
      }

      } else {
        try {
        return dkRequire('./n-nowplaying.linux-arm64-gnu.node')
      } catch (e) {
        loadErrors.push(e)
      }
      try {
        return dkRequire('nowplaying-linux-arm64-gnu')
      } catch (e) {
        loadErrors.push(e)
      }

      }
    } else if (process.arch === 'arm') {
      if (await isMusl()) {
        try {
        return dkRequire('./n-nowplaying.linux-arm-musleabihf.node')
      } catch (e) {
        loadErrors.push(e)
      }
      try {
        return dkRequire('nowplaying-linux-arm-musleabihf')
      } catch (e) {
        loadErrors.push(e)
      }

      } else {
        try {
        return dkRequire('./n-nowplaying.linux-arm-gnueabihf.node')
      } catch (e) {
        loadErrors.push(e)
      }
      try {
        return dkRequire('nowplaying-linux-arm-gnueabihf')
      } catch (e) {
        loadErrors.push(e)
      }

      }
    } else if (process.arch === 'riscv64') {
      if (await isMusl()) {
        try {
        return dkRequire('./n-nowplaying.linux-riscv64-musl.node')
      } catch (e) {
        loadErrors.push(e)
      }
      try {
        return dkRequire('nowplaying-linux-riscv64-musl')
      } catch (e) {
        loadErrors.push(e)
      }

      } else {
        try {
        return dkRequire('./n-nowplaying.linux-riscv64-gnu.node')
      } catch (e) {
        loadErrors.push(e)
      }
      try {
        return dkRequire('nowplaying-linux-riscv64-gnu')
      } catch (e) {
        loadErrors.push(e)
      }

      }
    } else if (process.arch === 'ppc64') {
      try {
        return dkRequire('./n-nowplaying.linux-ppc64-gnu.node')
      } catch (e) {
        loadErrors.push(e)
      }
      try {
        return dkRequire('nowplaying-linux-ppc64-gnu')
      } catch (e) {
        loadErrors.push(e)
      }

    } else if (process.arch === 's390x') {
      try {
        return dkRequire('./n-nowplaying.linux-s390x-gnu.node')
      } catch (e) {
        loadErrors.push(e)
      }
      try {
        return dkRequire('nowplaying-linux-s390x-gnu')
      } catch (e) {
        loadErrors.push(e)
      }

    } else {
      loadErrors.push(new Error(`Unsupported architecture on Linux: ${process.arch}`))
    }
  } else {
    loadErrors.push(new Error(`Unsupported OS: ${process.platform}, architecture: ${process.arch}`))
  }
}

nativeBinding = await importNative()

if (!nativeBinding || process.env.NAPI_RS_FORCE_WASI) {
  try {
    nativeBinding = dkRequire('./n-nowplaying.wasi.cjs')
  } catch (err) {
    if (process.env.NAPI_RS_FORCE_WASI) {
      loadErrors.push(err)
    }
  }
  if (!nativeBinding) {
    try {
      nativeBinding = dkRequire('nowplaying-wasm32-wasi')
    } catch (err) {
      if (process.env.NAPI_RS_FORCE_WASI) {
        loadErrors.push(err)
      }
    }
  }
}

if (!nativeBinding) {
  if (loadErrors.length > 0) {
    // TODO Link to documentation with potential fixes
    //  - The package owner could build/publish bindings for this arch
    //  - The user may need to bundle the correct files
    //  - The user may need to re-install node_modules to get new packages
    console.log(loadErrors.toString())
    throw new Error('Failed to load native binding', { cause: loadErrors })
  }
  throw new Error(`Failed to load native binding`)
}

const { NowPlaying: NowPlayingImpl } = nativeBinding as { NowPlaying: any }
// Assert that NowPlayingImpl is a constructable class
export const NowPlaying = NowPlayingImpl as new (
  callback: (event: any) => void, 
  options?: any
) => NowPlayingType