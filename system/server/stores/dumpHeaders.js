import fs from 'fs';
import path from 'path';
import { TextDecoder } from 'util'; // <--- important
import { fileURLToPath } from 'url';

// __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your CSV path
const csvPath = path.resolve('C:/Users/phili/Documents/cpu-temps.csv');

// Try using TextDecoder
try {
  const rawData = fs.readFileSync(csvPath); // <--- no 'utf-8' here!
  
  const decoder = new TextDecoder('latin1');
  const csvData = decoder.decode(rawData);

  const lines = csvData.trim().split('\n');

  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());

  const outputPath = path.resolve('E:/cpu_headers_log.txt');

  fs.writeFileSync(outputPath, headers.join('\n'), 'utf-8');

  console.log('✅ Headers written to E:/cpu_headers_log.txt');
} catch (error) {
  console.error('❌ Error:', error.message);
}
