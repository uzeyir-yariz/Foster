import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { randomizeQuestions } from '../utils/questionRandomizer';
import { validateStreak } from '../utils/streakManager';
import StreakDisplay from './StreakDisplay';
import NotificationBell from './NotificationBell';
import NotificationsModal from './NotificationsModal';
import './ExamSelector.css';

function ExamSelector({ onStartQuiz, onViewStats, onViewReportedQuestions, onViewAdminPanel, onSettings, studentData }) {
  const { signOut, userProfile, isAdmin } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [allExams, setAllExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  
  const [selectedCourses, setSelectedCourses] = useState(new Set());
  const [selectedTypes, setSelectedTypes] = useState(new Set());
  const [selectedExamIds, setSelectedExamIds] = useState(new Set());
  const [filteredExams, setFilteredExams] = useState([]);
  
  const [yearRange, setYearRange] = useState({ min: 2018, max: 2026 });
  const [filterYearRange, setFilterYearRange] = useState({ min: 2018, max: 2026 });
  
  const [loading, setLoading] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [randomExamName, setRandomExamName] = useState('');

  // Handle random exam selection
  const handleRandomExam = () => {
    if (filteredExams.length === 0) return;
    
    setIsRolling(true);
    setRandomExamName('');
    
    // Simulate dice roll for 5 seconds
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * filteredExams.length);
      const randomExam = filteredExams[randomIndex];
      
      // Select only this exam
      setSelectedExamIds(new Set([randomExam.id]));
      setRandomExamName(randomExam.filename);
      setIsRolling(false);
    }, 2000);
  };

  // Load exams from Firestore
  useEffect(() => {
    if (!userProfile?.selectedSourceId) return;
    
    const loadExams = async () => {
      try {
        setLoading(true);
        
        // Query exams for the selected source
        const examsRef = collection(db, 'exams');
        const q = query(examsRef, where('sourceId', '==', userProfile.selectedSourceId));
        const snapshot = await getDocs(q);
        
        const exams = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            filename: data.examName,
            courseName: data.courseName,
            examType: data.type || 'Sınav',
            year: data.year,
            questionCount: data.questionCount || data.questions?.length || 0,
            questions: data.questions || []
          };
        });
        
        setAllExams(exams);
        
        // Extract unique courses
        const uniqueCourses = [...new Set(exams.map(e => e.courseName))].sort();
        setCourses(uniqueCourses);
        if (uniqueCourses.length > 0) {
          setSelectedCourses(new Set([uniqueCourses[0]]));
        }
        
        // Extract unique exam types
        const uniqueTypes = [...new Set(exams.map(e => e.examType))].filter(Boolean).sort();
        setExamTypes(uniqueTypes);
        
        // Extract year range
        const years = exams
          .map(e => e.year)
          .filter(y => y && y.includes('-'))
          .map(y => parseInt(y.split('-')[0]));
        
        if (years.length > 0) {
          const min = Math.min(...years);
          const max = Math.max(...years) + 1; // End year
          setYearRange({ min, max });
          setFilterYearRange({ min, max });
        }
        
      } catch (error) {
        console.error('Error loading exams:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadExams();
  }, [userProfile?.selectedSourceId]);

  // Apply filters
  useEffect(() => {
    let filtered = allExams;
    
    // Filter by selected courses
    if (selectedCourses.size > 0) {
      filtered = filtered.filter(e => selectedCourses.has(e.courseName));
    }
    
    // Filter by selected types
    if (selectedTypes.size > 0) {
      filtered = filtered.filter(e => selectedTypes.has(e.examType));
    }
    
    // Filter by year range
    filtered = filtered.filter(e => {
      if (!e.year || !e.year.includes('-')) return true;
      const startYear = parseInt(e.year.split('-')[0]);
      return startYear >= filterYearRange.min && startYear <= filterYearRange.max;
    });
    
    setFilteredExams(filtered);
  }, [allExams, selectedCourses, selectedTypes, filterYearRange]);

  const handleCourseToggle = (course) => {
    const newCourses = new Set(selectedCourses);
    if (newCourses.has(course)) {
      newCourses.delete(course);
    } else {
      newCourses.add(course);
    }
    setSelectedCourses(newCourses);
  };

  const handleTypeToggle = (type) => {
    const newTypes = new Set(selectedTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setSelectedTypes(newTypes);
  };

  const handleExamToggle = (examId) => {
    const newSelected = new Set(selectedExamIds);
    if (newSelected.has(examId)) {
      newSelected.delete(examId);
    } else {
      newSelected.add(examId);
    }
    setSelectedExamIds(newSelected);
  };

  const handleSelectAll = () => {
    const allIds = new Set(filteredExams.map(e => e.id));
    setSelectedExamIds(allIds);
  };

  const handleClearAll = () => {
    setSelectedExamIds(new Set());
  };

  const handleStartQuiz = () => {
    const selected = allExams.filter(e => selectedExamIds.has(e.id));
    const allQuestions = selected.flatMap(exam => 
      exam.questions.map(q => ({ ...q, sourcExam: exam.filename }))
    );
    const randomized = randomizeQuestions(allQuestions);
    
    onStartQuiz(selected, randomized);
  };

  const selectedCount = selectedExamIds.size;
  const totalQuestions = allExams
    .filter(e => selectedExamIds.has(e.id))
    .reduce((sum, e) => sum + e.questionCount, 0);

  if (loading) {
    return (
      <div className="exam-selector container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Sınavlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-selector container fade-in">
      <header className="selector-header">
        <div className="header-top">
          <div className="header-content">
            <h1>Foster Sınav Sistemi</h1>
            <p className="subtitle">Sınav ve Test Merkezi</p>
          </div>
          <div className="header-actions">
            <StreakDisplay streak={validateStreak(studentData?.streak)} compact />
            <NotificationBell onClick={() => setShowNotifications(true)} />
            <button
              className="btn btn-secondary"
              onClick={onViewStats}
            >
              📊 İstatistikler
            </button>
            {isAdmin && (
              <>
                <button
                  className="btn btn-warning"
                  onClick={onViewReportedQuestions}
                >
                  🚨 Hatalı Sorular
                </button>
                <button
                  className="btn btn-primary"
                  onClick={onViewAdminPanel}
                >
                  👥 Kullanıcı Yönetimi
                </button>
              </>
            )}
            <button
              className="btn btn-secondary"
              onClick={onSettings}
            >
              ⚙️ Ayarlar
            </button>
            <button
              className="btn btn-danger"
              onClick={signOut}
            >
              🚪 Çıkış
            </button>
          </div>
        </div>
        
        {userProfile?.selectedSourceId && (
          <div className="source-info-banner">
            <p>📚 Seçili Kaynak: <strong>{userProfile.selectedSourceId.includes('erzurum') ? 'Erzurum Açık Üniversitesi' : 'Öğretmen Sınavları'}</strong></p>
          </div>
        )}
      </header>

      <div className="selector-content">
        {/* Filters Section */}
        <div className="filters-section card">
          <h3>Filtreler</h3>

          {/* Random Exam Selection - Moved to Top */}
          <div className="random-exam-section">
            <button 
              className="btn btn-primary random-exam-btn" 
              onClick={handleRandomExam}
              disabled={filteredExams.length === 0 || isRolling}
            >
              {isRolling ? '🎲 Zar Atılıyor...' : '🎲 Rastgele Sınav'}
            </button>

            {/* Random Exam Rolling Animation */}
            {isRolling && (
              <div className="random-exam-rolling">
                <div className="dice-animation">🎲</div>
                <p>Zar atılıyor...</p>
              </div>
            )}

            {/* Random Exam Result */}
            {randomExamName && !isRolling && (
              <div className="random-exam-result">
                <p>✨ Seçilen Sınav: <strong>{randomExamName}</strong></p>
              </div>
            )}
          </div>

          <div className="filter-group">
            <label>Dersler</label>
            <div className="checkbox-group">
              {courses.map(course => (
                <label key={course} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedCourses.has(course)}
                    onChange={() => handleCourseToggle(course)}
                  />
                  <span>{course}</span>
                </label>
              ))}
            </div>
          </div>
          
          {examTypes.length > 0 && (
            <div className="filter-group">
              <label>Sınav Tipi</label>
              <div className="checkbox-group">
                {examTypes.map(type => (
                  <label key={type} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedTypes.has(type)}
                      onChange={() => handleTypeToggle(type)}
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="filter-group">
            <label>Yıl Aralığı: {filterYearRange.min} - {filterYearRange.max}</label>
            <div className="year-range-inputs">
              <input
                type="number"
                min={yearRange.min}
                max={yearRange.max}
                value={filterYearRange.min}
                onChange={(e) => setFilterYearRange({
                  ...filterYearRange,
                  min: parseInt(e.target.value)
                })}
              />
              <span>-</span>
              <input
                type="number"
                min={yearRange.min}
                max={yearRange.max}
                value={filterYearRange.max}
                onChange={(e) => setFilterYearRange({
                  ...filterYearRange,
                  max: parseInt(e.target.value)
                })}
              />
            </div>
          </div>

          <div className="filter-actions">
            <button className="btn btn-secondary" onClick={handleSelectAll}>
              Tümünü Seç
            </button>
            <button className="btn btn-secondary" onClick={handleClearAll}>
              Tümünü Temizle
            </button>
          </div>
        </div>

        {/* Exams List */}
        <div className="exams-section">
          <div className="exams-header">
            <h3>Sınavlar ({filteredExams.length})</h3>
            {selectedCount > 0 && (
              <p className="selection-info">
                {selectedCount} sınav seçildi • {totalQuestions} soru
              </p>
            )}
          </div>

          <div className="exams-list">
            {filteredExams.map(exam => (
              <label key={exam.id} className="exam-card card">
                <input
                  type="checkbox"
                  checked={selectedExamIds.has(exam.id)}
                  onChange={() => handleExamToggle(exam.id)}
                />
                <div className="exam-info">
                  <h4>{exam.filename}</h4>
                  <div className="exam-meta">
                    <span className="badge course">{exam.courseName}</span>
                    <span className="badge">{exam.examType}</span>
                    {exam.year && <span className="year">{exam.year}</span>}
                    <span className="question-count">{exam.questionCount} soru</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Start Button */}
      {selectedCount > 0 && (
        <div className="start-section fade-in">
          <button className="btn btn-primary btn-large" onClick={handleStartQuiz}>
            Teste Başla ({totalQuestions} Soru)
          </button>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <NotificationsModal onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
}

export default ExamSelector;
