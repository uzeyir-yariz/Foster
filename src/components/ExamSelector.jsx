import { useState, useEffect } from 'react';
import { loadAllExams, getExamTypes, getYearRange, filterExams, combineExams, getCourses } from '../utils/examLoader';
import { randomizeQuestions } from '../utils/questionRandomizer';
import StreakDisplay from './StreakDisplay';
import './ExamSelector.css';

function ExamSelector({ onStartQuiz, onViewStats, onViewReports, onSettings, studentData }) {
  const [allExams, setAllExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [selectedExamIds, setSelectedExamIds] = useState(new Set());
  
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState(new Set());

  const [examTypes, setExamTypes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState(new Set());
  
  const [yearRange, setYearRange] = useState({ min: 2018, max: 2025 });
  const [filterYearRange, setFilterYearRange] = useState({ min: 2018, max: 2025 });

  // Load exams on mount
  useEffect(() => {
    try {
      const exams = loadAllExams();
      setAllExams(exams);
      
      // Extract unique courses and default select only the first one
      const uniqueCourses = getCourses(exams);
      setCourses(uniqueCourses);
      if (uniqueCourses.length > 0) {
        setSelectedCourses(new Set([uniqueCourses[0]]));
      }
      
      // Use filtered exams (all initially) for metadata extraction to populate other filters relevantly
      // But initially we want global types
      const types = getExamTypes(exams);
      setExamTypes(types);
      
      const range = getYearRange(exams);
      setYearRange(range);
      setFilterYearRange(range);
    } catch (error) {
      console.error('Error loading exams:', error);
    }
  }, []);

  // Apply filters when selection changes
  useEffect(() => {
    const filtered = filterExams(allExams, {
      courses: selectedCourses.size > 0 ? Array.from(selectedCourses) : null,
      examTypes: selectedTypes.size > 0 ? Array.from(selectedTypes) : null,
      yearRange: filterYearRange
    });
    setFilteredExams(filtered);
  }, [selectedCourses, selectedTypes, filterYearRange, allExams]);

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
    const questions = combineExams(selected);
    const randomized = randomizeQuestions(questions);
    
    onStartQuiz(selected, randomized);
  };

  const selectedCount = selectedExamIds.size;
  const totalQuestions = allExams
    .filter(e => selectedExamIds.has(e.id))
    .reduce((sum, e) => sum + e.questionCount, 0);

  return (
    <div className="exam-selector container fade-in">
      <header className="selector-header">
        <div className="header-content">
          <h1>Foster Sınav Sistemi</h1>
          <p className="subtitle">Sınav ve Test Merkezi</p>
        </div>
        <div className="header-actions">
          <StreakDisplay streak={studentData?.streak} compact />
          <button className="btn btn-secondary" onClick={onSettings}>
            ⚙️ Ayarlar
          </button>
          <button className="btn btn-reports" onClick={onViewReports}>
            🚨 Hatalı Sorular
          </button>
          <button className="btn btn-stats" onClick={onViewStats}>
            📊 İstatistiklerim
          </button>
        </div>
      </header>

      <div className="selector-content">
        {/* Filters Section */}
        <div className="filters-section card">
          <h3>Filtreler</h3>

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
    </div>
  );
}

export default ExamSelector;
