import * as fs from 'fs'
import * as path from 'path'

let prevVolLevel = 0

// Audio recording state management
const audioChunks: Buffer[] = []
let isRecording = false
let gapTimeout: NodeJS.Timeout | null = null
const GAP_THRESHOLD = 2000 // 2 seconds gap threshold to finalize recording

// Function to extract PCM data from a WAV chunk
const extractPCMFromWav = (wavBuffer: Buffer): Buffer | null => {
  try {
    // WAV header is 44 bytes, PCM data starts after that
    if (wavBuffer.length < 44) {
      return null // Invalid WAV chunk
    }
    
    // Verify it's a WAV file by checking the RIFF header
    if (wavBuffer.toString('ascii', 0, 4) !== 'RIFF' || 
        wavBuffer.toString('ascii', 8, 12) !== 'WAVE') {
      return null // Not a valid WAV file
    }
    
    // Find the 'data' chunk - it should be at byte 36 for standard WAV
    const dataChunkStart = wavBuffer.indexOf('data', 12)
    if (dataChunkStart === -1) {
      return null // No data chunk found
    }
    
    // PCM data starts 8 bytes after 'data' (4 bytes for 'data' + 4 bytes for data length)
    const pcmDataStart = dataChunkStart + 8
    
    // Extract only the PCM audio data
    return wavBuffer.subarray(pcmDataStart)
  } catch (error) {
    console.error('Error extracting PCM from WAV:', error)
    return null
  }
}

// Function to create a simple WAV header
const createWavHeader = (dataLength: number, sampleRate: number = 48000, channels: number = 1, bitsPerSample: number = 16) => {
  const header = Buffer.alloc(44)
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

// Function to save audio chunks as WAV file
const saveAudioFile = async () => {
  if (audioChunks.length === 0) return
  
  const audioData = Buffer.concat(audioChunks)
  const wavHeader = createWavHeader(audioData.length)
  const wavFile = Buffer.concat([wavHeader, audioData])
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `audio_recording_${timestamp}.wav`
  const filepath = path.join(process.cwd(), 'recordings', filename)
  
  // Ensure recordings directory exists
  const recordingsDir = path.dirname(filepath)
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true })
  }
  
  try {
    fs.writeFileSync(filepath, wavFile)
    console.log(`Audio saved to: ${filename}`)
  } catch (error) {
    console.error(`Error saving audio: ${error}`)
  }
}

// Function to reset recording state
const resetRecording = () => {
  audioChunks.length = 0
  isRecording = false
  if (gapTimeout) {
    clearTimeout(gapTimeout)
    gapTimeout = null
  }
}

export const handleBinary = (clientId: string, binary: ArrayBuffer | Buffer) => {
  // Process the binary data
  const buffer = Buffer.isBuffer(binary) ? binary : Buffer.from(binary)

  // Extract PCM data from the WAV chunk (removing headers)
  const pcmData = extractPCMFromWav(buffer)
  if (!pcmData) {
    console.error(`Received invalid audio chunk`)
    return
  }

  // Handle gap detection and file saving
  if (gapTimeout) {
    clearTimeout(gapTimeout)
  }

  // If this is the first chunk or we were not recording, start recording
  if (!isRecording) {
    isRecording = true
    audioChunks.length = 0 // Clear any old chunks
    console.debug(`Started recording audio...`)
  }

  // Add only the PCM data to buffer (no WAV headers)
  audioChunks.push(pcmData)

  // Set up timeout to save file if gap exceeds threshold
  gapTimeout = setTimeout(async () => {
    await saveAudioFile()
    resetRecording()
  }, GAP_THRESHOLD)

  // Calculate volume level for feedback using PCM data
  const samples = new Int16Array(pcmData.buffer, pcmData.byteOffset, pcmData.length / 2)
  const sumAbs = samples.reduce((acc, s) => acc + Math.abs(s), 0)
  const avgLevel = samples.length > 0 ? sumAbs / samples.length : 0
  const roundedLevel = Math.round(avgLevel * 1000) / 1000

  if (prevVolLevel == roundedLevel) return

  prevVolLevel = roundedLevel // update to new volume level

  console.log(`Average volume level: ${roundedLevel} | Recording: ${audioChunks.length} chunks`)
}