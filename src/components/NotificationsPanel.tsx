import React from "react";
import { Notification } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  Trash2, 
  CheckCheck, 
  Award, 
  Sparkles, 
  FileCheck, 
  Brain, 
  AlertCircle, 
  Clock,
  CheckCircle2
} from "lucide-react";
import { doc, updateDoc, writeBatch, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

interface NotificationsPanelProps {
  userId: string;
  notifications: Notification[];
  onLoadNotifications: () => Promise<void>;
}

export default function NotificationsPanel({ userId, notifications, onLoadNotifications }: NotificationsPanelProps) {

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), { read: true });
      await onLoadNotifications();
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;

    try {
      const batch = writeBatch(db);
      unreadNotifications.forEach(n => {
        batch.update(doc(db, "notifications", n.id), { read: true });
      });
      await batch.commit();
      await onLoadNotifications();
    } catch (err) {
      console.error("Error bulk marking notifications:", err);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, "notifications", notificationId));
      await onLoadNotifications();
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const getAlertConfig = (type: Notification['type']) => {
    switch (type) {
      case "achievement_unlocked":
        return { icon: <Award className="h-4.5 w-4.5 text-brand-success" />, border: "border-brand-success/30", bg: "bg-[#B7F34D]/5" };
      case "ai_suggestion":
        return { icon: <Brain className="h-4.5 w-4.5 text-brand-primary" />, border: "border-brand-primary/30", bg: "bg-[#33D6FF]/5" };
      case "quiz_result":
        return { icon: <FileCheck className="h-4.5 w-4.5 text-brand-secondary" />, border: "border-brand-secondary/30", bg: "bg-[#00E5FF]/5" };
      case "mistake_alert":
        return { icon: <AlertCircle className="h-4.5 w-4.5 text-brand-accent-pink" />, border: "border-brand-accent-pink/30", bg: "bg-[#FF5F9E]/5" };
      case "study_plan_update":
        return { icon: <Sparkles className="h-4.5 w-4.5 text-amber-500" />, border: "border-amber-500/20", bg: "bg-amber-500/5" };
      default:
        return { icon: <Clock className="h-4.5 w-4.5 text-brand-text-secondary" />, border: "border-brand-border", bg: "bg-brand-bg" };
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Notifications Control Header */}
      <div className="bg-white border border-brand-border p-5 rounded-2xl shadow-soft flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-3 items-center">
          <div className="h-10 w-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0 relative">
            <Bell className="h-5 w-5 animate-swing" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-brand-accent-pink border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-brand-text-primary">System Notification Desk</h3>
            <p className="text-xs text-brand-text-secondary mt-0.5">Real-time reactive audit log of study events, achievements, and KABAKA intelligence suggestions.</p>
          </div>
        </div>

        <button
          type="button"
          disabled={notifications.filter(n => !n.read).length === 0}
          onClick={handleMarkAllAsRead}
          className="w-full sm:w-auto bg-brand-bg hover:bg-brand-border/10 text-brand-text-secondary disabled:opacity-40 p-2.5 px-5 rounded-xl border border-brand-border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <CheckCheck className="h-4 w-4" /> Mark All as Read
        </button>
      </div>

      {/* Feed List Container */}
      <div className="space-y-3.5">
        <AnimatePresence mode="popLayout">
          {notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="py-16 bg-white border border-brand-border rounded-2xl text-center text-xs text-brand-text-secondary italic flex flex-col items-center justify-center space-y-2"
            >
              <CheckCircle2 className="h-10 w-10 text-brand-success" />
              <span>Inbox is clear. No push alerts indexed currently. Achieve learning checkpoints to trigger logs!</span>
            </motion.div>
          ) : (
            notifications.map(n => {
              const cfg = getAlertConfig(n.type);
              return (
                <motion.div
                  key={n.id}
                  layoutId={n.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 rounded-2xl border bg-white flex justify-between gap-4 transition-all ${n.read ? "border-brand-border bg-opacity-70 opacity-60" : `${cfg.border} ${cfg.bg} shadow-sm`}`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl border border-brand-border/40 bg-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      {cfg.icon}
                    </div>
                    <div className="text-left space-y-0.5 min-w-0">
                      <h4 className="font-extrabold text-xs text-brand-text-primary flex items-center gap-3">
                        {n.title}
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-brand-success" />
                        )}
                      </h4>
                      <p className="text-[11px] text-brand-text-secondary font-medium leading-relaxed max-w-full overflow-wrap truncate whitespace-pre-wrap">{n.content}</p>
                      
                      <span className="text-[8.5px] font-mono font-bold uppercase text-neutral-400 block pt-1 leading-none">
                        Logged on: {new Date(n.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex gap-1 items-start shrink-0">
                    {!n.read && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="p-1 px-2 text-[10px] bg-brand-primary text-brand-text-primary uppercase tracking-wider font-extrabold rounded-lg hover:opacity-90 leading-none shrink-0"
                        title="Mark read"
                      >
                        Keep Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteNotification(n.id)}
                      className="p-1 hover:bg-brand-accent-pink/10 rounded hover:text-brand-accent-pink text-brand-text-secondary/60 shrink-0"
                      title="Delete log"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
