/**
 * Exam Loader Utility
 * Loads and categorizes JSON exam files from multiple courses
 */

// Import all exam JSON files recursively from "sınavlar" directory
const examFiles = import.meta.glob('/sınavlar/**/*.json', { eager: true });

/**
 * Parse exam metadata from filename and path
 * Example Path: "/sınavlar/Programlama Temelleri/2024-2025 Güz Dönemi Vize Sınavı.json"
 */
function parseExamMetadata(filepath) {
  // Normalize path separators
  const normalizedPath = filepath.replace(/\\/g, '/');
  
  // Extract parts
  const parts = normalizedPath.split('/');
  const filename = parts.pop().replace('.json', '');
  
  // Extract Course Name (assumes structure: /sınavlar/CourseName/FileName.json)
  // parts array after pop: ['', 'sınavlar', 'CourseName']
  let courseName = 'Genel';
  if (parts.length >= 3 && parts[1] === 'sınavlar') {
    courseName = parts[2].replace(' sınavlar', ''); // Clean up name if it has " sınavlar" suffix
  }

  // Extract year range (e.g., "2024-2025")
  const yearMatch = filename.match(/(\d{4})-(\d{4})/);
  const year = yearMatch ? `${yearMatch[1]}-${yearMatch[2]}` : null;
  
  // Extract exam type
  let examType = 'Diğer';
  if (filename.includes('Vize')) examType = 'Vize';
  else if (filename.includes('Final')) examType = 'Final';
  else if (filename.includes('Bütünleme')) examType = 'Bütünleme';
  else if (filename.includes('Mezuniyet')) examType = 'Mezuniyet Üç Ders';
  else if (filename.includes('Yaz Okulu')) examType = 'Yaz Okulu';
  else if (filename.includes('Ara Sınav')) examType = 'Vize'; // Ara sınav = Vize
  
  // Extract semester
  const semester = filename.includes('Güz') ? 'Güz' : filename.includes('Bahar') ? 'Bahar' : null;
  
  return {
    id: `${courseName}_${filename}`, // Unique ID combination
    filename: filename,
    year,
    semester,
    examType,
    courseName,
    fullPath: filepath
  };
}

/**
 * Load all exams and categorize them
 */
export function loadAllExams() {
  const exams = [];
  
  for (const [path, module] of Object.entries(examFiles)) {
    // Ignore "hatalı" folders or files
    if (path.toLowerCase().includes('hatalı')) {
      continue;
    }

    const metadata = parseExamMetadata(path);
    const questions = module.default || module;
    
    // Validate if it has questions
    if (!Array.isArray(questions) || questions.length === 0) {
      continue;
    }

    exams.push({
      ...metadata,
      questions,
      questionCount: questions.length
    });
  }
  
  return exams;
}

/**
 * Get unique courses
 */
export function getCourses(exams) {
  const courses = new Set();
  exams.forEach(exam => courses.add(exam.courseName));
  return Array.from(courses).sort();
}

/**
 * Get unique exam types
 */
export function getExamTypes(exams) {
  const types = new Set();
  exams.forEach(exam => types.add(exam.examType));
  return Array.from(types).sort();
}

/**
 * Get year range
 */
export function getYearRange(exams) {
  const years = exams
    .map(exam => exam.year)
    .filter(Boolean)
    .flatMap(year => year.split('-').map(Number));
  
  if (years.length === 0) return { min: 2018, max: 2025 };
  
  return {
    min: Math.min(...years),
    max: Math.max(...years)
  };
}

/**
 * Filter exams based on criteria
 */
export function filterExams(exams, filters) {
  return exams.filter(exam => {
    // Filter by course
    if (filters.courses && filters.courses.length > 0) {
      if (!filters.courses.includes(exam.courseName)) return false;
    }

    // Filter by exam type
    if (filters.examTypes && filters.examTypes.length > 0) {
      if (!filters.examTypes.includes(exam.examType)) return false;
    }
    
    // Filter by year range
    if (filters.yearRange && exam.year) {
      const [startYear] = exam.year.split('-').map(Number);
      if (startYear < filters.yearRange.min || startYear > filters.yearRange.max) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Combine questions from multiple exams
 */
export function combineExams(selectedExams) {
  const allQuestions = [];
  
  selectedExams.forEach(exam => {
    exam.questions.forEach(question => {
      allQuestions.push({
        ...question,
        sourceExam: exam.filename,
        courseName: exam.courseName,
        fullPath: exam.fullPath
      });
    });
  });
  
  return allQuestions;
}
