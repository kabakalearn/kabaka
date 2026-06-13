import React from "react";
import { StudentProfile, Subject, Task, QuizAttempt } from "../types";
import { motion } from "motion/react";
import { 
  BarChart2, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Activity, 
  BookOpen, 
  Target, 
  ChevronRight,
  Flame,
  Award
} from "lucide-react";

interface AnalyticsTabProps {
  profile: StudentProfile | null;
  subjects: Subject[];
  tasks: Task[];
  attempts: QuizAttempt[];
}

export default function AnalyticsTab({ profile, subjects, tasks, attempts }: AnalyticsTabProps) {
  // Compute metric calculations
  const totalStudyTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === "completed").length;
  const taskCompletionPercentage = totalStudyTasksCount > 0 
    ? Math.round((completedTasksCount / totalStudyTasksCount) * 100) 
    : 0;

  const currentStreak = profile?.streak || 3;
  const studyHoursTotal = profile?.study_hours || 12.5;
  const consistencyScore = profile?.consistency_score || 85;

  const quizPassAverage = attempts.length > 0
    ? Math.round(attempts.reduce((a, b) => a + b.score, 0) / attempts.length)
    : 0;

  // Render weekly workload hours data
  const weeklyWorkload = [
    { day: "Mon", hours: 1.5, tasks: 2 },
    { day: "Tue", hours: 2.0, tasks: 4 },
    { day: "Wed", hours: 1.2, tasks: 1 },
    { day: "Thu", hours: 2.8, tasks: 3 },
    { day: "Fri", hours: 1.8, tasks: 2 },
    { day: "Sat", hours: 2.2, tasks: 5 },
    { day: "Sun", hours: 1.0, tasks: 1 }
  ];

  const maxHours = Math.max(...weeklyWorkload.map(d => d.hours));

  // Milestones outline
  const milestones = [
    { id: "registered", label: "Establish Cabinet Identity", desc: "First onboarding credentials registered.", completed: true, date: "Jun 10" },
    { id: "syllabus", label: "AI Syllabus parsing", desc: "Book course curricula generated via Gemini tutor.", completed: subjects.length > 0, date: "Jun 11" },
    { id: "task_done", label: "Perform daily tasks", desc: "Unlock cognitive recall triggers via checkbox logs.", completed: completedTasksCount > 0, date: "Jun 12" },
    { id: "eval", label: "Evaluate Core Knowledge", desc: "Achieve 60% or higher on custom generated quizzes.", completed: quizPassAverage >= 60, date: "Jun 13" },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Analytics control Header */}
      <div className="pb-4 border-b border-brand-border">
        <h2 className="font-display text-2xl font-black text-brand-text-primary tracking-tight">Active Learning Analytics</h2>
        <p className="text-xs text-brand-text-secondary mt-0.5">Empirical tracking of your cognitive load, focus benchmarks, and syllabus progress timelines.</p>
      </div>

      {/* 1. TOP CARDS PANEL SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Core Productivity Index */}
        <div className="bg-white border border-brand-border p-4.5 rounded-2xl shadow-soft flex items-center gap-4.5">
          <div className="h-11 w-11 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-brand-text-secondary uppercase font-bold tracking-wider">Productivity Index</span>
            <p className="text-lg font-black text-brand-text-primary mt-0.5">{consistencyScore}%</p>
          </div>
        </div>

        {/* Study Hours */}
        <div className="bg-white border border-brand-border p-4.5 rounded-2xl shadow-soft flex items-center gap-4.5">
          <div className="h-11 w-11 rounded-xl bg-[#00E5FF]/10 text-brand-secondary flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-brand-text-secondary uppercase font-bold tracking-wider">Focus Duration</span>
            <p className="text-lg font-black text-brand-text-primary mt-0.5">{studyHoursTotal} hrs</p>
          </div>
        </div>

        {/* Quiz Pass Rate */}
        <div className="bg-white border border-brand-border p-4.5 rounded-2xl shadow-soft flex items-center gap-4.5">
          <div className="h-11 w-11 rounded-xl bg-[#B7F34D]/10 text-brand-success flex items-center justify-center shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-brand-text-secondary uppercase font-bold tracking-wider">Quiz Pass average</span>
            <p className="text-lg font-black text-brand-text-primary mt-0.5">{quizPassAverage}%</p>
          </div>
        </div>

        {/* Active Streak */}
        <div className="bg-white border border-brand-border p-4.5 rounded-2xl shadow-soft flex items-center gap-4.5">
          <div className="h-11 w-11 rounded-xl bg-[#FF5F9E]/10 text-brand-accent-pink flex items-center justify-center shrink-0">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-brand-text-secondary uppercase font-bold tracking-wider">Study Streak</span>
            <p className="text-lg font-black text-brand-text-primary mt-0.5">{currentStreak} days</p>
          </div>
        </div>

      </div>

      {/* 2. CHARTS GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly study workload direct SVG bar chart */}
        <div className="lg:col-span-2 bg-white border border-brand-border p-5 rounded-2xl shadow-soft space-y-4">
          <div className="pb-3 border-b border-brand-border flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-brand-primary" /> Focus load metrics (Hours/Day)
            </h3>
            <span className="text-[10px] font-mono text-brand-text-secondary font-bold">This Core Week</span>
          </div>

          {/* Elegant direct responsive SVG chart canvas */}
          <div className="relative py-4 pr-1">
            <svg viewBox="0 0 540 220" className="w-full h-auto select-none overflow-visible">
              {/* Chart Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, index) => {
                const yPos = 20 + ratio * 150;
                const hoursVal = (yPos - 20) / 150 * maxHours;
                return (
                  <g key={ratio} className="opacity-40">
                    <line x1="50" y1={yPos} x2="520" y2={yPos} stroke="#E6EEF8" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="15" y={yPos + 4} className="font-mono text-[9px] fill-zinc-400 text-right">{ (maxHours - hoursVal).toFixed(1) }h</text>
                  </g>
                );
              })}

              {/* Bar Elements Rendering */}
              {weeklyWorkload.map((dayData, idx) => {
                const colWidth = 38;
                const spacing = 28;
                const startX = 64 + idx * (colWidth + spacing);
                const height = (dayData.hours / maxHours) * 150;
                const startY = 170 - height;

                return (
                  <g key={dayData.day} className="group cursor-pointer">
                    {/* Shadow Accent */}
                    <rect 
                      x={startX} 
                      y={startY} 
                      width={colWidth} 
                      height={height} 
                      rx="6" 
                      fill="#33D6FF" 
                      className="transition-colors hover:fill-[#00E5FF] origin-bottom duration-300 transform" 
                      opacity="0.85" 
                    />
                    
                    {/* Tiny hover tip indicator details */}
                    <text x={startX + colWidth/2} y={startY - 6} textAnchor="middle" className="font-mono text-[9px] font-bold fill-brand-primary opacity-0 group-hover:opacity-100 transition-opacity">{dayData.hours}h</text>
                    
                    {/* Bottom axis tag */}
                    <text x={startX + colWidth/2} y="192" textAnchor="middle" className="font-sans font-extrabold text-[10px] fill-zinc-500">{dayData.day}</text>
                  </g>
                );
              })}

              {/* Base Bottom line */}
              <line x1="50" y1="170" x2="520" y2="170" stroke="#E6EEF8" strokeWidth="2" />
            </svg>
          </div>

          <div className="pt-3 border-t border-brand-bg flex justify-between text-[10px] text-zinc-400 font-mono font-bold leading-normal">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-brand-primary" /> Actual Daily hours</span>
            <span>Completed study intervals synced at active session finish and Pomodoro intervals</span>
          </div>
        </div>

        {/* SUBJECT PROGRESS COMPASS PROGRESS LOG */}
        <div className="lg:col-span-1 bg-white border border-brand-border p-5 rounded-2xl shadow-soft space-y-4">
          <div className="pb-3 border-b border-brand-border">
            <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-brand-primary" /> Subject Mastery outlines
            </h3>
          </div>

          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
            {subjects.length === 0 ? (
              <p className="text-xs text-brand-text-secondary italic pt-12 text-center">No subjects mapped in cabinet active registry.</p>
            ) : (
              subjects.map(sub => {
                const matchedTasks = tasks.filter(t => t.subject_id === sub.id);
                const complTasks = matchedTasks.filter(t => t.status === "completed").length;
                const coverage = matchedTasks.length > 0 ? Math.round((complTasks / matchedTasks.length) * 100) : 0;

                return (
                  <div key={sub.id} className="space-y-1.5 p-3.5 bg-brand-bg rounded-xl border border-brand-border/40 text-left">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-black text-brand-text-primary inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sub.color }} />
                        {sub.name}
                      </span>
                      <span className="font-mono text-[10px] text-brand-primary font-bold">{coverage}% progress</span>
                    </div>

                    <div className="w-full bg-white rounded-full h-1.5 overflow-hidden border border-brand-border">
                      <div 
                        className="h-full rounded-full transition-all duration-700" 
                        style={{ backgroundColor: sub.color, width: `${coverage}%` }} 
                      />
                    </div>
                    <div className="flex justify-between font-mono text-[8px] text-neutral-400 mt-0.5 leading-none font-bold uppercase tracking-widest">
                      <span>Tasks: {complTasks} / {matchedTasks.length}</span>
                      <span>Syllabus units count: {sub.units_count || 0}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* 3. DIAGNOSTIC TIMELINE PROGRESS MARKERS */}
      <div className="bg-white border border-brand-border p-5 rounded-2xl shadow-soft space-y-4">
        <div className="pb-3 border-b border-brand-border">
          <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5">
            <Target className="h-4.5 w-4.5 text-brand-primary" /> Active Progression Milestones Timeline
          </h3>
        </div>

        {/* Milestone Staged Row layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left relative">
          {milestones.map((mil, index) => (
            <div key={mil.id} className="p-4 bg-brand-bg rounded-2xl border border-brand-border/40 space-y-2.5 relative flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-black uppercase ${mil.completed ? "bg-brand-success text-brand-text-primary" : "bg-zinc-200 text-zinc-500"}`}>
                    M{index + 1}
                  </span>
                  <span className="text-[9px] font-mono font-black text-zinc-400 bg-white border border-brand-border p-1 rounded-md leading-none uppercase">{mil.date}</span>
                </div>

                <h4 className="font-extrabold text-xs text-brand-text-primary">{mil.label}</h4>
                <p className="text-[10.5px] font-medium leading-relaxed text-brand-text-secondary">{mil.desc}</p>
              </div>

              <div className={`mt-2 border-t border-brand-border pt-2 text-[8.5px] font-mono uppercase font-black tracking-widest ${mil.completed ? "text-brand-success" : "text-zinc-400"}`}>
                {mil.completed ? "✓ MILTESTONE CONVERTED" : "⌛ LOCK WAITING CHECK"}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
