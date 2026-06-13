import React from "react";
import { motion } from "motion/react";
import { 
  Sparkles, 
  ArrowRight, 
  Compass, 
  Zap, 
  ShieldCheck, 
  Award, 
  Brain, 
  CheckCircle2,
  FileText,
  Bookmark,
  Users
} from "lucide-react";
// @ts-ignore
import logoJpg from "../../logo.jpg";

interface LandingPageProps {
  onStartAuth: (signUpMode: boolean) => void;
}

export default function LandingPage({ onStartAuth }: LandingPageProps) {
  // Smooth scroll helper
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="bg-brand-bg font-sans overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative px-6 py-16 md:py-24 max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 lg:gap-16">
        
        {/* Left column: Typography & CTAs */}
        <div className="flex-1 text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3  py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-text-primary text-xs font-mono font-bold tracking-wider">
            <Sparkles className="h-3 w-3 text-brand-primary animate-pulse" />
            <span>AI Learning System</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-brand-text-primary leading-[1.1] tracking-tight">
            Study Smarter. <span className="text-brand-primary bg-clip-text">Not Harder.</span>
          </h1>

          <p className="text-base sm:text-lg text-brand-text-secondary leading-relaxed max-w-xl">
            Your AI-powered learning system that turns textbooks, subjects, and study goals into a personalized study plan.

Upload your subjects, tell KABAKA when your semester starts and ends, and let AI build your daily learning roadmap automatically.

Personalized Study Plans
AI Tutor & Explanations
Smart Quizzes & Flashcards
Progress Tracking & Insights
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
            <button
              onClick={() => onStartAuth(true)}
              className="group flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary font-bold text-sm rounded-xl shadow-soft transition-all active:scale-[0.98] cursor-pointer"
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => onStartAuth(false)}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-card hover:bg-[#fafcfe] text-brand-text-secondary border border-brand-border font-bold text-sm rounded-xl shadow-soft transition-all active:scale-[0.98] cursor-pointer"
            >
              Sign In
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-brand-border max-w-md">
            <div>
              <p className="text-[10px] text-brand-text-secondary uppercase tracking-widest font-mono mt-0.5">📚 Subjects Organized</p>
            </div>
            <div>
              <p className="text-[10px] text-brand-text-secondary uppercase tracking-widest font-mono mt-0.5">🧠 AI Generated Plans</p>
            </div>
            <div>
              <p className="text-[10px] text-brand-text-secondary uppercase tracking-widest font-mono mt-0.5">✅ Tasks Completed</p>
            </div>
          </div>
        </div>

        {/* Right column: Beautifully Framed Big Logo */}
        <div className="flex-1 flex justify-center relative">
          {/* Circular Glowing Backdrops */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-brand-primary/15 blur-3xl -z-10 animate-pulse" />
          <div className="absolute top-1/3 left-2/3 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-brand-success/10 blur-3xl -z-10" />

          {/* Golden/Cyan Sovereign Frames */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative p-3 rounded-[2.5rem] bg-gradient-to-tr from-brand-primary via-brand-border to-brand-success shadow-card"
          >
            {/* Inner Ring */}
            <div className="p-2 rounded-[2.2rem] bg-brand-card">
              {/* Massive Cover Image of logo.jpg */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-[1.8rem] overflow-hidden bg-brand-bg group">
                <img 
                  src={logoJpg} 
                  alt="KABAKA Academic Mascot Logo" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Float-badge 1: Spaced Repetition */}
            <div className="absolute -top-4 -left-6 bg-brand-card border border-brand-border rounded-xl p-3 shadow-soft flex items-center gap-2 max-w-[170px]">
              <div className="h-8 w-8 rounded-lg bg-brand-success/20 text-brand-text-primary flex items-center justify-center shrink-0">
                <Brain className="h-4 w-4 text-brand-text-primary" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold text-[#A7E163]">Adaptive</p>
                <p className="text-xs font-bold text-brand-text-primary">Spaced Drills</p>
              </div>
            </div>

            {/* Float-badge 2: Model Synced */}
            <div className="absolute -bottom-4 -right-6 bg-brand-card border border-brand-border rounded-xl p-3 shadow-soft flex items-center gap-2 max-w-[170px]">
              <div className="h-8 w-8 rounded-lg bg-[#33D6FF]/20 text-brand-text-primary flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 text-brand-primary" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold text-brand-primary">Dual-Core</p>
                <p className="text-xs font-bold text-brand-text-primary">Gemini Synced</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* QUICK IN-PAGE NAVIGATION SYSTEM */}
      <div className="border-y border-brand-border bg-brand-card py-3">
        <div className="max-w-6xl mx-auto px-6 flex justify-around sm:justify-center gap-6 sm:gap-16 text-xs font-bold font-display uppercase tracking-widest text-brand-text-secondary">
          <button onClick={() => scrollToSection("about-us")} className="hover:text-brand-primary transition-colors cursor-pointer">
            About Us
          </button>
          <button onClick={() => scrollToSection("why-choose-kabaka")} className="hover:text-brand-primary transition-colors cursor-pointer">
            Why KABAKA
          </button>
          <button onClick={() => onStartAuth(false)} className="hover:text-brand-primary transition-colors cursor-pointer">
            Sign In
          </button>
        </div>
      </div>

      {/* 2. WHY CHOOSE KABAKA SECTION */}
      <section id="why-choose-kabaka" className="px-6 py-20 bg-brand-card">
        <div className="max-w-6xl mx-auto text-center space-y-12">
          <div className="max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-black text-brand-primary uppercase tracking-widest">Core Values & Assets</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-brand-text-primary tracking-tight">
              Why Choose KABAKA?
            </h2>
            <p className="text-sm sm:text-base text-brand-text-secondary leading-relaxed">
              We design software for high-agency scholars who refuse to learn passively. Traditional study software is static; KABAKA is a thinking partner.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left pt-4">
            
            {/* Card 1: Adaptive Curriculum Plan */}
            <div className="p-6 rounded-2xl bg-brand-bg border border-brand-border hover:border-brand-primary/30 transition-all shadow-soft flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-brand-primary/15 text-brand-primary flex items-center justify-center">
                  <Compass className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-brand-text-primary group-hover:text-brand-primary transition-colors">
                  🧠 AI-Powered Study Planning
                </h3>
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  Stop wasting time deciding what to study next. KABAKA analyzes your subjects, semester timeline, and study preferences to automatically generate a personalized learning plan.
                </p>
              </div>
              <ul className="mt-5 space-y-1.5 border-t border-brand-border/60 pt-4 text-xs font-medium text-brand-text-secondary">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-success" />
                  PDF, Image, and Text parser
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-success" />
                  Instant structured lesson maps
                </li>
              </ul>
            </div>

            {/* Card 2: Interactive Recall Testing */}
            <div className="p-6 rounded-2xl bg-brand-bg border border-brand-border hover:border-brand-primary/30 transition-all shadow-soft flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-brand-accent-pink/15 text-brand-accent-pink flex items-center justify-center">
                  <Brain className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-brand-text-primary group-hover:text-brand-accent-pink transition-colors">
                  📚 Smart Learning Organization
                </h3>
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  Upload your books and learning materials, and KABAKA transforms them into structured subjects, units, lessons, and study tasks that are easy to follow.
                </p>
              </div>
              <ul className="mt-5 space-y-1.5 border-t border-brand-border/60 pt-4 text-xs font-medium text-brand-text-secondary">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-success" />
                  Multi-format diagnostic exams
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-success" />
                  AI-driven detailed explanation responses
                </li>
              </ul>
            </div>

            {/* Card 3: Mistake Adaptation Ledger */}
            <div className="p-6 rounded-2xl bg-brand-bg border border-brand-border hover:border-brand-primary/30 transition-all shadow-soft flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-xl bg-brand-success/15 text-brand-success flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-brand-text-primary group-hover:text-brand-success transition-colors">
                  🎯 Adaptive Learning Experience
                </h3>
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  Your study plan evolves with you. As you complete tasks, take quizzes, and improve your performance, KABAKA continuously adjusts your learning path.
                </p>
              </div>
              <ul className="mt-5 space-y-1.5 border-t border-brand-border/60 pt-4 text-xs font-medium text-brand-text-secondary">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-success" />
                  No cognitive bottlenecks ignored
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-success" />
                  One-click weak point drills
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 3. ABOUT US SECTION */}
      <section id="about-us" className="px-6 py-20 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          
          {/* Left panel: Narrative content */}
          <div className="flex-1 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-success/15 text-brand-text-primary text-xs font-mono font-bold tracking-wider">
              <Award className="h-3.5 w-3.5 text-[#A7E163]" />
              <span>THE PHILOSOPHY OF KABAKA</span>
            </div>

            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-brand-text-primary tracking-tight">
              About KABAKA
            </h2>

            <div className="space-y-4 text-sm text-brand-text-secondary leading-relaxed">
              <p>
                KABAKA is an AI-powered Learning Operating System designed to help students study with clarity, consistency, and confidence.
              </p>
              <p>
                Most students struggle not because they lack ability, but because they lack structure. Managing multiple subjects, textbooks, deadlines, and revision schedules can quickly become overwhelming.
              </p>
              <p>
                KABAKA solves this problem by transforming academic materials and study goals into a personalized learning system. From creating adaptive study plans to tracking progress and identifying weak areas, KABAKA helps students focus on learning instead of planning.
              </p>
              <p>
                Our mission is simple: To make personalized, intelligent learning accessible to every student through the power of artificial intelligence.
              </p>
              <p>
                Whether you're preparing for school exams, university courses, or professional certifications, KABAKA helps you stay organized, improve retention, and achieve better academic results.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="flex gap-2.5 items-start">
                <Users className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-brand-text-primary uppercase tracking-wider font-mono">1-on-1 AI Companion</h4>
                  <p className="text-[11px] text-brand-text-secondary">Continuous mental sparring with cognitive coaching logic.</p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start">
                <FileText className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-brand-text-primary uppercase tracking-wider font-mono">Transparent Analytics</h4>
                  <p className="text-[11px] text-brand-text-secondary">Keep track of objective study streams and streaks dynamically.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Minimalist display image decoration or bento showcase */}
          <div className="flex-1 bg-brand-card border border-brand-border p-6 sm:p-8 rounded-3xl shadow-card space-y-6">
            <h3 className="font-display font-bold text-xl text-brand-text-primary text-left">
              How KABAKA Works
            </h3>
            
            <div className="space-y-4 text-left">
              <div className="p-4 rounded-xl bg-brand-bg border border-brand-border flex gap-4">
                <span className="h-8 w-8 rounded-lg bg-brand-primary/10 text-brand-primary font-mono font-bold text-sm flex items-center justify-center shrink-0">
                  01
                </span>
                <div>
                  <h4 className="font-bold text-xs text-brand-text-primary font-mono uppercase tracking-wide">📚 Add Your Subjects & Materials</h4>
                  <p className="text-xs text-brand-text-secondary mt-0.5">Upload your textbooks, study materials, or simply enter your subjects. KABAKA organizes everything into a structured learning system.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-brand-bg border border-brand-border flex gap-4">
                <span className="h-8 w-8 rounded-lg bg-brand-accent-pink/10 text-brand-accent-pink font-mono font-bold text-sm flex items-center justify-center shrink-0">
                  02
                </span>
                <div>
                  <h4 className="font-bold text-xs text-brand-text-primary font-mono uppercase tracking-wide">🧠 Get Your Personalized Study Plan</h4>
                  <p className="text-xs text-brand-text-secondary mt-0.5">Based on your semester timeline, available study hours, and learning preferences, KABAKA automatically creates your daily and weekly study roadmap.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-brand-bg border border-brand-border flex gap-4">
                <span className="h-8 w-8 rounded-lg bg-brand-success/10 text-brand-success font-mono font-bold text-sm flex items-center justify-center shrink-0">
                  03
                </span>
                <div>
                  <h4 className="font-bold text-xs text-brand-text-primary font-mono uppercase tracking-wide font-mono">🎯 Learn, Practice & Improve</h4>
                  <p className="text-xs text-brand-text-secondary mt-0.5">Complete daily tasks, take AI-generated quizzes, review flashcards, and track your progress as KABAKA continuously adapts to your performance.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. FINAL CALL TO ACTION */}
      <section className="px-6 py-16 bg-brand-text-primary text-white text-center relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#33D6FF_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="relative max-w-3xl mx-auto space-y-6">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-[#33D6FF]">
            Reclaim Academic Autonomy Today
          </h2>
          <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto leading-relaxed">
            Stop passive scrolling. Create your premium learning portal now and let KABAKA formulate your customized path to mastery.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button
              onClick={() => onStartAuth(true)}
              className="w-full sm:w-auto px-8 py-3.5 bg-brand-primary text-brand-text-primary font-extrabold text-sm rounded-xl cursor-pointer hover:bg-[#2bc4ec] transition-colors shadow-soft"
            >
              Get Started for Free
            </button>
            <button
              onClick={() => onStartAuth(false)}
              className="w-full sm:w-auto px-8 py-3.5 bg-transparent border border-white/20 text-white font-extrabold text-sm rounded-xl cursor-pointer hover:bg-white/10 transition-colors"
            >
              Already Registered? Sign In
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
