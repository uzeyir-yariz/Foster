import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const { signInWithGoogle, currentUser, isEmailVerified, resendVerificationEmail, error } = useAuth();
  const [showVerificationWarning, setShowVerificationWarning] = useState(false);

  useEffect(() => {
    if (currentUser && !isEmailVerified) {
      setShowVerificationWarning(true);
    } else {
      setShowVerificationWarning(false);
    }
  }, [currentUser, isEmailVerified]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      // Error is already handled in AuthContext
      console.error('Login error:', err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🎓 Foster Sınav Sistemi</h1>
          <p>Sınavlarına hazırlan, ilerlemeni takip et</p>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {showVerificationWarning && (
          <div className="warning-message">
            <p>⚠️ Email adresiniz henüz doğrulanmadı.</p>
            <p>Sistemi kullanmak için email adresinizi doğrulamanız gerekmektedir.</p>
            <button 
              onClick={resendVerificationEmail}
              className="resend-button"
            >
              Doğrulama Maili Tekrar Gönder
            </button>
          </div>
        )}

        <div className="login-content">
          <button 
            onClick={handleGoogleSignIn}
            className="google-signin-button"
            disabled={currentUser && !isEmailVerified}
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google ile Giriş Yap
          </button>

          <div className="login-info">
            <p className="info-text">
              ℹ️ İlk kez giriş yapıyorsanız, kayıt işleminiz otomatik olarak gerçekleştirilecektir.
            </p>
            <p className="info-text">
              📧 Kayıt sonrası email adresinize doğrulama maili gönderilecektir.
            </p>
          </div>
        </div>

        <div className="login-footer">
          <p>Foster Exam System © 2026</p>
        </div>
      </div>

      <div className="background-animation">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
    </div>
  );
}
