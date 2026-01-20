import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { calculateResults, formatTime } from '../utils/scoreCalculator';
import { getOptionLetter } from '../utils/questionRandomizer';
import { updateStreak } from '../utils/streakManager';
import './QuizScreen.css';

function QuizScreen({ questions, selectedExams, onComplete }) {
  const { currentUser, userProfile } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [timeSpent, setTimeSpent] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showTimer, setShowTimer] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleOptionSelect = (optionIndex) => {
    setSelectedOption(optionIndex);
    
    // Auto-advance with small delay
    setTimeout(() => {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = optionIndex;
      setAnswers(newAnswers);

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOption(answers[currentQuestionIndex + 1]);
      } else {
        completeQuiz(newAnswers);
      }
    }, 200);
  };

  const handleNext = () => {
    if (selectedOption !== null) {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = selectedOption;
      setAnswers(newAnswers);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(answers[currentQuestionIndex + 1]);
    } else {
      completeQuiz();
    }
  };

  const handleSkip = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(answers[currentQuestionIndex + 1]);
    } else {
      // On last question, just save as null but don't auto-complete
      // User must click "Bitir" button to finish
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = null;
      setAnswers(newAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedOption(answers[currentQuestionIndex - 1]);
    }
  };

  const handleReport = async () => {
    if (!currentUser) {
      alert('Soru bildirmek için giriş yapmalısınız!');
      return;
    }

    try {
      const reportsRef = collection(db, 'reports');
      
      // Build report data, excluding undefined fields
      const reportData = {
        questionNumber: currentQuestion['soru numarası'] || currentQuestion.displayOrder,
        question: currentQuestion['soru cümlesi'],
        options: currentQuestion.seçenekler || [],
        correctAnswer: currentQuestion['doğru cevap'],
        sourceExam: currentQuestion.sourceExam || selectedExams[0]?.filename || 'Bilinmiyor',
        reportedBy: currentUser.uid,
        reportedByName: userProfile?.profile?.isim || currentUser.displayName || currentUser.email,
        reportedAt: serverTimestamp(),
        status: 'pending'
      };

      // Only add explanation if it exists
      if (currentQuestion['doğru cevap açıklaması']) {
        reportData.explanation = currentQuestion['doğru cevap açıklaması'];
      }

      await addDoc(reportsRef, reportData);

      alert('Soru başarıyla bildirildi! Teşekkürler.');
    } catch (error) {
      console.error('Report error:', error);
      alert('Soru bildirirken hata oluştu: ' + error.message);
    }
  };

  const handleFinishEarly = () => {
    // Save current selection if any
    if (selectedOption !== null) {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = selectedOption;
      setAnswers(newAnswers);
    }
    
    setShowFinishConfirm(false);
    completeQuiz();
  };

  const completeQuiz = async (finalAnswers = answers) => {
    let calculatedAnswers = [...finalAnswers];
    
    if (finalAnswers === answers && selectedOption !== null && currentQuestionIndex < questions.length) {
       calculatedAnswers[currentQuestionIndex] = selectedOption;
    }

    const results = calculateResults(calculatedAnswers, questions);
    
    const examTypes = [...new Set(selectedExams.map(e => e.examType))].join(', ');
    
    // Save to Firestore if user is logged in
    if (currentUser && userProfile) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        // Update streak - only increases if today hasn't been counted yet
        const updatedStreak = updateStreak(userProfile.profile || {});
        
        // Prepare updated statistics
        const currentStats = userProfile.profile?.istatistikler || {
          toplamTest: 0,
          toplamSure: 0,
          toplamDogru: 0,
          toplamYanlis: 0,
          toplamBos: 0,
          ortalamaPuan: 0
        };

        const newStats = {
          toplamTest: currentStats.toplamTest + 1,
          toplamSure: currentStats.toplamSure + timeSpent,
          toplamDogru: currentStats.toplamDogru + results.correct,
          toplamYanlis: currentStats.toplamYanlis + results.wrong,
          toplamBos: currentStats.toplamBos + results.skipped,
          ortalamaPuan: ((currentStats.ortalamaPuan * currentStats.toplamTest) + results.percentage) / (currentStats.toplamTest + 1)
        };

        // Save to Firestore
        await setDoc(userDocRef, {
          profile: {
            ...userProfile.profile,
            streak: updatedStreak,
            istatistikler: newStats,
            sonSinav: {
              tarih: new Date().toISOString(),
              sinavlar: selectedExams.map(e => e.filename).join(', '),
              puan: results.net,
              dogru: results.correct,
              yanlis: results.wrong,
              bos: results.skipped,
              sure: timeSpent
            }
          }
        }, { merge: true });

      } catch (error) {
        console.error('Error saving quiz results:', error);
        // Continue even if save fails
      }
    }
    
    onComplete({
      ...results,
      timeSpent,
      examTypes,
      examCount: selectedExams.length
    });
  };

  const answeredCount = answers.filter(a => a !== null).length;

  return (
    <div className="quiz-screen container fade-in">
      {/* Finish Quiz Button - Top Right */}
      <button 
        className="btn-finish-quiz"
        onClick={() => setShowFinishConfirm(true)}
        title="Sınavı Bitir"
      >
        ⏹️ Bitir
      </button>

      {/* Header */}
      <div className="quiz-header">
        <div className="quiz-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="progress-text">
            Soru {currentQuestionIndex + 1} / {questions.length}
          </p>
        </div>
        
        <div className="quiz-stats">
          <div className="stat" onClick={() => setShowTimer(!showTimer)} style={{ cursor: 'pointer', userSelect: 'none' }} title="Süreyi Göster/Gizle">
            <span className="stat-label">Süre {!showTimer && '(Gizli)'}:</span>
            <span className="stat-value" style={{ display: showTimer ? 'inline' : 'none' }}>{formatTime(timeSpent)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Cevaplanmış:</span>
            <span className="stat-value">{answeredCount} / {questions.length}</span>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="question-container">
        <div className="question-card card slide-in">
          <div className="question-number-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="question-number" style={{ marginBottom: 0 }}>
              Soru #{currentQuestion.displayOrder || currentQuestion['soru numarası']}
            </div>
            <button 
              className="btn-report" 
              onClick={handleReport}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
              title="Hatalı Soru Bildir"
            >
              ⚠️ Hata Bildir
            </button>
          </div>
          
          <div className="question-text">
            {currentQuestion['soru cümlesi']}
          </div>

          <div className="options-container">
            {currentQuestion.seçenekler.map((option, index) => (
              <button
                key={index}
                className={`option-btn ${selectedOption === index ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(index)}
              >
                <span className="option-letter">{getOptionLetter(index)}</span>
                <span className="option-text">{option.replace(/^[A-Z][\)\.]?\s*/, '')}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="quiz-navigation">
        <button
          className="btn btn-secondary"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          ← Önceki
        </button>

        <button
          className="btn btn-secondary"
          onClick={handleSkip}
        >
          Boş Geç
        </button>

        <button
          className="btn btn-primary"
          onClick={handleNext}
        >
          {currentQuestionIndex === questions.length - 1 ? 'Bitir' : 'Sonraki →'}
        </button>
      </div>

      {/* Question Navigator */}
      <div className="question-navigator card">
        <h4>Sorular</h4>
        <div className="navigator-grid">
          {questions.map((_, index) => (
            <button
              key={index}
              className={`nav-btn ${currentQuestionIndex === index ? 'current' : ''} ${answers[index] !== null ? 'answered' : ''}`}
              onClick={() => {
                if (selectedOption !== null) {
                    const newAnswers = [...answers];
                    newAnswers[currentQuestionIndex] = selectedOption;
                    setAnswers(newAnswers);
                }
                setCurrentQuestionIndex(index);
                setSelectedOption(answers[index]);
              }}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Finish Quiz Confirmation Modal */}
      {showFinishConfirm && (
        <div className="modal-overlay" onClick={() => setShowFinishConfirm(false)}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <h3>⏹️ Sınavı Bitir</h3>
            <p>Sınavı şimdi bitirmek istediğinize emin misiniz?</p>
            <p className="warning-text">
              ⚠️ Cevaplanmamış sorular boş olarak işaretlenecek.
            </p>
            <div className="modal-stats">
              <div className="stat-item">
                <span className="stat-label">Toplam Soru:</span>
                <span className="stat-value">{questions.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Cevaplanmış:</span>
                <span className="stat-value success">{answeredCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Boş:</span>
                <span className="stat-value warning">{questions.length - answeredCount}</span>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowFinishConfirm(false)}
              >
                İptal
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleFinishEarly}
              >
                Evet, Bitir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizScreen;
