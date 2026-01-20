import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import './StudentSettingsModal.css';

export default function StudentSettingsModal({ studentData, onClose }) {
  const { currentUser, userProfile, clearSourceSelection } = useAuth();
  const [name, setName] = useState(studentData?.isim || '');
  const [status, setStatus] = useState(studentData?.durum || '');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmSourceChange, setShowConfirmSourceChange] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!currentUser) return;
    
    try {
      setSaving(true);
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Update profile in Firestore
      await setDoc(userDocRef, {
        profile: {
          ...studentData,
          isim: name,
          durum: status
        }
      }, { merge: true });

      alert('Değişiklikler kaydedildi!');
      // Don't close, just reload page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Save error:', error);
      alert('Kaydederken hata oluştu: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!currentUser) return;
    
    try {
      setSaving(true);
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Reset profile to default
      const defaultProfile = {
        isim: currentUser.displayName || currentUser.email.split('@')[0],
        avatarUrl: currentUser.photoURL || '/avatars/avatar1.png',
        durum: 'yeni başlangıç 🚀',
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
        dersler: {},
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

      await setDoc(userDocRef, {
        profile: defaultProfile
      }, { merge: true });

      setShowConfirmReset(false);
      alert('Verileriniz başarı ile sıfırlandı!');
      window.location.reload();
    } catch (error) {
      console.error('Reset error:', error);
      alert('Sıfırlarken hata oluştu: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSourceChange = async () => {
    try {
      await clearSourceSelection();
      setShowConfirmSourceChange(false);
      onClose();
    } catch (error) {
      console.error('Source change error:', error);
      alert('Kaynak değiştirilirken hata oluştu!');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Ayarlar</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="setting-group">
            <label>Öğrenci İsmi</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="İsminizi girin"
            />
          </div>

          <div className="setting-group">
            <label>Durum Mesajı</label>
            <input
              type="text"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="Durum mesajınız"
            />
          </div>

          <div className="setting-group">
            <label>Seçili Sınav Kaynağı</label>
            <div className="source-display">
              <p className="current-source">
                {userProfile?.selectedSourceId?.includes('erzurum')
                  ? '🏛️ Erzurum Açık Üniversitesi Sınavları' 
                  : '👨‍🏫 Öğretmen Sınavları'}
              </p>
              <button 
                className="btn btn-warning" 
                onClick={() => setShowConfirmSourceChange(true)}
              >
                Kaynağı Değiştir
              </button>
            </div>
            <p className="warning-text">
              ⚠️ Kaynağı değiştirdiğinizde kaynak seçim ekranına döneceksiniz
            </p>
          </div>

          <div className="danger-zone">
            <h3>Tehlikeli Alan</h3>
            <p>Tüm ilerlemenizi silemek için verileri sıfırlayabilirsiniz.</p>
            <button
              className="btn btn-danger"
              onClick={() => setShowConfirmReset(true)}
              disabled={saving}
            >
              🗑️ Tüm Verileri Sıfırla
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            İptal
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>

        {/* Reset Confirmation Modal */}
        {showConfirmReset && (
          <div className="confirmation-overlay">
            <div className="confirmation-dialog">
              <h3>⚠️ Emin misiniz?</h3>
              <p>Tüm istatistikleriniz, sınavlarınız ve ilerlemeniz silinecek!</p>
              <div className="confirmation-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowConfirmReset(false)}
                  disabled={saving}
                >
                  İptal
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={handleReset}
                  disabled={saving}
                >
                  {saving ? 'Sıfırlanıyor...' : 'Evet, Sıfırla'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Source Change Confirmation */}
        {showConfirmSourceChange && (
          <div className="confirmation-overlay">
            <div className="confirmation-dialog">
              <h3>🔄 Kaynak Değiştir</h3>
              <p>Kaynağınızı değiştirmek istediğinize emin misiniz? Kaynak seçim ekranına geri döneceksiniz.</p>
              <div className="confirmation-actions">
                <button  
                  className="btn btn-secondary" 
                  onClick={() => setShowConfirmSourceChange(false)}
                >
                  İptal
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSourceChange}
                >
                  Evet, Değiştir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
