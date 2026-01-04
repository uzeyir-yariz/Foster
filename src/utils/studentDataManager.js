/**
 * Student Data Manager
 * Handles reading/writing student.json
 */

import { updateStreak } from './streakManager';

const STUDENT_FILE_PATH = 'student.json';

/**
 * Default student data structure
 */
const DEFAULT_STUDENT_DATA = {
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

const API_URL = 'http://localhost:3501/api/student';

/**
 * Load student data from local file system via API
 */
export async function loadStudentData() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('API Error');
    return await response.json();
  } catch (error) {
    console.error('Error loading student data from API:', error);
    // Fallback to localStorage if server is offline
    const local = localStorage.getItem('studentData');
    return local ? JSON.parse(local) : DEFAULT_STUDENT_DATA;
  }
}

/**
 * Save student data to local file system via API
 */
export async function saveStudentData(data) {
  try {
    // Save to API
    await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    // Also save to localStorage as backup
    localStorage.setItem('studentData', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving student data to API:', error);
    // Fallback save to localStorage
    localStorage.setItem('studentData', JSON.stringify(data, null, 2));
    return false;
  }
}

/**
 * Download student data as JSON file
 */
export function downloadStudentData(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'student.json';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Calculate student status based on average score
 */
function calculateStatus(averageScore) {
  if (averageScore === 0) return 'heyecanlı başlıyor 🚀';
  if (averageScore >= 85) return 'mükemmel performans! 🎉';
  if (averageScore >= 75) return 'başarılı çalışıyor ⭐';
  if (averageScore >= 60) return 'iyi gidiyor 👍';
  if (averageScore >= 40) return 'daha fazla çalışmalı 📚';
  return 'çok çalışması gerekiyor 😔';
}

/**
 * Update student data after completing an exam
 */
export function updateStudentData(currentData, examResult) {
  const newData = { ...currentData };
  
  // Update streak
  newData.streak = updateStreak(newData);
  
  // Update general statistics
  newData.istatistikler.toplamTest++;
  newData.istatistikler.toplamSure += examResult.timeSpent;
  newData.istatistikler.toplamDogru += examResult.correct;
  newData.istatistikler.toplamYanlis += examResult.wrong;
  newData.istatistikler.toplamBos += examResult.skipped;
  
  // Calculate new average score
  const totalScore = newData.istatistikler.ortalamaPuan * (newData.istatistikler.toplamTest - 1) + parseFloat(examResult.score);
  newData.istatistikler.ortalamaPuan = totalScore / newData.istatistikler.toplamTest;
  
  // Update status
  newData.durum = calculateStatus(newData.istatistikler.ortalamaPuan);
  
  // Update course-specific data
  const courseName = examResult.courseName || 'programlama temelleri';
  if (!newData.dersler[courseName]) {
    newData.dersler[courseName] = {
      testSayisi: 0,
      ortalamaPuan: 0,
      enYuksekPuan: 0,
      enDusukPuan: 0,
      toplamDogru: 0,
      toplamYanlis: 0,
      yanlisSorular: []
    };
  }
  
  const courseData = newData.dersler[courseName];
  courseData.testSayisi++;
  courseData.toplamDogru += examResult.correct;
  courseData.toplamYanlis += examResult.wrong;
  
  const score = parseFloat(examResult.score);
  courseData.enYuksekPuan = Math.max(courseData.enYuksekPuan, score);
  courseData.enDusukPuan = courseData.enDusukPuan === 0 ? score : Math.min(courseData.enDusukPuan, score);
  
  const courseTotalScore = courseData.ortalamaPuan * (courseData.testSayisi - 1) + score;
  courseData.ortalamaPuan = courseTotalScore / courseData.testSayisi;
  
  // Add wrong questions
  examResult.wrongQuestions.forEach(wq => {
    const wrongQuestion = {
      soru: wq.question,
      kullaniciCevap: wq.userAnswer,
      dogruCevap: wq.correctAnswer,
      aciklama: wq.explanation,
      tarih: new Date().toISOString()
    };
    
    courseData.yanlisSorular.push(wrongQuestion);
    newData.tumYanlisSorular.push({
      ...wrongQuestion,
      ders: courseName
    });
  });
  
  // Update last exam
  newData.sonSinav = {
    tarih: new Date().toISOString(),
    ders: courseName,
    sinavTipi: examResult.examTypes || 'Karışık',
    puan: score,
    dogru: examResult.correct,
    yanlis: examResult.wrong,
    bos: examResult.skipped,
    sure: examResult.timeSpent
  };
  
  return newData;
}

/**
 * Get course statistics
 */
export function getCourseStats(studentData, courseName = 'programlama temelleri') {
  const courseData = studentData.dersler[courseName];
  if (!courseData) return null;
  
  return {
    testCount: courseData.testSayisi,
    averageScore: courseData.ortalamaPuan.toFixed(2),
    highestScore: courseData.enYuksekPuan.toFixed(2),
    lowestScore: courseData.enDusukPuan.toFixed(2),
    totalCorrect: courseData.toplamDogru,
    totalWrong: courseData.toplamYanlis,
    wrongQuestionsCount: courseData.yanlisSorular.length
  };
}
