import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import './NotificationsModal.css';

function NotificationsModal({ onClose }) {
  const { currentUser, userProfile } = useAuth();
  const [localWarnings, setLocalWarnings] = useState([]);
  const [processing, setProcessing] = useState(false);

  // Initialize local warnings from userProfile
  useEffect(() => {
    if (userProfile?.warnings) {
      setLocalWarnings([...userProfile.warnings]);
    }
  }, [userProfile]);

  const syncToFirestore = async (updatedWarnings) => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        warnings: updatedWarnings
      });
    } catch (error) {
      console.error('Firestore sync error:', error);
      alert('Değişiklikler kaydedilemedi: ' + error.message);
      // Revert to original if failed
      if (userProfile?.warnings) {
        setLocalWarnings([...userProfile.warnings]);
      }
    }
  };

  const handleMarkAsRead = async (warningToMark) => {
    if (processing) return;

    setProcessing(true);
    
    // Update local state immediately for UI responsiveness
    const updatedWarnings = localWarnings.map(w => 
      w.issuedAt === warningToMark.issuedAt && w.message === warningToMark.message
        ? { ...w, read: true }
        : w
    );
    
    setLocalWarnings(updatedWarnings);
    
    // Sync to Firestore in background
    await syncToFirestore(updatedWarnings);
    
    setProcessing(false);
  };

  const handleMarkAllAsRead = async () => {
    if (processing) return;

    setProcessing(true);
    
    const updatedWarnings = localWarnings.map(w => ({ ...w, read: true }));
    setLocalWarnings(updatedWarnings);
    
    await syncToFirestore(updatedWarnings);
    
    setProcessing(false);
  };

  const handleDeleteWarning = async (warningToDelete) => {
    if (processing) return;
    
    if (!window.confirm('Bu uyarıyı silmek istediğinize emin misiniz?')) return;

    setProcessing(true);
    
    const updatedWarnings = localWarnings.filter(w => 
      !(w.issuedAt === warningToDelete.issuedAt && w.message === warningToDelete.message)
    );
    
    setLocalWarnings(updatedWarnings);
    
    await syncToFirestore(updatedWarnings);
    
    setProcessing(false);
  };

  const handleClearAll = async () => {
    if (processing) return;
    
    if (!window.confirm('Tüm uyarıları silmek istediğinize emin misiniz?')) return;

    setProcessing(true);
    
    setLocalWarnings([]);
    
    await syncToFirestore([]);
    
    setProcessing(false);
    onClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Bilinmiyor';
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = localWarnings.filter(w => !w.read).length;
  
  // Sort warnings by date (newest first)
  const sortedWarnings = [...localWarnings].sort((a, b) => {
    const dateA = new Date(a.issuedAt);
    const dateB = new Date(b.issuedAt);
    return dateB - dateA;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="notifications-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔔 Bildirimler</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {localWarnings.length > 0 && (
          <div className="modal-actions-top">
            {unreadCount > 0 && (
              <button 
                className="btn btn-sm btn-primary" 
                onClick={handleMarkAllAsRead}
                disabled={processing}
              >
                {processing ? 'İşleniyor...' : 'Tümünü Okundu İşaretle'}
              </button>
            )}
            <button 
              className="btn btn-sm btn-danger" 
              onClick={handleClearAll}
              disabled={processing}
            >
              {processing ? 'Siliniyor...' : 'Tümünü Sil'}
            </button>
          </div>
        )}

        <div className="modal-body">
          {localWarnings.length === 0 ? (
            <div className="empty-notifications">
              <div className="empty-icon">✨</div>
              <h3>Bildiriminiz Yok</h3>
              <p>Yeni bildirimler burada görünecek</p>
            </div>
          ) : (
            <div className="notifications-list">
              {sortedWarnings.map((warning, index) => (
                <div 
                  key={`${warning.issuedAt}-${index}`}
                  className={`notification-item ${warning.read ? 'read' : 'unread'}`}
                >
                  <div className="notification-header">
                    <span className="notification-from">
                      👤 {warning.issuedByName || 'Admin'}
                    </span>
                    <span className="notification-date">
                      {formatDate(warning.issuedAt)}
                    </span>
                  </div>

                  <div className="notification-message">
                    {warning.message}
                  </div>

                  <div className="notification-actions">
                    {!warning.read && (
                      <button 
                        className="btn-text btn-primary"
                        onClick={() => handleMarkAsRead(warning)}
                        disabled={processing}
                      >
                        ✓ Okundu İşaretle
                      </button>
                    )}
                    <button 
                      className="btn-text btn-danger"
                      onClick={() => handleDeleteWarning(warning)}
                      disabled={processing}
                    >
                      🗑️ Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsModal;
