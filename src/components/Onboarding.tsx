import React, { useState, useEffect } from "react";
import { doc, setDoc, writeBatch, collection } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Subject, Task, StudentProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronRight, 
  BookOpen, 
  Clock, 
  Target, 
  Brain, 
  Sparkles, 
  Plus, 
  Trash, 
  Check, 
  Upload, 
  FileText,
  AlertCircle
} from "lucide-react";

interface OnboardingProps {
  userId: string;
  userName: string;
  onOnboardingComplete: () => void;
}

// Preset modern color values for subjects
const SUBJECT_COLORS = [
  "#33D6FF", // Primary cyan
  "#FF5F9E", // Accent pink
  "#B7F34D", // Success lime
  "#00E5FF", // Cyan secondary
  "#A7E163", // Soft green
  "#FFAE42", // Warm amber
  "#A389F4"  // Gentle violet
];

export default function Onboarding({ userId, userName, onOnboardingComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  // STEP 2 Data: Manual simple subjects
  const [subjectInput, setSubjectInput] = useState("");
  const [subjectsList, setSubjectsList] = useState<string[]>([
    "Maths", "Physics", "English"
  ]);

  // STEP 3 Data: Study Profile
  const [preferredTime, setPreferredTime] = useState<string>("Afternoon");
  const [hoursPerDay, setHoursPerDay] = useState<number>(3);
  const [focusLevel, setFocusLevel] = useState<"low" | "medium" | "high">("medium");
  const [learningStyle, setLearningStyle] = useState<string>("Flexible sessions");

  // STEP 4 Data: AI Loading & analysis values
  const [loadingStepText, setLoadingStepText] = useState("Reading profile...");
  const [analysisResult, setAnalysisResult] = useState<{
    greeting: string;
    strategy: string[];
    suggestedTasks: { title: string; subject_name: string }[];
  } | null>(null);

  // STEP 5 Data: Subject Confirm & edit
  const [confirmedSubjects, setConfirmedSubjects] = useState<Subject[]>([]);
  
  // STEP 6 Data: Book Upload optional state
  // Track uploaded files per subject id
  const [bookUploads, setBookUploads] = useState<Record<string, { name: string; size: number; url: string }>>({});
  const [dragActiveSubject, setDragActiveSubject] = useState<string | null>(null);

  // Onboarding sequence effects
  // Step 4 controls standard AI generation trigger
  useEffect(() => {
    if (step === 4) {
      runOnboardingAnalysis();
    }
  }, [step]);

  // Handle auto-progressing logs during AI Loading screen (Step 4)
  useEffect(() => {
    if (step !== 4) return;
    const labels = [
      "Reading profile...",
      "Creating structure...",
      "Initializing learning systems...",
      "Preparing final dashboard..."
    ];
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < labels.length - 1) {
        currentIndex++;
        setLoadingStepText(labels[currentIndex]);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [step]);

  const runOnboardingAnalysis = async () => {
    setError(null);
    try {
      const response = await fetch("/api/onboarding-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName,
          preferred_study_time: preferredTime,
          hours_per_day: hoursPerDay,
          focus_level: focusLevel,
          learning_style: learningStyle,
          subjects: subjectsList
        })
      });

      if (!response.ok) {
        throw new Error("Sovereign server failed initial subject and routine composition.");
      }

      const data = await response.json();
      setAnalysisResult(data);
      
      // Auto build step 5 verified subjects with color assignments
      const subjectsWithColors = subjectsList.map((subName, index) => ({
        id: `subject-${index}-${Date.now()}`,
        owner_id: userId,
        name: subName,
        color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      setConfirmedSubjects(subjectsWithColors);

      // Brief sleep for premium loading rhythm before transiting to confirmation
      setTimeout(() => {
        setStep(5);
      }, 1800);

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Encountered issue with KABAKA core AI engine. Let's restart step 3.");
      setStep(3);
    }
  };

  // Step 2 controls: Add manual subjects
  const handleAddSubjectText = () => {
    if (subjectInput.trim() && !subjectsList.includes(subjectInput.trim())) {
      setSubjectsList([...subjectsList, subjectInput.trim()]);
      setSubjectInput("");
    }
  };

  const handleRemoveSubjectText = (indexToRemove: number) => {
    setSubjectsList(subjectsList.filter((_, idx) => idx !== indexToRemove));
  };

  // Step 5 controls: Add/Edit/Delete confirmed subjects
  const [newSubDraft, setNewSubDraft] = useState("");
  const handleAddConfirmedSubject = () => {
    if (newSubDraft.trim()) {
      const newSub: Subject = {
        id: `subject-${Date.now()}`,
        owner_id: userId,
        name: newSubDraft.trim(),
        color: SUBJECT_COLORS[confirmedSubjects.length % SUBJECT_COLORS.length],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setConfirmedSubjects([...confirmedSubjects, newSub]);
      setNewSubDraft("");
    }
  };

  const handleRemoveConfirmedSubject = (subId: string) => {
    setConfirmedSubjects(confirmedSubjects.filter(s => s.id !== subId));
  };

  // Step 6 Drag-and-drop & Click controls
  const handleDrag = (e: React.DragEvent, subjectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveSubject(subjectId);
    } else if (e.type === "dragleave") {
      setDragActiveSubject(null);
    }
  };

  const processUploadedFile = (file: File, subjectId: string) => {
    const reader = new FileReader();
    reader.onload = () => {
      setBookUploads(prev => ({
        ...prev,
        [subjectId]: {
          name: file.name,
          size: Math.round(file.size / 1024), // inside KB
          url: reader.result as string || "data:text/plain;base64,"
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent, subjectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveSubject(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0], subjectId);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, subjectId: string) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0], subjectId);
    }
  };

  // Step 7: Finalize & Create Persistent State (Write to Firestore)
  const handleFinalizeOnboarding = async () => {
    setError(null);
    try {
      const batch = writeBatch(db);

      // 1. Create or Update Core Profile with onboarding completions
      const profileRef = doc(db, "student_profiles", userId);
      const studentProfileObj: StudentProfile = {
        id: userId,
        name: userName,
        parent_email: "", // Merged or saved previously in Sign-Up
        parent_phone: "",
        onboarding_completed: true,
        preferred_study_time: preferredTime,
        hours_per_day: hoursPerDay,
        focus_level: focusLevel,
        learning_style: learningStyle,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner_id: userId
      };
      
      batch.set(profileRef, studentProfileObj);

      // 2. Save each confirmed Subject with optional uploaded book info metadata
      confirmedSubjects.forEach(subject => {
        const subDocRef = doc(db, "subjects", subject.id);
        const uploadedBook = bookUploads[subject.id];
        
        const preparedSubject: Subject = {
          ...subject,
          book_name: uploadedBook?.name || "",
          book_size: uploadedBook?.size || 0,
          book_type: "base64",
          book_url: uploadedBook?.url || "",
          updated_at: new Date().toISOString()
        };
        batch.set(subDocRef, preparedSubject);
      });

      // 3. Save Suggested AI Starter Tasks
      if (analysisResult?.suggestedTasks) {
        analysisResult.suggestedTasks.forEach((taskItem, index) => {
          // Find matching subject ID from title
          const matchedSub = confirmedSubjects.find(sub => sub.name.toLowerCase() === taskItem.subject_name.toLowerCase()) 
                            || confirmedSubjects[0];
          
          if (matchedSub) {
            const taskId = `task-${index}-${Date.now()}`;
            const taskDocRef = doc(db, "tasks", taskId);
            const taskObj: Task = {
              id: taskId,
              subject_id: matchedSub.id,
              subject_name: matchedSub.name,
              title: taskItem.title,
              status: "pending",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              owner_id: userId
            };
            batch.set(taskDocRef, taskObj);
          }
        });
      }

      // Commit Batch atomically
      await batch.commit();

      // Trigger Completion parent redirect
      onOnboardingComplete();

    } catch (err: any) {
      console.error("Batch write failure:", err);
      handleFirestoreError(err, OperationType.WRITE, "onboarding-batch-write");
      setError("Failed to initialize database entries: " + err.message);
    }
  };

  return (
    <div id="onboarding-wrapper" className="min-h-[85vh] w-full max-w-4xl mx-auto flex flex-col justify-center px-4 py-8">
      
      {/* Progress horizontal steps indicators */}
      <div className="flex items-center justify-between max-w-lg mx-auto w-full mb-10 text-xs font-semibold text-brand-text-secondary uppercase tracking-widest px-2">
        <span className={`pb-1 border-b-2 ${step >= 1 ? "border-brand-primary text-brand-text-primary" : "border-transparent"}`}>Start</span>
        <ChevronRight className="h-4 w-4 text-brand-border" />
        <span className={`pb-1 border-b-2 ${step >= 2 ? "border-brand-primary text-brand-text-primary" : "border-transparent"}`}>Subjects</span>
        <ChevronRight className="h-4 w-4 text-brand-border" />
        <span className={`pb-1 border-b-2 ${step >= 3 ? "border-brand-primary text-brand-text-primary" : "border-transparent"}`}>Strategy</span>
        <ChevronRight className="h-4 w-4 text-brand-border" />
        <span className={`pb-1 border-b-2 ${step >= 5 ? "border-brand-primary text-brand-text-primary" : "border-transparent"}`}>Confirm</span>
        <ChevronRight className="h-4 w-4 text-brand-border" />
        <span className={`pb-1 border-b-2 ${step >= 6 ? "border-brand-primary text-brand-text-primary" : "border-transparent"}`}>Syllabi</span>
      </div>

      {error && (
        <div className="bg-brand-accent-pink/10 border border-brand-accent-pink/20 rounded-xl p-4 text-sm text-brand-accent-pink mb-6 flex gap-3.5 items-start">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* STEP 1: WELCOME SCREEN */}
        {step === 1 && (
          <motion.div 
            key="step-1"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-brand-card border border-brand-border rounded-2xl p-10 md:p-14 text-center shadow-card max-w-2xl mx-auto"
          >
            <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-[#33D6FF]/10 text-brand-primary mb-6">
              <Brain className="h-10 w-10 text-[#33D6FF]" />
            </div>

            <h1 className="font-display font-extrabold text-4xl text-brand-text-primary tracking-tight">
              Welcome to your Sovereign System
            </h1>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#00E5FF] mt-2">
              KABAKA: King of Learning Systems
            </p>

            <p className="mt-6 text-brand-text-secondary text-base leading-relaxed md:px-6">
              Greetings, <span className="font-semibold text-brand-text-primary">{userName}</span>. KABAKA will build your highly personalized learning schema based on your current subjects, study preferences, and daily focus thresholds.
            </p>

            <button 
              onClick={() => setStep(2)}
              className="mt-10 px-8 py-4 bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary rounded-xl font-bold text-sm shadow-soft cursor-pointer transition-all active:scale-[0.98] inline-flex items-center gap-2"
              id="start-setup-btn"
            >
              Start Setup
              <ChevronRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* STEP 2: MANUAL SUBJECT INPUT */}
        {step === 2 && (
          <motion.div 
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-brand-card border border-brand-border rounded-2xl p-8 shadow-card max-w-xl mx-auto w-full"
          >
            <div className="flex gap-4 items-center mb-6">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-brand-text-primary">What are you studying?</h2>
                <p className="text-xs text-brand-text-secondary mt-0.5">Please specify the subject syllabus you are looking to conquer</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="e.g. Maths, Biology, History..."
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubjectText()}
                  className="flex-grow rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text-primary focus:border-brand-primary focus:outline-none"
                  id="add-subject-text-input"
                />
                <button
                  type="button"
                  onClick={handleAddSubjectText}
                  className="bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary p-3 rounded-xl transition-colors cursor-pointer"
                  id="trigger-add-sub-btn"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              {/* Dynamic subjects chips */}
              <div className="mt-6">
                <label className="text-xs font-bold text-brand-text-secondary uppercase tracking-widest block mb-3">Core Syllabae ({subjectsList.length})</label>
                {subjectsList.length === 0 ? (
                  <p className="text-xs text-brand-accent-pink italic bg-brand-accent-pink/5 rounded-xl p-4 border border-brand-accent-pink/15">Please list at least one subject to establish your KABAKA intelligence loop.</p>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {subjectsList.map((subj, idx) => (
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={idx}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-brand-border bg-brand-bg text-sm text-brand-text-primary font-semibold"
                      >
                        <span>{subj}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubjectText(idx)}
                          className="text-brand-text-secondary hover:text-brand-accent-pink transition-colors cursor-pointer"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-between border-t border-brand-border pt-6">
              <button 
                onClick={() => setStep(1)}
                className="px-5 py-3 rounded-xl border border-brand-border text-sm font-semibold text-brand-text-secondary hover:bg-brand-bg transition-colors cursor-pointer"
              >
                Back
              </button>
              <button 
                onClick={() => subjectsList.length > 0 && setStep(3)}
                disabled={subjectsList.length === 0}
                className="px-6 py-3 bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary font-semibold rounded-xl text-sm shadow-soft cursor-pointer transition-all active:scale-[0.98] inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                id="next-strategy-btn"
              >
                Study Routine
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: FOCUS PROFILE & STUDY HABITS */}
        {step === 3 && (
          <motion.div 
            key="step-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-brand-card border border-brand-border rounded-2xl p-8 shadow-card max-w-2xl mx-auto w-full"
          >
            <div className="flex gap-4 items-center mb-6">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-brand-text-primary">Establish Your Schema</h2>
                <p className="text-xs text-brand-text-secondary mt-0.5">Customise KABAKA's focus rhythms to fit your actual daily lifecycle</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Preferred Time */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider block">Preferred Study Hours</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Morning", "Afternoon", "Evening"].map((timeOption) => (
                    <button
                      key={timeOption}
                      type="button"
                      onClick={() => setPreferredTime(timeOption)}
                      className={`py-3 px-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${preferredTime === timeOption ? "border-brand-primary bg-brand-primary/5 text-brand-text-primary font-bold shadow-soft" : "border-brand-border bg-brand-card hover:bg-brand-bg text-brand-text-secondary"}`}
                    >
                      {timeOption}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hours per day slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider block">Daily Study target</label>
                  <span className="text-sm font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md">{hoursPerDay} hours</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="8"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(parseInt(e.target.value))}
                  className="w-full accent-brand-primary focus:outline-none py-2"
                />
                <div className="flex justify-between text-[10px] text-brand-text-secondary">
                  <span>Light (1h)</span>
                  <span>Moderate (4h)</span>
                  <span>Intense (8h)</span>
                </div>
              </div>

              {/* Focus level */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider block">Active Focus thresholds</label>
                <div className="grid grid-cols-3 gap-2">
                  {["low", "medium", "high"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFocusLevel(lvl as any)}
                      className={`py-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer uppercase tracking-wider text-center ${focusLevel === lvl ? "border-brand-primary bg-brand-primary/5 text-brand-text-primary font-bold shadow-soft" : "border-brand-border bg-brand-card hover:bg-brand-bg text-brand-text-secondary"}`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Learning styles */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider block">Cognitive session structure</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: "Flexible sessions", label: "Variable (Adaptive cognitive sessions)" },
                    { value: "Short sessions", label: "Micro (Promote Pomodoro 25-min interval bursts)" },
                    { value: "Long sessions", label: "Deep-Dive (Promote deep unbroken 90-min study blocks)" }
                  ].map((styleOpt) => (
                    <button
                      key={styleOpt.value}
                      type="button"
                      onClick={() => setLearningStyle(styleOpt.value)}
                      className={`p-3 text-left rounded-xl text-xs font-semibold border transition-all cursor-pointer flex justify-between items-center ${learningStyle === styleOpt.value ? "border-brand-primary bg-brand-primary/5 text-brand-text-primary font-bold shadow-soft" : "border-brand-border bg-brand-card hover:bg-brand-bg text-brand-text-secondary"}`}
                    >
                      <span>{styleOpt.label}</span>
                      {learningStyle === styleOpt.value && <Check className="h-4 w-4 text-brand-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 flex justify-between border-t border-brand-border pt-6">
              <button 
                onClick={() => setStep(2)}
                className="px-5 py-3 rounded-xl border border-brand-border text-sm font-semibold text-brand-text-secondary hover:bg-brand-bg transition-colors cursor-pointer"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(4)}
                className="px-6 py-3 bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary font-bold rounded-xl text-sm shadow-soft cursor-pointer transition-all active:scale-[0.98] inline-flex items-center gap-2"
                id="analyze-and-onboard-btn"
              >
                <Sparkles className="h-4 w-4" />
                Analyze & Design routine
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: AI INITIAL ANALYSIS SCREEN (LOADING) */}
        {step === 4 && (
          <motion.div 
            key="step-4"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-brand-card border border-brand-border rounded-2xl p-12 text-center shadow-card max-w-md mx-auto w-full"
          >
            <div className="relative mx-auto h-24 w-24 mb-6">
              {/* Double nested rotating outer borders mimicking royal alignment indicator */}
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-brand-primary animate-spin" style={{ animationDuration: '6s' }}></div>
              <div className="absolute inset-2 rounded-full border border-[#00E5FF] animate-spin" style={{ animationDuration: '3s' }}></div>
              <div className="absolute inset-4 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                <Brain className="h-8 w-8 animate-pulse text-brand-primary" />
              </div>
            </div>

            <h3 className="font-display text-2xl font-bold text-brand-text-primary">Generating KABAKA Matrix</h3>
            <p className="text-xs uppercase tracking-widest text-brand-primary font-bold mt-1">Sovereign Artificial Intelligence</p>
            
            {/* Iterative labels displaying */}
            <p id="loading-status-text" className="mt-8 text-brand-text-secondary text-sm font-mono h-6 animate-pulse">
              &gt; {loadingStepText}
            </p>

            <div className="mt-6 w-full bg-brand-bg rounded-full h-1.5 overflow-hidden">
              <motion.div 
                initial={{ width: "10%" }}
                animate={{ width: "90%" }}
                transition={{ duration: 4, ease: "easeInOut" }}
                className="bg-brand-primary h-full rounded-full"
              ></motion.div>
            </div>

            <p className="mt-4 text-[10px] text-brand-text-secondary italic">We are modeling custom curriculum tasks and scheduling metrics...</p>
          </motion.div>
        )}

        {/* STEP 5: SUBJECT CONFIRMATION & ADJUSTMENTS */}
        {step === 5 && (
          <motion.div 
            key="step-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-brand-card border border-brand-border rounded-2xl p-8 shadow-card max-w-2xl mx-auto w-full"
          >
            <div className="flex gap-4 items-center mb-6">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                <Sparkles className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-brand-text-primary">Verify Learning Syllabary</h2>
                <p className="text-xs text-brand-text-secondary mt-0.5">KABAKA AI recommended structures. Modify, add or adjust colors below</p>
              </div>
            </div>

            {analysisResult && (
              <div className="bg-brand-primary/5 hover:bg-brand-primary/10 border border-brand-primary/15 rounded-xl p-5 mb-6 text-xs text-brand-text-secondary relative transition-colors leading-relaxed">
                <Sparkles className="absolute top-4 right-4 h-5 w-5 text-brand-primary" />
                <p className="font-display text-base font-bold text-brand-text-primary mb-2">Crown Strategy Formulated</p>
                <p className="italic font-medium text-brand-text-primary">"{analysisResult.greeting}"</p>
                <div className="mt-3.5 space-y-1.5">
                  {analysisResult.strategy.map((tip, i) => (
                    <div key={i} className="flex gap-2 items-start text-xs">
                      <span className="text-brand-primary font-bold shrink-0">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Need to add another course?"
                  value={newSubDraft}
                  onChange={(e) => setNewSubDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddConfirmedSubject()}
                  className="flex-grow rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-sm text-brand-text-primary focus:border-brand-primary focus:outline-none"
                  id="add-confirmed-sub-input"
                />
                <button
                  type="button"
                  onClick={handleAddConfirmedSubject}
                  className="bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary px-5 py-3 rounded-xl transition-colors font-medium text-xs flex items-center gap-1 cursor-pointer"
                  id="add-confirmed-sub-btn"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>

              {/* Editable Subjects grid layout */}
              <div className="mt-4">
                <label className="text-xs font-bold text-brand-text-secondary uppercase tracking-widest block mb-3">Your Final Subjects</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {confirmedSubjects.map((sub) => (
                    <div 
                      key={sub.id}
                      className="flex items-center justify-between border border-brand-border rounded-xl p-3.5 bg-brand-bg shadow-soft hover:border-brand-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-4 w-4 rounded-full border border-brand-border shadow-inner" 
                          style={{ backgroundColor: sub.color }}
                        />
                        <span className="text-sm font-semibold text-brand-text-primary">{sub.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveConfirmedSubject(sub.id)}
                        className="p-1 px-2 border border-brand-border rounded-lg bg-brand-card hover:bg-brand-accent-pink/5 hover:border-brand-accent-pink/20 text-brand-text-secondary hover:text-brand-accent-pink transition-all text-xs cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 flex justify-between border-t border-brand-border pt-6">
              <button 
                onClick={() => setStep(3)}
                className="px-5 py-3 rounded-xl border border-brand-border text-sm font-semibold text-brand-text-secondary hover:bg-brand-bg transition-colors cursor-pointer"
              >
                Back
              </button>
              <button 
                onClick={() => confirmedSubjects.length > 0 && setStep(6)}
                disabled={confirmedSubjects.length === 0}
                className="px-6 py-3 bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary font-semibold rounded-xl text-sm shadow-soft cursor-pointer transition-all active:scale-[0.98] inline-flex items-center gap-1.5 disabled:opacity-50"
                id="next-syllabi-books-btn"
              >
                Add Study Materials
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 6: BOOK AND CURRICULUM FILE UPLOADS (OPTIONAL) */}
        {step === 6 && (
          <motion.div 
            key="step-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-brand-card border border-brand-border rounded-2xl p-8 shadow-card max-w-3xl mx-auto w-full"
          >
            <div className="flex gap-4 items-center mb-6">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                <Upload className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-brand-text-primary">Load Study Materials</h2>
                <p className="text-xs text-brand-text-secondary mt-0.5">Upload a book Chapter, PDF syllabus, or reference image per course (optional)</p>
              </div>
            </div>

            <p className="text-xs text-brand-text-secondary mb-6 leading-relaxed leading-normal">
              Uploading material enables the AI assistant to reference exact terminology, structural guides, or formulas inside that subject. Supported formats: PDF, PNG, JPG, Text.
            </p>

            <div className="space-y-6">
              {confirmedSubjects.map((sub) => {
                const isSelectedFile = bookUploads[sub.id];
                const isDragActive = dragActiveSubject === sub.id;
                
                return (
                  <div 
                    key={sub.id} 
                    className="border border-brand-border bg-brand-bg rounded-xl p-5 hover:border-brand-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-brand-border">
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-3.5 w-3.5 rounded-full" 
                          style={{ backgroundColor: sub.color }}
                        />
                        <h4 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider">{sub.name} Reference</h4>
                      </div>
                      
                      {isSelectedFile && (
                        <div className="flex items-center gap-2 text-xs text-brand-primary font-semibold">
                          <Check className="h-4 w-4 text-brand-success" />
                          <span>Ready: {isSelectedFile.name.substring(0, 20)}...</span>
                        </div>
                      )}
                    </div>

                    {/* Integrated drag and drop file zone */}
                    <div 
                      onDragEnter={(e) => handleDrag(e, sub.id)}
                      onDragOver={(e) => handleDrag(e, sub.id)}
                      onDragLeave={(e) => handleDrag(e, sub.id)}
                      onDrop={(e) => handleDrop(e, sub.id)}
                      className={`relative flex flex-col items-center justify-center px-4 py-8 rounded-xl border-2 border-dashed transition-colors text-center ${isDragActive ? "border-brand-primary bg-brand-primary/5" : "border-brand-border bg-brand-card hover:bg-brand-bg/40"}`}
                    >
                      <input 
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.txt"
                        onChange={(e) => handleFileSelect(e, sub.id)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      
                      {isSelectedFile ? (
                        <div className="flex flex-col items-center">
                          <FileText className="h-9 w-9 text-brand-primary mb-2" />
                          <p className="text-sm font-bold text-brand-text-primary">{isSelectedFile.name}</p>
                          <p className="text-xs text-brand-text-secondary mt-0.5">Syllabus size: {isSelectedFile.size} KB • Converted to data structure</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="h-9 w-9 text-brand-text-secondary mb-2" />
                          <p className="text-sm font-semibold text-brand-text-primary">Drag study material here, or click to browse</p>
                          <p className="text-[10px] text-brand-text-secondary mt-1">PDF document, Syllabus, or Snapshot helper</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex justify-between border-t border-brand-border pt-6">
              <button 
                onClick={() => setStep(5)}
                className="px-5 py-3 rounded-xl border border-brand-border text-sm font-semibold text-brand-text-secondary hover:bg-brand-bg transition-colors cursor-pointer"
              >
                Back
              </button>
              <button 
                onClick={handleFinalizeOnboarding}
                className="px-7 py-4.5 bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary font-bold rounded-xl text-sm shadow-soft cursor-pointer transition-all active:scale-[0.98] inline-flex items-center gap-2"
                id="enter-dashboard-final-btn"
              >
                <Sparkles className="h-4.5 w-4.5" />
                Enter Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
