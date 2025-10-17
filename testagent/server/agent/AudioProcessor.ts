// Audio Processing Domain
// Handles WAV format detection, PCM extraction, and FFmpeg operations

import * as fs from 'fs'
import { execSync } from 'child_process'
import type { AudioFormat } from '../types'
import { FFMPEG_BIN } from '../utils/paths';

export class AudioProcessor {

  constructor() {  }

  /**
   * Extract PCM data from a WAV chunk and detect format
   */
  extractPCMFromWav(wavBuffer: Buffer): { pcmData: Buffer | null; format: AudioFormat | null } {
    try {
      // WAV header is 44 bytes, PCM data starts after that
      if (wavBuffer.length < 44) {
        return { pcmData: null, format: null }
      }

      // Verify it's a WAV file by checking the RIFF header
      if (wavBuffer.toString('ascii', 0, 4) !== 'RIFF' ||
        wavBuffer.toString('ascii', 8, 12) !== 'WAVE') {
        return { pcmData: null, format: null }
      }

      // Extract format information from WAV header
      const channels = wavBuffer.readUInt16LE(22)
      const sampleRate = wavBuffer.readUInt32LE(24)
      const bitsPerSample = wavBuffer.readUInt16LE(34)

      const format: AudioFormat = {
        channels,
        sampleRate,
        bitsPerSample
      }

      // Find the 'data' chunk - it should be at byte 36 for standard WAV
      const dataChunkStart = wavBuffer.indexOf('data', 12)
      if (dataChunkStart === -1) {
        return { pcmData: null, format }
      }

      // PCM data starts 8 bytes after 'data' (4 bytes for 'data' + 4 bytes for data length)
      const pcmDataStart = dataChunkStart + 8

      // Extract only the PCM audio data
      const pcmData = wavBuffer.subarray(pcmDataStart)

      return { pcmData, format }
    } catch (error) {
      console.error('Error extracting PCM from WAV:', error)
      return { pcmData: null, format: null }
    }
  }

  /**
   * Create a WAV header for given audio parameters
   */
  createWavHeader(dataLength: number, format: AudioFormat): Buffer {
    const header = Buffer.alloc(44)
    const { sampleRate, channels, bitsPerSample } = format
    const byteRate = sampleRate * channels * bitsPerSample / 8
    const blockAlign = channels * bitsPerSample / 8

    header.write('RIFF', 0)
    header.writeUInt32LE(36 + dataLength, 4)
    header.write('WAVE', 8)
    header.write('fmt ', 12)
    header.writeUInt32LE(16, 16) // PCM format chunk size
    header.writeUInt16LE(1, 20) // PCM format
    header.writeUInt16LE(channels, 22)
    header.writeUInt32LE(sampleRate, 24)
    header.writeUInt32LE(byteRate, 28)
    header.writeUInt16LE(blockAlign, 32)
    header.writeUInt16LE(bitsPerSample, 34)
    header.write('data', 36)
    header.writeUInt32LE(dataLength, 40)

    return header
  }

  /**
   * Resample audio to 16kHz mono for Whisper compatibility
   */
  async resampleTo16kHz(inputPath: string, outputPath: string): Promise<void> {
    try {

      if (inputPath.toLowerCase().endsWith('.wav')) {
        const format = this.getWavFileFormat(inputPath)

        if (format && format.sampleRate === 16000 && format.channels === 1) {
          console.log('WAV file is already 16kHz mono, copying directly')
          fs.copyFileSync(inputPath, outputPath)
          return
        }

        if (format) {
          console.log(`Resampling WAV from ${format.sampleRate}Hz (${format.channels}ch) to 16kHz mono`)
        }
      }

      const command = `"${FFMPEG_BIN}" -i "${inputPath}" -ar 16000 -ac 1 "${outputPath}" -y`
      execSync(command, { stdio: 'pipe' })
    } catch (error) {
      console.error('Error resampling audio:', error)
      throw new Error('Failed to resample audio to 16kHz')
    }
  }

  /**
   * Calculate volume level from PCM data for feedback
   */
  calculateVolumeLevel(pcmData: Buffer): number {
    const samples = new Int16Array(pcmData.buffer, pcmData.byteOffset, pcmData.length / 2)
    const sumAbs = samples.reduce((acc, s) => acc + Math.abs(s), 0)
    const avgLevel = samples.length > 0 ? sumAbs / samples.length : 0
    return Math.round(avgLevel * 1000) / 1000
  }

  /**
   * Save audio data as WAV file
   */
  saveAsWav(audioData: Buffer, format: AudioFormat, filePath: string): void {
    const wavHeader = this.createWavHeader(audioData.length, format)
    const wavFile = Buffer.concat([wavHeader, audioData])
    fs.writeFileSync(filePath, wavFile)
  }

  /**
   * Ensure temp directory exists
   */
  ensureTempDir(tempDir: string): void {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
  }

  /**
   * Clean up temporary files
   */
  cleanupFiles(filePaths: string[]): void {
    filePaths.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      } catch (error) {
        console.warn(`Failed to cleanup file ${filePath}:`, error)
      }
    })
  }


  /**
   * Get audio format from WAV file header
   */
  private getWavFileFormat(filePath: string): AudioFormat | null {
    try {
      const buffer = fs.readFileSync(filePath)
      const result = this.extractPCMFromWav(buffer)
      return result.format
    } catch (error) {
      console.warn('Could not read WAV header:', error)
      return null
    }
  }
}