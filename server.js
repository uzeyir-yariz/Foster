import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3501;

// Student JSON file path
const STUDENT_FILE = path.join(__dirname, 'student.json');
const REPORT_FILE = path.join(__dirname, 'hatali_sorular.json');

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public', 'avatars'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'custom-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Ensure files exist
async function initFiles() {
  try {
    await fs.access(STUDENT_FILE);
  } catch {
    const defaultData = {
      isim: 'foster',
      durum: 'heyecanlı başlıyor 🚀',
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        streakDates: []
      },
      istatistikler: {
        toplamTest: 0,
        toplamSure: 0,
        toplamDogru: 0,
        toplamYanlis: 0,
        toplamBos: 0,
        ortalamaPuan: 0
      },
      dersler: {
        'programlama temelleri': {
          testSayisi: 0,
          ortalamaPuan: 0,
          enYuksekPuan: 0,
          enDusukPuan: 0,
          toplamDogru: 0,
          toplamYanlis: 0,
          yanlisSorular: []
        }
      },
      sonSinav: {
        tarih: '',
        ders: '',
        sinavTipi: '',
        puan: 0,
        dogru: 0,
        yanlis: 0,
        bos: 0,
        sure: 0
      },
      tumYanlisSorular: []
    };
    await fs.writeFile(STUDENT_FILE, JSON.stringify(defaultData, null, 2));
    console.log('Created new student.json file');
  }

  try {
    await fs.access(REPORT_FILE);
  } catch {
    await fs.writeFile(REPORT_FILE, JSON.stringify([], null, 2));
    console.log('Created new hatali_sorular.json file');
  }
}

// GET endpoint to read student data
app.get('/api/student', async (req, res) => {
  try {
    const data = await fs.readFile(STUDENT_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading student.json:', error);
    res.status(500).json({ error: 'Failed to read student data' });
  }
});

// POST endpoint to update student data
app.post('/api/student', async (req, res) => {
  try {
    await fs.writeFile(STUDENT_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true, message: 'Student data updated' });
  } catch (error) {
    console.error('Error writing student.json:', error);
    res.status(500).json({ error: 'Failed to update student data' });
  }
});

// PATCH endpoint to update student name only
app.patch('/api/student/name', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Valid name is required' });
    }
    
    // Read current data
    const data = await fs.readFile(STUDENT_FILE, 'utf8');
    const studentData = JSON.parse(data);
    
    // Update only the name
    studentData.isim = name.trim();
    
    await fs.writeFile(STUDENT_FILE, JSON.stringify(studentData, null, 2));
    res.json({ success: true, message: 'Student name updated', data: studentData });
  } catch (error) {
    console.error('Error updating student name:', error);
    res.status(500).json({ error: 'Failed to update student name' });
  }
});

// POST endpoint to reset student data
app.post('/api/student/reset', async (req, res) => {
  try {
    const TEMPLATE_FILE = path.join(__dirname, 'template_student.json');
    
    // Read current data to preserve the name
    const currentData = await fs.readFile(STUDENT_FILE, 'utf8');
    const current = JSON.parse(currentData);
    
    // Read template data
    const templateData = await fs.readFile(TEMPLATE_FILE, 'utf8');
    const template = JSON.parse(templateData);
    
    // Reset data but preserve the student name
    const resetData = {
      ...template,
      isim: current.isim
    };
    
    await fs.writeFile(STUDENT_FILE, JSON.stringify(resetData, null, 2));
    res.json({ success: true, message: 'Student data reset successfully', data: resetData });
  } catch (error) {
    console.error('Error resetting student data:', error);
    res.status(500).json({ error: 'Failed to reset student data' });
  }
});

// POST endpoint to upload custom avatar
app.post('/api/upload-avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read current student data
    const data = await fs.readFile(STUDENT_FILE, 'utf8');
    const studentData = JSON.parse(data);

    // Update avatar field with new filename
    const avatarFilename = req.file.filename;
    studentData.avatar = avatarFilename;

    // Save updated student data
    await fs.writeFile(STUDENT_FILE, JSON.stringify(studentData, null, 2));

    res.json({ 
      success: true, 
      message: 'Avatar uploaded successfully',
      avatar: avatarFilename,
      data: studentData
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// POST endpoint to report a question
app.post('/api/report-question', async (req, res) => {
  try {
    const report = req.body;
    // Read existing reports
    const data = await fs.readFile(REPORT_FILE, 'utf8');
    const reports = JSON.parse(data);
    
    // Add new report with timestamp
    reports.push({
      ...report,
      reportedAt: new Date().toISOString()
    });
    
    await fs.writeFile(REPORT_FILE, JSON.stringify(reports, null, 2));
    res.json({ success: true, message: 'Question reported successfully' });
  } catch (error) {
    console.error('Error reporting question:', error);
    res.status(500).json({ error: 'Failed to report question' });
  }
});

// GET endpoint to read all reported questions
app.get('/api/reported-questions', async (req, res) => {
  try {
    const data = await fs.readFile(REPORT_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading hatali_sorular.json:', error);
    res.status(500).json({ error: 'Failed to read reported questions' });
  }
});

// DELETE endpoint to remove a reported question by index
app.delete('/api/reported-questions/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const data = await fs.readFile(REPORT_FILE, 'utf8');
    const reports = JSON.parse(data);
    
    if (index < 0 || index >= reports.length) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Remove the report at the specified index
    reports.splice(index, 1);
    
    await fs.writeFile(REPORT_FILE, JSON.stringify(reports, null, 2));
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// GET endpoint to fetch question data from exam file
app.get('/api/question-data', async (req, res) => {
  try {
    const { filePath, questionNumber } = req.query;
    
    if (!filePath || !questionNumber) {
      return res.status(400).json({ error: 'filePath and questionNumber are required' });
    }
    
    // Construct full path - filePath starts with /sınavlar/...
    const fullPath = path.join(__dirname, filePath);
    
    const data = await fs.readFile(fullPath, 'utf8');
    const questions = JSON.parse(data);
    
    // Find the question by its number
    const question = questions.find(q => q['soru numarası'] === parseInt(questionNumber));
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    res.json(question);
  } catch (error) {
    console.error('Error fetching question data:', error);
    res.status(500).json({ error: 'Failed to fetch question data' });
  }
});

// PUT endpoint to update question data in exam file
app.put('/api/question-data', async (req, res) => {
  try {
    const { filePath, questionNumber, questionData } = req.body;
    
    if (!filePath || !questionNumber || !questionData) {
      return res.status(400).json({ error: 'filePath, questionNumber, and questionData are required' });
    }
    
    // Construct full path
    const fullPath = path.join(__dirname, filePath);
    
    const data = await fs.readFile(fullPath, 'utf8');
    const questions = JSON.parse(data);
    
    // Find and update the question
    const questionIndex = questions.findIndex(q => q['soru numarası'] === parseInt(questionNumber));
    
    if (questionIndex === -1) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Update the question data
    questions[questionIndex] = questionData;
    
    await fs.writeFile(fullPath, JSON.stringify(questions, null, 2));
    res.json({ success: true, message: 'Question updated successfully' });
  } catch (error) {
    console.error('Error updating question data:', error);
    res.status(500).json({ error: 'Failed to update question data' });
  }
});

// Initialize and start server
initFiles().then(() => {
  app.listen(PORT, () => {
    console.log(`API Server running at http://localhost:${PORT}`);
  });
});
