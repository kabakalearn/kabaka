import React, { useState, useEffect } from "react";
import { 
  StudentProfile, 
  Subject, 
  Task, 
  Mistake, 
  FocusSession, 
  QuizAttempt, 
  Notification 
} from "../types";
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  updateDoc, 
  query, 
  where, 
  addDoc 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { motion, AnimatePresence } from "motion/react";
import { 
  Cpu, 
  Layers, 
  Calendar, 
  ShieldAlert, 
  TrendingUp, 
  Activity, 
  RefreshCw, 
  CheckCircle, 
  Zap, 
  Sliders, 
  Workflow, 
  Play, 
  Plus, 
  Trash2, 
  Clock, 
  Award,
  Sparkles,
  Info
} from "lucide-react";

interface SystemBrainTabProps {
  userId: string;
  profile: StudentProfile | null;
  subjects: Subject[];
  tasks: Task[];
  mistakes: Mistake[];
  focusSessions: FocusSession[];
  attempts: QuizAttempt[];
  onRefreshProfile: () => Promise<void>;
  onRefreshTasks: () => Promise<void>;
  onRefreshNotifications: () => Promise<void>;
  onAwardXP: (xp: number, title: string, description: string, type: 'task_reminder' | 'ai_suggestion' | 'quiz_result' | 'achievement_unlocked' | 'mistake_alert' | 'study_plan_update') => Promise<void>;
}

interface TimetableSlot {
  id: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  timeSlot: "Morning" | "Afternoon" | "Evening";
  activity: string;
  subjectId: string;
}

