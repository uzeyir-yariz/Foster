import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/config';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default student profile template
  const createDefaultProfile = (user, sourceId = null) => ({
    uid: user.uid,
    email: user.email,
    role: 'student',
    selectedSourceId: sourceId,
    sourceSelectionDate: sourceId ? serverTimestamp() : null,
    createdAt: serverTimestamp(),
    profile: {
      isim: user.displayName || user.email.split('@')[0],
      avatarUrl: user.photoURL || '/avatars/avatar1.png',
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
    }
  });

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user document exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create new user profile
        const newProfile = createDefaultProfile(user);
        await setDoc(userDocRef, newProfile);
        
        // Send email verification
        if (!user.emailVerified) {
          await sendEmailVerification(user);
          alert('Kayıt başarılı! Lütfen email adresinizi doğrulayın. Doğrulama maili gönderildi.');
        }
      } else if (!user.emailVerified) {
        // If user exists but email not verified
        alert('Lütfen email adresinizi doğrulayın. Tekrar doğrulama maili göndermek için çıkış yapıp tekrar giriş yapın.');
      }

      return user;
    } catch (err) {
      console.error('Sign in error:', err);
      
      // Handle specific errors
      if (err.code === 'auth/account-exists-with-different-credential') {
        setError('Bu email adresi farklı bir giriş yöntemiyle zaten kayıtlı.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup engellendi. Lütfen tarayıcınızın popup engelleyicisini kapatın.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Giriş penceresi kapatıldı.');
      } else {
        setError('Giriş yapılırken bir hata oluştu: ' + err.message);
      }
      
      throw err;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserProfile(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Çıkış yapılırken bir hata oluştu.');
    }
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    try {
      if (currentUser && !currentUser.emailVerified) {
        await sendEmailVerification(currentUser);
        alert('Doğrulama maili tekrar gönderildi. Lütfen email kutunuzu kontrol edin.');
      }
    } catch (err) {
      console.error('Resend verification error:', err);
      setError('Email gönderilirken bir hata oluştu.');
    }
  };

  // Select exam source for user
  const selectSource = async (source) => {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        selectedSourceId: source.id,
        sourceSelectionDate: serverTimestamp()
      }, { merge: true });
      
      // Reload profile
      await loadUserProfile(currentUser);
    } catch (err) {
      console.error('Error selecting source:', err);
      setError('Kaynak seçimi yapılırken bir hata oluştu.');
    }
  };

  // Clear source selection (for change)
  const clearSourceSelection = async () => {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        selectedSourceId: null,
        sourceSelectionDate: null
      }, { merge: true });
      
      // Reload profile
      await loadUserProfile(currentUser);
    } catch (err) {
      console.error('Error clearing source:', err);
      setError('Kaynak temizlenirken bir hata oluştu.');
    }
  };

  // Load user profile from Firestore
  const loadUserProfile = async (user) => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  // Auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await loadUserProfile(user);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    signInWithGoogle,
    signOut,
    resendVerificationEmail,
    selectSource,
    clearSourceSelection,
    hasSelectedSource: !!userProfile?.selectedSourceId,
    isEmailVerified: currentUser?.emailVerified || false,
    isAdmin: userProfile?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
