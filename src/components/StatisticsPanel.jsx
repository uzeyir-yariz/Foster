import { formatTime } from '../utils/scoreCalculator';
import { getCourseStats, downloadStudentData } from '../utils/studentDataManager';
import { validateStreak } from '../utils/streakManager';
import StreakDisplay from './StreakDisplay';
import './StatisticsPanel.css';

function StatisticsPanel({ studentData, onBack }) {
  if (!studentData || !studentData.istatistikler) {
    return (
      <div className="statistics-panel container">
        <p>Veri yükleniyor...</p>
      </div>
    );
  }

  const courseStats = studentData.dersler ? getCourseStats(studentData, 'programlama temelleri') : null;
  
  // Streak'i doğrula (eski streakler sıfırlanmalı)
  const validatedStreak = validateStreak(studentData.streak);

  const handleExportData = () => {
    downloadStudentData(studentData);
  };

  return (
    <div className="statistics-panel container fade-in">
      <div className="stats-header">
        <h1>İstatistikler</h1>
        <button className="btn btn-secondary" onClick={onBack}>
          ← Geri Dön
        </button>
      </div>

      {/* Student Info */}
      <div className="student-info card">
        <div className="student-avatar">
          {studentData.avatar ? (
            <img 
              src={`/avatars/${studentData.avatar}`} 
              alt={studentData.isim}
              className="avatar-image"
            />
          ) : (
            <span className="avatar-emoji">🎓</span>
          )}
        </div>
        <div className="student-details">
          <h2>{studentData.isim}</h2>
          <p className="student-status">{studentData.durum}</p>
        </div>
      </div>

      {/* Streak Display Section */}
      <div className="streak-section">
        <h3>🔥 Çalışma Serisi</h3>
        <StreakDisplay streak={validatedStreak} />
      </div>

      {/* Overall Statistics */}
      <div className="overall-stats">
        <h3>Genel İstatistikler</h3>
        <div className="stats-grid">
          <div className="stat-card card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <div className="stat-label">Toplam Test</div>
              <div className="stat-value">{studentData.istatistikler?.toplamTest || 0}</div>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon">⭐</div>
            <div className="stat-info">
              <div className="stat-label">Ortalama Puan</div>
              <div className="stat-value">{Number(studentData.istatistikler?.ortalamaPuan || 0).toFixed(2)}</div>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-info">
              <div className="stat-label">Toplam Süre</div>
              <div className="stat-value">{formatTime(studentData.istatistikler?.toplamSure || 0)}</div>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon">✓</div>
            <div className="stat-info">
              <div className="stat-label">Toplam Doğru</div>
              <div className="stat-value success">{studentData.istatistikler?.toplamDogru || 0}</div>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon">✗</div>
            <div className="stat-info">
              <div className="stat-label">Toplam Yanlış</div>
              <div className="stat-value error">{studentData.istatistikler?.toplamYanlis || 0}</div>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon">○</div>
            <div className="stat-info">
              <div className="stat-label">Toplam Boş</div>
              <div className="stat-value warning">{studentData.istatistikler?.toplamBos || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Statistics */}
      {courseStats && (
        <div className="course-stats">
          <h3>Programlama Temelleri</h3>
          <div className="stats-grid">
            <div className="stat-card card">
              <div className="stat-info">
                <div className="stat-label">Test Sayısı</div>
                <div className="stat-value">{courseStats.testCount}</div>
              </div>
            </div>

            <div className="stat-card card">
              <div className="stat-info">
                <div className="stat-label">Ortalama</div>
                <div className="stat-value">{courseStats.averageScore}</div>
              </div>
            </div>

            <div className="stat-card card">
              <div className="stat-info">
                <div className="stat-label">En Yüksek</div>
                <div className="stat-value success">{courseStats.highestScore}</div>
              </div>
            </div>

            <div className="stat-card card">
              <div className="stat-info">
                <div className="stat-label">En Düşük</div>
                <div className="stat-value error">{courseStats.lowestScore}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Exam */}
      {studentData.sonSinav?.tarih && (
        <div className="last-exam card">
          <h3>Son Sınav</h3>
          <div className="exam-details">
            <div className="detail-row">
              <span className="detail-label">Tarih:</span>
              <span className="detail-value">
                {studentData.sonSinav?.tarih ? new Date(studentData.sonSinav.tarih).toLocaleString('tr-TR') : '-'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Ders:</span>
              <span className="detail-value">{studentData.sonSinav?.ders || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Sınav Tipi:</span>
              <span className="detail-value">{studentData.sonSinav?.sinavTipi || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Puan:</span>
              <span className="detail-value highlight">{Number(studentData.sonSinav?.puan || 0).toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Doğru / Yanlış / Boş:</span>
              <span className="detail-value">
                <span className="success">{studentData.sonSinav?.dogru || 0}</span> / 
                <span className="error"> {studentData.sonSinav?.yanlis || 0}</span> / 
                <span className="warning"> {studentData.sonSinav?.bos || 0}</span>
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Süre:</span>
              <span className="detail-value">{formatTime(studentData.sonSinav?.sure || 0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="export-section">
        <button className="btn btn-primary" onClick={handleExportData}>
          📥 student.json İndir
        </button>
      </div>
    </div>
  );
}

export default StatisticsPanel;
