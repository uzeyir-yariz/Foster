import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import SourceSelector from './components/SourceSelector';
import ExamSelector from './components/ExamSelector';
import QuizScreen from './components/QuizScreen';
import ResultsScreen from './components/ResultsScreen';
import StatisticsPanel from './components/StatisticsPanel';
import ReportedQuestionsPanel from './components/ReportedQuestionsPanel';
import AdminPanel from './components/AdminPanel';
import StudentSettingsModal from './components/StudentSettingsModal';

function MainApp() {
  const { currentUser, isEmailVerified, hasSelectedSource, selectSource, userProfile, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('selector'); // 'selector', 'quiz', 'results', 'stats', 'reports', 'admin'
  const [selectedExams, setSelectedExams] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizResults, setQuizResults] = useState(null);
  const [showSettings, setShowSettings] = useState(false);


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

  // Show loading while checking auth
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '1.5rem',
        color: '#667eea'
      }}>
        🚀 Yükleniyor...
      </div>
    );
  }

  // Show login if not authenticated or email not verified
  if (!currentUser || !isEmailVerified) {
    return <Login />;
  }

  // Show source selector if user hasn't selected a source yet
  if (!hasSelectedSource) {
    return <SourceSelector onSourceSelected={selectSource} />;
  }

  return (
    <div className="App">
      {currentScreen === 'selector' && (
        <ExamSelector 
          onStartQuiz={handleStartQuiz} 
          onViewStats={handleViewStats}
          onViewReportedQuestions={() => setCurrentScreen('reports')}
          onViewAdminPanel={() => setCurrentScreen('admin')}
          onSettings={() => setShowSettings(true)}
          studentData={userProfile?.profile}
        />
      )}

      {currentScreen === 'quiz' && (
        <QuizScreen
          questions={quizQuestions}
          selectedExams={selectedExams}
          onComplete={handleQuizComplete}
          studentData={userProfile?.profile}
        />
      )}

      {currentScreen === 'results' && (
        <ResultsScreen
          results={quizResults}
          onBackToSelector={() => setCurrentScreen('selector')}
          onViewStats={() => setCurrentScreen('stats')}
        />
      )}

      {currentScreen === 'stats' && (
        <StatisticsPanel
          studentData={userProfile?.profile}
          onBack={() => setCurrentScreen('selector')}
        />
      )}

      {currentScreen === 'reports' && (
        <ReportedQuestionsPanel
          onBack={() => setCurrentScreen('selector')}
        />
      )}

      {currentScreen === 'admin' && (
        <AdminPanel
          onBack={() => setCurrentScreen('selector')}
        />
      )}

      {showSettings && (
        <StudentSettingsModal
          studentData={userProfile?.profile}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
