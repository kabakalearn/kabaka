import React, { useState, useEffect, useRef } from "react";
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  addDoc, 
  setDoc,
  deleteDoc,
  query, 
  where,
  increment,
  writeBatch
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { 
  StudentProfile, 
  Subject, 
  Task, 
  ChatMessage, 
  FocusSession, 
  Unit,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  Mistake,
  Flashcard,
  AIInsights,
  Notification
} from "../types";
import { motion, AnimatePresence } from "motion/react";
// @ts-ignore
import logoJpg from "../../logo.jpg";

// Phase 4 Tab modular imports
import ResourcesTab from "./ResourcesTab";
import AchievementsTab from "./AchievementsTab";
import NotificationsPanel from "./NotificationsPanel";
import SettingsTab from "./SettingsTab";
import AnalyticsTab from "./AnalyticsTab";
import SystemBrainTab from "./SystemBrainTab";
import { 
  Crown, 
  BookOpen, 
  Bell,
  CheckCircle, 
  MessageSquare, 
  Sparkles, 
  LogOut, 
  Send,
  Zap, 
  Plus, 
  Calendar,
  Layers,
  ChevronRight,
  BookMarked,
  Clock,
  Target,
  Play,
  Pause,
  RotateCcw,
  BarChart2,
  ListTodo,
  TrendingUp,
  AlertCircle,
  Upload,
  FileText,
  HelpCircle,
  Award,
  Trash2,
  Brain,
  RefreshCw,
  Eye,
  Sliders,
  Cpu
} from "lucide-react";

interface DashboardProps {
  userId: string;
  onLogout: () => void;
}

type TabType = "dashboard" | "subjects" | "study_plan" | "focus_mode" | "progress" | "tutor" | "resources" | "achievements" | "notifications" | "settings" | "brain";

