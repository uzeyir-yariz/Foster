// Streak (Günlük Seri) yönetimi

/**
 * Mevcut streak'in hala geçerli olup olmadığını kontrol eder
 * 2+ gün geçmişse streak'i sıfırlar
 * @param {Object} streak - Streak verileri
 * @returns {Object} - Doğrulanmış streak bilgisi
 */
export function validateStreak(streak) {
  if (!streak || !streak.lastActivityDate) {
    return {
      currentStreak: 0,
      longestStreak: streak?.longestStreak || 0,
      lastActivityDate: null,
      streakDates: []
    };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastDate = new Date(streak.lastActivityDate);
  lastDate.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
  
  // 2+ gün geçmişse streak sıfırla (1 gün atlanmış demektir)
  if (diffDays >= 2) {
    return {
      currentStreak: 0,
      longestStreak: streak.longestStreak,
      lastActivityDate: streak.lastActivityDate,
      streakDates: []
    };
  }
  
  // Streak hala geçerli
  return streak;
}

/**
 * Streak verisini günceller
 * @param {Object} studentData - Mevcut öğrenci verileri
 * @returns {Object} - Güncellenmiş streak bilgisi
 */
export function updateStreak(studentData) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  // Mevcut streak verilerini al veya varsayılan oluştur
  const streak = studentData.streak || {
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    streakDates: []
  };
  
  // Son aktivite tarihini kontrol et
  if (!streak.lastActivityDate) {
    // İlk kez çalışıyor
    return {
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: todayStr,
      streakDates: [todayStr]
    };
  }
  
  const lastDate = new Date(streak.lastActivityDate);
  lastDate.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Bugün zaten çalışmış, streak değişmez
    return streak;
  } else if (diffDays === 1) {
    // Ardışık gün, streak artır
    const newStreak = streak.currentStreak + 1;
    const newDates = [...streak.streakDates, todayStr].slice(-30); // Son 30 günü tut
    return {
      currentStreak: newStreak,
      longestStreak: Math.max(streak.longestStreak, newStreak),
      lastActivityDate: todayStr,
      streakDates: newDates
    };
  } else {
    // Gün atlandı, streak sıfırla
    return {
      currentStreak: 1,
      longestStreak: streak.longestStreak,
      lastActivityDate: todayStr,
      streakDates: [todayStr]
    };
  }
}

/**
 * Streak durumuna göre motivasyon mesajı döndürür
 * @param {number} currentStreak - Mevcut streak
 * @returns {Object} - Emoji ve mesaj
 */
export function getStreakMessage(currentStreak) {
  if (currentStreak === 0) {
    return { emoji: '🔥', message: 'Streak\'ini başlat!' };
  } else if (currentStreak === 1) {
    return { emoji: '🔥', message: 'Harika başlangıç!' };
  } else if (currentStreak < 3) {
    return { emoji: '🔥', message: 'Devam et!' };
  } else if (currentStreak < 7) {
    return { emoji: '🔥🔥', message: 'Süpersin!' };
  } else if (currentStreak < 14) {
    return { emoji: '🔥🔥🔥', message: 'Bir hafta aştın!' };
  } else if (currentStreak < 30) {
    return { emoji: '⚡🔥⚡', message: 'Yanıyorsun!' };
  } else if (currentStreak < 60) {
    return { emoji: '👑🔥👑', message: 'Efsane!' };
  } else {
    return { emoji: '🏆🔥🏆', message: 'Durdurulamaz!' };
  }
}

/**
 * Bugün çalışılıp çalışılmadığını kontrol eder
 * @param {Object} streak - Streak verileri
 * @returns {boolean}
 */
export function hasStudiedToday(streak) {
  if (!streak || !streak.lastActivityDate) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  return streak.lastActivityDate === todayStr;
}

/**
 * Streak tehlikede mi kontrol eder (bu gün çalışılmadı ve dün çalışıldı)
 * @param {Object} streak - Streak verileri
 * @returns {boolean}
 */
export function isStreakInDanger(streak) {
  if (!streak || !streak.lastActivityDate || streak.currentStreak === 0) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastDate = new Date(streak.lastActivityDate);
  lastDate.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
  
  return diffDays === 1 || (diffDays === 0 && hasStudiedToday(streak) === false);
}
