import { getStreakMessage, hasStudiedToday, isStreakInDanger } from '../utils/streakManager';
import './StreakDisplay.css';

function StreakDisplay({ streak, compact = false }) {
  const currentStreak = streak?.currentStreak || 0;
  const longestStreak = streak?.longestStreak || 0;
  const { emoji, message } = getStreakMessage(currentStreak);
  const studiedToday = hasStudiedToday(streak);
  const inDanger = isStreakInDanger(streak);
  
  if (compact) {
    return (
      <div className={`streak-compact ${inDanger ? 'danger' : ''} ${studiedToday ? 'completed' : ''}`}>
        <span className="streak-fire">🔥</span>
        <span className="streak-count">{currentStreak}</span>
        {inDanger && !studiedToday && <span className="streak-warning">!</span>}
        {studiedToday && <span className="streak-check">✓</span>}
      </div>
    );
  }
  
  return (
    <div className={`streak-display card ${inDanger ? 'danger' : ''} ${studiedToday ? 'completed' : ''}`}>
      <div className="streak-main">
        <div className="streak-icon">
          <span className="streak-fire-large">{emoji}</span>
        </div>
        <div className="streak-info">
          <div className="streak-count-large">{currentStreak}</div>
          <div className="streak-label">günlük seri</div>
        </div>
      </div>
      
      <div className="streak-message">{message}</div>
      
      <div className="streak-stats">
        <div className="streak-stat">
          <span className="stat-value">{longestStreak}</span>
          <span className="stat-label">En Uzun</span>
        </div>
        <div className="streak-stat">
          <span className={`stat-value ${studiedToday ? 'success' : 'warning'}`}>
            {studiedToday ? '✓' : '○'}
          </span>
          <span className="stat-label">Bugün</span>
        </div>
      </div>
      
      {inDanger && !studiedToday && (
        <div className="streak-alert">
          ⚠️ Streak'ini kaybetmemek için bugün çalış!
        </div>
      )}
    </div>
  );
}

export default StreakDisplay;
