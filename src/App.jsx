import { useState, useEffect } from 'react';
import ExamSelector from './components/ExamSelector';
import QuizScreen from './components/QuizScreen';
import ResultsScreen from './components/ResultsScreen';
import StatisticsPanel from './components/StatisticsPanel';
import ReportedQuestionsPanel from './components/ReportedQuestionsPanel';
import StudentSettingsModal from './components/StudentSettingsModal';
import { loadStudentData } from './utils/studentDataManager';

function App() {
  const [currentScreen, setCurrentScreen] = useState('selector'); // selector, quiz, results, stats, reports
  const [selectedExams, setSelectedExams] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizResults, setQuizResults] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Load student data on mount
  useEffect(() => {
    const loadData = async () => {
      const data = await loadStudentData();
      setStudentData(data);
    };
    loadData();
  }, []);

  const handleStartQuiz = (exams, questions) => {
    setSelectedExams(exams);
    setQuizQuestions(questions);
    setCurrentScreen('quiz');
  };

  const handleQuizComplete = (results) => {
    setQuizResults(results);
    setCurrentScreen('results');
  };

  const handleNewQuiz = () => {
    setSelectedExams([]);
    setQuizQuestions([]);
    setQuizResults(null);
    setCurrentScreen('selector');
  };

  const handleViewStats = () => {
    setCurrentScreen('stats');
  };

  const handleViewReports = () => {
    setCurrentScreen('reports');
  };

  const handleBackToSelector = () => {
    setCurrentScreen('selector');
  };

  const handleDataUpdate = (newData) => {
    setStudentData(newData);
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  return (
    <div className="App">
      {currentScreen === 'selector' && (
        <ExamSelector 
          onStartQuiz={handleStartQuiz} 
          onViewStats={handleViewStats} 
          onViewReports={handleViewReports}
          onSettings={handleOpenSettings}
          studentData={studentData}
        />
      )}

      {currentScreen === 'quiz' && (
        <QuizScreen
          questions={quizQuestions}
          selectedExams={selectedExams}
          onComplete={handleQuizComplete}
        />
      )}

      {currentScreen === 'results' && (
        <ResultsScreen
          results={quizResults}
          studentData={studentData}
          onNewQuiz={handleNewQuiz}
          onViewStats={handleViewStats}
          onDataUpdate={handleDataUpdate}
        />
      )}

      {currentScreen === 'stats' && (
        <StatisticsPanel
          studentData={studentData}
          onBack={handleBackToSelector}
        />
      )}

      {currentScreen === 'reports' && (
        <ReportedQuestionsPanel
          onBack={handleBackToSelector}
        />
      )}

      {showSettings && (
        <StudentSettingsModal
          studentData={studentData}
          onClose={handleCloseSettings}
          onUpdate={handleDataUpdate}
        />
      )}
    </div>
  );
}

export default App;
