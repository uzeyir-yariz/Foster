import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import './SourceSelector.css';

export default function SourceSelector({ onSourceSelected }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState(null);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const sourcesRef = collection(db, 'examSources');
      const snapshot = await getDocs(sourcesRef);
      
      const sourcesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(source => source.isActive);
      
      setSources(sourcesList);
    } catch (error) {
      console.error('Error loading sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedSource) {
      onSourceSelected(selectedSource);
    }
  };

  if (loading) {
    return (
      <div className="source-selector-container">
        <div className="source-selector-card">
          <div className="loading">
            <div className="spinner"></div>
            <p>Sınav kaynakları yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="source-selector-container">
      <div className="source-selector-card">
        <div className="source-header">
          <h1>🎓 Sınav Kaynağı Seçimi</h1>
          <p>Hangi sınav sisteminden sorular çözmek istersiniz?</p>
        </div>

        <div className="source-grid">
          {sources.map(source => (
            <div 
              key={source.id}
              className={`source-option ${selectedSource?.id === source.id ? 'selected' : ''}`}
              onClick={() => setSelectedSource(source)}
            >
              <div className="source-icon">
                {source.id.includes('universite') ? '🏛️' : '👨‍🏫'}
              </div>
              <h3>{source.displayName}</h3>
              <p className="source-description">{source.description || 'Sınav sorular sistemi'}</p>
              {selectedSource?.id === source.id && (
                <div className="check-mark">✓</div>
              )}
            </div>
          ))}
        </div>

        {selectedSource && (
          <div className="warning-box">
            <p>⚠️ <strong>Önemli:</strong> Kaynak seçiminiz sonrası sadece bu kaynağa ait sınavlara erişebileceksiniz. Kaynağı değiştirmek için ayarlardan değişiklik yapabilirsiniz.</p>
          </div>
        )}

        <button 
          className="confirm-button"
          onClick={handleConfirm}
          disabled={!selectedSource}
        >
          {selectedSource ? 'Seçimi Onayla ve Devam Et' : 'Lütfen bir kaynak seçin'}
        </button>
      </div>
    </div>
  );
}
