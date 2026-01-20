import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import './AdminPanel.css';

function AdminPanel({ onBack }) {
  const { userProfile, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [warningUser, setWarningUser] = useState(null);
  const [warningMessage, setWarningMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('email'));
      const snapshot = await getDocs(q);
      
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsers(usersData);
      setError(null);
    } catch (err) {
      setError('Kullanıcılar yüklenirken hata oluştu: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!isAdmin) return;
    
    // Prevent admin from downgrading themselves
    if (userId === userProfile?.uid && newRole !== 'admin') {
      alert('Kendi admin yetkilerinizi kaldıramazsınız!');
      return;
    }

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole
      });
      
      await loadUsers();
      alert('Rol başarıyla güncellendi!');
    } catch (error) {
      console.error('Role update error:', error);
      alert('Rol güncellenirken hata oluştu: ' + error.message);
    }
  };

  const handleBanToggle = async (userId, currentStatus) => {
    if (!isAdmin) return;
    
    if (userId === userProfile?.uid) {
      alert('Kendinizi banlayamazsınız!');
      return;
    }

    const newStatus = currentStatus === 'banned' ? 'active' : 'banned';

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: newStatus
      });
      
      await loadUsers();
      alert(newStatus === 'banned' ? 'Kullanıcı banlandı!' : 'Ban kaldırıldı!');
    } catch (error) {
      console.error('Ban toggle error:', error);
      alert('İşlem sırasında hata oluştu: ' + error.message);
    }
  };

  const handleSendWarning = async () => {
    if (!warningUser || !warningMessage.trim()) return;

    try {
      const userRef = doc(db, 'users', warningUser.id);
      const currentWarnings = warningUser.warnings || [];
      
      await updateDoc(userRef, {
        warnings: [...currentWarnings, {
          message: warningMessage,
          issuedBy: userProfile.uid,
          issuedByName: userProfile.profile?.isim || userProfile.email || 'Admin',
          issuedAt: new Date().toISOString(),
          read: false
        }]
      });
      
      setWarningUser(null);
      setWarningMessage('');
      await loadUsers();
      alert('Uyarı gönderildi!');
    } catch (error) {
      console.error('Warning error:', error);
      alert('Uyarı gönderilirken hata oluştu: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!isAdmin) return;
    
    if (userId === userProfile?.uid) {
      alert('Kendi hesabınızı silemezsiniz!');
      return;
    }

    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      
      setDeleteConfirm(null);
      await loadUsers();
      alert('Kullanıcı silindi!');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Kullanıcı silinirken hata oluştu: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Hiç';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || (user.status || 'active') === filterStatus;
    const matchesSearch = !searchTerm || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile?.isim?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRole && matchesStatus && matchesSearch;
  });

  if (!isAdmin) {
    return (
      <div className="admin-panel container">
        <div className="access-denied">
          <h2>⛔ Erişim Reddedildi</h2>
          <p>Bu sayfaya erişim yetkiniz yok.</p>
          <button className="btn btn-primary" onClick={onBack}>← Geri Dön</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-panel container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Kullanıcılar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel container fade-in">
      <div className="panel-header">
        <div className="header-content">
          <h1>👥 Kullanıcı Yönetimi</h1>
          <p className="subtitle">{filteredUsers.length} / {users.length} kullanıcı</p>
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

      {/* Filters */}
      <div className="filters card">
        <div className="filter-group">
          <label>Ara:</label>
          <input
            type="text"
            placeholder="İsim veya email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Rol:</label>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">Tümü</option>
            <option value="student">Öğrenci</option>
            <option value="teacher">Öğretmen</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Durum:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tümü</option>
            <option value="active">Aktif</option>
            <option value="banned">Banlı</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={loadUsers}>
          🔄 Yenile
        </button>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Kullanıcı</th>
              <th>Rol</th>
              <th>Durum</th>
              <th>Streak</th>
              <th>Son Sınav</th>
              <th>Toplam Test</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className={user.status === 'banned' ? 'banned-row' : ''}>
                <td>
                  <div className="user-info">
                    <div className="user-name">{user.profile?.isim || 'İsimsiz'}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </td>
                <td>
                  <select
                    value={user.role || 'student'}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="role-select"
                    disabled={user.id === userProfile?.uid}
                  >
                    <option value="student">Öğrenci</option>
                    <option value="teacher">Öğretmen</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <span className={`status-badge ${user.status || 'active'}`}>
                    {user.status === 'banned' ? 'Banlı' : 'Aktif'}
                  </span>
                </td>
                <td>
                  <div className="streak-info">
                    <div>🔥 {user.profile?.streak?.currentStreak || 0}</div>
                    <div className="streak-max">Max: {user.profile?.streak?.longestStreak || 0}</div>
                  </div>
                </td>
                <td>
                  <div className="last-exam">
                    <div>{formatDate(user.profile?.sonSinav?.tarih)}</div>
                    {user.profile?.sonSinav?.puan !== undefined && (
                      <div className="exam-score">Puan: {user.profile.sonSinav.puan}</div>
                    )}
                  </div>
                </td>
                <td>{user.profile?.istatistikler?.toplamTest || 0}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className={`btn-icon ${user.status === 'banned' ? 'btn-success' : 'btn-warning'}`}
                      onClick={() => handleBanToggle(user.id, user.status)}
                      disabled={user.id === userProfile?.uid}
                      title={user.status === 'banned' ? 'Banı Kaldır' : 'Banla'}
                    >
                      {user.status === 'banned' ? '✓' : '🚫'}
                    </button>
                    <button
                      className="btn-icon btn-info"
                      onClick={() => setWarningUser(user)}
                      title="Uyarı Gönder"
                    >
                      ⚠️
                    </button>
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => setDeleteConfirm(user)}
                      disabled={user.id === userProfile?.uid}
                      title="Sil"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <p>Hiç kullanıcı bulunamadı</p>
          </div>
        )}
      </div>

      {/* Warning Modal */}
      {warningUser && (
        <div className="modal-overlay" onClick={() => setWarningUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Uyarı Gönder</h2>
              <button className="btn-close" onClick={() => setWarningUser(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p><strong>Kullanıcı:</strong> {warningUser.profile?.isim} ({warningUser.email})</p>
              <div className="form-group">
                <label>Uyarı Mesajı:</label>
                <textarea
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  placeholder="Uyarı mesajınızı yazın..."
                  rows="4"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setWarningUser(null)}>
                İptal
              </button>
              <button 
                className="btn btn-warning" 
                onClick={handleSendWarning}
                disabled={!warningMessage.trim()}
              >
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🗑️ Kullanıcıyı Sil</h2>
              <button className="btn-close" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="warning-text">
                ⚠️ <strong>{deleteConfirm.profile?.isim}</strong> kullanıcısını silmek istediğinize emin misiniz?
              </p>
              <p>Bu işlem geri alınamaz!</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                İptal
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => handleDeleteUser(deleteConfirm.id)}
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
