import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBRfRcvS_9miuYuOHbBYjXY_i8oG_lQNHg",
  authDomain: "foster-c21f8.firebaseapp.com",
  projectId: "foster-c21f8",
  storageBucket: "foster-c21f8.firebasestorage.app",
  messagingSenderId: "744958868468",
  appId: "1:744958868468:web:649ce075433b10eaabd7a1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper to create URL-safe IDs
function createId(text) {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper to parse exam metadata from filename
function parseExamName(filename) {
  const name = filename.replace('.json', '');
  const yearMatch = name.match(/(\d{4}-\d{4})/);
  const termMatch = name.match(/(Güz|Bahar|Yaz)/);
  const typeMatch = name.match(/(Vize|Final|Bütünleme|Mezuniyet|Yaz Okulu)/);
  
  return {
    fullName: name,
    year: yearMatch ? yearMatch[1] : null,
    term: termMatch ? termMatch[1] : null,
    type: typeMatch ? typeMatch[0] : null
  };
}

async function migrateExamData() {
  const sinavlarPath = join(__dirname, '..', 'sınavlar');
  const stats = {
    sources: 0,
    courses: 0,
    exams: 0,
    questions: 0,
    errors: []
  };

  console.log('🚀 Starting migration...\n');

  try {
    // Get all source directories
    const sourceDirs = readdirSync(sinavlarPath).filter(item => {
      const fullPath = join(sinavlarPath, item);
      return statSync(fullPath).isDirectory() && !item.includes('hatalı');
    });

    for (const sourceDir of sourceDirs) {
      const sourcePath = join(sinavlarPath, sourceDir);
      const sourceId = createId(sourceDir);
      
      console.log(`\n📁 Processing source: ${sourceDir}`);
      
      // Create exam source document
      const sourceRef = doc(db, 'examSources', sourceId);
      await setDoc(sourceRef, {
        id: sourceId,
        displayName: sourceDir,
        description: `Exam collection from ${sourceDir}`,
        createdAt: new Date().toISOString(),
        isActive: true
      });
      stats.sources++;

      // Get all course directories in this source
      const courseDirs = readdirSync(sourcePath).filter(item => {
        const fullPath = join(sourcePath, item);
        return statSync(fullPath).isDirectory() && !item.includes('hatalı');
      });

      for (const courseDir of courseDirs) {
        const coursePath = join(sourcePath, courseDir);
        const courseId = `${createId(courseDir)}-${sourceId}`;
        
        console.log(`  📚 Processing course: ${courseDir}`);
        
        // Get all exam files in this course
        const examFiles = readdirSync(coursePath).filter(file => 
          file.endsWith('.json') && !file.includes('hatalı')
        );

        if (examFiles.length === 0) continue;

        let courseQuestionCount = 0;
        const batch = writeBatch(db);

        // Process each exam file
        for (const examFile of examFiles) {
          const examPath = join(coursePath, examFile);
          
          try {
            const examData = JSON.parse(readFileSync(examPath, 'utf-8'));
            const examMeta = parseExamName(examFile);
            const examId = createId(examFile);

            // Create exam document
            const examRef = doc(db, 'exams', `${examId}-${courseId}`);
            batch.set(examRef, {
              id: `${examId}-${courseId}`,
              sourceId: sourceId,
              courseId: courseId,
              courseName: courseDir,
              examName: examMeta.fullName,
              year: examMeta.year,
              term: examMeta.term,
              type: examMeta.type,
              questions: examData,
              questionCount: examData.length,
              createdAt: new Date().toISOString()
            });

            stats.exams++;
            courseQuestionCount += examData.length;
            stats.questions += examData.length;

            console.log(`    ✓ ${examFile} (${examData.length} questions)`);
          } catch (err) {
            stats.errors.push(`Error processing ${examFile}: ${err.message}`);
            console.error(`    ✗ ${examFile}: ${err.message}`);
          }
        }

        // Create course document
        const courseRef = doc(db, 'courses', courseId);
        batch.set(courseRef, {
          id: courseId,
          sourceId: sourceId,
          courseName: courseDir,
          examCount: examFiles.length,
          questionCount: courseQuestionCount,
          createdAt: new Date().toISOString()
        });

        // Commit batch
        await batch.commit();
        stats.courses++;
      }
    }

    // Print summary
    console.log('\n\n' + '='.repeat(50));
    console.log('✅ MIGRATION COMPLETE!');
    console.log('='.repeat(50));
    console.log(`📊 Statistics:`);
    console.log(`   - Sources: ${stats.sources}`);
    console.log(`   - Courses: ${stats.courses}`);
    console.log(`   - Exams: ${stats.exams}`);
    console.log(`   - Questions: ${stats.questions}`);
    
    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors (${stats.errors.length}):`);
      stats.errors.forEach(err => console.log(`   - ${err}`));
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateExamData()
  .then(() => {
    console.log('\n✨ Migration script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error);
    process.exit(1);
  });
