import { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import './ReportedQuestionsPanel.css';

function ReportedQuestionsPanel({ onBack }) {
  const { userProfile, isAdmin } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState('');
  const [editedOptions, setEditedOptions] = useState([]);
  const [editedCorrectAnswer, setEditedCorrectAnswer] = useState(0);
  const [editedExplanation, setEditedExplanation] = useState('');

  // Load reported questions from Firestore
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const reportsRef = collection(db, 'reports');
      const q = query(reportsRef, orderBy('reportedAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setReports(reportsData);
      setError(null);
    } catch (err) {
      setError('Hatalı sorular yüklenirken bir hata oluştu: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (report) => {
    if (!isAdmin) {
      alert('Sadece adminler soru düzenleyebilir!');
      return;
    }
    
    setEditingReport(report);
    setEditedQuestion(report.question || '');
    setEditedOptions(report.options || ['', '', '', '']);
    setEditedCorrectAnswer(report.correctAnswer || 0);
    setEditedExplanation(report.explanation || '');
  };

  const handleSaveEdit = async () => {
    if (!isAdmin || !editingReport) return;

    try {
      const reportRef = doc(db, 'reports', editingReport.id);
      
      await updateDoc(reportRef, {
        question: editedQuestion,
        options: editedOptions,
        correctAnswer: editedCorrectAnswer,
        explanation: editedExplanation,
        status: 'resolved'
      });

      alert('Soru başarıyla güncellendi!');
      setEditingReport(null);
      loadReports();
    } catch (error) {
      console.error('Update error:', error);
      alert('Güncellerken hata oluştu: ' + error.message);
    }
  };

  const handleDelete = async (reportId) => {
    if (!isAdmin) {
      alert('Sadece adminler rapor silebilir!');
      return;
    }

    try {
      const reportRef = doc(db, 'reports', reportId);
      await deleteDoc(reportRef);
      
      await loadReports();
      setDeleteConfirm(null);
      alert('Rapor başarıyla silindi!');
    } catch (err) {
      setError('Silme işlemi başarısız oldu.');
      console.error(err);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Bilinmiyor';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="reported-questions-panel container fade-in">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reported-questions-panel container fade-in">
      <div className="panel-header">
        <div className="header-content">
          <h1>🚨 Hatalı Sorular</h1>
          <p className="subtitle">{reports.length} adet bildirilen soru</p>
        </div>
        <button className="btn btn-secondary" onClick={onBack}>
          ← Geri Dön
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">✨</div>
          <h3>Tebrikler!</h3>
          <p>Henüz bildirilen hatalı soru bulunmuyor.</p>
        </div>
      ) : (
        <div className="reports-list">
          {reports.map((report, index) => (
            <div key={report.id} className="report-card card">
              <div className="report-header">
                <span className="report-number">#{index + 1}</span>
                <span className="report-date">{formatDate(report.reportedAt)}</span>
              </div>
              
              <div className="report-content">
                <div className="question-text">
                  <strong>Soru:</strong>
                  <p>{report.question}</p>
                </div>
                
                {report.options && report.options.length > 0 && (
                  <div className="question-options">
                    <strong>Seçenekler:</strong>
                    <ul>
                      {report.options.map((option, idx) => (
                        <li key={idx} className={idx === report.correctAnswer ? 'correct-option' : ''}>
                          {String.fromCharCode(65 + idx)}) {option}
                          {idx === report.correctAnswer && <span className="correct-badge"> ✓ Doğru</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.explanation && (
                  <div className="question-explanation">
                    <strong>Açıklama:</strong>
                    <p>{report.explanation}</p>
                  </div>
                )}
                
                <div className="report-meta">
                  <div className="meta-item">
                    <span className="meta-label">📄 Sınav:</span>
                    <span className="meta-value">{report.sourceExam || 'Bilinmiyor'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">📍 Soru No:</span>
                    <span className="meta-value">{report.questionNumber}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">👤 Bildiren:</span>
                    <span className="meta-value">{report.reportedByName || 'Anonim'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">📊 Durum:</span>
                    <span className={`status-badge ${report.status || 'pending'}`}>
                      {report.status === 'pending' ? 'Beklemede' : report.status === 'resolved' ? 'Çözüldü' : 'Bilinmiyor'}
                    </span>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="report-actions">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleEdit(report)}
                  >
                    ✏️ Düzenle
                  </button>
                  
                  {deleteConfirm === report.id ? (
                    <div className="confirm-delete">
                      <span>Sorunu düzelttiniz mi?</span>
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => handleDelete(report.id)}
                      >
                        ✓ Evet, Sil
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        İptal
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => setDeleteConfirm(report.id)}
                    >
                      🗑️ Düzeltildi olarak işaretle
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="panel-footer">
        <button className="btn btn-secondary" onClick={loadReports}>
          🔄 Yenile
        </button>
      </div>

      {/* Edit Modal */}
      {editingReport && (
        <div className="modal-overlay" onClick={() => setEditingReport(null)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Soru Düzenle</h2>
              <button className="btn-close" onClick={() => setEditingReport(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Soru Metni:</label>
                <textarea
                  value={editedQuestion}
                  onChange={(e) => setEditedQuestion(e.target.value)}
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Seçenekler:</label>
                {editedOptions.map((option, idx) => (
                  <div key={idx} className="option-input">
                    <span>{String.fromCharCode(65 + idx)})</span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...editedOptions];
                        newOptions[idx] = e.target.value;
                        setEditedOptions(newOptions);
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label>Doğru Cevap:</label>
                <select 
                  value={editedCorrectAnswer} 
                  onChange={(e) => setEditedCorrectAnswer(parseInt(e.target.value))}
                >
                  {editedOptions.map((_, idx) => (
                    <option key={idx} value={idx}>
                      {String.fromCharCode(65 + idx)}) {editedOptions[idx]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Açıklama (opsiyonel):</label>
                <textarea
                  value={editedExplanation}
                  onChange={(e) => setEditedExplanation(e.target.value)}
                  rows="3"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditingReport(null)}>
                İptal
              </button>
              <button className="btn btn-success" onClick={handleSaveEdit}>
                💾 Kaydet ve Çözüldü İşaretle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportedQuestionsPanel;
