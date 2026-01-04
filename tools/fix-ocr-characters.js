import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SINAVLAR_DIR = path.join(__dirname, 'sınavlar');

// OCR karakter düzeltme haritası
const CHARACTER_FIXES = new Map([
  // Türkçe karakter sorunları - En yaygın olanlar
  ['Ɵ', 'ti'],      // geƟrilmelidir → getirilmelidir
  ['ƨ', 'tı'],      // edaƨ → edatı, alƨnda → altında
  ['ƫ', 'ti'],      // eƫğinden → ettiğinde
  ['Ʃ', 'Ş'],       // 
  ['ƿ', 'p'],
  ['Ƣ', 'Ö'],
  ['ƣ', 'ö'],
  ['ƚ', 'l'],
  ['Ɩ', 'I'],
  ['ſ', 's'],
  ['ʃ', 'ş'],
  ['ǝ', 'e'],
  ['ɛ', 'e'],
  ['ɔ', 'o'],
  ['ɜ', 'ü'],
  ['ʌ', 'u'],
  ['ɪ', 'i'],
  ['ʊ', 'u'],
  ['ə', 'e'],
  ['ɑ', 'a'],
  ['ɒ', 'o'],
  ['æ', 'ae'],
  ['ð', 'd'],
  ['θ', 'th'],
  ['ŋ', 'ng'],
  ['Ō', 'O'],
  ['ō', 'o'],
  ['Ŏ', 'O'],
  ['ŏ', 'o'],
  ['Ő', 'Ö'],
  ['ő', 'ö'],
  ['Œ', 'Ö'],
  ['œ', 'ö'],
  ['Ŕ', 'R'],
  ['ŗ', 'r'],
  ['Ř', 'R'],
  ['ř', 'r'],
  ['Ś', 'S'],
  ['ś', 's'],
  ['Ŝ', 'S'],
  ['ŝ', 's'],
  ['Š', 'Ş'],
  ['š', 'ş'],
  ['Ţ', 'T'],
  ['ţ', 't'],
  ['Ť', 'T'],
  ['ť', 't'],
  ['Ŧ', 'T'],
  ['ŧ', 't'],
  ['Ũ', 'U'],
  ['ũ', 'u'],
  ['Ū', 'U'],
  ['ū', 'u'],
  ['Ŭ', 'U'],
  ['ŭ', 'u'],
  ['Ů', 'U'],
  ['ů', 'u'],
  ['Ű', 'Ü'],
  ['ű', 'ü'],
  ['Ų', 'U'],
  ['ų', 'u'],
  ['Ŵ', 'W'],
  ['ŵ', 'w'],
  ['Ŷ', 'Y'],
  ['ŷ', 'y'],
  ['Ÿ', 'Y'],
  ['Ź', 'Z'],
  ['ź', 'z'],
  ['Ż', 'Z'],
  ['ż', 'z'],
  ['Ž', 'Z'],
  ['ž', 'z'],
  ['Ǝ', 'E'],
  ['Ț', 'T'],
  ['ț', 't'],
  ['ķ', 'fı'],      // zarķ → zarfı
  ['Ʊ', 'U'],
  ['Ʋ', 'V'],
  ['Ɣ', 'G'],
  ['ɣ', 'g'],
  ['Ɛ', 'E'],
  ['Ǿ', 'Ö'],
  ['ǿ', 'ö'],
  ['Ǽ', 'Ö'],
  ['ǽ', 'ö'],
  ['Ǻ', 'A'],
  ['ǻ', 'a'],
  ['Ǹ', 'N'],
  ['ǹ', 'n'],
  ['Ȁ', 'A'],
  ['ȁ', 'a'],
  ['Ȃ', 'A'],
  ['ȃ', 'a'],
  ['Ȅ', 'E'],
  ['ȅ', 'e'],
  ['Ȇ', 'E'],
  ['ȇ', 'e'],
  ['Ȉ', 'I'],
  ['ȉ', 'ı'],
  ['Ȋ', 'İ'],
  ['ȋ', 'i'],
  ['Ȍ', 'O'],
  ['ȍ', 'o'],
  ['Ȏ', 'O'],
  ['ȏ', 'o'],
  ['Ȑ', 'R'],
  ['ȑ', 'r'],
  ['Ȓ', 'R'],
  ['ȓ', 'r'],
  ['Ȕ', 'U'],
  ['ȕ', 'u'],
  ['Ȗ', 'U'],
  ['ȗ', 'u'],
  ['Ș', 'Ş'],
  ['ș', 'ş'],
  ['Ʒ', 'Z'],
  ['ʒ', 'z'],
  ['ʤ', 'dz'],
  ['ʧ', 'tş'],
  ['ﬁ', 'fi'],
  ['ﬂ', 'fl'],
  ['ﬀ', 'ff'],
  ['ﬃ', 'ffi'],
  ['ﬄ', 'ffl'],
  ['Ī', 'I'],
  ['ī', 'ı'],
  ['Ē', 'E'],
  ['ē', 'e'],
  ['Ā', 'A'],
  ['ā', 'a'],
  ['Ʃ', 'ti'],
  ['Ō', 'ft'],      // leŌ → left
  ['ŏ', 'o'],
  ['Ʃ', 'Ş'],
  ['Ɵ', 'ti'],
  ['Ʃ', 'E'],
  ['ƪ', 'ti'],
  ['Ʃ', 'Ş'],
  ['Ɵ', 'ti'],
  ['Ʃ', 'tl'],      
  ['Ʃ', 'ti'],
  ['Ʃ', 'ti'],
  ['Ŏ', 'O'],
  ['Ŏ', 'ft'],      // leŌ → left için
  ['Ō', 'ft'],
  ['ō', 'ft'],
  ['Ɵ', 'ti'],
  ['Ɵ', 'ti'],
  ['Ɵ', 'ti'],
  ['Ɵ', 'ti'],
  ['Ɵ', 'ti'],
  ['Ɵ', 'ti'],
  ['Ɵ', 'ti'],
  ['ƿ', 'p'],
  ['Ƕ', 'H'],
  ['ƕ', 'h'],
  ['Ɠ', 'G'],
  ['ɠ', 'g'],
  ['Ɲ', 'N'],
  ['ɲ', 'n'],
  ['Ƒ', 'F'],
  ['ƒ', 'f'],
  ['Ƙ', 'K'],
  ['ƙ', 'k'],
  ['Ɯ', 'M'],
  ['ɯ', 'm'],
  ['Ɵ', 'ti'],
]);

