import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { TextDecoder } from 'util';
import os from 'os';

const app = express();
const PORT = 3334;

// Get path to the CSV log file
const documentsPath = path.join(os.homedir(), 'Documents');
const csvPath = path.join(documentsPath, 'cpu-temps.csv');

app.use(cors());

async function getCpuTemperatureFromHwinfo() {
  try {
    const rawData = fs.readFileSync(csvPath);
    const decoder = new TextDecoder('latin1');
    const csvData = decoder.decode(rawData);

    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('No sensor data available yet.');
    }

    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());

    // Try to find the CPU temperature column
    let cpuTempIndex = headers.findIndex(h => h === 'CPU (Tctl/Tdie) [°C]');
    if (cpuTempIndex === -1) {
      cpuTempIndex = headers.findIndex(h => h.includes('CPU') && h.includes('Tctl') && h.includes('Tdie'));
    }

    if (cpuTempIndex === -1) {
      throw new Error('CPU temperature column not found in HWiNFO log.');
    }

    const latest = lines[lines.length - 1].split(',');

    if (latest.length <= cpuTempIndex) {
      throw new Error(`Data row has fewer columns (${latest.length}) than expected index (${cpuTempIndex})`);
    }

    const cpuTemp = parseFloat(latest[cpuTempIndex]);
    if (isNaN(cpuTemp)) {
      throw new Error('Invalid CPU temperature value.');
    }

    return cpuTemp;
  } catch (error) {
    console.error("Error reading CPU temp from HWiNFO log:", error);
    return null;
  }
}

app.get('/cpu-temp', async (req, res) => {
  try {
    const temp = await getCpuTemperatureFromHwinfo();

    if (temp !== null) {
      res.json({
        temp: Math.round(temp * 10) / 10,
        success: true
      });
    } else {
      res.json({
        temp: 0,
        success: false,
        error: "Could not retrieve CPU temperature"
      });
    }
  } catch (error) {
    console.error("Error getting CPU temperature:", error);
    res.status(500).json({
      error: "Failed to get CPU temperature",
      message: error.message,
      success: false
    });
  }
});

app.get('/file-stats', async (req, res) => {
  try {
    const stats = fs.statSync(csvPath);
    const fileSizeInMB = stats.size / (1024 * 1024);

    const rawData = fs.readFileSync(csvPath);
    const decoder = new TextDecoder('latin1');
    const csvData = decoder.decode(rawData);

    const lines = csvData.trim().split('\n');

    res.json({
      success: true,
      fileSize: {
        bytes: stats.size,
        kilobytes: (stats.size / 1024).toFixed(2),
        megabytes: fileSizeInMB.toFixed(2)
      },
      rows: lines.length - 1, // Excluding header
      lastModified: stats.mtime
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get file stats",
      message: error.message,
      success: false
    });
  }
});

app.listen(PORT, () => {
  console.log(`CPU temperature monitoring server running on port ${PORT}`);
  console.log(`CSV path: ${csvPath}`);
});
