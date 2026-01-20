import { formatTime } from '../utils/scoreCalculator';
import './ResultsScreen.css';

function ResultsScreen({ results, onBackToSelector, onViewStats }) {
  return (
    <div className="results-screen container fade-in">
      <div className="results-header">
        <h1>Test Tamamlandı! {results.performance.emoji}</h1>
        <p className="performance-level" style={{ color: results.performance.color }}>
          {results.performance.level}
        </p>
      </div>

      {/* Score Summary */}
      <div className="score-summary">
        <div className="score-card card main-score">
          <div className="score-label">Net Puan</div>
          <div className="score-value large">{results.net}</div>
        </div>

        <div className="score-card card">
          <div className="score-label">Toplam Puan</div>
          <div className="score-value">{results.score}</div>
        </div>

        <div className="score-card card">
          <div className="score-label">Yüzde</div>
          <div className="score-value">{results.percentage}%</div>
        </div>

        <div className="score-card card">
          <div className="score-label">Süre</div>
          <div className="score-value">{formatTime(results.timeSpent)}</div>
        </div>
      </div>

      {/* Answer Breakdown */}
      <div className="answer-breakdown card">
        <h3>Cevap Dağılımı</h3>
        <div className="breakdown-grid">
          <div className="breakdown-item success">
            <div className="breakdown-icon">✓</div>
            <div className="breakdown-info">
              <div className="breakdown-label">Doğru</div>
              <div className="breakdown-value">{results.correct}</div>
            </div>
          </div>

          <div className="breakdown-item error">
            <div className="breakdown-icon">✗</div>
            <div className="breakdown-info">
              <div className="breakdown-label">Yanlış</div>
              <div className="breakdown-value">{results.wrong}</div>
            </div>
          </div>

          <div className="breakdown-item warning">
            <div className="breakdown-icon">○</div>
            <div className="breakdown-info">
              <div className="breakdown-label">Boş</div>
              <div className="breakdown-value">{results.skipped}</div>
            </div>
          </div>

          <div className="breakdown-item info">
            <div className="breakdown-icon">Σ</div>
            <div className="breakdown-info">
              <div className="breakdown-label">Toplam</div>
              <div className="breakdown-value">{results.total}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wrong Questions */}
      {results.wrongQuestions.length > 0 && (
        <div className="wrong-questions card">
          <h3>Yanlış Yapılan Sorular ({results.wrongQuestions.length})</h3>
          <div className="wrong-list">
            {results.wrongQuestions.map((wq, index) => (
              <div key={index} className="wrong-item">
                <div className="wrong-header">
                  <span className="wrong-number">Soru #{wq.questionNumber}</span>
                </div>
                <div className="wrong-question">{wq.question}</div>
                <div className="wrong-answers">
                  <div className="answer-row incorrect">
                    <span className="answer-label">Senin Cevabın:</span>
                    <span className="answer-value">{wq.userAnswer}</span>
                  </div>
                  <div className="answer-row correct">
                    <span className="answer-label">Doğru Cevap:</span>
                    <span className="answer-value">{wq.correctAnswer}</span>
                  </div>
                </div>
                {wq.explanation && (
                  <div className="wrong-explanation">
                    <strong>Açıklama:</strong> {wq.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="results-actions">
        <button className="btn btn-primary" onClick={onBackToSelector}>
          🏠 Ana Sayfaya Dön
        </button>
        <button className="btn btn-secondary" onClick={onViewStats}>
          📊 İstatistikleri Gör
        </button>
      </div>
    </div>
  );
}

export default ResultsScreen;