// Kelime bazlı düzeltmeler
const WORD_FIXES = new Map([
  ['geƟrilmelidir', 'getirilmelidir'],
  ['geƟrilir', 'getirilir'],
  ['geƟrilerek', 'getirilerek'],
  ['belirƟr', 'belirtir'],
  ['belirƟrken', 'belirtirken'],
  ['hikayeleşƟrilmesinde', 'hikayeleştirilmesinde'],
  ['seçenekƟr', 'seçenektir'],
  ['eƫğinden', 'ettiğinden'],
  ['edaƨ', 'edatı'],
  ['alƨnda', 'altında'],
  ['zarķ', 'zarfı'],
  ['sıfaƨ', 'sıfatı'],
  ['ConƟnuous', 'Continuous'],
  ['conƟnuous', 'continuous'],
  ['starƟng', 'starting'],
  ['waiƟng', 'waiting'],
  ['someƟmes', 'sometimes'],
  ['QuanƟty', 'Quantity'],
  ['AdjecƟves', 'Adjectives'],
  ['eaƟng', 'eating'],
  ['ParagraŌa', 'Paragrafta'],
  ['liƩle', 'little'],
  ['LiƩle', 'Little'],
  ['isƟyorum', 'istiyorum'],
  ['staƟon', 'station'],
  ['yanıƨ', 'yanıtı'],
  ['MeƟn', 'Metin'],
  ['leŌ', 'left'],
  ['Ɵme', 'time'],
  ['taƟle', 'tatile'],
  ['kısalƨlabilir', 'kısaltılabilir'],
  ['iƟbariyle', 'itibariyle'],
  ['iƟbaren', 'itibaren'],
  ['kullanılmışƨr', 'kullanılmıştır'],
  ['yapılmışƨr', 'yapılmıştır'],
  ['yapƨğı', 'yaptığı'],
  ['yapƨğını', 'yaptığını'],
  ['gerçekleşƟğini', 'gerçekleştiğini'],
  ['karşılaşƨrmada', 'karşılaştırmada'],
]);