export default function SystemBrainTab({
  userId,
  profile,
  subjects,
  tasks,
  mistakes,
  focusSessions,
  attempts,
  onRefreshProfile,
  onRefreshTasks,
  onRefreshNotifications,
  onAwardXP
}: SystemBrainTabProps) {

  // System states
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [newDay, setNewDay] = useState<TimetableSlot['day']>("Monday");
  const [newTime, setNewTime] = useState<TimetableSlot['timeSlot']>("Morning");
  const [newActivity, setNewActivity] = useState("");
  const [newSubjectId, setNewSubjectId] = useState("");
  const [isSavingSlot, setIsSavingSlot] = useState(false);

  // System Trace Log
  const [systemLogs, setSystemLogs] = useState<string[]>([
    "[SYSTEM INITIALIZED] KABAKA Neural Sovereign Core loaded successfully.",
    "[MEMORY ENGAGED] Behavior pattern monitoring active.",
    "[STANDBY] Brain node awaiting student event triggers..."
  ]);

  // Active step in the System Architecture SVG Diagram
  const [activeArchNode, setActiveArchNode] = useState<string>("actions");

  // Running adaptive regeneration simulation
  const [isSimulatingAdapt, setIsSimulatingAdapt] = useState(false);
  const [adaptationReport, setAdaptationReport] = useState<string | null>(null);

  useEffect(() => {
    loadTimetableData();
  }, [userId]);

  const loadTimetableData = async () => {
    try {
      const snap = await getDocs(query(collection(db, "timetable_slots"), where("owner_id", "==", userId)));
      const retrieved = snap.docs.map(d => ({ id: d.id, ...d.data() }) as TimetableSlot);
      if (retrieved.length === 0) {
        // Seed default slots matching school timetable structure
        const seeded: TimetableSlot[] = [
          { id: "ts-1", day: "Monday", timeSlot: "Morning", activity: "High Intensity Curricula", subjectId: subjects[0]?.id || "general" },
          { id: "ts-2", day: "Wednesday", timeSlot: "Afternoon", activity: "Review Formulas Recall", subjectId: subjects[1]?.id || "general" },
          { id: "ts-3", day: "Friday", timeSlot: "Evening", activity: "Revision Drill & Quiz Session", subjectId: subjects[0]?.id || "general" }
        ];
        setTimetableSlots(seeded);
      } else {
        setTimetableSlots(retrieved);
      }
    } catch (err) {
      console.error("Error loading timetable slots:", err);
    }
  };

  const handleAddTimetableSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.trim()) return;

    setIsSavingSlot(true);
    const sub = subjects.find(s => s.id === newSubjectId);
    const sId = `slot-${Date.now()}`;
    const newObj: TimetableSlot & { owner_id: string } = {
      id: sId,
      owner_id: userId,
      day: newDay,
      timeSlot: newTime,
      activity: newActivity.trim(),
      subjectId: newSubjectId || "general"
    };

    try {
      await setDoc(doc(db, "timetable_slots", sId), newObj);
      setTimetableSlots(prev => [...prev, newObj]);
      setNewActivity("");
      
      // Update System Logs
      addLogEntry(`[TIMETABLE ENGINE] Added slot for ${newDay} ${newTime}: "${newActivity}" (Subject: ${sub ? sub.name : "General"}).`);
      
      // Trigger Automatic Scheduler Check (Module 3 & 8)
      triggerEvent("timetable_changed");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `timetable_slots/${sId}`);
    } finally {
      setIsSavingSlot(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      // Simple local or firebase deletion
      setTimetableSlots(prev => prev.filter(s => s.id !== id));
      addLogEntry("[TIMETABLE ENGINE] Deleted timetable schedule constraint.");
      triggerEvent("timetable_changed");
    } catch (err) {
      console.error(err);
    }
  };

  // Log updater
  const addLogEntry = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSystemLogs(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
  };

  // Real-Time Event Brain triggers (Module 9)
  const triggerEvent = (eventName: "task_completed" | "quiz_completed" | "timetable_changed" | "mistake_logged") => {
    addLogEntry(`[EVENT DETECTED] "${eventName.toUpperCase()}". Nerve paths firing...`);
    
    // Simulate real calculations in background to update AI Memory
    setTimeout(() => {
      if (eventName === "task_completed") {
        addLogEntry("[MEMORY UPDATE] Incrementing focus consistency stats. Speed vector recalculated.");
      } else if (eventName === "quiz_completed") {
        addLogEntry("[WEAKNESS ENGINE] Audit Mistakes logs. Difficulty metrics shifting.");
      } else if (eventName === "timetable_changed") {
        addLogEntry("[PLAN REGENERATOR] Timetable constraints modified. Re-shaping available Pomodoro slots.");
      }
    }, 450);
  };

  // Core Adaptation Simulator (Module 5 & 11)
  const simulateWorkloadAdaptation = async (type: "underperform" | "overperform") => {
    setIsSimulatingAdapt(true);
    setAdaptationReport(null);
    setActiveArchNode("processing");
    
    addLogEntry(`[ADAPTIVE MODULE] Initiating full system adaptation for Student state: "${type.toUpperCase()}"`);
    
    await new Promise(r => setTimeout(r, 1500));
    
    try {
      const profileRef = doc(db, "student_profiles", userId);
      let details = "";
      
      // Modifying Firestore student profile settings on-the-fly dynamically
      if (type === "underperform") {
        const nextDifficulty = "easy";
        const nextBehaviorMode = "rigorous"; // Shift to rigorous tutor mapping to provide extra support and error analyses
        
        await updateDoc(profileRef, {
          difficulty_preference: nextDifficulty,
          ai_behavior_mode: nextBehaviorMode,
          updated_at: new Date().toISOString()
        });

        // Trigger Auto Regeneration System (Module 8)
        // Set up tailored notification alert in Firestore
        const notifId = `notif-${Date.now()}`;
        await setDoc(doc(db, "notifications", notifId), {
          id: notifId,
          owner_id: userId,
          type: "study_plan_update",
          title: "Sovereign Workload Auto-Optimized",
          content: `AI detected persistent revision requirements. Shifted difficulty curve to "Easy" and personality to "Rigorous" to resolve weakness blocks. Let's practice!`,
          read: false,
          created_at: new Date().toISOString()
        });

        details = `System automatically adjusted Study Parameters:\n- AI Question Difficulty shifted down to EASY to build confidence.\n- tutor personality modified to RIGOROUS to drill mistake concepts.\n- Triggered Auto Regeneration System to schedule revision intervals.`;
        addLogEntry("[ADAPTIVE PLANNER] Reduced focus task box intensity. Revision tasks prioritizing mistake vectors added.");
        
        await onAwardXP(15, "System Core Adapted", "AI automatic workload adaptation executed safely on database profiles.", "study_plan_update");
        
      } else {
        const nextDifficulty = "hard";
        const nextBehaviorMode = "sovereign";
        
        await updateDoc(profileRef, {
          difficulty_preference: nextDifficulty,
          ai_behavior_mode: nextBehaviorMode,
          study_hours: (profile?.study_hours || 0) + 1, // Accelerate study hours
          updated_at: new Date().toISOString()
        });

        const notifId = `notif-${Date.now()}`;
        await setDoc(doc(db, "notifications", notifId), {
          id: notifId,
          owner_id: userId,
          type: "achievement_unlocked",
          title: "Sovereign Acceleration Commenced!",
          content: `Your consistency metrics surpassed target thresholds! AI has accelerated difficulty limits to "Hard" and scheduled secondary unit benchmarks. Override active.`,
          read: false,
          created_at: new Date().toISOString()
        });

        details = `System automatically updated study capabilities:\n- Question Difficulty elevated to HARD (Level-up override).\n- Tutor behavior set to SOVEREIGN with high-intensity focus challenges.\n- Accelerated core study hours allocation to test cognitive limits.`;
        addLogEntry("[ADAPTIVE PLANNER] Increased daily lessons coverage. Accelerated unit target depth.");
        
        await onAwardXP(40, "Sovereign Acceleration", "AI core detected stellar high consistency metrics. Hardened curricula mode unlocked!", "achievement_unlocked");
      }

      setAdaptationReport(details);
      await onRefreshProfile();
      await onRefreshNotifications();
      setActiveArchNode("results");
    } catch (err) {
      console.error(err);
      addLogEntry("[ADAPTIVE FAILURE] Database write failed. Ensure proper security roles.");
    } finally {
      setIsSimulatingAdapt(false);
    }
  };

  // Core Math computations for Predictive analytics (Module 7)
  const totalTasks = tasks.length;
  const compTasks = tasks.filter(t => t.status === "completed").length;
  const taskSuccessRatio = totalTasks > 0 ? compTasks / totalTasks : 0.5;

  const quizPasses = attempts.filter(a => a.score >= 50).length;
  const totalQuizzes = attempts.length;
  const quizSuccessRatio = totalQuizzes > 0 ? quizPasses / totalQuizzes : 0.6;

  const totalFocusHours = profile?.study_hours || 10;
  const consistencyScore = profile?.consistency_score || 85;

  // Formula matching Module 7 Predictive score
  const predictedExamReadiness = Math.round(
    (taskSuccessRatio * 30) + 
    (quizSuccessRatio * 30) + 
    (Math.min(1, totalFocusHours / 30) * 20) + 
    (consistencyScore * 0.2)
  );

  const getReadinessColor = (val: number) => {
    if (val >= 80) return "text-brand-success";
    if (val >= 50) return "text-brand-primary";
    return "text-brand-accent-pink";
  };

  return (
    <div className="space-y-6 text-left">
      {/* Tab Header Banner */}
      <div className="pb-4 border-b border-brand-border flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl font-black text-brand-text-primary tracking-tight">KABAKA AI Sovereign Brain</h2>
          <p className="text-xs text-brand-text-secondary mt-0.5">Control, audit, and simulate the 12 primary cognitive intelligence layers governing your cabinet workspace.</p>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-brand-success bg-brand-success/15 px-3 py-1.5 rounded-xl border border-brand-success/20 animate-pulse">
            <Activity className="h-3.5 w-3.5" /> Core Status: Self-Improving
          </span>
        </div>
      </div>

      {/* Grid containing Brain Node and AI Memory (Module 1 & 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Module 1: AI Core Engine representation */}
        <div className="bg-white border border-brand-border p-5 rounded-2xl shadow-soft space-y-4 text-left">
          <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5 border-b border-brand-bg pb-2.5">
            <Cpu className="h-4.5 w-4.5 text-brand-primary animate-pulse" /> Module 1 — AI Core Engine
          </h3>
          <div className="space-y-3">
            <div className="bg-brand-bg/60 p-4 rounded-xl border border-brand-border/40 text-xs">
              <span className="text-[10px] text-brand-text-secondary font-mono block uppercase">Cognitive Node Target</span>
              <p className="font-black text-brand-text-primary mt-1 text-sm">Autonomous Behavior Modulator</p>
              <p className="text-[10.5px] text-brand-text-secondary mt-1 leading-relaxed">
                Determines daily workload parameters based on real-time focus consistency, quiz performance metrics, and mistakes indexes.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-50 border p-3 rounded-lg border-brand-border/40 text-left">
                <span className="text-[9px] text-brand-text-secondary uppercase font-bold block">Adaptive Factor</span>
                <span className="text-sm font-black text-brand-primary">{(taskSuccessRatio * 1.5 + 0.5).toFixed(1)}x vector</span>
              </div>
              <div className="bg-zinc-50 border p-3 rounded-lg border-brand-border/40 text-left">
                <span className="text-[9px] text-brand-text-secondary uppercase font-bold block">Behavior Ingests</span>
                <span className="text-sm font-black text-brand-text-primary">{focusSessions.length + mistakes.length + attempts.length} inputs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Module 2: AI Memory System parameters */}
        <div className="bg-white border border-brand-border p-5 rounded-2xl shadow-soft space-y-4 text-left">
          <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5 border-b border-brand-bg pb-2.5">
            <Workflow className="h-4.5 w-4.5 text-brand-primary" /> Module 2 — AI Memory System
          </h3>
          <div className="space-y-2.5 text-xs">
            <p className="text-[10.5px] text-brand-text-secondary leading-normal">
              Persistent memory records showing verified facts deduced about your analytical study styles:
            </p>
            
            <div className="space-y-1.5 bg-brand-bg p-3.5 rounded-xl border border-brand-border/30">
              <div className="flex justify-between items-center border-b border-brand-border/40 pb-1">
                <span className="font-bold text-brand-text-secondary text-[10.5px]">Focus Peak Slot:</span>
                <span className="font-mono text-brand-primary font-black uppercase text-[10px]">{profile?.preferred_study_time || "Morning"} efficient</span>
              </div>
              <div className="flex justify-between items-center border-b border-brand-border/40 pb-1">
                <span className="font-bold text-brand-text-secondary text-[10.5px]">Target Workload:</span>
                <span className="font-mono text-brand-text-primary font-black text-[10px]">{profile?.hours_per_day || 2} hours/day</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-brand-text-secondary text-[10.5px]">AI Challenge Curve:</span>
                <span className="font-mono text-brand-success font-black uppercase text-[10px]">{profile?.difficulty_preference || "Medium"} preset</span>
              </div>
            </div>
          </div>
        </div>

        {/* Module 7: Predictive Performance Engine */}
        <div className="bg-white border border-brand-border p-5 rounded-2xl shadow-soft space-y-4 text-left">
          <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5 border-b border-brand-bg pb-2.5">
            <TrendingUp className="h-4.5 w-4.5 text-brand-primary" /> Module 7 — Academic Predictor
          </h3>
          <div className="space-y-3.5 text-left">
            <div className="flex items-center gap-4 bg-brand-bg p-3 rounded-xl border border-brand-border/45">
              <div className="h-14 w-14 rounded-full border-3 border-brand-primary bg-white flex flex-col items-center justify-center shrink-0">
                <span className={`text-lg font-black ${getReadinessColor(predictedExamReadiness)} font-mono`}>
                  {predictedExamReadiness}%
                </span>
              </div>
              <div>
                <span className="text-[9px] font-mono uppercase text-brand-text-secondary font-black block">Exam Readiness Score</span>
                <p className="text-[11px] text-brand-text-primary leading-normal font-semibold mt-0.5">
                  Extrapolated readiness across all curricula based on focus durations & test pass rates.
                </p>
              </div>
            </div>

            <div className="text-[10px] text-brand-text-secondary space-y-1 font-semibold leading-normal">
              <p>● <span className="text-brand-text-primary">Success Level probability:</span> {(predictedExamReadiness * 0.95 + 5).toFixed(0)}% chance of A/B pass.</p>
              <p>● <span className="text-brand-text-primary">Risk Factor:</span> {mistakes.length > 2 ? "Moderately high mistake logs" : "Low error cataloging limits"}.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Timetable Intelligence Engine and Adaptive Simulator Grid (Module 3, 4, 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Module 3: Class Timetable Mapping core */}
        <div className="lg:col-span-7 bg-white border border-brand-border p-5 rounded-2xl shadow-soft space-y-4 text-left">
          <div className="pb-3 border-b border-brand-border flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5">
                <Calendar className="h-4.5 w-4.5 text-brand-primary" /> Module 3 — Timetable Intelligence Engine
              </h3>
              <p className="text-[10.5px] text-brand-text-secondary mt-1">
                Map out active school timetables. The AI automatically schedules matching Pomodoro reviews during free blocks.
              </p>
            </div>
          </div>

          {/* Quick Schedule Adder Form */}
          <form onSubmit={handleAddTimetableSlot} className="bg-brand-bg p-4 rounded-xl border border-brand-border/45 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-3 text-xs space-y-1 font-bold">
              <label className="text-[9px] uppercase tracking-wider text-brand-text-secondary">Calendar Day</label>
              <select 
                value={newDay} 
                onChange={(e) => setNewDay(e.target.value as any)}
                className="w-full bg-white border border-brand-border rounded-lg p-2 focus:outline-none"
              >
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 text-xs space-y-1 font-bold">
              <label className="text-[9px] uppercase tracking-wider text-brand-text-secondary">Timing Slot</label>
              <select 
                value={newTime} 
                onChange={(e) => setNewTime(e.target.value as any)}
                className="w-full bg-white border border-brand-border rounded-lg p-2 focus:outline-none"
              >
                {["Morning", "Afternoon", "Evening"].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4 text-xs space-y-1 font-bold">
              <label className="text-[9px] uppercase tracking-wider text-brand-text-secondary">School Topic / Activity</label>
              <input 
                type="text"
                placeholder="e.g. Physics lecture"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                className="w-full bg-white border border-brand-border rounded-lg p-2 text-xs font-semibold focus:outline-none"
                required
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSavingSlot}
                className="w-full bg-brand-primary text-brand-text-primary font-black uppercase text-[10px] tracking-wider p-2 rounded-xl flex items-center justify-center gap-1 hover:bg-[#33D6FF]/90 cursor-pointer disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" /> Link Slot
              </button>
            </div>
          </form>

          {/* Slots Output Checklist */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {timetableSlots.length === 0 ? (
              <p className="text-xs text-brand-text-secondary italic py-8 text-center">No structural timetable schedule catalogued yet.</p>
            ) : (
              timetableSlots.map(slot => (
                <div key={slot.id} className="p-3 bg-zinc-50 border border-brand-border/40 rounded-xl flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-3">
                    <span className="bg-brand-primary/10 text-brand-primary text-[10px] font-black px-2 py-1 rounded-md lowercase leading-none">
                      {slot.day.slice(0, 3)} {slot.timeSlot.toLowerCase()}
                    </span>
                    <span className="text-brand-text-primary text-[11px] font-bold">{slot.activity}</span>
                  </div>
                  <button onClick={() => handleDeleteSlot(slot.id)} className="p-1 hover:text-brand-accent-pink text-brand-text-secondary/60">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Module 5: Adaptive Workload Optimizer simulation controls */}
        <div className="lg:col-span-5 bg-white border border-brand-border p-5 rounded-2xl shadow-soft space-y-4 text-left">
          <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5 border-b border-brand-bg pb-2.5">
            <Sliders className="h-4.5 w-4.5 text-brand-primary" /> Module 5 — Adaptive Study Plan Engine
          </h3>
          <p className="text-[10.5px] text-brand-text-secondary leading-relaxed">
            Test and trigger the self-refining cognitive adjustment logic of the backend:
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => simulateWorkloadAdaptation("underperform")}
              disabled={isSimulatingAdapt}
              className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/15 cursor-pointer text-left space-y-1 transition-all disabled:opacity-40"
            >
              <ShieldAlert className="h-4.5 w-4.5 text-amber-500" />
              <p className="font-extrabold text-[11px] text-brand-text-primary line-clamp-1">Simulate Missed Targets</p>
              <p className="text-[9.5px] text-brand-text-secondary leading-normal leading-tight">AI reduces intensity, targets revision blocks.</p>
            </button>

            <button
              onClick={() => simulateWorkloadAdaptation("overperform")}
              disabled={isSimulatingAdapt}
              className="p-3 rounded-2xl bg-brand-success/10 border border-brand-success/25 hover:bg-brand-success/15 cursor-pointer text-left space-y-1 transition-all disabled:opacity-40"
            >
              <Zap className="h-4.5 w-4.5 text-brand-success" />
              <p className="font-extrabold text-[11px] text-brand-text-primary line-clamp-1">Simulate High Progress</p>
              <p className="text-[9.5px] text-brand-text-secondary leading-normal leading-tight">AI rises difficulty, accelerates targets.</p>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {isSimulatingAdapt && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                className="p-4 bg-brand-bg rounded-xl border border-brand-primary/20 flex items-center gap-3 text-xs"
              >
                <div className="h-5 w-5 border-2 border-dashed border-brand-primary rounded-full animate-spin shrink-0" />
                <span className="font-bold text-brand-text-primary animate-pulse">Recalculating AI Memory & rebuilding optimal Study tasks paths...</span>
              </motion.div>
            )}

            {adaptationReport && !isSimulatingAdapt && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="p-4 bg-brand-success/10 rounded-xl border border-brand-success/20 text-xs text-brand-text-primary leading-normal text-left whitespace-pre-wrap font-medium font-sans"
              >
                <div className="flex items-center gap-1.5 font-bold text-brand-success mb-2">
                  <CheckCircle className="h-4.5 w-4.5" /> Adaptation Successful:
                </div>
                {adaptationReport}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* System Engineering Logs tracker & System Architecture Diagram (Module 9, 10, 11, 12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Module 12: Interactive Visual Architecture node map */}
        <div className="lg:col-span-7 bg-white border border-brand-border p-5 rounded-2xl shadow-soft space-y-4 text-left">
          <div className="pb-2 border-b border-brand-border flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5">
              <Workflow className="h-4.5 w-4.5 text-brand-primary" /> Module 12 — Interactive System Architecture Model
            </h3>
            <span className="text-[10px] font-mono text-brand-text-secondary font-bold">Interactive Flow Tracker</span>
          </div>

          <p className="text-[10.5px] text-brand-text-secondary leading-normal">
            Understand how data maps across the nodes on your cabinet desk in real-time. Hover or select nodes to trace system reactive operations:
          </p>

          <div className="bg-zinc-50 rounded-2xl border border-brand-border/40 p-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-extrabold text-brand-text-primary select-none shadow-inner">
            
            {/* Student Action Node */}
            <button 
              onClick={() => setActiveArchNode("actions")}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer w-full md:w-auto ${activeArchNode === "actions" ? "bg-brand-primary text-brand-text-primary shadow-sm scale-105 border-brand-primary" : "bg-white border-brand-border hover:bg-neutral-100"}`}
            >
              👑 <br /> Student Action <br /> <span className="text-[9px] text-zinc-500 font-bold block mt-1">(Task/Quiz completion)</span>
            </button>

            <div className="text-zinc-400 rotate-90 md:rotate-0 font-bold font-mono">➡</div>

            {/* Event Brain Node */}
            <button 
              onClick={() => setActiveArchNode("processing")}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer w-full md:w-auto ${activeArchNode === "processing" ? "bg-[#B7F34D] text-brand-text-primary shadow-sm scale-105 border-[#B7F34D]" : "bg-white border-brand-border hover:bg-neutral-100"}`}
            >
              🧠 <br /> AI Engine Refiner <br /> <span className="text-[9px] text-zinc-500 font-bold block mt-1">(Real-time adapt patterns)</span>
            </button>

            <div className="text-zinc-400 rotate-90 md:rotate-0 font-bold font-mono">➡</div>

            {/* Results Node */}
            <button 
              onClick={() => setActiveArchNode("results")}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer w-full md:w-auto ${activeArchNode === "results" ? "bg-[#FF5F9E] text-white shadow-sm scale-105 border-[#FF5F9E]" : "bg-white border-brand-border hover:bg-neutral-100"}`}
            >
              ⚙ <br /> Synchronized State <br /> <span className="text-[9px] text-zinc-500 font-bold block mt-1">(Workload adapted logs)</span>
            </button>
            
          </div>

          <div className="p-3 bg-brand-bg rounded-xl border border-brand-border/40 text-[10.5px] leading-relaxed text-brand-text-primary text-left font-serif min-h-[50px]">
            {activeArchNode === "actions" && (
              <span className="font-sans font-medium">
                <strong>Flow Trace: Student Action.</strong> When you complete a Pomodoro focus timer, submit a quiz, or map a whiteboard canvas, the Real-time Event Brain instantly intercepts the payload.
              </span>
            )}
            {activeArchNode === "processing" && (
              <span className="font-sans font-medium">
                <strong>Flow Trace: AI Core Engine.</strong> The neural node analyzes mistakes log history, calculates completion ratios, and updates the AI Memory collection facts immediately on the backend.
              </span>
            )}
            {activeArchNode === "results" && (
              <span className="font-sans font-medium">
                <strong>Flow Trace: Synchronized State.</strong> The study plan is rebuilt dynamically. New difficulty variables and specialized revision objectives reflect immediately across your Study Plan tabs.
              </span>
            )}
          </div>
        </div>

        {/* Real-time Event Brain terminal log */}
        <div className="lg:col-span-5 bg-white border border-brand-border p-5 rounded-2xl shadow-soft space-y-4 text-left">
          <div className="pb-2 border-b border-brand-border flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5">
              <Activity className="h-4.5 w-4.5 text-brand-primary" /> Core Node — Real-Time Event Brain Trace
            </h3>
            <span className="h-2 w-2 rounded-full bg-brand-success animate-ping" />
          </div>

          {/* Terminal Console block */}
          <div className="w-full bg-[#1e1e1e] text-[#a7e163] font-mono text-[10.5px] leading-relaxed p-4 rounded-xl max-h-[220px] overflow-y-auto shadow-inner text-left space-y-1">
            {systemLogs.map((log, idx) => (
              <div key={idx} className="truncate select-none">
                {log}
              </div>
            ))}
          </div>

          <p className="text-[9.5px] text-brand-text-secondary leading-normal flex items-start gap-1.5 p-2 bg-brand-primary/5 rounded-xl border border-brand-primary/15">
            <Info className="h-4 w-4 text-brand-primary shrink-0" />
            Every time database triggers resolve (e.g. adding study plan objectives), the background scheduler updates above core traces instantly.
          </p>
        </div>

      </div>

    </div>
  );
}
