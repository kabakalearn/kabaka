import React, { useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  updateProfile 
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, User, Phone, BookOpen, AlertCircle, Sparkles } from "lucide-react";
// @ts-ignore
import logoJpg from "../../logo.jpg";

interface AuthProps {
  onAuthSuccess: (uid: string) => void;
  initialSignUp?: boolean;
  onBack?: () => void;
}

export default function Auth({ onAuthSuccess, initialSignUp = false, onBack }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(initialSignUp);
  
  // Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  
  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple validation
  const validate = () => {
    if (isSignUp) {
      if (!name.trim()) return "Full Name is required.";
      if (!parentEmail.trim() || !/\S+@\S+\.\S+/.test(parentEmail)) return "Please enter a valid parent email.";
      if (!parentPhone.trim() || parentPhone.length < 6) return "Please enter a valid parent phone number.";
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return "Please enter a valid student email.";
    if (!password || password.length < 6) return "Password must be at least 6 characters.";
    return null;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        // Register standard Email/Password User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update user display name
        await updateProfile(user, { displayName: name });

        // Initialize Firestore student profile
        const profileRef = doc(db, "student_profiles", user.uid);
        const initialProfile = {
          id: user.uid,
          name: name.trim(),
          parent_email: parentEmail.trim(),
          parent_phone: parentPhone.trim(),
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner_id: user.uid
        };
        await setDoc(profileRef, initialProfile);
        
        onAuthSuccess(user.uid);
      } else {
        // Sign In
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess(userCredential.user.uid);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === "auth/operation-not-allowed") {
        setError("Email/Password account creation is direct but not yet enabled in Firebase Console. Please enable 'Email/Password' in your Firebase Auth tab, or use standard 'Sign In with Google' below for instantaneous access.");
      } else {
        setError(err.message || "Authentication failed. Please verify credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSocial = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if profile document already exists
      const profileRef = doc(db, "student_profiles", user.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        const initialProfile = {
          id: user.uid,
          name: user.displayName || "Scholar",
          parent_email: "",
          parent_phone: "",
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          owner_id: user.uid
        };
        await setDoc(profileRef, initialProfile);
      }
      onAuthSuccess(user.uid);
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setError(err.message || "Google Sign-in failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="auth-container" className="flex min-h-[85vh] items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-brand-border bg-brand-card p-8 shadow-card"
      >
        {onBack && (
          <button 
            type="button" 
            onClick={onBack}
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-brand-text-secondary hover:text-brand-primary transition-colors cursor-pointer"
            id="back-to-landing-btn"
          >
            ← Back to Home
          </button>
        )}
        <div className="flex flex-col items-center text-center">
          {/* Logo element resembling mascot smiling */}
          <div className="relative mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#33D6FF]/10 text-brand-primary">
            <img src={logoJpg} alt="Mascot Logo" className="h-8 w-8 rounded-full object-cover animate-pulse" referrerPolicy="no-referrer" />
            <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-brand-success" />
          </div>
          
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-brand-text-primary">
            KABAKA
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#00E5FF] font-semibold mt-1">
            King of Learning Systems
          </p>
          <p className="mt-2 text-sm text-brand-text-secondary">
            {isSignUp ? "Begin your elite structured learning trial" : "Welcome back to your study routine"}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-6 flex gap-3 rounded-lg bg-brand-accent-pink/5 border border-brand-accent-pink/20 p-3.5 text-xs text-brand-accent-pink"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Notification Helper</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleEmailAuth} className="mt-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {isSignUp && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block mb-1">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-text-secondary">
                      <User className="h-4 w-4" />
                    </span>
                    <input 
                      type="text" 
                      placeholder="e.g. Frederick the Great" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-brand-border bg-brand-bg pl-10 pr-3 py-3 text-sm text-brand-text-primary focus:border-brand-primary focus:outline-none transition-colors"
                      id="name-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block mb-1">Parent Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-text-secondary">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input 
                      type="email" 
                      placeholder="parent@example.com" 
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      className="w-full rounded-xl border border-brand-border bg-brand-bg pl-10 pr-3 py-3 text-sm text-brand-text-primary focus:border-brand-primary focus:outline-none transition-colors"
                      id="parent-email-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block mb-1">Parent Phone Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-text-secondary">
                      <Phone className="h-4 w-4" />
                    </span>
                    <input 
                      type="tel" 
                      placeholder="+256 701 000000" 
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      className="w-full rounded-xl border border-brand-border bg-brand-bg pl-10 pr-3 py-3 text-sm text-brand-text-primary focus:border-brand-primary focus:outline-none transition-colors"
                      id="parent-phone-input"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-text-secondary">
                <Mail className="h-4 w-4" />
              </span>
              <input 
                type="email" 
                placeholder="student@learning.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-brand-border bg-brand-bg pl-10 pr-3 py-3 text-sm text-brand-text-primary focus:border-brand-primary focus:outline-none transition-colors"
                id="email-input"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block mb-1">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-text-secondary">
                <Lock className="h-4 w-4" />
              </span>
              <input 
                type="password" 
                placeholder="••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-brand-border bg-brand-bg pl-10 pr-3 py-3 text-sm text-brand-text-primary focus:border-brand-primary focus:outline-none transition-colors"
                id="password-input"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full rounded-xl bg-brand-primary py-3.5 text-sm font-semibold text-brand-text-primary hover:bg-[#2bc4ec] active:scale-[0.98] transition-all cursor-pointer shadow-soft text-center"
            id="auth-submit-btn"
          >
            {isLoading ? "Communicating with KABAKA DB..." : (isSignUp ? "Initialize Learning System" : "Continue Learning")}
          </button>
        </form>

        <div className="relative flex py-4 items-center justify-center">
          <div className="flex-grow border-t border-brand-border"></div>
          <span className="flex-shrink mx-4 text-[10px] uppercase tracking-widest text-brand-text-secondary font-bold">or use cloud system auth</span>
          <div className="flex-grow border-t border-brand-border"></div>
        </div>

        {/* Google Authentication backup ensures 100% real authentication immediately even if Email Auth isn't enabled on custom console */}
        <button 
          onClick={handleGoogleSocial}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-brand-border bg-brand-card py-3 px-4 hover:bg-brand-bg active:scale-[0.98] transition-all text-sm font-medium text-brand-text-primary cursor-pointer shadow-soft"
          id="google-auth-btn"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Quick Sign In with Google
        </button>

        <p className="mt-6 text-center text-xs text-brand-text-secondary">
          {isSignUp ? "Already initiated?" : "New study trial?"}{" "}
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-semibold text-brand-primary hover:underline cursor-pointer"
            id="toggle-auth-mode-btn"
          >
            {isSignUp ? "Login" : "Sign Up"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