// Açıklama sonundaki sayıları temizle
function cleanTrailingNumbers(text) {
  return text.replace(/\s+\d+\s*$/, '').trim();
}

// Karakterleri düzelt
function fixCharacters(text) {
  if (!text || typeof text !== 'string') return text;
  
  let fixed = text;
  
  // Önce kelime bazlı düzeltmeleri yap
  for (const [wrong, correct] of WORD_FIXES) {
    fixed = fixed.split(wrong).join(correct);
  }
  
  // Sonra karakter bazlı düzeltmeleri yap
  for (const [wrong, correct] of CHARACTER_FIXES) {
    fixed = fixed.split(wrong).join(correct);
  }
  
  return fixed;
}

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

function processQuestion(question) {
  let modified = false;
  
  // Soru cümlesini düzelt
  if (question['soru cümlesi']) {
    const original = question['soru cümlesi'];
    const fixed = fixCharacters(original);
    if (original !== fixed) {
      question['soru cümlesi'] = fixed;
      modified = true;
    }
  }
  
  // Seçenekleri düzelt
  if (question['seçenekler'] && Array.isArray(question['seçenekler'])) {
    for (let i = 0; i < question['seçenekler'].length; i++) {
      const original = question['seçenekler'][i];
      const fixed = fixCharacters(original);
      if (original !== fixed) {
        question['seçenekler'][i] = fixed;
        modified = true;
      }
    }
  }
  
  // Açıklamayı düzelt
  if (question['açıklama']) {
    let original = question['açıklama'];
    let fixed = fixCharacters(original);
    fixed = cleanTrailingNumbers(fixed);
    if (original !== fixed) {
      question['açıklama'] = fixed;
      modified = true;
    }
  }
  
  return modified;
}

async function processFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const questions = JSON.parse(content);
    
    let modifiedCount = 0;
    
    for (const question of questions) {
      if (processQuestion(question)) {
        modifiedCount++;
      }
    }
    
    if (modifiedCount > 0) {
      await fs.writeFile(filePath, JSON.stringify(questions, null, 2), 'utf8');
      console.log(`✅ ${path.basename(filePath)} - ${modifiedCount} soru düzeltildi`);
      return { filePath, modified: true, count: modifiedCount };
    } else {
      console.log(`⏭️ ${path.basename(filePath)} - Değişiklik gerekmiyor`);
      return { filePath, modified: false, count: 0 };
    }
    
  } catch (error) {
    console.error(`❌ ${path.basename(filePath)} - Hata: ${error.message}`);
    return { filePath, error: error.message };
  }
}

async function main() {
  console.log('🔧 OCR Karakter Düzeltme Scripti');
  console.log('================================\n');
  console.log('🔍 Sınav dosyaları taranıyor...\n');
  
  const jsonFiles = await getAllJsonFiles(SINAVLAR_DIR);
  console.log(`📁 ${jsonFiles.length} dosya bulundu\n`);
  
  let totalModified = 0;
  let totalQuestions = 0;
  
  for (const file of jsonFiles) {
    const relativePath = path.relative(SINAVLAR_DIR, file);
    console.log(`📄 İşleniyor: ${relativePath}`);
    
    const result = await processFile(file);
    if (result.modified) {
      totalModified++;
      totalQuestions += result.count;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`\n✅ İşlem tamamlandı!`);
  console.log(`📊 Toplam: ${jsonFiles.length} dosya`);
  console.log(`📝 Değiştirilen dosya: ${totalModified}`);
  console.log(`🔧 Toplam düzeltilen soru: ${totalQuestions}`);
}

main().catch(console.error);
