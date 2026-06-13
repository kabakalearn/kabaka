import React, { useState } from "react";
import { StudentProfile } from "../types";
import { doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { motion } from "motion/react";
import { 
  User, 
  Settings, 
  Cpu, 
  BellRing, 
  Layout, 
  Sun, 
  Save, 
  CheckCircle, 
  Mail, 
  Phone, 
  Sparkles,
  Sliders
} from "lucide-react";

interface SettingsTabProps {
  userId: string;
  profile: StudentProfile | null;
  onRefreshProfile: () => Promise<void>;
  onAwardXP: (xp: number, title: string, description: string, type: 'task_reminder' | 'ai_suggestion' | 'quiz_result' | 'achievement_unlocked' | 'mistake_alert' | 'study_plan_update') => Promise<void>;
}

export default function SettingsTab({ userId, profile, onRefreshProfile, onAwardXP }: SettingsTabProps) {
  // Local Form state derived from profile document
  const [name, setName] = useState(profile?.name || "");
  const [parentEmail, setParentEmail] = useState(profile?.parent_email || "");
  const [parentPhone, setParentPhone] = useState(profile?.parent_phone || "");

  const [preferredStudyTime, setPreferredStudyTime] = useState(profile?.preferred_study_time || "morning");
  const [hoursPerDay, setHoursPerDay] = useState(profile?.hours_per_day || 2);
  const [difficultyPreference, setDifficultyPreference] = useState(profile?.difficulty_preference || "medium");
  const [aiBehaviorMode, setAiBehaviorMode] = useState(profile?.ai_behavior_mode || "sovereign");

  const [enableAlerts, setEnableAlerts] = useState(profile?.enable_alerts !== false);
  const [enableEmails, setEnableEmails] = useState(profile?.enable_emails !== false);

  const [layoutDensity, setLayoutDensity] = useState(profile?.layout_density || "comfortable");
  const [fontScaling, setFontScaling] = useState(profile?.font_scaling || "medium");

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    setSaveStatus("idle");

    const updatedFields = {
      name: name.trim(),
      parent_email: parentEmail.trim(),
      parent_phone: parentPhone.trim(),
      preferred_study_time: preferredStudyTime,
      hours_per_day: Number(hoursPerDay),
      difficulty_preference: difficultyPreference,
      ai_behavior_mode: aiBehaviorMode,
      enable_alerts: enableAlerts,
      enable_emails: enableEmails,
      layout_density: layoutDensity,
      font_scaling: fontScaling,
      updated_at: new Date().toISOString()
    };

    try {
      const profileRef = doc(db, "student_profiles", profile.id);
      await updateDoc(profileRef, updatedFields);
      
      await onRefreshProfile();
      setSaveStatus("success");

      // Award XP for personalizing settings
      await onAwardXP(20, "Workspace Customised", "Configured custom AI behavior, study goals, notifications and font-scaling parameters.", "study_plan_update");

      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);

    } catch (err) {
      console.error("Save profile settings error:", err);
      setSaveStatus("error");
      handleFirestoreError(err, OperationType.UPDATE, `student_profiles/${profile.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Settings control Header */}
      <div className="pb-4 border-b border-brand-border">
        <h2 className="font-display text-2xl font-black text-brand-text-primary tracking-tight">Personalization Panels</h2>
        <p className="text-xs text-brand-text-secondary mt-0.5">Configure cognitive AI tutoring behaviors, study hour benchmarks, and visual density layouts.</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* ROW 1: PROFILE & PARENT NOTIFICATIONS FIELDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-brand-border p-5 rounded-2xl shadow-soft space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5 border-b border-brand-bg pb-2.5">
              <User className="h-4.5 w-4.5 text-brand-primary" /> Profile Foundations
            </h3>

            <div className="space-y-3.5 text-xs text-left">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-text-secondary">Scholar Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-brand-bg border border-brand-border text-brand-text-primary focus:outline-none focus:border-brand-primary font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-text-secondary">Parent / Sponsor Email Address</label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-brand-bg border border-brand-border text-brand-text-primary focus:outline-none focus:border-brand-primary font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-text-secondary">Parent Phone Number</label>
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-brand-bg border border-brand-border text-brand-text-primary focus:outline-none focus:border-brand-primary font-bold"
                  required
                />
              </div>
            </div>
          </div>

          {/* STUDY PARAMETERS CHANNELS */}
          <div className="bg-white border border-brand-border p-5 rounded-2xl shadow-soft space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5 border-b border-brand-bg pb-2.5">
              <Sliders className="h-4.5 w-4.5 text-brand-primary" /> Cognitive Study Parameters
            </h3>

            <div className="space-y-3.5 text-xs text-left">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-text-secondary">Peak Efficiency Time</label>
                <div className="grid grid-cols-3 gap-2">
                  {["morning", "afternoon", "evening"].map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setPreferredStudyTime(time)}
                      className={`p-2 rounded-xl text-[10px] font-bold border capitalize transition-all cursor-pointer ${preferredStudyTime === time ? "bg-brand-primary text-brand-text-primary border-brand-primary font-extrabold" : "bg-white border-brand-border text-brand-text-secondary"}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-mono font-bold text-brand-text-secondary">
                  <span>Daily Study Hour Target</span>
                  <span className="font-sans text-brand-primary font-bold">{hoursPerDay} hours / day</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value))}
                  className="w-full accent-brand-primary bg-brand-bg rounded-lg h-1.5 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-text-secondary">AI Question Difficulty Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {["easy", "medium", "hard"].map(diff => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficultyPreference(diff)}
                      className={`p-2 rounded-xl text-[10px] font-bold border capitalize transition-all cursor-pointer ${difficultyPreference === diff ? "bg-brand-primary text-brand-text-primary border-brand-primary font-extrabold" : "bg-white border-brand-border text-brand-text-secondary"}`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI & ADVICE CONFIGURATION BLOCK */}
        <div className="bg-white border border-brand-border p-5 rounded-2xl shadow-soft space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5 border-b border-brand-bg pb-2.5">
            <Cpu className="h-4.5 w-4.5 text-brand-primary" /> KABAKA AI Personality behaviors
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {[
              { id: "sovereign", title: "Sovereign Master", desc: "Rigorous diagnostic feedback combined with majestic encouraging feedback on achievements." },
              { id: "encouraging", title: "Royal Counselor", desc: "Forgiving quiz analytics modeling, high motivational feedback and soft streak protection advise." },
              { id: "rigorous", title: "Empirical Inquisitor", desc: "No soft indicators. High difficulty default curves, detailed diagnostics of mistakes with stringent tasks alignment." }
            ].map(mode => (
              <div
                key={mode.id}
                onClick={() => setAiBehaviorMode(mode.id)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${aiBehaviorMode === mode.id ? "bg-brand-bg border-brand-primary shadow-sm" : "bg-white border-brand-border hover:bg-neutral-50"}`}
              >
                <div>
                  <h4 className="font-extrabold text-xs text-brand-text-primary">{mode.title}</h4>
                  <p className="text-[10.5px] font-medium leading-relaxed text-brand-text-secondary mt-1">{mode.desc}</p>
                </div>
                <div className="mt-3 flex justify-end text-[9px] font-mono tracking-widest font-black uppercase text-brand-primary">
                  {aiBehaviorMode === mode.id ? "● SELECTED MODE" : "SELECT MODE"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ALERTS AND PUSH ALERTS SYSTEM FEEDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-brand-border p-5 rounded-2xl shadow-soft space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5 border-b border-brand-bg pb-2.5">
              <Sun className="h-4.5 w-4.5 text-brand-primary" /> Visual & Typography constraints
            </h3>

            <div className="space-y-4 text-xs text-left">
              <div className="space-y-1 bg-brand-bg border p-3.5 rounded-xl border-brand-border/40">
                <div className="flex justify-between items-center text-brand-text-primary leading-none">
                  <span className="font-bold">Light mode only (Hard locked)</span>
                  <Sun className="h-4 w-4 text-amber-500 animate-spin" />
                </div>
                <p className="text-[10px] text-brand-text-secondary mt-1 tracking-tight leading-relaxed">
                  In compliance with KABAKA Phase 2 UI design rules: Dark preset selection is strict disabled to maintain eye focus and white cabinet desk aesthetics.
                </p>
              </div>

              {/* Layout Density */}
              <div className="space-y-1 bg-white">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-text-secondary">Layout Density</label>
                <div className="grid grid-cols-3 gap-2">
                  {["comfortable", "compact", "extended"].map(density => (
                    <button
                      key={density}
                      type="button"
                      onClick={() => setLayoutDensity(density)}
                      className={`p-2 rounded-xl text-[10px] font-bold border capitalize transition-all cursor-pointer ${layoutDensity === density ? "bg-brand-primary text-brand-text-primary border-brand-primary font-extrabold" : "bg-white border-brand-border text-zinc-500"}`}
                    >
                      {density}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font scaling */}
              <div className="space-y-1 bg-white">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-text-secondary">Interface Typography Scaling</label>
                <div className="grid grid-cols-3 gap-2">
                  {["small", "medium", "large"].map(scale => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => setFontScaling(scale)}
                      className={`p-2 rounded-xl text-[10px] font-bold border capitalize transition-all cursor-pointer ${fontScaling === scale ? "bg-brand-primary text-brand-text-primary border-brand-primary font-extrabold" : "bg-white border-brand-border text-zinc-500"}`}
                    >
                      {scale}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-brand-border p-5 rounded-2xl shadow-soft space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary flex items-center gap-1.5 border-b border-brand-bg pb-2.5">
                <BellRing className="h-4.5 w-4.5 text-brand-primary" /> Integrated Notification Channels
              </h3>

              <div className="space-y-3.5 text-xs text-left">
                {/* Enable Alerts */}
                <div 
                  onClick={() => setEnableAlerts(!enableAlerts)} 
                  className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  <div>
                    <h4 className="font-extrabold text-xs text-brand-text-primary">Enable Real-time UI Alerts</h4>
                    <p className="text-[10px] text-brand-text-secondary mt-0.5">Toggle floating notification banners on streak increments & task completions.</p>
                  </div>
                  <div className={`h-5 w-10 p-0.5 rounded-full transition-colors flex items-center ${enableAlerts ? "bg-brand-success justify-end" : "bg-neutral-300 justify-start"}`}>
                    <span className="h-4 w-4 bg-white rounded-full shadow-md" />
                  </div>
                </div>

                {/* Enable Emails */}
                <div 
                  onClick={() => setEnableEmails(!enableEmails)} 
                  className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  <div>
                    <h4 className="font-extrabold text-xs text-brand-text-primary">Direct Email Digest delivery</h4>
                    <p className="text-[10px] text-brand-text-secondary mt-0.5">Dispatches monthly study plans and week analytics summaries to profile email.</p>
                  </div>
                  <div className={`h-5 w-10 p-0.5 rounded-full transition-colors flex items-center ${enableEmails ? "bg-brand-success justify-end" : "bg-neutral-300 justify-start"}`}>
                    <span className="h-4 w-4 bg-white rounded-full shadow-md" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-brand-bg/60 text-right">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-brand-primary text-brand-text-primary p-3 px-8 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-soft hover:bg-[#33D6FF]/95 transition-all select-none cursor-pointer"
              >
                <Save className="h-4 w-4" /> {isSaving ? "Locking changes..." : "Lock Personalization settings"}
              </button>

              <motion.div className="flex justify-end mt-1.5">
                {saveStatus === "success" && (
                  <p className="text-[9.5px] text-brand-success font-bold flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Workspace profiles adjusted. XP awarded!
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
