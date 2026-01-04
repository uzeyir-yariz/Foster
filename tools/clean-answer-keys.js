import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SINAVLAR_DIR = path.join(__dirname, 'sınavlar');

// Pattern to match answer keys in explanations
const ANSWER_KEY_PATTERNS = [
  /CEVAP ANAHTARI[\s\S]*/gi,  // Everything after "CEVAP ANAHTARI"
  /Cevap Anahtarı[\s\S]*/gi,
  /\s*\d+\.\s*[A-E]\s*\d+\.\s*[A-E][\s\S]*/gi, // Pattern like "1. A2. B3. C..."
];

async function getAllJsonFiles(dir) {
  const files = [];
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      const subFiles = await getAllJsonFiles(fullPath);
      files.push(...subFiles);
    } else if (item.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function cleanExplanation(explanation) {
  if (!explanation || typeof explanation !== 'string') return explanation;
  
  let cleaned = explanation;
  
  // Remove answer key patterns
  for (const pattern of ANSWER_KEY_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

async function processFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const questions = JSON.parse(content);
    
    let modified = false;
    const answerKeys = [];
    
    for (const question of questions) {
      if (question['açıklama']) {
        const original = question['açıklama'];
        const cleaned = cleanExplanation(original);
        
        // Check if we removed something
        if (original !== cleaned) {
          // Extract answer key if present
          const answerKeyMatch = original.match(/CEVAP ANAHTARI[\s\S]*/i);
          if (answerKeyMatch) {
            answerKeys.push({
              questionNumber: question['soru numarası'],
              extractedKey: answerKeyMatch[0]
            });
          }
          
          question['açıklama'] = cleaned;
          modified = true;
          console.log(`  - Soru ${question['soru numarası']}: Açıklama temizlendi`);
        }
      }
    }
    
    if (modified) {
      // Save cleaned file
      await fs.writeFile(filePath, JSON.stringify(questions, null, 2), 'utf8');
      console.log(`✅ ${path.basename(filePath)} - Kaydedildi`);
      return { filePath, modified: true, answerKeys };
    } else {
      console.log(`⏭️ ${path.basename(filePath)} - Değişiklik gerekmiyor`);
      return { filePath, modified: false, answerKeys: [] };
    }
    
  } catch (error) {
    console.error(`❌ ${path.basename(filePath)} - Hata: ${error.message}`);
    return { filePath, error: error.message };
  }
}

async function main() {
  console.log('🔍 Sınav dosyaları taranıyor...\n');
  
  const jsonFiles = await getAllJsonFiles(SINAVLAR_DIR);
  console.log(`📁 ${jsonFiles.length} dosya bulundu\n`);
  
  let modifiedCount = 0;
  const allAnswerKeys = [];
  
  for (const file of jsonFiles) {
    const relativePath = path.relative(SINAVLAR_DIR, file);
    console.log(`\n📄 İşleniyor: ${relativePath}`);
    
    const result = await processFile(file);
    if (result.modified) {
      modifiedCount++;
    }
    if (result.answerKeys && result.answerKeys.length > 0) {
      allAnswerKeys.push({
        file: relativePath,
        keys: result.answerKeys
      });
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`\n✅ İşlem tamamlandı!`);
  console.log(`📊 Toplam: ${jsonFiles.length} dosya`);
  console.log(`📝 Değiştirilen: ${modifiedCount} dosya`);
  
  // Save extracted answer keys to a separate file
  if (allAnswerKeys.length > 0) {
    const keysFile = path.join(__dirname, 'extracted_answer_keys.json');
    await fs.writeFile(keysFile, JSON.stringify(allAnswerKeys, null, 2), 'utf8');
    console.log(`\n📋 Çıkarılan cevap anahtarları "extracted_answer_keys.json" dosyasına kaydedildi`);
  }
}

main().catch(console.error);
