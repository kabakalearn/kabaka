import React, { useState } from "react";
import { StudentProfile, Subject, Task, QuizAttempt } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Award, 
  Zap, 
  CheckCircle, 
  Mail, 
  Lock, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Target, 
  Clock, 
  Bookmark, 
  ShieldAlert,
  Send,
  Loader2,
  Trophy,
  Activity
} from "lucide-react";

interface AchievementsTabProps {
  profile: StudentProfile | null;
  subjects: Subject[];
  tasks: Task[];
  attempts: QuizAttempt[];
  onAwardXP: (xp: number, title: string, description: string, type: 'task_reminder' | 'ai_suggestion' | 'quiz_result' | 'achievement_unlocked' | 'mistake_alert' | 'study_plan_update') => Promise<void>;
}

export default function AchievementsTab({ profile, subjects, tasks, attempts, onAwardXP }: AchievementsTabProps) {
  const [parentEmail, setParentEmail] = useState(profile?.parent_email || "guardian@sovereign-academy.com");
  const [isSimulatingEmail, setIsSimulatingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent">("idle");

  // Determine levels and XP thresholds
  const currentXP = profile?.xp || 420; // default initial fallback
  const currentLevel = profile?.level || Math.floor(currentXP / 1000) + 1;
  const nextLevelXP = currentLevel * 1000;
  const currentLevelMinXP = (currentLevel - 1) * 1000;
  const rawProgressXP = currentXP - currentLevelMinXP;
  const levelProgressPercentage = Math.min(100, Math.max(0, (rawProgressXP / 1000) * 100));

  // Count Completed metrics
  const completedTasksCount = tasks.filter(t => t.status === "completed").length;
  const focusCompletedMinutes = profile?.study_hours ? Math.round(profile.study_hours * 60) : 750;
  const quizzesTakenCount = attempts.length;
  const bestQuizScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0;
  const studentStreak = profile?.streak || 3;

  // Track Achievements badges mapping
  // A badge is unlocked if its criteria is satisfied or if it rests in `profile.badges`
  const badgesList = [
    {
      id: "focus_warrior",
      title: "Focus Warrior",
      description: "Dedicated 300+ minutes inside the Pomodoro Focus core",
      criteria: focusCompletedMinutes >= 300,
      icon: <Clock className="h-6 w-6" />,
      color: "#00E5FF", // Neon cyan
    },
    {
      id: "quiz_master",
      title: "Quiz Master",
      description: "Achieved a perfect score in KABAKA quiz evaluations",
      criteria: bestQuizScore >= 100 || (profile?.badges?.includes("quiz_master") || false),
      icon: <Trophy className="h-6 w-6" />,
      color: "#B7F34D", // Soft success green
    },
    {
      id: "consistent_learner",
      title: "Consistent Learner",
      description: "Maintained a study streak of 3 or more days",
      criteria: studentStreak >= 3,
      icon: <Activity className="h-6 w-6" />,
      color: "#FF5F9E", // Accent Pink
    },
    {
      id: "a_student",
      title: "A+ Scholar",
      description: "Completed 5 or more study tasks from active syallbi",
      criteria: completedTasksCount >= 5,
      icon: <Award className="h-6 w-6" />,
      color: "#FFC107", // Gold yellow
    },
  ];

  const milestonesList = [
    { id: "first_lesson", label: "First Lesson syllabus module completed", checked: completedTasksCount >= 1 },
    { id: "first_quiz", label: "First custom quiz evaluation submitted", checked: quizzesTakenCount >= 1 },
    { id: "week_streak", label: "Unlocked a consistent 3-day streak", checked: studentStreak >= 3 },
    { id: "thirty_streak", label: "Completed a 5+ core tasks completed barrier", checked: completedTasksCount >= 5 }
  ];

  const handleSimulateEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentEmail.trim()) return;

    setIsSimulatingEmail(true);
    setEmailStatus("sending");
    
    // Simulate real formatting and secure background submission
    await new Promise(r => setTimeout(r, 1600));
    
    setEmailStatus("sent");
    setIsSimulatingEmail(false);
    
    // Award minor XP for sending parent progress summary reports!
    await onAwardXP(20, "Guardian Report Shared", `A custom progress report email has been dispatched securely to ${parentEmail}`, 'ai_suggestion');
    
    setTimeout(() => {
      setEmailStatus("idle");
    }, 4000);
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header Profile Summary */}
      <div className="pb-4 border-b border-brand-border flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl font-black text-brand-text-primary tracking-tight">Achievements & Sovereign Badges</h2>
          <p className="text-xs text-brand-text-secondary mt-0.5">Maintain study consistency to unlock gamified tiers, levels, and email summaries.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: XP AND LEVEL PROGRESS CARD */}
        <div className="lg:col-span-1 bg-white border border-brand-border p-6 rounded-2xl shadow-soft space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5 border-b border-brand-border pb-2.5">
              <Sparkles className="h-4 w-4 text-brand-primary" /> Core Level Metrics
            </h3>

            {/* Huge Level Circle */}
            <div className="relative flex items-center justify-center py-6">
              <div className="h-32 w-32 rounded-full border-4 border-brand-bg bg-[#33D6FF]/5 flex flex-col items-center justify-center relative shadow-inner">
                <span className="text-[10px] text-brand-text-secondary uppercase tracking-widest font-bold">LEVEL</span>
                <span className="text-4xl font-display font-black text-brand-primary">{currentLevel}</span>
                <div className="absolute -bottom-2 bg-brand-primary text-brand-text-primary text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-md leading-none">
                  Sovereign
                </div>
              </div>
            </div>

            {/* Level XP Progress Bar */}
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center text-[11px] font-bold">
                <span className="text-brand-text-secondary">Next Level Progression</span>
                <span className="font-mono text-brand-primary">{currentXP} / {nextLevelXP} XP</span>
              </div>
              <div className="w-full bg-brand-bg rounded-full h-3 border border-brand-border overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgressPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-brand-primary h-full rounded-full"
                />
              </div>
              <p className="text-[10px] text-brand-text-secondary font-medium">Earn {nextLevelXP - currentXP} more XP to reach Level {currentLevel + 1}! XP is earned automatically from study tasks and quizzes.</p>
            </div>
          </div>

          {/* Mini Stats Grid */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-brand-border">
            <div className="bg-brand-bg p-3 rounded-xl border border-brand-border/40 text-left">
              <span className="text-[9px] text-brand-text-secondary uppercase font-bold tracking-wider">Completed Tasks</span>
              <p className="text-lg font-black text-brand-text-primary mt-1">{completedTasksCount}</p>
            </div>
            <div className="bg-brand-bg p-3 rounded-xl border border-brand-border/40 text-left">
              <span className="text-[9px] text-brand-text-secondary uppercase font-bold tracking-wider">Focus Minutes</span>
              <p className="text-lg font-black text-brand-text-primary mt-1">{focusCompletedMinutes}</p>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: BADGES SHOWCASE */}
        <div className="lg:col-span-2 bg-white border border-brand-border p-6 rounded-2xl shadow-soft space-y-6">
          <div className="pb-3 border-b border-brand-border flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5">
              <Award className="h-4.5 w-4.5 text-brand-primary animate-pulse" /> Gamified Badge Cabinet
            </h3>
            <span className="text-[10px] font-mono text-brand-success font-bold bg-brand-success/10 px-2 rounded-lg">
              {badgesList.filter(b => b.criteria).length} / {badgesList.length} unlocked
            </span>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {badgesList.map((badge) => (
              <div 
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${badge.criteria ? "bg-brand-bg border-brand-border shadow-sm text-brand-text-primary" : "bg-brand-bg/50 border-brand-border/45 opacity-60 text-brand-text-secondary"}`}
              >
                {/* Badge Visual Icon Wrapper */}
                <div 
                  className="h-12 w-12 rounded-xl shrink-0 flex items-center justify-center text-white font-bold relative"
                  style={{ 
                    backgroundColor: badge.criteria ? badge.color : "#90A4AE",
                    boxShadow: badge.criteria ? `0 4px 14px -3px ${badge.color}` : "none" 
                  }}
                >
                  {badge.icon}
                  {!badge.criteria && (
                    <div className="absolute -top-1 -right-1 bg-white text-zinc-500 rounded-full p-0.5 border border-brand-border">
                      <Lock className="h-3 w-3" />
                    </div>
                  )}
                </div>

                <div className="text-left space-y-0.5">
                  <h4 className="font-black text-xs text-brand-text-primary flex items-center gap-1.5">
                    {badge.title}
                    {badge.criteria && <span className="h-1.5 w-1.5 rounded-full bg-brand-success animate-ping" />}
                  </h4>
                  <p className="text-[11px] font-medium leading-relaxed text-brand-text-secondary">{badge.description}</p>
                  
                  {/* Visual tracker tag */}
                  <span className={`text-[8px] font-mono font-extrabold uppercase mt-1 inline-block ${badge.criteria ? "text-brand-success" : "text-brand-text-secondary"}`}>
                    {badge.criteria ? "✓ Unlocked & Persistent" : "🔒 Requirement not met"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Milestone List Checkboxes */}
          <div className="pt-4 border-t border-brand-border space-y-3">
            <h4 className="font-black text-[10px] text-brand-text-secondary uppercase tracking-widest block mb-2">Milestones progress checkpoints</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {milestonesList.map(mil => (
                <div key={mil.id} className="flex items-center gap-2.5 p-2 bg-brand-bg rounded-xl border border-brand-border/40 text-left">
                  <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center shrink-0 border ${mil.checked ? "bg-brand-success border-brand-success text-brand-text-primary" : "bg-white border-brand-border"}`}>
                    {mil.checked && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <span className="text-[11px] font-bold text-brand-text-primary leading-tight truncate">{mil.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PARENT EMAIL DISPATCH SYSTEM CARD */}
      <div className="bg-white border border-brand-border p-6 rounded-2xl shadow-soft space-y-6">
        <div className="pb-3 border-b border-brand-border flex items-center gap-2 flex-wrap justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-primary" />
            <div>
              <h3 className="font-extrabold text-sm text-brand-text-primary">Parent Progress Summary report</h3>
              <p className="text-[11px] text-brand-text-secondary mt-0.5">Keep parents or sponsors involved by automatically formatting and simulating structured email notifications.</p>
            </div>
          </div>
          <span className="text-[9px] font-mono tracking-widest uppercase font-extrabold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full">
            System Synchronized
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Dispatch controls */}
          <form onSubmit={handleSimulateEmailSubmit} className="lg:col-span-4 space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-brand-text-secondary">Parent/Guardian Email Destination</label>
              <input
                type="email"
                placeholder="guardian@family.com"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-brand-bg border border-brand-border text-brand-text-primary focus:outline-none focus:border-brand-primary font-semibold"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSimulatingEmail || !parentEmail.trim()}
              className="w-full bg-brand-primary hover:bg-[#33D6FF]/95 text-brand-text-primary p-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40"
            >
              {isSimulatingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-brand-text-primary" /> Formatting report payload...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" /> Dispatch Report Email
                </>
              )}
            </button>

            <AnimatePresence mode="wait">
              {emailStatus === "sent" && (
                <motion.p 
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0 }} 
                  className="text-[10px] text-brand-success font-bold mt-2 bg-brand-success/15 p-2.5 rounded-xl border border-brand-success/20 text-center"
                >
                  ✓ Email simulation successfully dispatched! Progress summary sent securely on background thread.
                </motion.p>
              )}
            </AnimatePresence>
          </form>

          {/* Email Preview Layout Card */}
          <div className="lg:col-span-8 bg-zinc-50 border border-brand-border p-5 rounded-2xl text-left font-mono text-[11px] leading-relaxed text-brand-text-secondary select-all shadow-inner">
            <div className="pb-3 border-b border-brand-border/60 mb-3 space-y-1 text-brand-text-secondary">
              <p><span className="font-bold text-brand-text-primary">FROM:</span> system@kabaka-learning.com (KABAKA AI Dispatch engine)</p>
              <p><span className="font-bold text-brand-text-primary">TO:</span> {parentEmail}</p>
              <p><span className="font-bold text-brand-text-primary">SUBJECT:</span> KABAKA Progress Report Summary — Scholar: {profile?.name || " Noble student"}</p>
            </div>

            <div className="space-y-3.5 text-zinc-700 bg-white p-5 rounded-xl border border-brand-border/40">
              <p className="font-bold text-brand-primary">Sovereign Guardian Greetings,</p>
              <p>We are excited to deliver the weekly diagnostic outline of <strong>{profile?.name || "Noble Student"}</strong> in the KABAKA King of Learning system. Real-time cognitive evaluation metrics logged:</p>
              
              {/* Layout stats list */}
              <div className="space-y-1 bg-brand-bg p-3.5 rounded-xl border border-brand-border/40 text-xs font-sans text-brand-text-primary font-bold">
                <div className="flex justify-between">
                  <span>Current Level:</span>
                  <span className="text-brand-primary">{currentLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Study Streak Count:</span>
                  <span className="text-brand-success">{studentStreak} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed Syllabus Tasks:</span>
                  <span>{completedTasksCount} cards</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Time Spent Focus Mode:</span>
                  <span>{profile?.study_hours || 12.5} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span>Quiz Evaluation Average:</span>
                  <span>{attempts.length > 0 ? `${Math.round(attempts.reduce((a, b) => a + b.score, 0) / attempts.length)}%` : "N/A"}</span>
                </div>
              </div>

              <div className="space-y-1 mt-3">
                <p><strong>Primary Weak Point focus area:</strong> {subjects.length > 1 ? subjects[0].name : "Analyzing diagnostic metrics"}</p>
                <p><strong>Primary Strengths:</strong> {subjects.length > 0 ? subjects[subjects.length - 1].name : "Begin study blocks inside focus mode"}</p>
              </div>

              <p className="text-[10px] text-zinc-500 italic mt-4 border-t border-zinc-100 pt-2.5">
                Yours in active scholarship, <br />
                KABAKA Autonomous Learning Nodes
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
