import { useState, useEffect } from 'react';
import { calculateResults, formatTime } from '../utils/scoreCalculator';
import { getOptionLetter } from '../utils/questionRandomizer';
import './QuizScreen.css';

function QuizScreen({ questions, selectedExams, onComplete }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [timeSpent, setTimeSpent] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showTimer, setShowTimer] = useState(false); // Default hidden as per request "süreyi kapatmada olsun"

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
    
    // Auto-advance with small delay for visual feedback
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
      // Quiz complete
      completeQuiz();
    }
  };

  const handleSkip = () => {
    // Explicitly leaving it blank (null)
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(answers[currentQuestionIndex + 1]);
    } else {
      completeQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedOption(answers[currentQuestionIndex - 1]);
    }
  };

  const handleReport = async () => {
    try {
      const response = await fetch('http://localhost:3501/api/report-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: currentQuestionIndex,
          questionText: currentQuestion['soru cümlesi'],
          examFile: currentQuestion.sourceExam,
          courseName: currentQuestion.courseName,
          fullPath: currentQuestion.fullPath,
          questionNumber: currentQuestion['soru numarası'] || currentQuestion.displayOrder
        }),
      });

      if (response.ok) {
        alert('Soru hatalı olarak bildirildi.');
      } else {
        alert('Bildirim sırasında bir hata oluştu.');
      }
    } catch (error) {
      console.error('Error reporting question:', error);
      alert('Bildirim gönderilemedi.');
    }
  };

  const completeQuiz = (finalAnswers = answers) => {
    // If called without arguments (e.g. from Skip/Next), use current state, 
    // but also check if we need to save the current selection
    let calculatedAnswers = [...finalAnswers];
    
    // If usage is from handleNext/handleSkip where state hasn't updated yet?
    // Actually handleOptionSelect passes the *updated* array.
    // handleNext does setAnswers then calls completeQuiz? 
    // No, handleNext logic above calls setAnswers then checks index.
    // If it's the last question, it calls completeQuiz().
    // setAnswers is async, so `answers` might be stale.
    // Ideally we should pass the new answers to completeQuiz everywhere.
    
    if (finalAnswers === answers && selectedOption !== null && currentQuestionIndex < questions.length) {
       // Only apply this logic if we are using the STALE state answers
       // If selectedOption is set, meaning we are on the last question completing it manually
       calculatedAnswers[currentQuestionIndex] = selectedOption;
    }

    const results = calculateResults(calculatedAnswers, questions);
    
    // Get exam types
    const examTypes = [...new Set(selectedExams.map(e => e.examType))].join(', ');
    
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
              Soru #{currentQuestion.displayOrder}
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
                <span className="option-text">{option.replace(/^[A-Z][\)\.]\s*/, '')}</span>
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
                // If we are navigating via grid, we should probably save current selection too?
                // Standard behavior: yes, save if selected.
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
    </div>
  );
}

export default QuizScreen;
