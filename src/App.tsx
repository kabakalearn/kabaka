import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import Auth from "./components/Auth";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import LandingPage from "./components/LandingPage";
import { Crown, Sparkles, BookOpen } from "lucide-react";
// @ts-ignore
import logoJpg from "../logo.jpg";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authSignUpDefault, setAuthSignUpDefault] = useState(false);

  useEffect(() => {
    // Standard Firebase Auth State Changed subscription
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await verifyOnboardingStatus(user.uid);
      } else {
        setIsOnboardingCompleted(null);
        setIsAuthChecking(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const verifyOnboardingStatus = async (uid: string) => {
    setIsAuthChecking(true);
    try {
      const profileRef = doc(db, "student_profiles", uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const data = profileSnap.data();
        setIsOnboardingCompleted(!!data.onboarding_completed);
      } else {
        setIsOnboardingCompleted(false);
      }
    } catch (err) {
      console.error("Error reading database onboarding flag on lifecycle:", err);
      // Fallback sandbox transition in case database permissions are still deploying
      setIsOnboardingCompleted(false);
    } finally {
      setIsAuthChecking(false);
    }
  };

  const handleAuthSuccess = async (uid: string) => {
    await verifyOnboardingStatus(uid);
  };

  const handleOnboardingCompleted = async () => {
    setIsOnboardingCompleted(true);
  };

  const handleLogout = async () => {
    setIsAuthChecking(true);
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsOnboardingCompleted(null);
    } catch (err) {
      console.error("Logout failure:", err);
    } finally {
      setIsAuthChecking(false);
    }
  };

  if (isAuthChecking) {
    return (
      <div id="full-page-loading" className="flex min-h-screen flex-col items-center justify-center bg-brand-bg text-brand-text-primary">
        <div className="flex flex-col items-center">
          <div className="relative h-16 w-16 mb-4 flex items-center justify-center rounded-full bg-[#33D6FF]/10 text-brand-primary">
            <img src={logoJpg} alt="Mascot Logo" className="h-8 w-8 rounded-full object-cover animate-bounce" referrerPolicy="no-referrer" />
            <Sparkles className="absolute top-0 right-0 h-4 w-4 text-brand-success" />
          </div>
          <h2 className="font-display font-extrabold text-lg text-brand-text-primary">KABAKA</h2>
          <p className="text-[10px] text-brand-text-secondary uppercase tracking-widest mt-1 animate-pulse font-medium">Verifying sovereign credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary selection:bg-brand-primary/20 flex flex-col justify-between">
      {/* Dynamic Navigation panel for general pages */}
      <header className="border-b border-brand-border bg-brand-card/85 backdrop-blur-md px-6 py-4.5 sticky top-0 z-30 shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoJpg} alt="Mascot Logo" className="h-5 w-5 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
            <span className="font-display font-extrabold text-lg text-brand-text-primary tracking-tight">KABAKA</span>
          </div>
          
          <div className="flex items-center gap-5 text-xs font-semibold text-brand-text-secondary">
            {currentUser ? (
              <div className="flex items-center gap-1.5 font-mono text-[10px] bg-brand-bg border border-brand-border px-3 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-success" />
                <span>Scholar: {currentUser.displayName || currentUser.email}</span>
              </div>
            ) : !showAuth ? (
              <button 
                onClick={() => { setAuthSignUpDefault(false); setShowAuth(true); }}
                className="px-4 py-1.5 bg-brand-primary text-brand-text-primary text-xs font-bold rounded-lg shadow-soft hover:bg-[#2bc4ec] transition-colors active:scale-[0.98] cursor-pointer"
              >
                Sign In
              </button>
            ) : (
              <button 
                onClick={() => setShowAuth(false)}
                className="text-brand-primary hover:underline cursor-pointer font-bold"
              >
                ← Back to Home
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main router controller view */}
      <main className="flex-grow flex flex-col justify-center">
        {!currentUser ? (
          showAuth ? (
            <Auth 
              onAuthSuccess={handleAuthSuccess} 
              initialSignUp={authSignUpDefault} 
              onBack={() => setShowAuth(false)} 
            />
          ) : (
            <LandingPage 
              onStartAuth={(signUpMode) => { 
                setAuthSignUpDefault(signUpMode); 
                setShowAuth(true); 
              }} 
            />
          )
        ) : isOnboardingCompleted === false ? (
          <Onboarding 
            userId={currentUser.uid} 
            userName={currentUser.displayName || "Noble Student"} 
            onOnboardingComplete={handleOnboardingCompleted} 
          />
        ) : (
          <Dashboard userId={currentUser.currentUser?.uid || currentUser.uid} onLogout={handleLogout} />
        )}
      </main>

      {/* Footer System Credits */}
      <footer className="border-t border-brand-border py-4 bg-brand-card/50 text-center text-[10px] text-brand-text-secondary uppercase tracking-widest shrink-0 font-medium">
        © 2026 KABAKA INTELLECTUAL PLATFORM • COGNITIVE REVOLUTION
      </footer>
    </div>
  );
}
