import { useState } from 'react';
import './StudentSettingsModal.css';

function StudentSettingsModal({ studentData, onClose, onUpdate }) {
  const [name, setName] = useState(studentData?.isim || '');
  const [selectedAvatar, setSelectedAvatar] = useState(studentData?.avatar || 'avatar1.png');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const avatars = [
    'avatar1.png',
    'avatar2.png',
    'avatar3.png',
    'avatar4.png',
    'avatar5.png',
    'avatar6.png'
  ];

  const handleSaveName = async () => {
    if (!name.trim()) {
      alert('İsim boş olamaz!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3501/api/student/name', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      const result = await response.json();
      
      if (result.success) {
        onUpdate(result.data);
        alert('İsim başarıyla güncellendi! ✨');
        onClose();
      } else {
        alert('İsim güncellenirken hata oluştu!');
      }
    } catch (error) {
      console.error('Error updating name:', error);
      alert('İsim güncellenirken hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAvatar = async () => {
    setLoading(true);
    try {
      // Read current data and update only avatar
      const response = await fetch('http://localhost:3501/api/student');
      const currentData = await response.json();
      
      currentData.avatar = selectedAvatar;
      
      const updateResponse = await fetch('http://localhost:3501/api/student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentData),
      });

      const result = await updateResponse.json();
      
      if (result.success) {
        onUpdate(currentData);
        alert('Profil fotoğrafı güncellendi! 🎨');
        onClose();
      } else {
        alert('Profil fotoğrafı güncellenirken hata oluştu!');
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      alert('Profil fotoğrafı güncellenirken hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3501/api/student/reset', {
        method: 'POST',
      });

      const result = await response.json();
      
      if (result.success) {
        onUpdate(result.data);
        setShowResetConfirm(false);
        alert('Öğrenci verileri sıfırlandı! 🔄');
        onClose();
      } else {
        alert('Veriler sıfırlanırken hata oluştu!');
      }
    } catch (error) {
      console.error('Error resetting data:', error);
      alert('Veriler sıfırlanırken hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Öğrenci Ayarları</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Avatar Selection Section */}
          <div className="settings-section">
            <label className="settings-label">
              <span className="label-icon">📸</span>
              Profil Fotoğrafı
            </label>
            
            {/* Custom Upload */}
            <div className="custom-upload-section">
              <label className="upload-label">
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setLoading(true);
                      try {
                        const formData = new FormData();
                        formData.append('avatar', file);
                        
                        const response = await fetch('http://localhost:3501/api/upload-avatar', {
                          method: 'POST',
                          body: formData,
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                          setSelectedAvatar(result.avatar);
                          onUpdate(result.data);
                          alert('Kendi fotoğrafın yüklendi! 🎉');
                          onClose(); // Close modal after successful upload
                        } else {
                          alert('Dosya yüklenirken hata oluştu!');
                        }
                      } catch (error) {
                        console.error('Error uploading file:', error);
                        alert('Dosya yüklenirken hata oluştu!');
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                />
                <div className="upload-button">
                  <span className="upload-icon">📤</span>
                  <span>Kendi Fotoğrafını Yükle</span>
                  <span className="upload-hint">(JPEG, PNG, GIF - Max 5MB)</span>
                </div>
              </label>
            </div>

            <div className="divider">
              <span>veya hazır avatarlardan seç</span>
            </div>

            <div className="avatar-grid">
              {avatars.map((avatar) => (
                <div
                  key={avatar}
                  className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  <img src={`/avatars/${avatar}`} alt={avatar} />
                  {selectedAvatar === avatar && <div className="check-mark">✓</div>}
                </div>
              ))}
            </div>
            <button 
              className="btn btn-primary btn-save"
              onClick={handleSaveAvatar}
              disabled={loading || selectedAvatar === studentData?.avatar}
            >
              🎨 Profil Fotoğrafını Kaydet
            </button>
          </div>

          {/* Name Change Section */}
          <div className="settings-section">
            <label className="settings-label">
              <span className="label-icon">👤</span>
              Öğrenci İsmi
            </label>
            <input
              type="text"
              className="settings-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="İsminizi girin"
              disabled={loading}
            />
            <button 
              className="btn btn-primary btn-save"
              onClick={handleSaveName}
              disabled={loading || !name.trim() || name === studentData?.isim}
            >
              💾 İsmi Kaydet
            </button>
          </div>

          {/* Reset Section */}
          <div className="settings-section danger-section">
            <label className="settings-label danger">
              <span className="label-icon">⚠️</span>
              Tehlikeli Bölge
            </label>
            <p className="warning-text">
              Tüm istatistikleriniz, test geçmişiniz ve yanlış sorularınız silinecektir. 
              Bu işlem geri alınamaz!
            </p>
            
            {!showResetConfirm ? (
              <button 
                className="btn btn-danger"
                onClick={() => setShowResetConfirm(true)}
                disabled={loading}
              >
                🗑️ Öğrenciyi Sıfırla
              </button>
            ) : (
              <div className="confirm-reset">
                <p className="confirm-text">Emin misiniz? Bu işlem geri alınamaz!</p>
                <div className="confirm-actions">
                  <button 
                    className="btn btn-danger btn-confirm"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    {loading ? '⏳ Sıfırlanıyor...' : '✓ Evet, Sıfırla'}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowResetConfirm(false)}
                    disabled={loading}
                  >
                    ✗ Vazgeç
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentSettingsModal;
