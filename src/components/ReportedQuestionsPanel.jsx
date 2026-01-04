import { useState, useEffect } from 'react';
import './ReportedQuestionsPanel.css';

const API_BASE = 'http://localhost:3501';

function ReportedQuestionsPanel({ onBack }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Edit modal state
  const [editingReport, setEditingReport] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(false);

  // Load reported questions on mount
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/reported-questions`);
      if (!response.ok) throw new Error('Failed to load reports');
      const data = await response.json();
      setReports(data);
      setError(null);
    } catch (err) {
      setError('Hatalı sorular yüklenirken bir hata oluştu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index) => {
    try {
      const response = await fetch(`${API_BASE}/api/reported-questions/${index}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete report');
      
      // Reload reports after deletion
      await loadReports();
      setDeleteConfirm(null);
    } catch (err) {
      setError('Silme işlemi başarısız oldu.');
      console.error(err);
    }
  };

  // Fetch question data for editing
  const handleEdit = async (report, index) => {
    try {
      setEditLoading(true);
      setEditingReport({ ...report, index });
      setEditError(null);
      setEditSuccess(false);
      
      const response = await fetch(
        `${API_BASE}/api/question-data?filePath=${encodeURIComponent(report.fullPath)}&questionNumber=${report.questionNumber}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch question data');
      
      const questionData = await response.json();
      setEditingData(JSON.stringify(questionData, null, 2));
    } catch (err) {
      setEditError('Soru verisi yüklenirken bir hata oluştu.');
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  // Save edited question and remove from reports
  const handleSaveEdit = async () => {
    try {
      setEditLoading(true);
      setEditError(null);
      
      // Parse the edited JSON
      let parsedData;
      try {
        parsedData = JSON.parse(editingData);
      } catch {
        setEditError('Geçersiz JSON formatı. Lütfen düzeltiniz.');
        setEditLoading(false);
        return;
      }
      
      // Update the question in the exam file
      const updateResponse = await fetch(`${API_BASE}/api/question-data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: editingReport.fullPath,
          questionNumber: editingReport.questionNumber,
          questionData: parsedData
        })
      });
      
      if (!updateResponse.ok) throw new Error('Failed to update question');
      
      // Remove from reported questions
      const deleteResponse = await fetch(
        `${API_BASE}/api/reported-questions/${editingReport.index}`,
        { method: 'DELETE' }
      );
      
      if (!deleteResponse.ok) throw new Error('Failed to remove from reports');
      
      setEditSuccess(true);
      
      // After a short delay, close the modal and reload
      setTimeout(() => {
        setEditingReport(null);
        setEditingData(null);
        setEditSuccess(false);
        loadReports();
      }, 1500);
      
    } catch (err) {
      setEditError('Kaydetme işlemi başarısız oldu.');
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingReport(null);
    setEditingData(null);
    setEditError(null);
    setEditSuccess(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR', {
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
            <div key={index} className="report-card card">
              <div className="report-header">
                <span className="report-number">#{index + 1}</span>
                <span className="report-date">{formatDate(report.reportedAt)}</span>
              </div>
              
              <div className="report-content">
                <div className="question-text">
                  <strong>Soru:</strong>
                  <p>{report.questionText}</p>
                </div>
                
                <div className="report-meta">
                  <div className="meta-item">
                    <span className="meta-label">📚 Ders:</span>
                    <span className="meta-value">{report.courseName}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">📄 Sınav:</span>
                    <span className="meta-value">{report.examFile}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">📍 Soru No:</span>
                    <span className="meta-value">{report.questionNumber}</span>
                  </div>
                  <div className="meta-item file-path">
                    <span className="meta-label">📂 Dosya:</span>
                    <code>{report.fullPath}</code>
                  </div>
                </div>
              </div>

              <div className="report-actions">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => handleEdit(report, index)}
                >
                  ✏️ Düzenle
                </button>
                
                {deleteConfirm === index ? (
                  <div className="confirm-delete">
                    <span>Sorunu düzelttiniz mi?</span>
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={() => handleDelete(index)}
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
                    onClick={() => setDeleteConfirm(index)}
                  >
                    🗑️ Düzeltildi olarak işaretle
                  </button>
                )}
              </div>
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
        <div className="edit-modal-overlay" onClick={closeEditModal}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h2>📝 Soru Düzenleme</h2>
              <button className="close-btn" onClick={closeEditModal}>✕</button>
            </div>
            
            <div className="edit-modal-info">
              <span>📚 {editingReport.courseName}</span>
              <span>📄 {editingReport.examFile}</span>
              <span>📍 Soru No: {editingReport.questionNumber}</span>
            </div>
            
            {editLoading && !editingData && (
              <div className="edit-loading">
                <div className="spinner"></div>
                <p>Soru verisi yükleniyor...</p>
              </div>
            )}
            
            {editError && (
              <div className="edit-error">
                ⚠️ {editError}
              </div>
            )}
            
            {editSuccess && (
              <div className="edit-success">
                ✅ Soru başarıyla güncellendi ve listeden kaldırıldı!
              </div>
            )}
            
            {editingData && !editSuccess && (
              <>
                <div className="edit-modal-body">
                  <textarea
                    className="json-editor"
                    value={editingData}
                    onChange={(e) => setEditingData(e.target.value)}
                    spellCheck="false"
                  />
                </div>
                
                <div className="edit-modal-footer">
                  <button 
                    className="btn btn-secondary"
                    onClick={closeEditModal}
                    disabled={editLoading}
                  >
                    İptal
                  </button>
                  <button 
                    className="btn btn-success"
                    onClick={handleSaveEdit}
                    disabled={editLoading}
                  >
                    {editLoading ? 'Kaydediliyor...' : '💾 Kaydet ve Listeden Kaldır'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportedQuestionsPanel;

