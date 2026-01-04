/**
 * Score Calculator Utility
 * Handles scoring logic: 3 wrong = -1 correct, 2 points per question
 */

/**
 * Calculate net score
 * Formula: net = correct - (wrong / 3)
 */
export function calculateNet(correct, wrong) {
  return correct - (wrong / 3);
}

/**
 * Calculate total score
 * Formula: score = net * 2
 */
export function calculateScore(correct, wrong) {
  const net = calculateNet(correct, wrong);
  return Math.max(0, net * 2); // Don't allow negative scores
}

/**
 * Calculate percentage
 */
export function calculatePercentage(correct, total) {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

/**
 * Get performance level based on score percentage
 */
export function getPerformanceLevel(percentage) {
  if (percentage >= 90) return { level: 'Mükemmel', emoji: '🎉', color: '#22c55e' };
  if (percentage >= 80) return { level: 'Çok İyi', emoji: '⭐', color: '#3b82f6' };
  if (percentage >= 70) return { level: 'İyi', emoji: '👍', color: '#8b5cf6' };
  if (percentage >= 60) return { level: 'Orta', emoji: '📚', color: '#f59e0b' };
  if (percentage >= 50) return { level: 'Geçer', emoji: '😐', color: '#f97316' };
  return { level: 'Yetersiz', emoji: '😔', color: '#ef4444' };
}

/**
 * Generate motivational status message based on average score
 */
export function getStudentStatus(averageScore) {
  const percentage = (averageScore / 100) * 100; // Assuming max 100 points per exam
  
  if (percentage >= 85) return 'mükemmel performans! 🎉';
  if (percentage >= 75) return 'başarılı çalışıyor ⭐';
  if (percentage >= 60) return 'iyi gidiyor 👍';
  if (percentage >= 40) return 'daha fazla çalışmalı 📚';
  return 'çok çalışması gerekiyor 😔';
}

/**
 * Format time in minutes and seconds
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate exam results
 */
export function calculateResults(answers, questions) {
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  const wrongQuestions = [];
  
  questions.forEach((question, index) => {
    const userAnswer = answers[index];
    const correctAnswer = question['doğru cevap indeksi'];
    
    if (userAnswer === null || userAnswer === undefined) {
      skipped++;
    } else if (userAnswer === correctAnswer) {
      correct++;
    } else {
      wrong++;
      wrongQuestions.push({
        questionNumber: question['soru numarası'] || index + 1,
        question: question['soru cümlesi'],
        userAnswer: question.seçenekler[userAnswer],
        correctAnswer: question.seçenekler[correctAnswer],
        explanation: question.açıklama || ''
      });
    }
  });
  
  const net = calculateNet(correct, wrong);
  const score = calculateScore(correct, wrong);
  const total = questions.length;
  const percentage = calculatePercentage(correct, total);
  const performance = getPerformanceLevel(percentage);
  
  return {
    correct,
    wrong,
    skipped,
    net: net.toFixed(2),
    score: score.toFixed(2),
    total,
    percentage,
    performance,
    wrongQuestions
  };
}