export default function Dashboard({ userId, onLogout }: DashboardProps) {
  // Database States
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Phase 3 AI Tutor States
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);

  // Sub-navigation inside "tutor" tab
  const [tutorSubTab, setTutorSubTab] = useState<"explain" | "quiz" | "mistakes" | "flashcards" | "insights">("explain");

  // State for EXPLAIN MODE
  const [explainTopic, setExplainTopic] = useState("");
  const [explainMode, setExplainMode] = useState<"explain" | "exam" | "summary" | "deep">("explain");
  const [explainResult, setExplainResult] = useState("");
  const [isExplainLoading, setIsExplainLoading] = useState(false);

  // Active lesson-by-lesson study board states
  const [activeStudyLesson, setActiveStudyLesson] = useState<{ unitTitle: string; lessonTitle: string } | null>(null);
  const [lessonExplanationMode, setLessonExplanationMode] = useState<"brief" | "detailed">("brief");
  const [lessonExplanation, setLessonExplanation] = useState<string>("");
  const [isLessonLoading, setIsLessonLoading] = useState<boolean>(false);
  const [lessonQuestion, setLessonQuestion] = useState<string>("");
  const [lessonQAHistory, setLessonQAHistory] = useState<{ q: string; a: string }[]>([]);
  const [isLessonQALoading, setIsLessonQALoading] = useState<boolean>(false);

  // State for QUIZ GENERATOR
  const [quizSubjectId, setQuizSubjectId] = useState("");
  const [quizType, setQuizType] = useState<'lesson' | 'unit' | 'subject' | 'full_exam'>("lesson");
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>("medium");
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [isQuizGenerating, setIsQuizGenerating] = useState(false);
  const [quizCurrentIdx, setQuizCurrentIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [quizSelectedOption, setQuizSelectedOption] = useState<string>("");
  const [quizShortAnswerText, setQuizShortAnswerText] = useState<string>("");
  const [quizIsAnswerRevealed, setQuizIsAnswerRevealed] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizTimer, setQuizTimer] = useState(180); // 3 minutes standard countdown
  const [quizIsCompleted, setQuizIsCompleted] = useState(false);
  const quizTimerRef = useRef<NodeJS.Timeout | null>(null);

  // State for FLASHCARDS
  const [cardSubjectId, setCardSubjectId] = useState("");
  const [cardSource, setCardSource] = useState<'lessons' | 'books' | 'mistakes' | 'ai_summaries'>("lessons");
  const [isFlashcardsGenerating, setIsFlashcardsGenerating] = useState(false);
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [isErrorDiagnosisLoading, setIsErrorDiagnosisLoading] = useState(false);
  const [errorDiagnosisResult, setErrorDiagnosisResult] = useState("");
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  
  // Loader States Overlays
  const [isLoader, setIsLoader] = useState(true);
  const [isSyllabusParsing, setIsSyllabusParsing] = useState<string | null>(null); // Course id currently parsing
  const [isStudyPlanGenerating, setIsStudyPlanGenerating] = useState(false);

  // Companion AI Interface Drawer
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Subject Tab Additional States
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState("#33D6FF");
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState("");
  
  // Drag-and-drop book upload helper state
  const [dragActiveSubjectId, setDragActiveSubjectId] = useState<string | null>(null);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);

  // Study Plan custom manual creation
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedSubId, setSelectedSubId] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>("Medium");
  const [newTaskDuration, setNewTaskDuration] = useState<number>(30);

  // Focus Mode / Pomodoro Timer States
  const [timerMode, setTimerMode] = useState<"focus" | "short_break" | "long_break">("focus");
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMaxSeconds, setTimerMaxSeconds] = useState(25 * 60);
  const [customTimerMinutes, setCustomTimerMinutes] = useState(25);
  
  // Use simple ref to keep accurate interval ticker
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadUserSystemState();
  }, [userId]);

  // Handle Focus task updates
  useEffect(() => {
    if (tasks.length > 0 && !focusTask) {
      const activeTask = tasks.find(t => t.status === "pending" || t.status === "in_progress");
      if (activeTask) setFocusTask(activeTask);
    }
  }, [tasks]);

  // Sound cues and tick handlers
  const loadUserSystemState = async () => {
    setIsLoader(true);
    try {
      // 1. Fetch Student Profile
      const profileSnap = await getDocs(query(collection(db, "student_profiles"), where("owner_id", "==", userId)));
      let studentProf: StudentProfile | null = null;
      if (!profileSnap.empty) {
        studentProf = { id: profileSnap.docs[0].id, ...profileSnap.docs[0].data() } as StudentProfile;
        // Merge optional field default fallbacks for visual analytics
        if (studentProf.streak === undefined) studentProf.streak = 3;
        if (studentProf.study_hours === undefined) studentProf.study_hours = 12.5;
        if (studentProf.consistency_score === undefined) studentProf.consistency_score = 85;
        setProfile(studentProf);
      }

      // 2. Fetch Subjects list
      const subjectsSnap = await getDocs(query(collection(db, "subjects"), where("owner_id", "==", userId)));
      const retrievedSubjects = subjectsSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Subject);
      setSubjects(retrievedSubjects);
      if (retrievedSubjects.length > 0) {
        setSelectedSubId(retrievedSubjects[0].id);
        setSelectedSubject(retrievedSubjects[0]);
      }

      // 3. Fetch Tasks
      const tasksSnap = await getDocs(query(collection(db, "tasks"), where("owner_id", "==", userId)));
      const retrievedTasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Task);
      setTasks(retrievedTasks);

      // 4. Fetch Focus sessions helper
      const sessionsSnap = await getDocs(query(collection(db, "focus_sessions"), where("owner_id", "==", userId)));
      const retrievedSessions = sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() }) as FocusSession);
      setFocusSessions(retrievedSessions);

      // 5. Fetch Quiz Attempts
      const attemptsSnap = await getDocs(query(collection(db, "quiz_attempts"), where("owner_id", "==", userId)));
      const retrievedAttempts = attemptsSnap.docs.map(d => ({ id: d.id, ...d.data() }) as QuizAttempt);
      setAttempts(retrievedAttempts);

      // 6. Fetch Mistakes
      const mistakesSnap = await getDocs(query(collection(db, "mistakes"), where("owner_id", "==", userId)));
      const retrievedMistakes = mistakesSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Mistake);
      setMistakes(retrievedMistakes);

      // 7. Fetch Flashcards
      const flashcardsSnap = await getDocs(query(collection(db, "flashcards"), where("owner_id", "==", userId)));
      const retrievedFlashcards = flashcardsSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Flashcard);
      setFlashcards(retrievedFlashcards);

      // 8. Fetch AI Insights
      const insightsSnap = await getDocs(query(collection(db, "ai_insights"), where("owner_id", "==", userId)));
      if (!insightsSnap.empty) {
        setAiInsights({ id: insightsSnap.docs[0].id, ...insightsSnap.docs[0].data() } as AIInsights);
      } else {
        setAiInsights({
          id: userId,
          owner_id: userId,
          best_study_time: "Needs evaluation data",
          weakest_subject: "Take deep quiz practice",
          strongest_subject: "Configure subjects list",
          difficult_topics: ["Verify core lesson blocks"],
          revision_schedule: "Engage in quiz feedback cycles to formulate custom revisions",
          updated_at: new Date().toISOString()
        });
      }

      // Load reactive notifications
      await loadNotificationsFeed();

      // Initialize welcome address
      setChatMessages([
        {
          id: "welcome",
          role: "model",
          content: `Noble Student Scholar ${studentProf ? studentProf.name : "Student"}, KABAKA Daily Tutor execution node is ready. 
We have loaded your profile. Complete today's learning objectives to solidify your streak or upload a reference book to let me write a custom syllabus!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

    } catch (err: any) {
      console.error("Error loading system state:", err);
      handleFirestoreError(err, OperationType.GET, "load-user-dashboard-data");
    } finally {
      setIsLoader(false);
    }
  };

  const loadNotificationsFeed = async () => {
    try {
      const snap = await getDocs(query(collection(db, "notifications"), where("owner_id", "==", userId)));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Notification);
      // Sort manually, ensuring zero index compilation fallback safety
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(list);
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  const handleAwardXP = async (
    xpGained: number, 
    title: string, 
    description: string, 
    type: 'task_reminder' | 'ai_suggestion' | 'quiz_result' | 'achievement_unlocked' | 'mistake_alert' | 'study_plan_update' = 'ai_suggestion'
  ) => {
    if (!profile) return;
    
    try {
      const currentXP = profile.xp || 0;
      const currentLevel = profile.level || 1;
      const newXP = currentXP + xpGained;
      
      const newLevel = Math.floor(newXP / 1000) + 1;
      const hasLeveledUp = newLevel > currentLevel;

      const profileRef = doc(db, "student_profiles", profile.id);
      const updatePayload: any = {
        xp: newXP,
        level: newLevel,
        updated_at: new Date().toISOString()
      };
      
      if (type === 'quiz_result') {
        updatePayload.consistency_score = Math.min(100, (profile.consistency_score || 85) + 2);
      } else if (type === 'achievement_unlocked') {
        updatePayload.study_hours = (profile.study_hours || 12.5) + 0.5;
      }

      await updateDoc(profileRef, updatePayload);
      setProfile(prev => prev ? { ...prev, ...updatePayload } : null);

      const notificationId = `notif-${Date.now()}`;
      const notifObj = {
        id: notificationId,
        owner_id: userId,
        type: type,
        title: title,
        content: `${description} (+${xpGained} XP)`,
        read: false,
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, "notifications", notificationId), notifObj);
      
      if (hasLeveledUp) {
        const lvNotifId = `notif-lvl-${Date.now()}`;
        const lvNotifObj = {
          id: lvNotifId,
          owner_id: userId,
          type: 'achievement_unlocked' as const,
          title: `👑 Level Up Unlocked!`,
          content: `Congratulations! You have risen from Level ${currentLevel} to Level ${newLevel}! Keep converting study goals.`,
          read: false,
          created_at: new Date().toISOString()
        };
        await setDoc(doc(db, "notifications", lvNotifId), lvNotifObj);
      }

      await loadNotificationsFeed();

    } catch (err) {
      console.error("Error setting XP award:", err);
    }
  };

  // ----------------------------------------------------
  // MODULE 1 & 3: COURSE / BOOK SYSTEM IMPLEMENTATION
  // ----------------------------------------------------

  // File Upload drag handler
  const handleBookUploadDrag = (e: React.DragEvent, subId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveSubjectId(subId);
    } else if (e.type === "dragleave") {
      setDragActiveSubjectId(null);
    }
  };

  // Simulated & real backend parsing triggering API
  const runBookAnalysisFlow = async (file: File, subject: Subject) => {
    setIsSyllabusParsing(subject.id);
    setUploadProgressText("Uploading reference material...");
    
    try {
      // Simulate brief uploading progress
      await new Promise(r => setTimeout(r, 800));
      setUploadProgressText("Processing book layouts...");
      await new Promise(r => setTimeout(r, 600));
      setUploadProgressText("Analyzing subject curricula via Gemini...");

      // Call high fidelity backend parser
      const response = await fetch("/api/analyze-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_name: subject.name,
          book_name: file.name
        })
      });

      if (!response.ok) {
        throw new Error("Sovereign KABAKA AI node returned an error state.");
      }

      const syllabusData = await response.json(); // returns { units: Array }
      
      const unitsArray: Unit[] = syllabusData.units || [];
      const unitsCount = unitsArray.length;
      const lessonsCount = unitsArray.reduce((acc, current) => acc + (current.lessons?.length || 0), 0);

      // Save syllabus units directly into Firestore subject doc as a sub-data
      const subjectDocRef = doc(db, "subjects", subject.id);
      const updatedSubjectData = {
        book_name: file.name,
        book_size: Math.round(file.size / 1024),
        book_type: file.type || "application/pdf",
        book_status: "analyzed" as const,
        units_count: unitsCount,
        lessons_count: lessonsCount,
        progress: 0,
        units: unitsArray,
        updated_at: new Date().toISOString()
      };

      await updateDoc(subjectDocRef, updatedSubjectData);

      // Commit changes locally
      setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, ...updatedSubjectData } : s));
      
      // Update selected subject details visually
      setSelectedSubject(prev => prev && prev.id === subject.id ? { ...prev, ...updatedSubjectData } : prev);

      // Generate custom starter tasks based on new syllabus
      if (unitsArray.length > 0) {
        const docBatch = writeBatch(db);
        const newAIGeneratedTasks: Task[] = [];
        
        // Add 2 initial task cards from Unit 1
        const unitOne = unitsArray[0];
        const initialLessons = unitOne.lessons.slice(0, 2);

        initialLessons.forEach((lesson, index) => {
          const tId = `task-gen-${index}-${Date.now()}`;
          const tObj: Task = {
            id: tId,
            subject_id: subject.id,
            subject_name: subject.name,
            title: `Solve Study Prompt: ${lesson} (${unitOne.title})`,
            status: "pending",
            priority: index === 0 ? "High" : "Medium",
            duration: 30,
            owner_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const taskRef = doc(db, "tasks", tId);
          docBatch.set(taskRef, tObj);
          newAIGeneratedTasks.push(tObj);
        });

        await docBatch.commit();
        setTasks(prev => [...prev, ...newAIGeneratedTasks]);
      }

    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `subjects/${subject.id}`);
    } finally {
      setIsSyllabusParsing(null);
      setDragActiveSubjectId(null);
      setUploadProgressText(null);
    }
  };

  const handleBookDrop = (e: React.DragEvent, subject: Subject) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveSubjectId(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      runBookAnalysisFlow(e.dataTransfer.files[0], subject);
    }
  };

  const handleBookFileSelect = (e: React.ChangeEvent<HTMLInputElement>, subject: Subject) => {
    if (e.target.files && e.target.files[0]) {
      runBookAnalysisFlow(e.target.files[0], subject);
    }
  };

  // Manage Subjects Add
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    const newSubId = `subject-${Date.now()}`;
    const newSubObj: Subject = {
      id: newSubId,
      owner_id: userId,
      name: newSubjectName.trim(),
      color: newSubjectColor,
      progress: 0,
      units_count: 0,
      lessons_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const subRef = doc(db, "subjects", newSubId);
      await setDoc(subRef, newSubObj);
      setSubjects(prev => [...prev, newSubObj]);
      setNewSubjectName("");
      setIsAddingSubject(false);
      setSelectedSubId(newSubId);
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.CREATE, "subjects");
    }
  };

  // Delete Course
  const handleDeleteSubject = async (subId: string) => {
    if (!confirm("Are you positive you wish to delete this course and all its related curriculum elements? This is irreversible.")) return;
    
    try {
      const subRef = doc(db, "subjects", subId);
      const batchObj = writeBatch(db);
      batchObj.delete(subRef);

      // Purge related task items as well
      const relatedTasks = tasks.filter(t => t.subject_id === subId);
      relatedTasks.forEach(t => {
        batchObj.delete(doc(db, "tasks", t.id));
      });

      await batchObj.commit();

      setSubjects(prev => prev.filter(s => s.id !== subId));
      setTasks(prev => prev.filter(t => t.subject_id !== subId));
      
      if (selectedSubject?.id === subId) {
        setSelectedSubject(null);
      }
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, `subjects/${subId}`);
    }
  };

  // Subject Edit (rename)
  const handleStartRenameSubject = (sub: Subject) => {
    setEditingSubjectId(sub.id);
    setEditingSubjectName(sub.name);
  };

  const handleSaveRenameSubject = async (subId: string) => {
    if (!editingSubjectName.trim()) return;
    try {
      const subRef = doc(db, "subjects", subId);
      await updateDoc(subRef, {
        name: editingSubjectName.trim(),
        updated_at: new Date().toISOString()
      });

      setSubjects(prev => prev.map(s => s.id === subId ? { ...s, name: editingSubjectName.trim() } : s));
      setEditingSubjectId(null);
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `subjects/${subId}`);
    }
  };


  // ----------------------------------------------------
  // MODULE 4 & 5: AI MODULE STUDY PLAN SCHEDULER
  // ----------------------------------------------------

  // AI-Controlled task scheduler formulation trigger
  const handleRegenerateAIPlan = async () => {
    if (subjects.length === 0) return;
    setIsStudyPlanGenerating(true);

    try {
      const response = await fetch("/api/generate-study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profile,
          subjects: subjects,
          tasks: tasks
        })
      });

      if (!response.ok) {
        throw new Error("Sovereign scheduler node failed execution.");
      }

      const planData = await response.json();
      const newTasks: Task[] = planData.tasks || [];

      if (newTasks.length > 0) {
        const batch = writeBatch(db);
        
        // Remove existing pending tasks to allow complete refresh
        const existingPending = tasks.filter(t => t.status === "pending" || t.status === "in_progress");
        existingPending.forEach(t => {
          batch.delete(doc(db, "tasks", t.id));
        });

        const createdTasksList: Task[] = [];
        
        newTasks.forEach((t, i) => {
          const tId = `task-plan-${i}-${Date.now()}`;
          const finalTaskObj: Task = {
            id: tId,
            subject_id: t.subject_id,
            subject_name: t.subject_name,
            title: t.title,
            status: "pending",
            priority: t.priority || "Medium",
            duration: t.duration || 30,
            owner_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          batch.set(doc(db, "tasks", tId), finalTaskObj);
          createdTasksList.push(finalTaskObj);
        });

        await batch.commit();

        // Refresh state
        setTasks(prev => {
          const completedTasks = prev.filter(t => t.status === "completed" || t.status === "skipped");
          return [...completedTasks, ...createdTasksList];
        });

        // Trigger motivational chat response
        setChatMessages(prev => [
          ...prev,
          {
            id: `plan-gen-${Date.now()}`,
            role: "model",
            content: `Sovereign Planner complete. I have structured yesterday's feedback and generated 4 tailored action objectives with optimal timeboxes matching your preferred ${profile?.learning_style || "adaptive sessions"}. Let's execute!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsChatOpen(true);
      }

    } catch (err: any) {
      console.error(err);
      alert("Study plan generation error: " + err.message);
    } finally {
      setIsStudyPlanGenerating(false);
    }
  };

  // Manual fast task creation submit
  const handleAddNewManualTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedSubId) return;

    const matchedSubject = subjects.find(s => s.id === selectedSubId);
    const newTaskId = `task-manual-${Date.now()}`;
    const newTaskObj: Task = {
      id: newTaskId,
      subject_id: selectedSubId,
      subject_name: matchedSubject?.name || "",
      title: newTaskTitle.trim(),
      status: "pending",
      priority: newTaskPriority,
      duration: newTaskDuration,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner_id: userId
    };

    try {
      setTasks(prev => [...prev, newTaskObj]);
      setNewTaskTitle("");
      
      const taskRef = doc(db, "tasks", newTaskId);
      await setDoc(taskRef, newTaskObj);
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.CREATE, "tasks");
    }
  };

  // Change task state
  const handleSetTaskStatus = async (taskId: string, targetStatus: 'pending' | 'in_progress' | 'completed' | 'skipped') => {
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));
      
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        status: targetStatus,
        updated_at: new Date().toISOString()
      });

      // Recalculate profile study metrics and consistency rating on transitions to final outcomes
      if (targetStatus === "completed" || targetStatus === "skipped") {
        recalculateProgressTelemetry();
      }
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };


  // ----------------------------------------------------
  // MODULE 6 & 7: TASK EXECUTION & FOCUS MODE TIMERS
  // ----------------------------------------------------

  const changeTimerModeSettings = (mode: "focus" | "short_break" | "long_break") => {
    setTimerMode(mode);
    setIsTimerRunning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    
    let minutes = 25;
    if (mode === "short_break") minutes = 5;
    if (mode === "long_break") minutes = 10;
    
    setSecondsRemaining(minutes * 60);
    setTimerMaxSeconds(minutes * 60);
    setCustomTimerMinutes(minutes);
  };

  const handleCustomTimerValueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTimerRunning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    
    const sec = customTimerMinutes * 60;
    setSecondsRemaining(sec);
    setTimerMaxSeconds(sec);
  };

  const handleToggleTimer = () => {
    if (isTimerRunning) {
      // Pause
      setIsTimerRunning(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    } else {
      // Start
      setIsTimerRunning(true);
      timerIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Timer expired!
            handleTimerExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setSecondsRemaining(timerMaxSeconds);
  };

  // Timer complete tick and logging trigger
  const handleTimerExpired = async () => {
    setIsTimerRunning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    
    // Play subtle audio cue if supported, or state alerts
    alert("KABAKA FOCUS BLOCK ACCOMPLISHED! Take a well-earned crown break.");

    if (timerMode === "focus" && focusTask) {
      await logFocusSessionCompletion(focusTask, Math.round(timerMaxSeconds / 60));
    }
  };

  // Force Save Focus Block now
  const handleForceLogFocusBlock = async () => {
    if (!focusTask) return;
    const minutesElapsed = Math.round((timerMaxSeconds - secondsRemaining) / 60);
    if (minutesElapsed < 1) {
      alert("Please focus for at least 1 whole minute to submit stats logs.");
      return;
    }
    await logFocusSessionCompletion(focusTask, minutesElapsed);
    handleResetTimer();
  };

  // Securely Log Focus Stats and sync profile metrics in Firestore (ABAC Guard)
  const logFocusSessionCompletion = async (task: Task, durationMin: number) => {
    const sId = `session-${Date.now()}`;
    const newSession: FocusSession = {
      id: sId,
      owner_id: userId,
      task_id: task.id,
      task_title: task.title,
      subject_id: task.subject_id,
      subject_name: task.subject_name || "General Course",
      duration: durationMin,
      completed_at: new Date().toISOString()
    };

    try {
      // 1. Save Focus session
      const sessRef = doc(db, "focus_sessions", sId);
      await setDoc(sessRef, newSession);
      setFocusSessions(prev => [...prev, newSession]);

      // 2. Set Task as Completed
      const taskRef = doc(db, "tasks", task.id);
      await updateDoc(taskRef, {
        status: "completed",
        updated_at: new Date().toISOString()
      });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "completed" } : t));

      // 3. Increment study hours, bolster streak, recalculate scores on profiles
      const profileRef = doc(db, "student_profiles", userId);
      const prevHours = profile?.study_hours || 0;
      const prevStreak = profile?.streak || 0;
      
      const addedHrs = durationMin / 60;
      const newHrs = parseFloat((prevHours + addedHrs).toFixed(1));
      const nextStreak = prevStreak + 1;

      await updateDoc(profileRef, {
        study_hours: newHrs,
        streak: nextStreak,
        updated_at: new Date().toISOString()
      });

      setProfile(prev => prev ? { ...prev, study_hours: newHrs, streak: nextStreak } : null);

      recalculateProgressTelemetry();

      setChatMessages(prev => [
        ...prev,
        {
          id: `focus-log-${Date.now()}`,
          role: "model",
          content: `Veni, Vidi, Vici! Excellent effort, Scholar. Focus block of ${durationMin} minutes has been logged for "${task.title}". Study hours expanded to ${newHrs} hours, adding 1 day to your study streak!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsChatOpen(true);

    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.CREATE, "focus_sessions");
    }
  };

  // Periodic Telemetry calculation
  const recalculateProgressTelemetry = async () => {
    try {
      const qTasks = await getDocs(query(collection(db, "tasks"), where("owner_id", "==", userId)));
      const freshTasks = qTasks.docs.map(d => d.data());
      if (freshTasks.length === 0) return;

      const completed = freshTasks.filter(t => t.status === "completed").length;
      const total = freshTasks.length;
      const consistency = Math.round((completed / total) * 100);

      // Save directly to Firestore profile sync
      const profileRef = doc(db, "student_profiles", userId);
      await updateDoc(profileRef, {
        consistency_score: consistency,
        updated_at: new Date().toISOString()
      });

      setProfile(prev => prev ? { ...prev, consistency_score: consistency } : null);
    } catch (err: any) {
      console.error("Telemetry failed:", err);
    }
  };

  // ====================================================
  // PHASE 3 — COGNITIVE AI TUTOR FUNCTIONS
  // ====================================================

  // 1. Explain Mode
  const handleQueryExplain = async () => {
    if (!explainTopic.trim()) return;
    setIsExplainLoading(true);
    setExplainResult("");
    
    // find matching subject name
    const matchingSubject = subjects[0]?.name || "General study course";

    try {
      const response = await fetch("/api/ai-tutor/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: explainTopic,
          mode: explainMode,
          subject_name: matchingSubject
        })
      });

      if (response.ok) {
        const data = await response.json();
        setExplainResult(data.explanation);
      } else {
        setExplainResult("KABAKA's tutoring register is slightly congested at the moment.");
      }
    } catch (err) {
      console.error(err);
      setExplainResult("Failed to contact KABAKA explain controller.");
    } finally {
      setIsExplainLoading(false);
    }
  };

  // Study specific lesson from subjects tab
  const handleStudyLesson = async (unitTitle: string, lessonTitle: string, forceMode?: "brief" | "detailed") => {
    const targetMode = forceMode || lessonExplanationMode;
    setActiveStudyLesson({ unitTitle, lessonTitle });
    setIsLessonLoading(true);
    setLessonExplanation("");
    setLessonQAHistory([]);
    setLessonQuestion("");

    try {
      const modeParam = targetMode === "brief" ? "summary" : "deep";
      const response = await fetch("/api/ai-tutor/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: `${unitTitle} - ${lessonTitle}`,
          mode: modeParam,
          subject_name: selectedSubject?.name || "General course"
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLessonExplanation(data.explanation);
      } else {
        setLessonExplanation("Unable to generate an explanation for this lesson. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setLessonExplanation("Error contacting AI Assistant core.");
    } finally {
      setIsLessonLoading(false);
    }
  };

  const handleToggleLessonMode = async (nextMode: "brief" | "detailed") => {
    setLessonExplanationMode(nextMode);
    if (activeStudyLesson) {
      await handleStudyLesson(activeStudyLesson.unitTitle, activeStudyLesson.lessonTitle, nextMode);
    }
  };

  const handleAskLessonQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonQuestion.trim() || !activeStudyLesson) return;

    const currentQuestion = lessonQuestion.trim();
    setLessonQuestion("");
    setIsLessonQALoading(true);

    // Optimistically add to QA list
    const placeholderQA = { q: currentQuestion, a: "Thinking..." };
    setLessonQAHistory(prev => [...prev, placeholderQA]);

    try {
      const prompt = `Student has been studying the lesson "${activeStudyLesson.lessonTitle}" (from unit "${activeStudyLesson.unitTitle}") in the subject "${selectedSubject?.name}".
The current explanation of the lesson was:
"${lessonExplanation || "Brief breakdown of core lesson objectives."}"

The student asked this specific question: "${currentQuestion}"

Provide a highly simplified, intuitive, and direct response explaining it to them. Be helpful, clear, and encouraging.`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: prompt }
          ],
          profile,
          subjects: subjects.map(s => s.name)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLessonQAHistory(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1].a = data.text;
          }
          return updated;
        });
      } else {
        setLessonQAHistory(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1].a = "Unable to generate an answer. Please try again.";
          }
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
      setLessonQAHistory(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].a = "Error talking to AI assistant.";
        }
        return updated;
      });
    } finally {
      setIsLessonQALoading(false);
    }
  };

  // 2. Quiz Generator
  const handleTriggerQuizGeneration = async () => {
    const sub = subjects.find(s => s.id === quizSubjectId) || subjects[0];
    if (!sub) return;

    setIsQuizGenerating(true);
    setActiveQuiz(null);
    setQuizCurrentIdx(0);
    setQuizAnswers([]);
    setQuizSelectedOption("");
    setQuizShortAnswerText("");
    setQuizIsAnswerRevealed(false);
    setQuizScore(0);
    setQuizTimer(180); // 3 minutes
    setQuizIsCompleted(false);

    if (quizTimerRef.current) clearInterval(quizTimerRef.current);

    try {
      // Find historical mistakes in mistakes list for this subject to build adaptivity
      const subMistakes = mistakes.filter(m => m.subject_id === sub.id).map(m => m.question);

      const response = await fetch("/api/ai-tutor/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_name: sub.name,
          quiz_type: quizType,
          difficulty: quizDifficulty,
          weak_points: subMistakes
        })
      });

      if (response.ok) {
        const qData = await response.json();
        const generatedQ: Quiz = {
          id: `quiz-${Date.now()}`,
          owner_id: userId,
          subject_id: sub.id,
          subject_name: sub.name,
          type: quizType,
          difficulty: quizDifficulty,
          questions: qData.questions || [],
          created_at: new Date().toISOString()
        };

        // Save generated quiz to quizzes collection
        await setDoc(doc(db, "quizzes", generatedQ.id), generatedQ);
        
        setActiveQuiz(generatedQ);

        // Start countdown timer
        quizTimerRef.current = setInterval(() => {
          setQuizTimer(prev => {
            if (prev <= 1) {
              if (quizTimerRef.current) clearInterval(quizTimerRef.current);
              handleFinishQuiz();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      console.error("Quiz init failed:", err);
    } finally {
      setIsQuizGenerating(false);
    }
  };

  // Check Answer
  const handleCheckAnswer = async () => {
    if (!activeQuiz) return;
    const currentQ = activeQuiz.questions[quizCurrentIdx];
    let studentAns = "";
    if (currentQ.type === "multiple_choice") {
      studentAns = quizSelectedOption;
    } else if (currentQ.type === "true_false") {
      studentAns = quizSelectedOption;
    } else {
      studentAns = quizShortAnswerText;
    }

    const isCorrect = studentAns.trim().toLowerCase() === currentQ.correct_answer.trim().toLowerCase();
    
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
    } else {
      // EVENT SYSTEM: WHEN MISTAKE OCCURS -> Log in Firestore 'mistakes' collection!
      try {
        const misId = `mistake-${Date.now()}`;
        const newMistake: Mistake = {
          id: misId,
          owner_id: userId,
          subject_id: activeQuiz.subject_id,
          subject_name: activeQuiz.subject_name,
          question: currentQ.question,
          student_answer: studentAns,
          correct_answer: currentQ.correct_answer,
          topic: currentQ.explanation.substring(0, 50) + "..",
          weakness_score: 1,
          created_at: new Date().toISOString()
        };
        await setDoc(doc(db, "mistakes", misId), newMistake);
        setMistakes(prev => [newMistake, ...prev]);
      } catch (err) {
        console.error("Failed to store mistake in Error Bank:", err);
      }
    }

    setQuizAnswers(prev => [...prev, studentAns]);
    setQuizIsAnswerRevealed(true);
  };

  const handleNextQuizQuestion = () => {
    if (!activeQuiz) return;
    if (quizCurrentIdx + 1 < activeQuiz.questions.length) {
      setQuizCurrentIdx(prev => prev + 1);
      setQuizSelectedOption("");
      setQuizShortAnswerText("");
      setQuizIsAnswerRevealed(false);
    } else {
      handleFinishQuiz();
    }
  };

  const handleFinishQuiz = async () => {
    if (quizTimerRef.current) clearInterval(quizTimerRef.current);
    if (!activeQuiz) return;

    const timeSpent = 180 - quizTimer;
    const attemptId = `attempt-${Date.now()}`;
    const quizAttemptObj: QuizAttempt = {
      id: attemptId,
      owner_id: userId,
      quiz_id: activeQuiz.id,
      subject_id: activeQuiz.subject_id,
      subject_name: activeQuiz.subject_name,
      score: quizScore,
      total_questions: activeQuiz.questions.length,
      time_taken: timeSpent,
      answers: quizAnswers,
      mistakes: [], 
      created_at: new Date().toISOString()
    };

    try {
      // 1. Save Attempt in Firestore
      await setDoc(doc(db, "quiz_attempts", attemptId), quizAttemptObj);
      setAttempts(prev => [quizAttemptObj, ...prev]);

      // 2. Event System: Update Student Profile streak and stats
      if (profile) {
        const profRef = doc(db, "student_profiles", profile.id);
        const updatedHours = profile.study_hours + parseFloat((timeSpent / 3600).toFixed(2));
        const updatedScore = profile.consistency_score + 2 > 100 ? 100 : profile.consistency_score + 2;
        const newStreak = profile.streak + 1;
        const upMap = {
          study_hours: updatedHours,
          consistency_score: updatedScore,
          streak: newStreak
        };
        await updateDoc(profRef, upMap);
        setProfile(prev => prev ? { ...prev, ...upMap } : null);
      }

      setQuizIsCompleted(true);
      
      // 3. Auto-trigger Intelligence Insight Recalculation
      handleGenerateInsights();

    } catch (err: any) {
      console.error("Error submitting quiz attempt:", err);
    }
  };

  // AI Cognitive Insights Recalculator
  const handleGenerateInsights = async () => {
    setIsInsightsLoading(true);
    try {
      const response = await fetch("/api/ai-tutor/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects: subjects,
          mistakes: mistakes,
          focus_sessions: focusSessions,
          tasks: tasks
        })
      });

      if (response.ok) {
        const data = await response.json();
        const insightObj: AIInsights = {
          id: userId,
          owner_id: userId,
          best_study_time: data.best_study_time,
          weakest_subject: data.weakest_subject,
          strongest_subject: data.strongest_subject,
          difficult_topics: data.difficult_topics || [],
          revision_schedule: data.revision_schedule,
          updated_at: new Date().toISOString()
        };

        await setDoc(doc(db, "ai_insights", userId), insightObj);
        setAiInsights(insightObj);
      }
    } catch (err) {
      console.error("Failed to generate AI insights:", err);
    } finally {
      setIsInsightsLoading(false);
    }
  };

  // Flashcard Generation
  const handleTriggerFlashcardGeneration = async () => {
    const sub = subjects.find(s => s.id === cardSubjectId) || subjects[0];
    if (!sub) return;

    setIsFlashcardsGenerating(true);
    try {
      const contextStr = mistakes.filter(m => m.subject_id === sub.id).map(m => m.question).join(", ");
      const response = await fetch("/api/ai-tutor/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_name: sub.name,
          source: cardSource,
          context: contextStr || "curriculum milestones"
        })
      });

      if (response.ok) {
        const data = await response.json();
        const cards: Flashcard[] = data.flashcards || [];
        
        const docBatch = writeBatch(db);
        const storedCards: Flashcard[] = [];

        cards.forEach((card, index) => {
          const cardId = `card-${Date.now()}-${index}`;
          const cardObj: Flashcard = {
            id: cardId,
            owner_id: userId,
            subject_id: sub.id,
            subject_name: sub.name,
            front: card.front,
            back: card.back,
            source: cardSource,
            created_at: new Date().toISOString()
          };
          docBatch.set(doc(db, "flashcards", cardId), cardObj);
          storedCards.push(cardObj);
        });

        await docBatch.commit();
        setFlashcards(prev => [...storedCards, ...prev]);
        setActiveCardIdx(0);
        setIsCardFlipped(false);
      }
    } catch (err) {
      console.error("Error generating flashcards:", err);
    } finally {
      setIsFlashcardsGenerating(false);
    }
  };

  // Clear mistake from Error Bank
  const handleMasterMistake = async (mistakeId: string) => {
    try {
      await deleteDoc(doc(db, "mistakes", mistakeId));
      setMistakes(prev => prev.filter(m => m.id !== mistakeId));
    } catch (err) {
      console.error(err);
    }
  };

  // Delete flashcard
  const handleDeleteFlashcard = async (cardId: string) => {
    try {
      await deleteDoc(doc(db, "flashcards", cardId));
      setFlashcards(prev => prev.filter(c => c.id !== cardId));
      if (activeCardIdx >= flashcards.length - 1 && activeCardIdx > 0) {
        setActiveCardIdx(prev => prev - 1);
      }
      setIsCardFlipped(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Error Diagnosis analyst
  const handleRunDiagnosis = async () => {
    setIsErrorDiagnosisLoading(true);
    setErrorDiagnosisResult("");
    try {
      const matchingSubject = subjects[0]?.name || "Active curriculum";
      const mistakesPrompts = mistakes.map(m => m.question).join("\n- ");
      const prompt = `Diagnose and evaluate errors from our study cabinet for course: ${matchingSubject}.
Mistakes occurring:
- ${mistakesPrompts || "None yet logged"}

Identify the conceptual misunderstanding pattern, output top 1-2 weak topics, and outline similar questions or study targets to review immediately. Keeping it in structured short blocks.`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          profile: profile,
          subjects: [matchingSubject]
        })
      });

      if (response.ok) {
        const data = await response.json();
        setErrorDiagnosisResult(data.text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsErrorDiagnosisLoading(false);
    }
  };

  // Clean timer loops on dismantle
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (quizTimerRef.current) clearInterval(quizTimerRef.current);
    };
  }, []);

  // ----------------------------------------------------
  // MODULE 9: INTERACTIVE COMPANION AI CHATBOX
  // ----------------------------------------------------

  const handleSendChatQuery = async (presetText?: string) => {
    const qString = presetText || chatInput;
    if (!qString.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: qString.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const hist = [...chatMessages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const activeSubNames = subjects.map(s => s.name);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: hist,
          profile: profile,
          subjects: activeSubNames
        })
      });

      if (!res.ok) {
        throw new Error("Chat sat node failed.");
      }

      const resData = await res.json();
      
      const modelMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        role: "model",
        content: resData.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "model",
          content: "Noble scholar, my AI telemetry loops are slightly congested. Let's perform that check again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };


  // ----------------------------------------------------
  // TELEMETRY VISUALS CALCULATOR HELPERS
  // ----------------------------------------------------

  // Calculate subject completed ratio
  const calculateCourseCompleted = (subId: string) => {
    const sTasks = tasks.filter(t => t.subject_id === subId);
    if (sTasks.length === 0) return 0;
    const done = sTasks.filter(t => t.status === "completed").length;
    return Math.round((done / sTasks.length) * 100);
  };

  const getPriorityDisplayClass = (priority?: string) => {
    if (priority === "High") return "bg-brand-accent-pink/10 text-brand-accent-pink border-brand-accent-pink/20";
    if (priority === "Medium") return "bg-brand-primary/10 text-brand-primary border-brand-primary/20";
    return "bg-[#B7F34D]/10 text-brand-text-primary border-[#B7F34D]/20";
  };


  if (isLoader) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#F7FAFF]">
        <div className="flex flex-col items-center">
          <img src={logoJpg} alt="Mascot Logo" className="h-12 w-12 rounded-full object-cover animate-bounce mb-3" referrerPolicy="no-referrer" />
          <p className="text-xs font-bold text-brand-text-secondary uppercase tracking-widest animate-pulse font-mono">Initializing Royal Study Room...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="full-study-workspace" className="min-h-[85vh] bg-[#F7FAFF] flex flex-col lg:flex-row border-t border-brand-border h-full">
      
      {/* 1. STRUCTURAL SIDEBAR NAV (PHASE 2 REQUIREMENT) */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-brand-border shrink-0 p-5 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="hidden lg:block pb-4 border-b border-brand-border">
            <span className="text-[10px] text-brand-text-secondary uppercase tracking-widest font-bold">Cabinet Desk</span>
            <p className="text-xs font-semibold text-brand-text-primary mt-0.5">Sovereign State Active</p>
          </div>

          <nav className="space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: <Layers className="h-4 w-4" />, action: () => { setActiveTab("dashboard"); } },
              { id: "subjects", label: "My Subjects", icon: <BookOpen className="h-4 w-4" />, action: () => { setActiveTab("subjects"); } },
              { id: "study_plan", label: "Study Plan", icon: <Calendar className="h-4 w-4" />, action: () => { setActiveTab("study_plan"); } },
              { id: "focus_mode", label: "Focus Mode", icon: <Clock className="h-4 w-4" />, action: () => { setActiveTab("focus_mode"); } },
              { id: "quizzes", label: "Quizzes", icon: <Award className="h-4 w-4" />, action: () => { setActiveTab("tutor"); setTutorSubTab("quiz"); } },
              { id: "flashcards", label: "Flashcards", icon: <Sliders className="h-4 w-4" />, action: () => { setActiveTab("tutor"); setTutorSubTab("flashcards"); } },
              { id: "tutor", label: "AI Assistant", icon: <Brain className="h-4 w-4" />, action: () => { setActiveTab("tutor"); setTutorSubTab("explain"); } },
              { id: "divider" },
              { id: "mistakes", label: "Review Mistakes", icon: <AlertCircle className="h-4 w-4" />, action: () => { setActiveTab("tutor"); setTutorSubTab("mistakes"); } },
              { id: "progress", label: "M Progress", icon: <BarChart2 className="h-4 w-4" />, action: () => { setActiveTab("progress"); } },
              { id: "achievements", label: "Achievements", icon: <Award className="h-4 w-4" />, action: () => { setActiveTab("achievements"); } },
              { id: "settings", label: "Settings", icon: <Sliders className="h-4 w-4" />, action: () => { setActiveTab("settings"); } }
            ].map((tabItem, idx) => {
              if (tabItem.id === "divider") {
                return <div key={`div-${idx}`} className="my-2 border-t border-brand-border" />;
              }

              const isItemActive = (() => {
                if (tabItem.id === "dashboard") return activeTab === "dashboard";
                if (tabItem.id === "subjects") return activeTab === "subjects";
                if (tabItem.id === "study_plan") return activeTab === "study_plan";
                if (tabItem.id === "focus_mode") return activeTab === "focus_mode";
                if (tabItem.id === "quizzes") return activeTab === "tutor" && tutorSubTab === "quiz";
                if (tabItem.id === "flashcards") return activeTab === "tutor" && tutorSubTab === "flashcards";
                if (tabItem.id === "tutor") return activeTab === "tutor" && !["quiz", "flashcards", "mistakes"].includes(tutorSubTab);
                if (tabItem.id === "mistakes") return activeTab === "tutor" && tutorSubTab === "mistakes";
                if (tabItem.id === "progress") return activeTab === "progress";
                if (tabItem.id === "achievements") return activeTab === "achievements";
                if (tabItem.id === "settings") return activeTab === "settings";
                return false;
              })();

              return (
                <button
                  key={tabItem.id}
                  onClick={tabItem.action}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${isItemActive ? "bg-brand-primary/10 text-brand-primary font-extrabold shadow-sm border-l-4 border-brand-primary" : "text-brand-text-secondary hover:bg-brand-bg hover:text-brand-text-primary"}`}
                >
                  {tabItem.icon}
                  <span>{tabItem.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User details capsule */}
        <div className="pt-4 border-t border-brand-border mt-6 space-y-3.5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-[#B7F34D]/20 text-[#A7E163] font-bold text-xs flex items-center justify-center border border-[#B7F34D]/40">
              🎓
            </div>
            <div className="text-left font-sans">
              <p className="text-xs font-extrabold text-brand-text-primary truncate max-w-[130px]">{profile?.name}</p>
              <p className="text-[9px] uppercase tracking-wider font-semibold text-brand-text-secondary">AI Study Room Student</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setIsChatOpen(true)}
              className="flex-grow flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-primary text-brand-text-primary rounded-xl font-bold text-xs shadow-soft transition-all active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              AI Chat
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-600 border border-brand-border hover:border-rose-200 rounded-xl font-bold text-xs shadow-soft transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. DYNAMIC WORKSPACE STAGE AREA */}
      <main className="flex-grow p-6 lg:p-8 overflow-y-auto max-w-5xl mx-auto w-full transition-all">
        
        {/* TAB 1: MASTER DASHBOARD VIEW */}
        {activeTab === "dashboard" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            
            {/* Top Welcome Royal Banner */}
            <div className="rounded-2xl border border-brand-border bg-white p-6 md:p-8 shadow-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-brand-primary/5 -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="space-y-1.5 z-10">
                <span className="text-[10px] bg-brand-accent-pink/15 text-brand-accent-pink border border-brand-accent-pink/20 px-2 rounded-md font-bold uppercase tracking-widest inline-block">Active Momentum</span>
                <h2 className="font-display text-2xl font-black text-brand-text-primary tracking-tight">Focus State: Studying</h2>
                <p className="text-xs text-brand-text-secondary max-w-xl leading-relaxed">
                  Welcome back! Upload your textbooks to let KABAKA list your lessons, generate custom study plans, and help zoom into your weak points with interactive micro-learning.
                </p>
                
                <div className="flex gap-2.5 mt-4 flex-wrap text-[10px] font-bold uppercase tracking-wider">
                  <span className="bg-brand-bg px-2.5 py-1.5 rounded-lg border border-brand-border flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-brand-primary" />
                    Target: {profile?.hours_per_day} hrs/day
                  </span>
                  <span className="bg-brand-bg px-2.5 py-1.5 rounded-lg border border-brand-border flex items-center gap-1">
                    <Target className="h-3.5 w-3.5 text-brand-accent-pink" />
                    Focus Level: {profile?.focus_level}
                  </span>
                  <span className="bg-brand-bg px-2.5 py-1.5 rounded-lg border border-brand-border flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-brand-success" />
                    Consistency Score: {profile?.consistency_score}%
                  </span>
                </div>
              </div>

              {/* Dynamic Day Streak Display */}
              <div className="flex flex-col items-center shrink-0 bg-brand-bg rounded-xl border border-brand-border px-5 py-4 min-w-[130px] text-center shadow-inner z-10">
                <span className="text-[9px] uppercase font-bold tracking-widest text-[#FF5F9E]">Study streak</span>
                <span className="text-4xl font-extrabold text-[#00E5FF] mt-1.5 flex items-center gap-1 justify-center font-mono">
                  <Zap className="h-7 w-7 text-brand-primary fill-none shrink-0" />
                  {profile?.streak}
                </span>
                <span className="text-[10px] text-brand-text-secondary font-semibold mt-1">Active Days</span>
              </div>
            </div>

            {/* AI Prompt Wizard Widget */}
            <div className="bg-white border border-brand-border rounded-xl p-5 shadow-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex gap-3.5 items-start">
                <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0 animate-pulse">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-brand-text-primary">KABAKA AI Advisory Queue</h4>
                  <p className="text-xs text-brand-text-secondary mt-0.5">Press to ask the royal assistant for study routines or curriculum guidelines instantly.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(true)}
                className="w-full md:w-auto px-5 py-2.5 bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary font-bold text-xs rounded-xl shadow-soft cursor-pointer shrink-0 transition-all active:scale-[0.98]"
              >
                Confer with Advisor
              </button>
            </div>

            {/* Quick Status and Priority overview lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Tasks List */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-brand-border p-5 shadow-soft space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-brand-border">
                  <div className="flex items-center gap-2">
                    <ListTodo className="h-4 w-4 text-brand-primary" />
                    <h3 className="font-bold text-sm text-brand-text-primary">Today's Operating Tasks</h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab("study_plan")}
                    className="text-[10px] text-brand-primary hover:underline font-bold uppercase tracking-wider"
                  >
                    Manage Board
                  </button>
                </div>

                {tasks.filter(t => t.status === "pending" || t.status === "in_progress").length === 0 ? (
                  <div className="py-12 text-center text-xs text-brand-text-secondary font-medium">
                    <CheckCircle className="h-8 w-8 text-[#B7F34D] mx-auto mb-2.5" />
                    All tasks accomplished! Refresh or regenerate using KABAKA AI in the Study Plan center.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {tasks.filter(t => t.status === "pending" || t.status === "in_progress").map((t) => (
                      <div key={t.id} className="flex justify-between items-center p-3 border border-brand-border bg-brand-bg rounded-xl text-xs hover:border-brand-primary/30 transition-all">
                        <div className="flex items-center gap-3">
                          <span className="h-2 w-2 rounded-full bg-brand-primary" />
                          <div>
                            <p className="font-bold text-brand-text-primary">{t.title}</p>
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-brand-text-secondary">{t.subject_name}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 border rounded-md font-bold text-[9px] uppercase tracking-wider ${getPriorityDisplayClass(t.priority)}`}>
                            {t.priority || 'Medium'}
                          </span>
                          <button 
                            onClick={() => {
                              setFocusTask(t);
                              setActiveTab("focus_mode");
                            }}
                            className="bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary p-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide cursor-pointer shadow-soft"
                          >
                            Focus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Course Progress Summary */}
              <div className="bg-white rounded-xl border border-brand-border p-5 shadow-soft space-y-4 flex flex-col justify-between">
                <div>
                  <div className="pb-3 border-b border-brand-border">
                    <h3 className="font-bold text-sm text-brand-text-primary">Subject Index</h3>
                  </div>

                  {subjects.length === 0 ? (
                    <div className="py-10 text-center text-xs text-brand-text-secondary italic">No subjects added. Visit "My Subjects" on your sidebar.</div>
                  ) : (
                    <div className="space-y-3 mt-4">
                      {subjects.slice(0, 3).map((sub) => {
                        const progress = calculateCourseCompleted(sub.id);
                        return (
                          <div key={sub.id} className="space-y-1 text-xs">
                            <div className="flex justify-between items-center text-[11px] font-semibold text-brand-text-primary">
                              <span className="truncate max-w-[120px]">{sub.name}</span>
                              <span className="font-mono">{progress}%</span>
                            </div>
                            <div className="w-full bg-brand-bg rounded-full h-1.5 overflow-hidden">
                              <div style={{ width: `${progress}%`, backgroundColor: sub.color }} className="h-full rounded-full transition-all"></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setActiveTab("subjects")}
                  className="w-full border border-brand-border bg-white hover:bg-brand-bg p-2 rounded-xl text-center text-[10px] text-brand-text-secondary font-bold uppercase tracking-wider mt-4"
                >
                  Manage Materials ({subjects.length})
                </button>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 2: SUBJECTS & BOOK SYSTEM (MODULE 1 & 3) */}
        {activeTab === "subjects" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex justify-between items-center pb-4 border-b border-brand-border">
              <div>
                <h2 className="font-display text-2xl font-black text-brand-text-primary tracking-tight">My Subjects & Lessons</h2>
                <p className="text-xs text-brand-text-secondary mt-0.5">Upload textbook files (.pdf, .txt, or images) to let AI list the lessons and plan study sessions for you.</p>
              </div>
              <button
                onClick={() => setIsAddingSubject(!isAddingSubject)}
                className="bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary p-2 px-4 rounded-xl text-xs font-bold shadow-soft flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Subject
              </button>
            </div>

            {/* Slide-down adding subjects form */}
            <AnimatePresence>
              {isAddingSubject && (
                <motion.form 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleCreateSubject}
                  className="bg-white border border-brand-border p-5 rounded-xl shadow-soft space-y-4 overflow-hidden"
                >
                  <h4 className="font-bold text-xs text-brand-text-primary uppercase tracking-widest">Add New Subject</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text"
                      placeholder="e.g. Inorganic Chemistry, World History..."
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      className="flex-grow rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 text-xs text-brand-text-primary focus:border-brand-primary focus:outline-none"
                    />
                    
                    <div className="flex gap-2.5 items-center">
                      <span className="text-xs font-semibold text-brand-text-secondary">Pick Color Tag:</span>
                      <div className="flex gap-1.5">
                        {["#33D6FF", "#FF5F9E", "#B7F34D", "#FFAE42", "#A389F4"].map((clr) => (
                          <button
                            key={clr}
                            type="button"
                            onClick={() => setNewSubjectColor(clr)}
                            style={{ backgroundColor: clr }}
                            className={`h-6 w-6 rounded-full border border-brand-border relative cursor-pointer ${newSubjectColor === clr ? "scale-110 shadow-md ring-2 ring-brand-primary" : ""}`}
                          />
                        ))}
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="bg-brand-primary text-brand-text-primary hover:bg-[#2bc4ec] font-bold text-xs p-2.5 px-5 rounded-xl cursor-pointer"
                    >
                      Add Course
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Courses / Subjects Layout */}
            {subjects.length === 0 ? (
              <div className="py-20 text-center bg-white border border-brand-border rounded-xl">
                <BookOpen className="h-12 w-12 text-brand-border mx-auto mb-3" />
                <p className="text-sm font-semibold text-brand-text-primary">No subjects added yet.</p>
                <p className="text-xs text-brand-text-secondary mt-1 max-w-sm mx-auto">Create your first subject by clicking the add subject button above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subjects.map((sub) => {
                  const isParsing = isSyllabusParsing === sub.id;
                  const isDragActive = dragActiveSubjectId === sub.id;
                  const complRate = calculateCourseCompleted(sub.id);

                  return (
                    <div 
                      key={sub.id} 
                      className="bg-white border border-brand-border rounded-xl p-5 shadow-soft hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start pb-3 border-b border-brand-border">
                          <div className="flex gap-2.5 items-center">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: sub.color }} />
                            {editingSubjectId === sub.id ? (
                              <input 
                                type="text"
                                value={editingSubjectName}
                                onChange={(e) => setEditingSubjectName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSaveRenameSubject(sub.id)}
                                className="border border-brand-primary rounded bg-brand-bg px-2 py-0.5 text-xs text-brand-text-primary"
                                autoFocus
                              />
                            ) : (
                              <h3 className="font-bold text-sm text-brand-text-primary">{sub.name}</h3>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 text-[10px]">
                            {editingSubjectId === sub.id ? (
                              <button 
                                onClick={() => handleSaveRenameSubject(sub.id)} 
                                className="text-brand-primary font-bold uppercase tracking-wider hover:underline"
                              >
                                Save
                              </button>
                            ) : (
                              <>
                                <button 
                                  onClick={() => handleStartRenameSubject(sub)} 
                                  className="text-brand-text-secondary hover:text-brand-primary font-bold uppercase tracking-wider"
                                >
                                  Edit
                                </button>
                                <span className="text-brand-border">|</span>
                                <button 
                                  onClick={() => handleDeleteSubject(sub.id)} 
                                  className="text-brand-text-secondary hover:text-brand-accent-pink font-bold uppercase tracking-wider"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Syllabus stats */}
                        <div className="grid grid-cols-3 gap-2.5 text-center bg-brand-bg p-3 border border-brand-border rounded-xl">
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-brand-text-secondary block">Units</span>
                            <span className="text-sm font-bold text-brand-text-primary">{sub.units_count || 0}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-brand-text-secondary block">Lessons</span>
                            <span className="text-sm font-bold text-[#00E5FF]">{sub.lessons_count || 0}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-semibold text-brand-text-secondary block">Syllabus Progress</span>
                            <span className="text-sm font-bold text-brand-success">{complRate}%</span>
                          </div>
                        </div>

                        {/* Interactive Drag & Drop Area */}
                        {sub.book_status === "analyzed" ? (
                          <div className="p-3 bg-brand-primary/5 hover:bg-brand-primary/10 transition-colors border border-brand-primary/10 rounded-xl space-y-2.5 text-xs text-brand-text-secondary leading-relaxed">
                            <div className="flex items-center gap-1.5 font-bold text-brand-text-primary">
                              <FileText className="h-4 w-4 text-brand-primary shrink-0" />
                              <span className="truncate max-w-[190px]">{sub.book_name}</span>
                            </div>
                            <p className="text-[10px]">Reference active. Let's inspect lessons or regenerate our schedule plan!</p>
                            
                            {/* Expand syllabus units list */}
                            <button
                              onClick={() => setSelectedSubject(sub)}
                              className="w-full text-center py-2 bg-white hover:bg-brand-primary/10 border border-brand-border rounded-lg text-[10px] font-bold uppercase tracking-wider text-brand-primary cursor-pointer active:scale-[0.98] transition-all"
                            >
                              Explore Lesson Hierarchy
                            </button>
                          </div>
                        ) : isParsing ? (
                          <div className="p-5 border-2 border-dashed border-brand-primary/40 rounded-xl bg-brand-primary/5 text-center flex flex-col items-center">
                            <div className="h-7 w-7 rounded-full border-2 border-dashed border-brand-primary animate-spin mb-2" />
                            <p className="text-xs font-semibold text-brand-text-primary">{uploadProgressText}</p>
                            <p className="text-[10px] text-brand-text-secondary animate-pulse mt-0.5">Please hold. Constructing detailed learning index...</p>
                          </div>
                        ) : (
                          <div 
                            onDragEnter={(e) => handleBookUploadDrag(e, sub.id)}
                            onDragOver={(e) => handleBookUploadDrag(e, sub.id)}
                            onDragLeave={(e) => handleBookUploadDrag(e, sub.id)}
                            onDrop={(e) => handleBookDrop(e, sub)}
                            className={`p-5 rounded-xl border-2 border-dashed text-center flex flex-col items-center justify-center transition-colors relative ${isDragActive ? "border-brand-primary bg-brand-primary/5" : "border-brand-border bg-brand-bg hover:bg-brand-border/10"}`}
                          >
                            <input 
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg,.txt"
                              onChange={(e) => handleBookFileSelect(e, sub)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <Upload className="h-6 w-6 text-brand-text-secondary mb-1.5" />
                            <p className="text-xs font-bold text-brand-text-primary">Drop reference book here</p>
                            <span className="text-[9px] text-brand-text-secondary mt-0.5">or click to browse material (PDF/Images)</span>
                          </div>
                        )}
                      </div>

                      {/* View details */}
                      <div className="mt-4 pt-4 border-t border-brand-border flex justify-between items-center text-[10px] text-brand-text-secondary">
                        <span className="font-semibold uppercase tracking-wider">Course setup: Completed</span>
                        <span className="font-mono text-[9px]">{new Date(sub.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Syllabus Unit Explorer Drawer Modal */}
            <AnimatePresence>
              {selectedSubject && selectedSubject.units && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white border border-brand-border rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl relative"
                  >
                    <button 
                      onClick={() => {
                        setSelectedSubject(null);
                        setActiveStudyLesson(null);
                        setLessonExplanation("");
                        setLessonQAHistory([]);
                        setLessonQuestion("");
                      }}
                      className="absolute top-4 right-4 p-1 px-2.5 border border-brand-border rounded-lg bg-brand-bg hover:bg-brand-border/20 text-xs font-bold text-brand-text-secondary hover:text-brand-text-primary cursor-pointer"
                    >
                      Hide
                    </button>

                    <div className="flex gap-3.5 items-center mb-6 pb-4 border-b border-brand-border">
                      <div className="h-10 w-10 rounded-xl" style={{ backgroundColor: selectedSubject.color + "15" }}>
                        <BookMarked className="h-6 w-6 m-2" style={{ color: selectedSubject.color }} />
                      </div>
                      <div>
                        <h3 className="font-display font-black text-xl text-brand-text-primary">{selectedSubject.name}</h3>
                        <p className="text-[10px] text-brand-text-secondary uppercase font-bold tracking-widest mt-0.5">Custom Learning Lessons</p>
                      </div>
                    </div>

                    {activeStudyLesson ? (
                      <div className="space-y-5 text-left">
                        {/* Back navigation */}
                        <div className="flex items-center justify-between border-b border-brand-border pb-3 flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveStudyLesson(null);
                              setLessonExplanation("");
                              setLessonQAHistory([]);
                              setLessonQuestion("");
                            }}
                            className="text-xs font-bold text-brand-primary flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            ← Back to Lesson list
                          </button>
                          
                          <div className="flex bg-brand-bg border border-brand-border rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleToggleLessonMode("brief")}
                              className={`px-3 py-1.5 text-[10px] font-bold rounded-md cursor-pointer transition-all ${lessonExplanationMode === "brief" ? "bg-brand-primary text-brand-text-primary" : "text-brand-text-secondary hover:text-brand-text-primary"}`}
                            >
                              Brief Explanation
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleLessonMode("detailed")}
                              className={`px-3 py-1.5 text-[10px] font-bold rounded-md cursor-pointer transition-all ${lessonExplanationMode === "detailed" ? "bg-brand-primary text-brand-text-primary" : "text-brand-text-secondary hover:text-brand-text-primary"}`}
                            >
                              Detailed Explanation
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-brand-text-secondary bg-brand-bg px-2 py-0.5 border border-brand-border rounded">{activeStudyLesson.unitTitle}</span>
                          <h4 className="text-lg font-black text-brand-text-primary mt-1">{activeStudyLesson.lessonTitle}</h4>
                        </div>

                        {/* Explanation output block */}
                        <div className="bg-brand-bg rounded-xl p-4 border border-brand-border/60 min-h-[180px] relative text-left">
                          {isLessonLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/95 rounded-xl z-10">
                              <div className="h-6 w-6 border-2 border-dashed border-brand-primary rounded-full animate-spin" />
                              <span className="text-xs font-bold text-brand-text-secondary">Generating customized study notes...</span>
                            </div>
                          )}

                          {lessonExplanation ? (
                            <div className="text-xs text-brand-text-primary leading-relaxed whitespace-pre-wrap max-h-[250px] overflow-y-auto pr-1">
                              {lessonExplanation}
                            </div>
                          ) : !isLessonLoading ? (
                            <div className="text-center py-12 text-xs text-brand-text-secondary italic">
                              No explanation loaded. Select Brief or Detailed tab to try again.
                            </div>
                          ) : null}
                        </div>

                        {/* Interactive textbox to ask questions about this lesson */}
                        <div className="border-t border-brand-border pt-4 space-y-3">
                          <h5 className="font-bold text-xs text-brand-text-primary">Have a question? Ask your AI Assistant:</h5>
                          
                          <form onSubmit={handleAskLessonQuestion} className="flex gap-2">
                            <input
                              type="text"
                              value={lessonQuestion}
                              onChange={(e) => setLessonQuestion(e.target.value)}
                              placeholder={`Ask anything about "${activeStudyLesson.lessonTitle}"...`}
                              className="flex-grow rounded-xl border border-brand-border bg-brand-bg px-3.5 py-2 border-brand-border/80 text-xs text-brand-text-primary focus:border-brand-primary focus:outline-none"
                              disabled={isLessonQALoading}
                            />
                            <button
                              type="submit"
                              disabled={isLessonQALoading || !lessonQuestion.trim()}
                              className="bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-40"
                            >
                              {isLessonQALoading ? "Thinking..." : "Send"}
                            </button>
                          </form>

                          {/* QA dialog log */}
                          {lessonQAHistory.length > 0 && (
                            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pt-2 border-t border-brand-border/30">
                              {lessonQAHistory.map((item, idx) => (
                                <div key={idx} className="p-3 bg-zinc-50 border border-brand-border/40 rounded-xl space-y-1.5 text-xs text-left">
                                  <div className="flex gap-2 items-start font-semibold">
                                    <span className="text-brand-primary font-bold shrink-0">Student:</span>
                                    <span className="text-brand-text-primary">{item.q}</span>
                                  </div>
                                  <div className="flex gap-2 items-start text-brand-text-secondary leading-relaxed border-t border-dashed border-brand-border/20 pt-1.5">
                                    <span className="text-brand-success font-bold shrink-0">KABAKA AI:</span>
                                    <span className="whitespace-pre-wrap">{item.a}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {selectedSubject.units.map((unit, i) => (
                          <div key={unit.id} className="border border-brand-border rounded-xl p-4.5 bg-brand-bg space-y-3">
                            <h4 className="font-bold text-sm text-brand-text-primary border-b border-brand-border/10 pb-1.5 flex justify-between items-center">
                              <span>{unit.title}</span>
                              <span className="text-[9px] uppercase tracking-wider text-brand-primary p-0.5 bg-brand-primary/10 rounded-md font-extrabold">Unit {i + 1}</span>
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {unit.lessons.map((les, idx) => (
                                <button 
                                  key={idx} 
                                  onClick={() => handleStudyLesson(unit.title, les)}
                                  className="bg-white hover:bg-brand-primary/5 hover:border-brand-primary/45 transition-all p-3 border border-brand-border rounded-xl text-xs font-semibold text-brand-text-primary flex gap-3 items-start text-left w-full cursor-pointer group"
                                >
                                  <span className="h-5 w-5 rounded-lg bg-brand-primary/15 text-brand-primary text-[10px] flex items-center justify-center font-bold font-mono shrink-0 group-hover:bg-brand-primary group-hover:text-brand-text-primary transition-all">{idx + 1}</span>
                                  <div className="flex-grow min-w-0">
                                    <span className="block truncate font-bold text-brand-text-primary" title={les}>{les}</span>
                                    <span className="text-[9px] text-brand-text-secondary font-medium">Click to study lesson</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </motion.div>
        )}

        {/* TAB 3: STUDY PLANNER (MODULE 4 & 5) */}
        {activeTab === "study_plan" && (
          <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-brand-border">
              <div>
                <h2 className="font-display text-2xl font-black text-brand-text-primary tracking-tight">AI Study Plan Schedulers</h2>
                <p className="text-xs text-brand-text-secondary mt-0.5">Automate and adapt daily tasks to fit available hours and target subjects securely</p>
              </div>

              <div className="flex gap-2.5 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleRegenerateAIPlan}
                  disabled={isStudyPlanGenerating || subjects.length === 0}
                  className="w-full md:w-auto bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary p-3.5 px-6 rounded-xl text-xs font-bold shadow-soft flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 select-none animate-pulse"
                >
                  {isStudyPlanGenerating ? (
                    <>
                      <div className="h-4 w-4 border-2 border-dashed border-brand-text-primary rounded-full animate-spin" />
                      Scholarly Planning...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Regenerate Daily Plan with AI
                    </>
                  )}
                </button>
              </div>
            </div>

            {subjects.length === 0 && (
              <div className="bg-brand-accent-pink/10 border border-brand-accent-pink/20 rounded-xl p-4 text-xs text-brand-accent-pink flex gap-2.5 items-center">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Please establish at least 1 course subject on your sideboard cabinet before running AI planning!</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Task list board */}
              <div className="lg:col-span-2 bg-white border border-brand-border rounded-xl p-5 shadow-soft space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-brand-border">
                  <h3 className="font-bold text-sm text-brand-text-primary">Operational Checklist</h3>
                  <span className="text-[10px] text-brand-text-secondary font-mono font-bold">{tasks.filter(t => t.status === "completed").length}/{tasks.length} Completed</span>
                </div>

                {tasks.length === 0 ? (
                  <div className="py-20 text-center text-xs text-brand-text-secondary italic">No study tasks active. Enter manual objectives below or trigger the AI Plan Regulator!</div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((t) => {
                      const compl = t.status === "completed";
                      const pr = t.priority || "Medium";
                      
                      return (
                        <div key={t.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl gap-3 text-xs transition-colors ${compl ? "bg-brand-success/5 border-brand-success/20 opacity-70" : "bg-white border-brand-border hover:border-brand-primary/30"}`}>
                          <div className="flex items-start gap-3.5">
                            <button
                              type="button"
                              onClick={() => handleSetTaskStatus(t.id, compl ? "pending" : "completed")}
                              className={`h-5 w-5 rounded-md flex items-center justify-center border transition-all shrink-0 cursor-pointer mt-0.5 ${compl ? "bg-brand-success border-brand-success text-brand-text-primary" : "border-brand-text-secondary/40 bg-white"}`}
                            >
                              {compl && <CheckCircle className="h-4 w-4 text-white fill-current" />}
                            </button>
                            
                            <div className="text-left space-y-1">
                              <p className={`font-bold transition-all ${compl ? "line-through text-brand-text-secondary font-medium" : "text-brand-text-primary"}`}>{t.title}</p>
                              <div className="flex items-center gap-2 flex-wrap text-[10px] text-brand-text-secondary font-semibold">
                                <span className="bg-brand-border/20 px-2 py-0.5 rounded-md">{t.subject_name}</span>
                                {t.duration && <span>⏱ {t.duration} mins</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <span className={`px-2 py-0.5 border rounded-md font-bold text-[9px] uppercase tracking-wider ${getPriorityDisplayClass(pr)}`}>{pr}</span>
                            
                            {!compl && (
                              <button
                                onClick={() => handleSetTaskStatus(t.id, "skipped")}
                                className="p-1.5 bg-brand-bg hover:bg-brand-accent-pink/5 text-brand-text-secondary hover:text-brand-accent-pink border border-brand-border rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                              >
                                Skip
                              </button>
                            )}

                            {!compl && (
                              <button
                                onClick={() => {
                                  setFocusTask(t);
                                  setActiveTab("focus_mode");
                                }}
                                className="p-1.5 bg-brand-primary text-brand-text-primary hover:bg-[#2bc4ec] border border-transparent rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-soft"
                              >
                                Focus
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick custom task form */}
              <div className="bg-white border border-brand-border rounded-xl p-5 shadow-soft space-y-4">
                <div className="pb-3 border-b border-brand-border flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-brand-primary" />
                  <h3 className="font-bold text-sm text-brand-text-primary">Declare Manual Task</h3>
                </div>

                <form onSubmit={handleAddNewManualTask} className="space-y-4">
                  <div className="space-y-1 text-xs">
                    <label className="text-[10px] uppercase font-bold text-brand-text-secondary block">Action item details</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Solve review algebra vectors in Math"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-2.5 focus:border-brand-primary focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-brand-text-secondary block">Subject Category</label>
                      <select
                        value={selectedSubId}
                        onChange={(e) => setSelectedSubId(e.target.value)}
                        className="w-full rounded-xl border border-brand-border bg-brand-bg px-2 py-2.5 focus:outline-none"
                      >
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-brand-text-secondary block">Priority Degree</label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                        className="w-full rounded-xl border border-brand-border bg-brand-bg px-2 py-2.5 focus:outline-none"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] uppercase font-bold text-brand-text-secondary">Expected Time size (mins)</label>
                      <span className="font-bold text-brand-primary font-mono">{newTaskDuration}m</span>
                    </div>
                    <input 
                      type="range"
                      min="10"
                      max="120"
                      step="5"
                      value={newTaskDuration}
                      onChange={(e) => setNewTaskDuration(parseInt(e.target.value))}
                      className="w-full accent-brand-primary"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={!newTaskTitle.trim() || subjects.length === 0}
                    className="w-full py-3 bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary text-xs font-bold rounded-xl shadow-soft cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1 transition-all"
                  >
                    <Plus className="h-4 w-4" /> Add Manual Task
                  </button>
                </form>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 4: FOCUS MODE EXPERIENCES (MODULE 6 & 7) */}
        {activeTab === "focus_mode" && (
          <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
            <div className="pb-4 border-b border-brand-border">
              <h2 className="font-display text-2xl font-black text-brand-text-primary tracking-tight">Active Focus Core</h2>
              <p className="text-xs text-brand-text-secondary mt-0.5">Distraction-free environment with interactive Pomodoro cycles linked directly to objectives</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Pomodoro Timer Center Piece */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-brand-border p-8 shadow-soft flex flex-col items-center justify-center text-center space-y-6">
                
                {/* Mode Select horizontal chips */}
                <div className="flex gap-2 p-1 border border-brand-border bg-brand-bg rounded-xl">
                  {[
                    { id: "focus", label: "Pomodoro Focus (25m)", value: "focus" },
                    { id: "short_break", label: "Short Break (5m)", value: "short_break" },
                    { id: "long_break", label: "Long Break (10m)", value: "long_break" }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => changeTimerModeSettings(item.value as any)}
                      className={`px-4 py-2.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer ${timerMode === item.value ? "bg-white text-brand-primary border border-brand-border shadow-sm" : "text-brand-text-secondary"}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Spectacular concentric timer circle display */}
                <div className="relative h-64 w-64 flex items-center justify-center">
                  
                  {/* Dynamic rotating outer SVG frame circle */}
                  <svg className="absolute inset-0 h-full w-full transform -rotate-90">
                    <circle cx="128" cy="128" r="110" stroke="#F1F5F9" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="128" 
                      cy="128" 
                      r="110" 
                      stroke="#33D6FF" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray={`${2 * Math.PI * 110}`}
                      strokeDashoffset={`${2 * Math.PI * 110 * (1 - secondsRemaining / timerMaxSeconds)}`}
                      className="transition-all duration-1000"
                    />
                  </svg>

                  {/* Inner Digital Display */}
                  <div className="text-center space-y-1.5 z-10 select-none">
                    <p className="text-[10px] font-bold tracking-widest text-[#FF5F9E] uppercase leading-none">
                      {timerMode === "focus" ? "Active block" : "Rejuvenation"}
                    </p>
                    <h3 className="text-5xl font-black font-mono tracking-tight text-brand-text-primary leading-none">
                      {Math.floor(secondsRemaining / 60).toString().padStart(2, "0")}
                      <span className="text-brand-primary animate-pulse">:</span>
                      {(secondsRemaining % 60).toString().padStart(2, "0")}
                    </h3>
                    <p className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-widest leading-none">
                      {isTimerRunning ? "Engaged" : "Paused"}
                    </p>
                  </div>
                </div>

                {/* Control Toggles buttons block */}
                <div className="flex gap-4 items-center">
                  <button
                    onClick={handleResetTimer}
                    className="p-3 border border-brand-border bg-white hover:bg-brand-bg rounded-xl transition-all cursor-pointer"
                    title="Reset Stopwatch"
                  >
                    <RotateCcw className="h-5 w-5 text-brand-text-secondary" />
                  </button>

                  <button
                    onClick={handleToggleTimer}
                    className="p-4 bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary rounded-2xl shadow-soft font-bold text-sm flex items-center gap-2 px-8 cursor-pointer transition-transform active:scale-95"
                  >
                    {isTimerRunning ? (
                      <>
                        <Pause className="h-4 w-4 fill-current" /> Pause Focus
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-current" /> Start Focus
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleForceLogFocusBlock}
                    disabled={!focusTask}
                    className="p-3 border border-brand-border hover:bg-brand-success/10 bg-white hover:border-brand-success/20 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                    title="Log completed study block"
                  >
                    <CheckCircle className="h-5 w-5 text-brand-success" />
                  </button>
                </div>

                {/* Manual Timer duration override settings */}
                <form onSubmit={handleCustomTimerValueSubmit} className="pt-4 border-t border-brand-border/10 w-full flex gap-3.5 items-end max-w-sm justify-center">
                  <div className="text-left space-y-1 text-xs">
                    <label className="text-[9px] uppercase font-bold text-brand-text-secondary block">Custom duration (minutes)</label>
                    <input 
                      type="number"
                      min="1"
                      max="120"
                      value={customTimerMinutes}
                      onChange={(e) => setCustomTimerMinutes(parseInt(e.target.value))}
                      className="border border-brand-border rounded-xl bg-brand-bg px-3.5 py-2 w-28 focus:outline-none text-xs text-brand-text-primary text-center font-bold"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="p-2 py-2.5 bg-brand-bg border border-brand-border hover:bg-brand-border/15 text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary rounded-xl cursor-pointer"
                  >
                    Set
                  </button>
                </form>
              </div>

              {/* Focus Task and Subject details card block */}
              <div className="space-y-6">
                
                {/* Active Focus Target details */}
                <div className="bg-white border border-brand-border rounded-xl p-5 shadow-soft space-y-4">
                  <div className="pb-3 border-b border-brand-border">
                    <span className="text-[10px] uppercase font-bold text-brand-text-secondary">Current Focus Objective</span>
                  </div>

                  {focusTask ? (
                    <div className="space-y-3.5 text-xs text-left">
                      <div className="p-3 border border-brand-border bg-brand-bg rounded-xl">
                        <p className="font-extrabold text-brand-text-primary leading-snug">{focusTask.title}</p>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-1.5 rounded-md mt-1.5 inline-block">
                          {focusTask.subject_name}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[9px] uppercase font-bold text-brand-text-secondary block">Focus Parameters</span>
                        <div className="flex gap-4 text-xs font-semibold text-brand-text-primary">
                          <div>⏱ Duration: <span className="font-semibold text-brand-text-secondary font-mono">{focusTask.duration || 30} mins</span></div>
                          <div>🔥 Degree: <span className="font-semibold text-brand-text-secondary">{focusTask.priority || "Medium"}</span></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-brand-text-secondary italic"> No study targets formulated today. Use the Study Plan center.</div>
                  )}
                </div>

                {/* Auxiliary Selector lists for custom focus targets */}
                <div className="bg-white border border-brand-border rounded-xl p-5 shadow-soft space-y-4">
                  <div className="pb-3 border-[#E2E8F0] border-b text-xs uppercase font-bold text-brand-text-secondary text-left">
                    Switch Active Study Target
                  </div>

                  {tasks.filter(t => t.status === "pending" || t.status === "in_progress").length === 0 ? (
                    <div className="py-6 text-center text-xs text-brand-text-secondary italic">All tasks completed. No switcher targets.</div>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto">
                      {tasks.filter(t => t.status === "pending" || t.status === "in_progress").map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setFocusTask(t)}
                          className={`w-full p-2.5 text-left border rounded-xl text-xs transition-colors flex justify-between items-center ${focusTask?.id === t.id ? "bg-brand-primary/5 border-brand-primary font-bold text-brand-text-primary" : "bg-brand-bg border-brand-border hover:border-brand-primary/30 text-brand-text-secondary"}`}
                        >
                          <span className="truncate max-w-[170px]">{t.title}</span>
                          <span style={{ backgroundColor: subjects.find(s => s.id === t.subject_id)?.color + "25", color: subjects.find(s => s.id === t.subject_id)?.color }} className="text-[9px] px-1 rounded uppercase font-bold">
                            {t.subject_name?.substring(0, 4)}..
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 5: PROGRESS STATS MODULES (MODULE 8) */}
        {activeTab === "progress" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <AnalyticsTab 
              profile={profile} 
              subjects={subjects} 
              tasks={tasks} 
              attempts={attempts} 
            />
          </motion.div>
        )}

        {/* TAB 5.0: AI SYSTEM BRAIN CONTROLLER */}
        {activeTab === "brain" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <SystemBrainTab 
              userId={userId}
              profile={profile}
              subjects={subjects}
              tasks={tasks}
              mistakes={mistakes}
              focusSessions={focusSessions}
              attempts={attempts}
              onRefreshProfile={async () => {
                const profileSnap = await getDocs(query(collection(db, "student_profiles"), where("owner_id", "==", userId)));
                if (!profileSnap.empty) {
                  setProfile({ id: profileSnap.docs[0].id, ...profileSnap.docs[0].data() } as StudentProfile);
                }
              }}
              onRefreshTasks={async () => {
                const tasksSnap = await getDocs(query(collection(db, "tasks"), where("owner_id", "==", userId)));
                setTasks(tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Task));
              }}
              onRefreshNotifications={loadNotificationsFeed}
              onAwardXP={handleAwardXP}
            />
          </motion.div>
        )}

        {/* TAB 5.1: RESOURCES HUB - PDF, NOTES, DRAWING CANVAS, CALCULATOR */}
        {activeTab === "resources" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <ResourcesTab 
              userId={userId} 
              subjects={subjects} 
              onAwardXP={handleAwardXP} 
            />
          </motion.div>
        )}

        {/* TAB 5.2: ACHIEVEMENTS & GAMIFICATION LEVEL SHOWCASE */}
        {activeTab === "achievements" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <AchievementsTab 
              profile={profile} 
              subjects={subjects} 
              tasks={tasks} 
              attempts={attempts} 
              onAwardXP={handleAwardXP} 
            />
          </motion.div>
        )}

        {/* TAB 5.3: SYSTEM NOTIFICATIONS LOG */}
        {activeTab === "notifications" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <NotificationsPanel 
              userId={userId} 
              notifications={notifications} 
              onLoadNotifications={loadNotificationsFeed} 
            />
          </motion.div>
        )}

        {/* TAB 5.4: PERSONALIZATION SETTINGS SUITE */}
        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <SettingsTab 
              userId={userId} 
              profile={profile} 
              onRefreshProfile={async () => {
                const profileSnap = await getDocs(query(collection(db, "student_profiles"), where("owner_id", "==", userId)));
                if (!profileSnap.empty) {
                  setProfile({ id: profileSnap.docs[0].id, ...profileSnap.docs[0].data() } as StudentProfile);
                }
              }} 
              onAwardXP={handleAwardXP} 
            />
          </motion.div>
        )}

        {/* TAB 6: AI TUTOR ROOM (PHASE 3 ACTIVE COMPASS SYSTEM) */}
        {activeTab === "tutor" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="pb-4 border-b border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-black text-brand-text-primary tracking-tight">Crown Tutor Room</h2>
                <p className="text-xs text-brand-text-secondary mt-0.5">Explore active recall drills, study flashcard carousels, error logs, and cognitive insights</p>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] uppercase font-bold text-brand-text-secondary bg-brand-bg px-2.5 py-1.5 border border-brand-border rounded-xl">
                  Error bank: <span className="font-mono text-brand-accent-pink">{mistakes.length} items</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-brand-text-primary bg-[#B7F34D]/15 px-2.5 py-1.5 rounded-xl border border-[#B7F34D]/30">
                  Drills log: <span className="font-mono">{attempts.length} attempts</span>
                </span>
              </div>
            </div>

            {/* Sub-tab navigation bar */}
            <div className="flex flex-wrap gap-2.5 border-b border-brand-border pb-1">
              {[
                { id: "explain", label: "Interactive Advisor", icon: <Sparkles className="h-3.5 w-3.5" /> },
                { id: "quiz", label: "Active Recall Quizzes", icon: <Award className="h-3.5 w-3.5" /> },
                { id: "mistakes", label: "Mistake Error Bank", icon: <AlertCircle className="h-3.5 w-3.5" /> },
                { id: "flashcards", label: "Flashcards Flip Deck", icon: <Sliders className="h-3.5 w-3.5" /> },
                { id: "insights", label: "AI Cognitive Insights", icon: <TrendingUp className="h-3.5 w-3.5" /> },
              ].map((subT) => (
                <button
                  key={subT.id}
                  onClick={() => setTutorSubTab(subT.id as any)}
                  className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${tutorSubTab === subT.id ? "bg-brand-primary text-brand-text-primary shadow-soft" : "bg-white hover:bg-brand-bg text-brand-text-secondary border border-brand-border"}`}
                >
                  {subT.icon}
                  <span>{subT.label}</span>
                </button>
              ))}
            </div>

            {/* SUB-TAB 1: INTERACTIVE COMPANION ADVISOR (EXPLAIN MODE) */}
            {tutorSubTab === "explain" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white border border-brand-border p-5 rounded-xl shadow-soft space-y-5 text-left h-fit">
                  <div className="pb-3 border-b border-brand-border">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary">Ask Your AI Assistant</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-brand-text-secondary">Type your topic or question</label>
                      <textarea
                        rows={4}
                        placeholder="e.g. What is photosynthesis? or Explain how calculus limits work in simple words with a real-world example."
                        value={explainTopic}
                        onChange={(e) => setExplainTopic(e.target.value)}
                        className="w-full rounded-xl border border-brand-border bg-brand-bg px-3.5 py-2.5 text-xs text-brand-text-primary focus:border-brand-primary focus:outline-none resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-brand-text-secondary">Explanation Style</label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: "explain", name: "🎓 Simple Explanation", desc: "Easy conceptual breakdown + custom analogy" },
                          { id: "exam", name: "📝 Exam Prep Notes", desc: "Key information, exam tips, and scoring keys" },
                          { id: "summary", name: "⚡ Quick Key Points", desc: "Bullet list of keywords and formulas" },
                          { id: "deep", name: "🔍 Detailed Breakdown", desc: "Full detailed lesson explanation" },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setExplainMode(m.id as any)}
                            className={`p-3 text-left border rounded-xl transition-all cursor-pointer ${explainMode === m.id ? "bg-brand-primary/5 border-brand-primary" : "bg-white border-brand-border hover:bg-brand-bg"}`}
                          >
                            <p className={`text-xs font-bold ${explainMode === m.id ? "text-brand-primary" : "text-brand-text-primary"}`}>{m.name}</p>
                            <p className="text-[9px] text-brand-text-secondary mt-0.5 leading-snug">{m.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isExplainLoading || !explainTopic.trim()}
                      onClick={handleQueryExplain}
                      className="w-full bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary p-3 rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-40"
                    >
                      {isExplainLoading ? "Asking AI..." : "Ask AI Assistant"}
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white border border-brand-border rounded-xl p-6 shadow-soft flex flex-col justify-between min-h-[400px]">
                  <div>
                    <div className="pb-3 border-b border-brand-border flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-brand-primary animate-pulse" />
                        <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary">AI Assistant Response</h3>
                      </div>
                      <span className="text-[9px] uppercase tracking-widest text-brand-text-secondary bg-brand-bg px-2 rounded font-bold">{explainMode} mode</span>
                    </div>

                    {explainResult ? (
                      <div className="mt-5 text-left text-xs text-brand-text-primary leading-relaxed whitespace-pre-line bg-[#F0F8FF] border border-[#33D6FF]/15 p-5.5 rounded-2xl relative">
                        <div className="absolute right-4 top-4 h-8 w-8 rounded-full bg-brand-primary/5 flex items-center justify-center font-bold font-mono">⚡</div>
                        <div className="space-y-4">
                          <p className="font-black text-[10px] text-brand-primary uppercase tracking-widest">Answer:</p>
                          <p className="text-brand-text-primary font-semibold">{explainResult}</p>
                        </div>
                      </div>
                    ) : isExplainLoading ? (
                      <div className="py-24 text-center text-xs text-brand-text-secondary italic flex flex-col items-center gap-2">
                        <div className="h-7 w-7 border-2 border-dashed border-brand-primary rounded-full animate-spin" />
                        <span>Speaking to AI Assistant...</span>
                      </div>
                    ) : (
                      <div className="py-24 text-center text-xs text-brand-text-secondary italic flex flex-col items-center justify-center space-y-2">
                        <Sparkles className="h-10 w-10 text-brand-border" />
                        <span>Type a question or topic on the panel to the left and click Ask AI Assistant.</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-brand-border flex justify-between items-center text-[9px] text-brand-text-secondary font-bold uppercase tracking-widest">
                    <span>Active: AI Assistant Workspace</span>
                    <span>No mock data layer</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB 2: ADAPTIVE QUIZZES (Drills Engine) */}
            {tutorSubTab === "quiz" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                
                {subjects.length === 0 ? (
                  <div className="bg-brand-bg border border-brand-border rounded-xl p-10 text-center text-xs text-brand-text-secondary italic flex flex-col items-center justify-center space-y-2.5">
                    <BookMarked className="h-9 w-9 text-brand-border" />
                    <span>Please add a textbook or subject to configure the learning quiz drill system.</span>
                  </div>
                ) : !activeQuiz ? (
                  /* Quiz generator settings selection card */
                  <div className="max-w-xl mx-auto bg-white border border-brand-border rounded-xl p-6 shadow-soft text-left space-y-5">
                    <div className="pb-3 border-b border-brand-border flex items-center gap-2">
                      <Award className="h-5 w-5 text-brand-primary" />
                      <div>
                        <h3 className="font-extrabold text-sm text-brand-text-primary">Evaluation Quiz Configurator</h3>
                        <p className="text-[10px] text-brand-text-secondary mt-0.5">Generates highly targeted exercises from textbook syllabus or mistake reviews</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-brand-text-secondary">Target Course</label>
                        <select
                          value={quizSubjectId}
                          onChange={(e) => setQuizSubjectId(e.target.value)}
                          className="w-full rounded-xl border border-brand-border bg-brand-bg px-3.5 py-2.5 text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary font-semibold"
                        >
                          <option value="">Select subject context...</option>
                          {subjects.map((sub) => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-brand-text-secondary">Quiz Type</label>
                          <select
                            value={quizType}
                            onChange={(e) => setQuizType(e.target.value as any)}
                            className="w-full rounded-xl border border-brand-border bg-brand-bg px-2.5 py-2.5 text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary font-semibold"
                          >
                            <option value="lesson">Lesson quiz (Specific)</option>
                            <option value="unit">Unit quiz (Medium review)</option>
                            <option value="subject">Subject evaluation (Broad)</option>
                            <option value="full_exam">Master simulation (Adaptive)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-brand-text-secondary">Aptitude Difficulty</label>
                          <select
                            value={quizDifficulty}
                            onChange={(e) => setQuizDifficulty(e.target.value as any)}
                            className="w-full rounded-xl border border-brand-border bg-brand-bg px-2.5 py-2.5 text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary font-semibold"
                          >
                            <option value="easy">Easy (Concept recall)</option>
                            <option value="medium">Medium (Analytical application)</option>
                            <option value="hard">Hard (Sovereign mastery)</option>
                          </select>
                        </div>
                      </div>

                      {mistakes.length > 0 && (
                        <div className="p-3 bg-brand-accent-pink/5 border border-brand-accent-pink/15 rounded-xl text-[10px] text-brand-text-secondary">
                          🧠 <span className="font-bold text-brand-accent-pink">Mistake Adaptation Active:</span> KABAKA AI will query your past {mistakes.length} error logs to formulate drills targeting weak analytical areas!
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={isQuizGenerating}
                        onClick={handleTriggerQuizGeneration}
                        className="w-full bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary p-3 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
                      >
                        {isQuizGenerating ? (
                          <>
                            <div className="h-4 w-4 border-2 border-dashed border-brand-text-primary rounded-full animate-spin" />
                            Compiling royal evaluation...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Generate active recall quiz
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Active Quiz Interactive Session Play Canvas */
                  <div className="max-w-2xl mx-auto bg-white border border-brand-border rounded-xl p-6 shadow-soft text-left space-y-6">
                    
                    {!quizIsCompleted ? (
                      <>
                        <div className="pb-3 border-b border-brand-border flex justify-between items-center flex-wrap gap-2">
                          <div className="flex gap-2 items-center">
                            <span style={{ backgroundColor: subjects.find(s => s.id === activeQuiz.subject_id)?.color + "15", color: subjects.find(s => s.id === activeQuiz.subject_id)?.color }} className="text-[10px] px-2.5 py-1 border border-transparent rounded-lg uppercase tracking-wider font-extrabold font-mono">
                              {activeQuiz.subject_name}
                            </span>
                            <span className="text-xs font-bold text-brand-text-secondary uppercase tracking-widest text-[9px] bg-brand-bg px-2 py-0.5 rounded-md border border-brand-border">{activeQuiz.type}</span>
                          </div>

                          <div className="flex gap-3 text-xs items-center">
                            <div className="font-mono text-brand-text-primary font-bold bg-[#FF5F9E]/10 p-1 px-2.5 text-[#FF5F9E] border border-[#FF5F9E]/20 rounded-lg">
                              ⏱ {Math.floor(quizTimer / 60)}:{(quizTimer % 60).toString().padStart(2, "0")}
                            </div>
                            <div className="font-mono font-bold text-brand-text-secondary">
                              Question {quizCurrentIdx + 1} of {activeQuiz.questions.length}
                            </div>
                          </div>
                        </div>

                        {/* Question details block */}
                        <div className="space-y-4">
                          <p className="text-sm font-black text-brand-text-primary leading-relaxed bg-[#F7FAFF] border border-brand-border p-4 rounded-xl">
                            {activeQuiz.questions[quizCurrentIdx].question}
                          </p>

                          {/* Dynamic Inputs depending on Question type */}
                          {activeQuiz.questions[quizCurrentIdx].type === "multiple_choice" && (
                            <div className="grid grid-cols-1 gap-2.5">
                              {activeQuiz.questions[quizCurrentIdx].options?.map((opts) => {
                                const selected = quizSelectedOption === opts;
                                return (
                                  <button
                                    key={opts}
                                    type="button"
                                    disabled={quizIsAnswerRevealed}
                                    onClick={() => setQuizSelectedOption(opts)}
                                    className={`p-3 text-left border rounded-xl text-xs font-semibold cursor-pointer transition-all ${selected ? "bg-brand-primary/10 border-brand-primary text-brand-text-primary" : "bg-white border-brand-border hover:bg-brand-bg text-brand-text-secondary"} disabled:opacity-85`}
                                  >
                                    {opts}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {activeQuiz.questions[quizCurrentIdx].type === "true_false" && (
                            <div className="grid grid-cols-2 gap-3.5">
                              {["True", "False"].map((opts) => {
                                const selected = quizSelectedOption === opts;
                                return (
                                  <button
                                    key={opts}
                                    type="button"
                                    disabled={quizIsAnswerRevealed}
                                    onClick={() => setQuizSelectedOption(opts)}
                                    className={`p-4.5 border rounded-xl font-bold text-xs cursor-pointer text-center transition-all ${selected ? "bg-brand-primary/10 border-brand-primary text-brand-text-primary" : "bg-white border-brand-border hover:bg-brand-bg text-brand-text-secondary"} disabled:opacity-85`}
                                  >
                                    {opts}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {activeQuiz.questions[quizCurrentIdx].type === "short_answer" && (
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                disabled={quizIsAnswerRevealed}
                                placeholder="Write your brief answer..."
                                value={quizShortAnswerText}
                                onChange={(e) => setQuizShortAnswerText(e.target.value)}
                                className="w-full rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary font-semibold disabled:opacity-80"
                              />
                            </div>
                          )}
                        </div>

                        {/* Correct answer explanation modal card */}
                        {quizIsAnswerRevealed && (
                          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-5.5 rounded-2xl border text-xs text-brand-text-primary space-y-2 text-left leading-relaxed bg-[#F0F8FF] border-[#33D6FF]/15">
                            <div className="flex items-center gap-1.5 pb-1.5 border-b border-[#33D6FF]/10">
                              <Sparkles className="h-4 w-4 text-brand-primary" />
                              <span className="font-extrabold uppercase tracking-widest text-[#00E5FF] text-[9px]">Tutor evaluation correction</span>
                            </div>
                            <p className="font-bold text-brand-text-primary">Correct solution: <span className="text-brand-primary font-extrabold">{activeQuiz.questions[quizCurrentIdx].correct_answer}</span></p>
                            <p className="text-[11px] font-semibold text-brand-text-secondary">{activeQuiz.questions[quizCurrentIdx].explanation}</p>
                          </motion.div>
                        )}

                        {/* Quiz Controls */}
                        <div className="pt-4 border-t border-brand-border flex justify-between items-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (quizTimerRef.current) clearInterval(quizTimerRef.current);
                              setActiveQuiz(null);
                            }}
                            className="p-2 py-2.5 bg-brand-bg hover:bg-brand-border/15 font-bold text-[10px] text-brand-text-secondary border border-brand-border rounded-xl cursor-pointer"
                          >
                            Forfeit test runs
                          </button>

                          {!quizIsAnswerRevealed ? (
                            <button
                              type="button"
                              disabled={
                                (activeQuiz.questions[quizCurrentIdx].type === "multiple_choice" && !quizSelectedOption) ||
                                (activeQuiz.questions[quizCurrentIdx].type === "true_false" && !quizSelectedOption) ||
                                (activeQuiz.questions[quizCurrentIdx].type === "short_answer" && !quizShortAnswerText.trim())
                              }
                              onClick={handleCheckAnswer}
                              className="bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary p-2.5 px-6 rounded-xl font-bold text-xs shadow-soft cursor-pointer disabled:opacity-40"
                            >
                              Check Answer
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleNextQuizQuestion}
                              className="bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary p-2.5 px-6 rounded-xl font-bold text-xs shadow-soft cursor-pointer flex items-center gap-1.5"
                            >
                              {quizCurrentIdx + 1 < activeQuiz.questions.length ? "Proceed Next Question" : "Finish Evaluation Drills"}
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      /* Quiz Completed Victory Summary Block */
                      <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} className="py-8 text-center space-y-6">
                        <div className="h-16 w-16 bg-[#B7F34D]/25 rounded-full flex items-center justify-center mx-auto text-3xl">
                          🏆
                        </div>

                        <div className="space-y-1.5">
                          <h3 className="font-display font-black text-xl text-brand-text-primary">Recall drill Completed successfully</h3>
                          <p className="text-xs text-brand-text-secondary">Study hours evaluated. Consistency indicators updated securely.</p>
                        </div>

                        {/* Score details card */}
                        <div className="grid grid-cols-3 gap-4 border border-brand-border bg-brand-bg p-4.5 rounded-2xl max-w-sm mx-auto text-center font-mono">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-brand-text-secondary block">Accuracy score</span>
                            <span className="text-lg font-black text-brand-primary">{quizScore} / {activeQuiz.questions.length}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-brand-text-secondary block">Study Gained</span>
                            <span className="text-lg font-black text-brand-success font-serif">+1 streak</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-brand-text-secondary block">Consistency</span>
                            <span className="text-lg font-black text-purple-500">+2% score</span>
                          </div>
                        </div>

                        {/* Mistakes summary reminder */}
                        {quizScore < activeQuiz.questions.length && (
                          <p className="text-[10px] text-brand-text-secondary max-w-md mx-auto">
                            ⚠️ We logged <span className="font-bold text-brand-accent-pink font-mono">{activeQuiz.questions.length - quizScore} question errors</span> into your royal Mistake Error Bank collections. Review them to adapt future assessments!
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() => setActiveQuiz(null)}
                          className="bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary p-3 px-8 rounded-xl font-bold text-xs shadow-soft cursor-pointer active:scale-95 transition-all inline-block"
                        >
                          Execute Another recall cycle
                        </button>
                      </motion.div>
                    )}

                  </div>
                )}

              </motion.div>
            )}

            {/* SUB-TAB 3: MISTAKE ANALYSIS SYSTEM (Error Bank) */}
            {tutorSubTab === "mistakes" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-left">
                
                <div className="bg-white border border-brand-border p-5 rounded-xl shadow-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex gap-3 items-start">
                    <div className="h-10 w-10 text-brand-accent-pink bg-brand-accent-pink/10 rounded-xl flex items-center justify-center shrink-0">
                      <Brain className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-brand-text-primary">Cognitive Error bank Diagnostics</h3>
                      <p className="text-xs text-brand-text-secondary mt-0.5">Launches deep analytical logic tracing incorrect solutions to construct targeted revision paths.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isErrorDiagnosisLoading || mistakes.length === 0}
                    onClick={handleRunDiagnosis}
                    className="w-full md:w-auto bg-brand-accent-pink hover:bg-rose-500 text-white p-2.5 px-5 rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-40 shadow-soft font-mono"
                  >
                    {isErrorDiagnosisLoading ? "Synthesizing errors..." : "Execute AI Diagnostic Log"}
                  </button>
                </div>

                {/* AI Error diagnosis analytical outcomes wrapper */}
                {errorDiagnosisResult && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-5.5 rounded-2xl border text-xs text-brand-text-primary leading-relaxed bg-[#FFF5F7] border-brand-accent-pink/20 space-y-3 relative">
                    <div className="absolute right-4 top-4 h-8 w-8 rounded-full bg-brand-accent-pink/5 flex items-center justify-center font-bold font-mono">👑</div>
                    <div className="space-y-3">
                      <p className="font-black text-[10px] text-brand-accent-pink uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 animate-spin" />
                        Senior Cognitive Diagnostics assessment:
                      </p>
                      <p className="text-brand-text-primary font-semibold whitespace-pre-line bg-white/60 p-4 border border-brand-border rounded-xl">{errorDiagnosisResult}</p>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-3.5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-brand-text-secondary border-b border-brand-border pb-1.5">Active Academic Mistakes List ({mistakes.length})</h4>
                  
                  {mistakes.length === 0 ? (
                    <div className="py-20 text-center text-xs text-brand-text-secondary italic bg-white border border-brand-border rounded-xl">
                      🎉 Impeccable accuracy! Your Mistake Error Bank collections are clean. Take Evaluation quizzes to trace potential vulnerabilities.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mistakes.map((mis) => (
                        <div key={mis.id} className="bg-white border border-brand-border p-4.5 rounded-xl shadow-soft space-y-4 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-brand-bg pb-2">
                              <span className="text-[9px] uppercase font-mono font-black text-brand-accent-pink bg-brand-accent-pink/10 border border-brand-accent-pink/15 px-2.5 rounded">
                                {mis.subject_name}
                              </span>
                              <span className="text-[9px] text-brand-text-secondary font-mono leading-none">{new Date(mis.created_at).toLocaleDateString()}</span>
                            </div>

                            <div className="space-y-2 text-xs leading-relaxed text-brand-text-primary">
                              <p className="font-bold bg-brand-bg border border-brand-border/10 p-3 rounded-lg">{mis.question}</p>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                                <div className="p-2 border border-brand-accent-pink/15 bg-brand-accent-pink/5 rounded-lg text-brand-text-secondary">
                                  ❌ Submitted Answer: <span className="font-extrabold text-brand-accent-pink truncate block max-w-[170px] mt-0.5">{mis.student_answer || "(None)"}</span>
                                </div>
                                <div className="p-2 border border-[#B7F34D]/25 bg-[#B7F34D]/5 rounded-lg text-brand-text-secondary">
                                  ✅ Correct Solution: <span className="font-extrabold text-[#A7E163] truncate block max-w-[170px] mt-0.5">{mis.correct_answer}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-brand-bg flex justify-between items-center">
                            <span className="text-[8px] font-mono text-brand-text-secondary uppercase font-bold">Concept review triggered</span>
                            <button
                              type="button"
                              onClick={() => handleMasterMistake(mis.id)}
                              className="text-[9px] uppercase tracking-wider font-extrabold font-mono text-brand-text-secondary hover:text-brand-success flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> Checked / Mastered
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </motion.div>
            )}

            {/* SUB-TAB 4: STUDY FLASHCARD DECK */}
            {tutorSubTab === "flashcards" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                
                {subjects.length === 0 ? (
                  <div className="bg-white border border-brand-border rounded-xl p-10 text-center text-xs text-brand-text-secondary italic flex flex-col items-center justify-center space-y-2.5">
                    <BookMarked className="h-9 w-9 text-brand-border" />
                    <span>Please add textbooks or subjects list to configure flashcard revision loops.</span>
                  </div>
                ) : (
                  <div className="max-w-xl mx-auto bg-white border border-brand-border p-5 rounded-xl shadow-soft text-left space-y-4">
                    <div className="pb-3 border-b border-brand-border flex items-center gap-2">
                      <Sliders className="h-5 w-5 text-brand-primary" />
                      <div>
                        <h3 className="font-extrabold text-sm text-brand-text-primary">Sovereign Card Generator Controller</h3>
                        <p className="text-[10px] text-brand-text-secondary mt-0.5">Synthesize lessons, summaries, or mistakes history into custom card index lists</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-brand-text-secondary">Course Context</label>
                        <select
                          value={cardSubjectId}
                          onChange={(e) => setQuizSubjectId(e.target.value)}
                          className="w-full rounded-xl border border-brand-border bg-brand-bg px-3 py-2.5 text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary font-semibold"
                        >
                          <option value="">Select Course...</option>
                          {subjects.map((sub) => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-brand-text-secondary">Inference Source</label>
                        <select
                          value={cardSource}
                          onChange={(e) => setCardSource(e.target.value as any)}
                          className="w-full rounded-xl border border-brand-border bg-brand-bg px-3 py-2.5 text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary font-semibold"
                        >
                          <option value="lessons">Book Syllabus Lessons</option>
                          <option value="mistakes">Feynman Mistakes list</option>
                          <option value="ai_summaries">AI Curated Revision highlights</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isFlashcardsGenerating}
                      onClick={handleTriggerFlashcardGeneration}
                      className="w-full bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary p-3 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      {isFlashcardsGenerating ? (
                        <>
                          <div className="h-4 w-4 border-2 border-dashed border-brand-text-primary rounded-full animate-spin" />
                          Indexing logical pairings...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 animate-bounce" />
                          Synergize card deck
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Interactive Flip Card viewer */}
                {flashcards.length > 0 && (
                  <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} className="max-w-md mx-auto space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold text-brand-text-secondary">
                      <span>Course: {flashcards[activeCardIdx].subject_name}</span>
                      <span>Card {activeCardIdx + 1} of {flashcards.length}</span>
                    </div>

                    {/* Interactive 3D styled card viewer */}
                    <button
                      type="button"
                      onClick={() => setIsCardFlipped(!isCardFlipped)}
                      className="w-full min-h-[220px] bg-white border border-brand-border rounded-2xl shadow-soft p-6 relative flex flex-col justify-between items-center text-center cursor-pointer transition-all hover:shadow-md select-none border-l-4 border-l-brand-primary text-brand-text-primary outline-none"
                    >
                      <div className="w-full pb-3 border-b border-brand-bg/40 flex justify-between items-center">
                        <span className="text-[8px] uppercase tracking-widest font-bold text-brand-primary">KABAKA Revision deck</span>
                        <HelpCircle className="h-4 w-4 text-brand-text-secondary/60 shrink-0" />
                      </div>

                      <div className="my-auto py-4">
                        {!isCardFlipped ? (
                          <p className="text-sm font-black text-brand-text-primary leading-relaxed">{flashcards[activeCardIdx].front}</p>
                        ) : (
                          <p className="text-xs font-semibold text-brand-text-secondary leading-relaxed bg-[#F0F8FF] border border-[#33D6FF]/10 p-3 rounded-xl">{flashcards[activeCardIdx].back}</p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-brand-bg/40 w-full text-[9px] font-black uppercase tracking-widest text-[#FF5F9E] animate-pulse">
                        {!isCardFlipped ? "⚡ Press card block to Reveal explanation" : "💡 Press card block to review Front prompt"}
                      </div>
                    </button>

                    {/* Deck view controls */}
                    <div className="flex justify-between items-center gap-4">
                      <button
                        type="button"
                        disabled={activeCardIdx === 0}
                        onClick={() => {
                          setActiveCardIdx(prev => prev - 1);
                          setIsCardFlipped(false);
                        }}
                        className="p-2 bg-white hover:bg-brand-bg border border-brand-border rounded-xl font-bold text-xs text-brand-text-primary px-4.5 disabled:opacity-30 cursor-pointer"
                      >
                        Prev Prompt
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteFlashcard(flashcards[activeCardIdx].id)}
                        className="p-2 border border-brand-border bg-white hover:bg-brand-accent-pink/5 hover:border-brand-accent-pink text-[10px] text-brand-text-secondary hover:text-brand-accent-pink uppercase font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove Card
                      </button>

                      <button
                        type="button"
                        disabled={activeCardIdx >= flashcards.length - 1}
                        onClick={() => {
                          setActiveCardIdx(prev => prev + 1);
                          setIsCardFlipped(false);
                        }}
                        className="p-2 bg-brand-primary hover:bg-[#2bc4ec] rounded-xl font-bold text-xs text-brand-text-primary px-4.5 disabled:opacity-30 cursor-pointer"
                      >
                        Next Prompt
                      </button>
                    </div>
                  </motion.div>
                )}

              </motion.div>
            )}

            {/* SUB-TAB 5: COGNITIVE LEARNING INSIGHTS SCREEN */}
            {tutorSubTab === "insights" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-left">
                
                {isInsightsLoading ? (
                  <div className="bg-white border border-brand-border rounded-xl p-24 text-center text-xs text-brand-text-secondary italic flex flex-col items-center justify-center gap-2">
                    <div className="h-6 w-6 border-2 border-dashed border-brand-primary rounded-full animate-spin" />
                    <span>Regulating dynamic stats and performance records...</span>
                  </div>
                ) : aiInsights ? (
                  <div className="space-y-6">
                    <div className="bg-white border border-brand-border p-5 rounded-xl shadow-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex gap-3 items-center">
                        <TrendingUp className="h-5 w-5 text-brand-primary" />
                        <div>
                          <h3 className="font-extrabold text-sm text-brand-text-primary">Cognitive telemetry outcomes</h3>
                          <p className="text-xs text-[#00E5FF] font-semibold font-mono">Aggregated update: {new Date(aiInsights.updated_at).toLocaleTimeString()}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateInsights}
                        className="p-2.5 bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-soft active:scale-95 transition-all w-full md:w-auto"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Recalculate insights
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-semibold">
                      
                      <div className="bg-white border border-brand-border p-5 rounded-xl shadow-soft text-left space-y-1.5 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-brand-text-secondary block">Peak Performance Interval</span>
                          <h4 className="text-sm font-black text-brand-text-primary mt-1 leading-snug">{aiInsights.best_study_time}</h4>
                        </div>
                        <p className="text-[9px] text-brand-text-secondary mt-2">Calculated matching maximum focus metrics logged.</p>
                      </div>

                      <div className="bg-white border border-brand-border p-5 rounded-xl shadow-soft text-left space-y-1.5 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-brand-accent-pink block">Analytical Vulnerability Area</span>
                          <h4 className="text-sm font-black text-brand-text-primary mt-1 leading-snug">{aiInsights.weakest_subject}</h4>
                        </div>
                        <p className="text-[9px] text-brand-text-secondary mt-2">Targeted from historical quiz error logging files.</p>
                      </div>

                      <div className="bg-white border border-brand-border p-5 rounded-xl shadow-soft text-left space-y-1.5 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-brand-success block">Academic Strength Domain</span>
                          <h4 className="text-sm font-black text-brand-text-primary mt-1 leading-snug">{aiInsights.strongest_subject}</h4>
                        </div>
                        <p className="text-[9px] text-brand-text-secondary mt-2">Matches maximum focus blocks logging ratios.</p>
                      </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      
                      <div className="md:col-span-2 bg-white border border-brand-border p-5 rounded-xl shadow-soft space-y-3.5">
                        <span className="text-[10px] uppercase font-bold text-brand-text-secondary block">Vulnerability Concept list</span>
                        <div className="flex flex-wrap gap-1.5">
                          {aiInsights.difficult_topics && aiInsights.difficult_topics.length > 0 ? (
                            aiInsights.difficult_topics.map((t, idx) => (
                              <span key={idx} className="bg-brand-accent-pink/10 border border-brand-accent-pink/15 text-brand-accent-pink text-[10px] px-2.5 py-1.5 rounded-lg font-bold">
                                {t}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-brand-text-secondary italic">Impeccable recall recorded. No core weaknesses mapped.</span>
                          )}
                        </div>
                      </div>

                      <div className="md:col-span-3 bg-[#F0F8FF] border border-[#33D6FF]/15 p-5.5 rounded-2xl relative flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="text-[9px] uppercase font-black text-brand-primary tracking-widest block flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4 animate-pulse" /> Recommended Sovereign Revision Strategy:
                          </span>
                          <p className="text-xs text-brand-text-primary font-bold leading-relaxed">{aiInsights.revision_schedule}</p>
                        </div>
                        
                        <div className="pt-3 border-t border-[#33D6FF]/10 text-[9px] text-brand-text-secondary font-mono">
                          Computed natively on KABAKA sovereign analytical node.
                        </div>
                      </div>

                    </div>

                  </div>
                ) : (
                  <div className="py-24 text-center italic text-xs text-brand-text-secondary">Click the manual recalculate loop to compile scholarly database telemetry.</div>
                )}

              </motion.div>
            )}

          </motion.div>
        )}

      </main>

      {/* 3. CO-PILOT ASSISTANT AI SLIDE DRAWER (MODULE 9: INTERACTIVE CHAT) */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-[#0F172A] z-40"
            />

            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 210 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white border-l border-brand-border shadow-2xl z-50 flex flex-col h-full"
              id="kabaka-ai-chat-drawer"
            >
              {/* Drawer header */}
              <div className="p-5 border-b border-brand-border flex justify-between items-center bg-[#F7FAFF] shrink-0">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-5 w-5 text-brand-primary shrink-0 animate-pulse" />
                  <div>
                    <h3 className="font-display font-extrabold text-sm text-brand-text-primary leading-tight">Crown Mentor Companion</h3>
                    <p className="text-[9px] text-brand-text-secondary uppercase tracking-widest mt-0.5">KABAKA AI Intelligent Tutor</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 px-2.5 border border-brand-border bg-white text-brand-text-secondary hover:text-brand-text-primary text-[10px] uppercase tracking-widest font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Hide
                </button>
              </div>

              {/* Chat messages */}
              <div className="flex-grow p-5 overflow-y-auto space-y-4 bg-white">
                {chatMessages.map((msg) => {
                  const isModel = msg.role === "model";
                  
                  return (
                    <div 
                      key={msg.id}
                      className={`flex flex-col ${isModel ? "items-start" : "items-end"}`}
                    >
                      <div className={`p-4 max-w-[85%] rounded-2xl text-[11px] leading-relaxed relative ${isModel ? "bg-[#F7FAFF] text-brand-text-primary rounded-tl-none border border-brand-border" : "bg-brand-primary text-brand-text-primary rounded-tr-none shadow-soft"}`}>
                        <div className="whitespace-pre-line font-semibold">{msg.content}</div>
                      </div>
                      <span className="text-[8px] text-brand-text-secondary font-semibold mt-1 px-1">{msg.timestamp}</span>
                    </div>
                  );
                })}

                {isChatLoading && (
                  <div className="flex items-center gap-2 text-[10px] text-brand-text-secondary italic">
                    <Sparkles className="h-4 w-4 text-brand-primary animate-spin" />
                    <span>Analyzing academic memory registers...</span>
                  </div>
                )}
              </div>

              {/* Predefined prompts chips */}
              <div className="p-3 border-t border-brand-border bg-[#F7FAFF] flex flex-wrap gap-1.5 shrink-0">
                {[
                  "Draft a custom study timetable",
                  "Explain Feynman study technique",
                  "Why is active recall optimal?"
                ].map((pre, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendChatQuery(pre)}
                    className="text-[9px] px-2.5 py-1.5 rounded-lg border border-brand-border bg-white hover:border-brand-primary text-brand-text-primary font-bold cursor-pointer transition-colors"
                  >
                    {pre}
                  </button>
                ))}
              </div>

              {/* Chat action input */}
              <div className="p-4 border-t border-brand-border shrink-0 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Confer with advisor, command planning..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChatQuery()}
                    className="flex-grow rounded-xl border border-brand-border bg-brand-bg px-4 py-3 text-xs text-brand-text-primary focus:border-brand-primary focus:outline-none"
                  />
                  <button
                    onClick={() => handleSendChatQuery()}
                    disabled={!chatInput.trim() || isChatLoading}
                    className="bg-brand-primary hover:bg-[#2bc4ec] text-brand-text-primary p-3 rounded-xl cursor-pointer disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
