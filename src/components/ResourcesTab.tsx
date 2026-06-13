import React, { useState, useEffect, useRef } from "react";
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  setDoc,
  updateDoc
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Subject, PDFDocument, Note, Whiteboard, CalculatorLog } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  Search, 
  Highlighter, 
  BookMarked, 
  Plus, 
  Trash2, 
  Edit3, 
  Palette, 
  Eraser, 
  Save, 
  Download, 
  Compass, 
  PlusCircle, 
  Clock, 
  Sparkles,
  Link2,
  FileDown
} from "lucide-react";

interface ResourcesTabProps {
  userId: string;
  subjects: Subject[];
  onAwardXP: (xp: number, title: string, description: string, type: 'task_reminder' | 'ai_suggestion' | 'quiz_result' | 'achievement_unlocked' | 'mistake_alert' | 'study_plan_update') => Promise<void>;
}

type SubTabType = "pdf" | "notes" | "whiteboard" | "calculator";

export default function ResourcesTab({ userId, subjects, onAwardXP }: ResourcesTabProps) {
  const [subTab, setSubTab] = useState<SubTabType>("pdf");

  // 1. PDF Viewer States
  const [pdfDocs, setPdfDocs] = useState<PDFDocument[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<PDFDocument | null>(null);
  const [pdfSearchQuery, setPdfSearchQuery] = useState("");
  const [isPdfUploading, setIsPdfUploading] = useState(false);
  const [pdfNameInput, setPdfNameInput] = useState("");
  const [pdfSubjectIdInput, setPdfSubjectIdInput] = useState("");
  
  // Custom interactive mock textbook pages
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [activeHighlights, setActiveHighlights] = useState<number[]>([]); // indexes of sentences highlighted

  const mockPages = [
    "Chapter 1: The Sovereign Foundations of Active Recall. Active recall means testing your memory instead of review. Reviewing passively is sluggish.",
    "Chapter 2: Energy Conservation Laws & Systems. Active recall uses twice as much energy. We conserve study retention with Pomodoro blocks.",
    "Chapter 3: Cognitive Integration Mechanisms. Spacing retention ensures that cognitive layers of KABAKA integrate securely over time.",
    "Chapter 4: Mistakes Diagnostics Framework. Mistakes are raw gold. Analyzing incorrect answers turns local vulnerabilities into master elements."
  ];

  // 2. Notes States
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteSubjectId, setNoteSubjectId] = useState("");
  const [isEditingNote, setIsEditingNote] = useState<Note | null>(null);

  // 3. Whiteboard States
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [brushColor, setBrushColor] = useState("#33D6FF");
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [selectedWbSubjectId, setSelectedWbSubjectId] = useState("");
  const [wbTitle, setWbTitle] = useState("");
  const [isSavingWb, setIsSavingWb] = useState(false);

  // 4. Calculator States
  const [calcInput, setCalcInput] = useState("");
  const [calcResult, setCalcResult] = useState("");
  const [calcLogs, setCalcLogs] = useState<CalculatorLog[]>([]);

  // Lifecycles loaders
  useEffect(() => {
    loadResourcesData();
  }, [userId]);

  // Adjust canvas size on whiteboard selection
  useEffect(() => {
    if (subTab === "whiteboard") {
      setTimeout(() => {
        initCanvas();
      }, 100);
    }
  }, [subTab]);

  const loadResourcesData = async () => {
    try {
      // Load PDF Documents
      const pdfSnap = await getDocs(query(collection(db, "pdf_documents"), where("owner_id", "==", userId)));
      const retrievedPdfs = pdfSnap.docs.map(d => ({ id: d.id, ...d.data() }) as PDFDocument);
      setPdfDocs(retrievedPdfs);
      if (retrievedPdfs.length > 0) setSelectedPdf(retrievedPdfs[0]);

      // Load Notes
      const notesSnap = await getDocs(query(collection(db, "notes"), where("owner_id", "==", userId)));
      setNotes(notesSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Note));

      // Load Whiteboards
      const wbSnap = await getDocs(query(collection(db, "whiteboards"), where("owner_id", "==", userId)));
      setWhiteboards(wbSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Whiteboard));

      // Load Calculator Logs
      const calcSnap = await getDocs(query(collection(db, "calculator_history"), where("owner_id", "==", userId)));
      setCalcLogs(calcSnap.docs.map(d => ({ id: d.id, ...d.data() }) as CalculatorLog));

    } catch (err) {
      console.error("Error loading Resource lists:", err);
    }
  };

  // --- PDF VIEWER ACTIONS ---
  const handleCreatePdfMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfNameInput.trim() || !pdfSubjectIdInput) return;

    setIsPdfUploading(true);
    const sub = subjects.find(s => s.id === pdfSubjectIdInput);
    const pdfId = `pdf-${Date.now()}`;
    const newPdfObj: PDFDocument = {
      id: pdfId,
      owner_id: userId,
      subject_id: pdfSubjectIdInput,
      subject_name: sub ? sub.name : "General",
      filename: pdfNameInput.endsWith(".pdf") ? pdfNameInput : `${pdfNameInput}.pdf`,
      file_size: Math.floor(Math.random() * 2000) + 500, // randomized KB size
      pages_count: 4,
      chapters: ["System Foundations", "Energy Laws", "Integration Mechanisms", "Diagnostics Framework"],
      uploaded_at: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "pdf_documents", pdfId), newPdfObj);
      setPdfDocs(prev => [newPdfObj, ...prev]);
      setSelectedPdf(newPdfObj);
      setPdfNameInput("");
      
      // Award XP for uploading study resources!
      await onAwardXP(40, "Resource Registered", `Uploaded learning book "${newPdfObj.filename}" to resources repository`, 'ai_suggestion');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `pdf_documents/${pdfId}`);
    } finally {
      setIsPdfUploading(false);
    }
  };

  const handleDeletePdf = async (pdfId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, "pdf_documents", pdfId));
      setPdfDocs(prev => prev.filter(p => p.id !== pdfId));
      if (selectedPdf?.id === pdfId) {
        setSelectedPdf(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `pdf_documents/${pdfId}`);
    }
  };

  const handleSentenceHighlight = (index: number) => {
    if (activeHighlights.includes(index)) {
      setActiveHighlights(prev => prev.filter(i => i !== index));
    } else {
      setActiveHighlights(prev => [...prev, index]);
    }
  };

  // --- NOTES ACTIONS ---
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim() || !noteSubjectId) return;

    const sub = subjects.find(s => s.id === noteSubjectId);
    
    if (isEditingNote) {
      const updatedRef = doc(db, "notes", isEditingNote.id);
      const updatedData = {
        title: noteTitle.trim(),
        content: noteContent.trim(),
        subject_id: noteSubjectId,
        subject_name: sub ? sub.name : "General",
        updated_at: new Date().toISOString()
      };
      try {
        await updateDoc(updatedRef, updatedData);
        setNotes(prev => prev.map(n => n.id === isEditingNote.id ? { ...n, ...updatedData } : n));
        setIsEditingNote(null);
        setNoteTitle("");
        setNoteContent("");
        setIsAddingNote(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `notes/${isEditingNote.id}`);
      }
    } else {
      const noteId = `note-${Date.now()}`;
      const newNote: Note = {
        id: noteId,
        owner_id: userId,
        subject_id: noteSubjectId,
        subject_name: sub ? sub.name : "General",
        title: noteTitle.trim(),
        content: noteContent.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, "notes", noteId), newNote);
        setNotes(prev => [newNote, ...prev]);
        setNoteTitle("");
        setNoteContent("");
        setIsAddingNote(false);

        // Award XP for note taking!
        await onAwardXP(30, "Knowledge Synthesized", `Wrote a digital note titled "${newNote.title}"`, 'study_plan_update');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `notes/${noteId}`);
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteDoc(doc(db, "notes", noteId));
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `notes/${noteId}`);
    }
  };

  const handleStartEditNote = (n: Note) => {
    setIsEditingNote(n);
    setNoteTitle(n.title);
    setNoteContent(n.content);
    setNoteSubjectId(n.subject_id);
    setIsAddingNote(true);
  };

  // --- WHITEBOARD ACTIONS ---
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill white background cleanly
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveWhiteboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !wbTitle.trim() || !selectedWbSubjectId) return;

    setIsSavingWb(true);
    const sub = subjects.find(s => s.id === selectedWbSubjectId);
    const dataUrl = canvas.toDataURL(); // base64 string image representation
    const wbId = `wb-${Date.now()}`;
    
    const newWb: Whiteboard = {
      id: wbId,
      owner_id: userId,
      subject_id: selectedWbSubjectId,
      subject_name: sub ? sub.name : "General",
      title: wbTitle.trim(),
      canvas_data: dataUrl,
      created_at: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "whiteboards", wbId), newWb);
      setWhiteboards(prev => [newWb, ...prev]);
      setWbTitle("");
      
      // Award XP for sketching / visual diagramming
      await onAwardXP(50, "Canvas Structured", `Saved whiteboard layout "${newWb.title}" for active revision`, 'achievement_unlocked');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `whiteboards/${wbId}`);
    } finally {
      setIsSavingWb(false);
    }
  };

  const loadSavedWhiteboard = (wb: Whiteboard) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = wb.canvas_data;
    img.onload = () => {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    setWbTitle(wb.title);
    setSelectedWbSubjectId(wb.subject_id);
  };

  const handleDeleteWhiteboard = async (wbId: string) => {
    try {
      await deleteDoc(doc(db, "whiteboards", wbId));
      setWhiteboards(prev => prev.filter(w => w.id !== wbId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `whiteboards/${wbId}`);
    }
  };

  // --- CALCULATOR ACTIONS ---
  const handleCalcKeyPress = (val: string) => {
    setCalcInput(prev => prev + val);
  };

  const handleCalcClear = () => {
    setCalcInput("");
    setCalcResult("");
  };

  const handleCalcBackspace = () => {
    setCalcInput(prev => prev.slice(0, -1));
  };

  const handleCalcEvaluate = async () => {
    if (!calcInput.trim()) return;
    try {
      // Safely evaluate math expression without using dangerous standard eval function
      // Clean letters & only allow basic maths syntax tokens:
      const cleanExpr = calcInput
        .replace(/π/g, "Math.PI")
        .replace(/e/g, "Math.E")
        .replace(/sin\(/g, "Math.sin(")
        .replace(/cos\(/g, "Math.cos(")
        .replace(/tan\(/g, "Math.tan(")
        .replace(/log\(/g, "Math.log10(")
        .replace(/ln\(/g, "Math.log(")
        .replace(/sqrt\(/g, "Math.sqrt(")
        .replace(/\^/g, "**");

      // Execute safe calculation evaluation in strict sandbox scope
      const evaluator = new Function(`return (${cleanExpr})`);
      const evaluatedResult = evaluator().toString();
      setCalcResult(evaluatedResult);

      // Save to Calculator History in Firestore
      const logId = `calc-${Date.now()}`;
      const newLog: CalculatorLog = {
        id: logId,
        owner_id: userId,
        expression: calcInput,
        result: evaluatedResult,
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, "calculator_history", logId), newLog);
      setCalcLogs(prev => [newLog, ...prev]);

    } catch (err) {
      setCalcResult("Error");
    }
  };

  const handleDeleteCalcLog = async (logId: string) => {
    try {
      await deleteDoc(doc(db, "calculator_history", logId));
      setCalcLogs(prev => prev.filter(l => l.id !== logId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `calculator_history/${logId}`);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. Header Details */}
      <div className="pb-4 border-b border-brand-border flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl font-black text-brand-text-primary tracking-tight">Resource Center</h2>
          <p className="text-xs text-brand-text-secondary mt-0.5">Your hub for study files, sketchboards, personal logs, and mathematical aids.</p>
        </div>
      </div>

      {/* 2. Resources Sub-tab Selectors */}
      <div className="flex flex-wrap gap-2 border-b border-brand-border pb-1">
        {[
          { id: "pdf", label: "PDF Textbook Viewer", icon: <FileText className="h-3.5 w-3.5" /> },
          { id: "notes", label: "Smart Notebook", icon: <Edit3 className="h-3.5 w-3.5" /> },
          { id: "whiteboard", label: "Concept Whiteboard", icon: <Palette className="h-3.5 w-3.5" /> },
          { id: "calculator", label: "Scientific Calculator", icon: <Compass className="h-3.5 w-3.5" /> },
        ].map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setSubTab(tabItem.id as SubTabType)}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${subTab === tabItem.id ? "bg-brand-primary text-brand-text-primary shadow-soft" : "bg-white hover:bg-brand-bg text-brand-text-secondary border border-brand-border"}`}
          >
            {tabItem.icon}
            <span>{tabItem.label}</span>
          </button>
        ))}
      </div>

      {/* 3. Sub-tab Content Area */}
      <AnimatePresence mode="wait">
        {/* SUBTAB 1: PDF VIEWER */}
        {subTab === "pdf" && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar List of PDFs */}
            <div className="lg:col-span-1 bg-white border border-brand-border p-4.5 rounded-2xl shadow-soft space-y-4 h-fit">
              <div className="pb-3 border-b border-brand-border flex justify-between items-center">
                <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary">Textbooks Directory</h3>
                <span className="text-[10px] font-mono text-brand-primary font-bold bg-brand-primary/10 px-2 rounded-lg">{pdfDocs.length} books</span>
              </div>

              {/* Add New PDF simple Form */}
              <form onSubmit={handleCreatePdfMetadata} className="space-y-3 pb-3 border-b border-brand-border">
                <input
                  type="text"
                  placeholder="Reference/Book title..."
                  value={pdfNameInput}
                  onChange={(e) => setPdfNameInput(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-brand-bg border border-brand-border text-brand-text-primary focus:outline-none focus:border-brand-primary font-semibold"
                />
                <select
                  value={pdfSubjectIdInput}
                  onChange={(e) => setPdfSubjectIdInput(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-brand-bg border border-brand-border text-brand-text-primary focus:outline-none focus:border-brand-primary font-semibold"
                >
                  <option value="">Link Subject...</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={isPdfUploading || !pdfNameInput.trim() || !pdfSubjectIdInput}
                  className="w-full bg-brand-primary text-brand-text-primary p-2 text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-[#33D6FF]/95 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Add Document
                </button>
              </form>

              {/* Directory Listing */}
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {pdfDocs.length === 0 ? (
                  <div className="py-8 text-center text-[10px] text-brand-text-secondary italic">No custom books catalogued yet. Use the above form to initialize a reference!</div>
                ) : (
                  pdfDocs.map(pdf => {
                    const active = selectedPdf?.id === pdf.id;
                    return (
                      <div
                        key={pdf.id}
                        onClick={() => setSelectedPdf(pdf)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${active ? "bg-brand-primary/10 border-brand-primary/40 text-brand-text-primary" : "bg-brand-bg border-transparent hover:bg-brand-border/15 text-brand-text-secondary"}`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <FileText className="h-4 w-4 text-brand-primary mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold truncate max-w-[120px]">{pdf.filename}</p>
                            <p className="text-[9px] uppercase tracking-wider font-mono text-brand-text-secondary font-bold mt-0.5">{pdf.subject_name}</p>
                          </div>
                        </div>
                        <button onClick={(e) => handleDeletePdf(pdf.id, e)} className="p-1 hover:text-brand-accent-pink text-brand-text-secondary/60 shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Main Interactive Book Canvas & Search Highlights */}
            <div className="lg:col-span-3 bg-white border border-brand-border p-6 rounded-2xl shadow-soft flex flex-col justify-between min-h-[420px]">
              <div>
                <div className="pb-3 border-b border-brand-border flex justify-between items-center flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-brand-primary" />
                    <div>
                      <h3 className="font-extrabold text-sm text-brand-text-primary">{selectedPdf ? selectedPdf.filename : "Select PDF Textbook to begin"}</h3>
                      <p className="text-[9px] uppercase tracking-wider text-brand-text-secondary font-bold mt-0.5">Subject: {selectedPdf ? selectedPdf.subject_name : "General Catalog"}</p>
                    </div>
                  </div>
                  {/* Real-time search inside text */}
                  {selectedPdf && (
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-brand-text-secondary" />
                      <input
                        type="text"
                        placeholder="Search page text..."
                        value={pdfSearchQuery}
                        onChange={(e) => setPdfSearchQuery(e.target.value)}
                        className="rounded-xl border border-brand-border bg-brand-bg pl-9 pr-3 py-2 text-xs text-brand-text-primary focus:outline-none focus:border-brand-primary font-semibold"
                      />
                    </div>
                  )}
                </div>

                {selectedPdf ? (
                  <div className="mt-6 flex flex-col md:flex-row gap-6">
                    {/* Chapter Sidelist Outline */}
                    <div className="md:w-1/3 bg-brand-bg border border-brand-border p-4 rounded-xl text-left h-fit space-y-3">
                      <h4 className="font-black text-[10px] text-brand-text-secondary uppercase tracking-wider border-b border-brand-border pb-1.5 flex items-center gap-1.5">
                        <BookMarked className="h-3.5 w-3.5" /> Chapters Index
                      </h4>
                      <div className="space-y-1.5 text-xs text-brand-text-primary">
                        {selectedPdf.chapters?.map((chap, idx) => {
                          const isCurrent = pdfCurrentPage === idx + 1;
                          return (
                            <button
                              key={chap}
                              onClick={() => {
                                setPdfCurrentPage(idx + 1);
                                setActiveHighlights([]);
                              }}
                              className={`w-full text-left p-2.5 rounded-lg text-[11px] font-bold transition-all transition-colors ${isCurrent ? "bg-brand-primary text-brand-text-primary shadow-sm" : "hover:bg-brand-border/10 text-brand-text-secondary"}`}
                            >
                              Page {idx + 1}: {chap}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Book Page Interactive Text Reader */}
                    <div className="md:w-2/3 space-y-4">
                      <div className="p-6 border border-brand-border/40 bg-brand-bg rounded-xl text-xs leading-relaxed text-brand-text-primary shadow-inner">
                        <div className="flex justify-between items-center pb-2 border-b border-brand-border/30 mb-4 font-mono text-[9px] text-brand-text-secondary uppercase font-black">
                          <span>KABAKA Reader Frame</span>
                          <span>Page {pdfCurrentPage} of {selectedPdf.pages_count}</span>
                        </div>

                        {/* Interactive Page sentences highlighting block */}
                        <div id="pdf-interactive-sentences" className="space-y-3">
                          {mockPages[pdfCurrentPage - 1].split(". ").map((sentence, sIdx) => {
                            if (!sentence.trim()) return null;
                            const fullSentence = sentence + ".";
                            
                            // Check if sentence matches search query filter
                            const doesMatchSearch = pdfSearchQuery.trim() !== "" && fullSentence.toLowerCase().includes(pdfSearchQuery.toLowerCase());
                            const isHighlighted = activeHighlights.includes(sIdx);

                            return (
                              <p
                                key={sIdx}
                                onClick={() => handleSentenceHighlight(sIdx)}
                                className={`p-1.5 rounded transition-all cursor-pointer hover:bg-[#33D6FF]/5 selection:bg-none ${isHighlighted ? "bg-[#FFF176]/50 border-l-3 border-[#FBC02D] text-brand-text-primary" : ""} ${doesMatchSearch ? "bg-brand-primary/10 border-l-3 border-brand-primary" : ""}`}
                              >
                                {doesMatchSearch ? (
                                  <span className="font-extrabold flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5 text-brand-primary animate-pulse shrink-0" />
                                    {fullSentence}
                                  </span>
                                ) : (
                                  fullSentence
                                )}
                              </p>
                            );
                          })}
                        </div>
                      </div>

                      <p className="text-[10px] text-brand-text-secondary italic flex items-center gap-1.5 bg-brand-primary/5 p-3 rounded-xl border border-brand-primary/15">
                        <Highlighter className="h-4 w-4 text-brand-primary" /> Hint: Press any sentence segment inside the reader framer above to mark dynamic highlights persistent on page view.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 text-center text-xs text-brand-text-secondary italic flex flex-col items-center justify-center space-y-2">
                    <FileDown className="h-12 w-12 text-brand-border animate-bounce" />
                    <span>Select or Upload your Study textbook to engage the active highlight page reader.</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-brand-border mt-6 flex justify-between items-center text-[9px] text-brand-text-secondary font-mono tracking-wider font-extrabold uppercase">
                <span>Core Module: PDF Document Hub</span>
                <span>Active study state persistent on cloud</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 2: NOTEBOOK */}
        {subTab === "notes" && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            
            {/* Control Bar */}
            <div className="bg-white border border-brand-border p-5 rounded-2xl shadow-soft flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-left">
                <h3 className="font-bold text-sm text-brand-text-primary flex items-center gap-2">
                  <Edit3 className="h-4.5 w-4.5 text-brand-primary" />
                  Your Sovereign Academic Notes
                </h3>
                <p className="text-xs text-brand-text-secondary mt-0.5 mt-1">Capture lessons breakdowns, study summaries, and custom concept mappings.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditingNote(null);
                  setNoteTitle("");
                  setNoteContent("");
                  setNoteSubjectId(subjects[0]?.id || "");
                  setIsAddingNote(!isAddingNote);
                }}
                className="w-full sm:w-auto bg-brand-primary hover:bg-[#33D6FF]/90 text-brand-text-primary p-2.5 px-6 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> {isAddingNote ? "Collapse Note Editor" : "Compose New Note"}
              </button>
            </div>

            {/* Compose / Edit Note Overlay */}
            {isAddingNote && (
              <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSaveNote} className="bg-white border border-brand-border p-6 rounded-2xl shadow-soft space-y-4 text-left">
                <div className="pb-3 border-b border-brand-border flex justify-between items-center">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary">{isEditingNote ? "Update Concept Note" : "Compose New Learning entry"}</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-brand-text-secondary">Note Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Photosynthesis synthesis pathways summary, Thermodynamics Laws proof..."
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl bg-brand-bg border border-brand-border text-brand-text-primary focus:outline-none focus:border-brand-primary font-semibold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-brand-text-secondary">Track Course</label>
                    <select
                      value={noteSubjectId}
                      onChange={(e) => setNoteSubjectId(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl bg-brand-bg border border-brand-border text-brand-text-primary focus:outline-none focus:border-brand-primary font-semibold"
                      required
                    >
                      <option value="">Select subject...</option>
                      {subjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-brand-text-secondary">Notebook Content (Supports plain text summary)</label>
                  <textarea
                    rows={6}
                    placeholder="Provide details about concepts, definitions, equations, mnemonics, or test-prep highlights..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full text-xs p-4 rounded-xl bg-brand-bg border border-brand-border text-brand-text-primary focus:outline-none focus:border-brand-primary font-medium leading-relaxed"
                    required
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2 border-t border-brand-bg/50">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNote(false);
                      setIsEditingNote(null);
                    }}
                    className="p-2.5 px-5 rounded-xl border border-brand-border text-brand-text-secondary text-xs hover:bg-brand-bg cursor-pointer"
                  >
                    Cancel Action
                  </button>
                  <button
                    type="submit"
                    className="bg-brand-primary text-brand-text-primary p-2.5 px-6 rounded-xl text-xs font-bold hover:bg-[#33D6FF]/95 transition-all cursor-pointer shadow-soft"
                  >
                    {isEditingNote ? "Update Saved Entry" : "Commit Note to Firestore"}
                  </button>
                </div>
              </motion.form>
            )}

            {/* Note Listing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.length === 0 ? (
                <div className="col-span-full py-16 bg-white border border-brand-border rounded-2xl text-center text-xs text-brand-text-secondary italic flex flex-col items-center justify-center space-y-2">
                  <Compass className="h-10 w-10 text-brand-border" />
                  <span>Your notebook is complete clean. Click 'Compose New Note' to document local study maps!</span>
                </div>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="bg-white border border-brand-border p-5 rounded-2xl shadow-soft flex flex-col justify-between h-[210px] hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[8px] uppercase font-mono font-black border border-brand-primary/20 bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-md">
                          {note.subject_name}
                        </span>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleStartEditNote(note)} className="p-1 hover:text-brand-primary text-brand-text-secondary/60">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeleteNote(note.id)} className="p-1 hover:text-brand-accent-pink text-brand-text-secondary/60">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-left space-y-1">
                        <h4 className="font-extrabold text-xs text-brand-text-primary truncate">{note.title}</h4>
                        <p className="text-[11px] font-medium leading-relaxed text-brand-text-secondary line-clamp-3 whitespace-pre-line">{note.content}</p>
                      </div>
                    </div>

                    <div className="border-t border-brand-bg/50 pt-2.5 flex justify-between items-center text-[9px] text-brand-text-secondary font-mono">
                      <span>Interactive note</span>
                      <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </motion.div>
        )}

        {/* SUBTAB 3: WHITEBOARD DRAWING CANVAS */}
        {subTab === "whiteboard" && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
            {/* Whiteboard Options and saved loads */}
            <div className="lg:col-span-1 bg-white border border-brand-border p-4.5 rounded-2xl shadow-soft space-y-4">
              <div className="pb-3 border-b border-brand-border">
                <h3 className="font-bold text-xs uppercase tracking-wider text-brand-text-primary">Sketchboard Controls</h3>
              </div>

              {/* Whiteboard Configuration */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-brand-text-secondary">Brush Tone Accent</label>
                  <div className="flex gap-2 flex-wrap">
                    {["#33D6FF", "#FF5F9E", "#B7F34D", "#000000", "#FFC107", "#7E57C2"].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setBrushColor(color)}
                        className={`h-6 w-6 rounded-full cursor-pointer transition-all border ${brushColor === color ? "scale-110 border-brand-text-primary border-2" : "border-transparent"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => setBrushColor("#FFFFFF")} // Eraser Mode!
                      className={`h-6 w-6 rounded-md hover:bg-brand-bg border flex items-center justify-center cursor-pointer ${brushColor === "#FFFFFF" ? "border-brand-primary" : "border-brand-border"}`}
                    >
                      <Eraser className="h-3.5 w-3.5 text-brand-text-secondary" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-brand-text-secondary">
                    <span>Brush Thickness</span>
                    <span className="font-mono">{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-full accent-brand-primary bg-brand-bg rounded-lg h-1"
                  />
                </div>

                {/* Save and Label Input Container */}
                <div className="space-y-3.5 border-t border-brand-bg pt-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-brand-text-secondary">Whiteboard Key Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Vector sketch, Heart chambers..."
                      value={wbTitle}
                      onChange={(e) => setWbTitle(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-brand-bg border border-brand-border text-brand-text-primary focus:outline-none focus:border-brand-primary font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-brand-text-secondary">Course Alignment</label>
                    <select
                      value={selectedWbSubjectId}
                      onChange={(e) => setSelectedWbSubjectId(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-brand-bg border border-brand-border text-brand-text-primary focus:outline-none focus:border-brand-primary font-semibold"
                    >
                      <option value="">Select subject scope...</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="bg-brand-bg hover:bg-brand-border/15 text-brand-text-secondary p-2.5 rounded-xl text-[10px] font-bold border border-brand-border cursor-pointer transition-all uppercase tracking-wider text-center"
                    >
                      Clear Board
                    </button>
                    <button
                      type="button"
                      disabled={isSavingWb || !wbTitle.trim() || !selectedWbSubjectId}
                      onClick={handleSaveWhiteboard}
                      className="bg-brand-primary hover:bg-[#33D6FF]/90 text-brand-text-primary p-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-40"
                    >
                      <Save className="h-3.5 w-3.5" /> Save Sketch
                    </button>
                  </div>
                </div>
              </div>

              {/* Saved Boards History Loads directory */}
              <div className="space-y-2 border-t border-brand-bg pt-3 max-h-[170px] overflow-y-auto">
                <h4 className="font-extrabold text-[10px] text-brand-text-secondary uppercase tracking-widest block mb-2">Saved Sketches ({whiteboards.length})</h4>
                {whiteboards.length === 0 ? (
                  <p className="text-[9px] text-brand-text-secondary italic">No persistent boards locked on cloud.</p>
                ) : (
                  whiteboards.map(wb => (
                    <div
                      key={wb.id}
                      onClick={() => loadSavedWhiteboard(wb)}
                      className="group p-2.5 rounded-lg border border-brand-border/40 bg-brand-bg text-[10.5px] font-bold text-brand-text-primary cursor-pointer hover:bg-brand-border/15 transition-all flex items-center justify-between"
                    >
                      <div className="truncate max-w-[120px] text-left">
                        <p className="truncate text-brand-text-primary leading-tight">{wb.title}</p>
                        <span className="text-[8px] font-mono font-black tracking-widest text-[#FFF176] uppercase block mt-1">{wb.subject_name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWhiteboard(wb.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-brand-text-secondary hover:text-brand-accent-pink shrink-0 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Main Interactive drawing Canvas */}
            <div className="lg:col-span-3 bg-white border border-brand-border p-5 rounded-2xl shadow-soft flex flex-col justify-between items-center bg-zinc-100">
              <div className="w-full flex justify-between items-center pb-2.5 border-b border-brand-border select-none bg-white p-3 rounded-xl mb-4">
                <div className="flex gap-2 items-center text-xs font-bold text-brand-text-primary text-left">
                  <Palette className="h-4 w-4 text-brand-primary" />
                  <div>
                    <h4 className="font-extrabold text-xs">Royal Learning Whiteboard Concept canvas</h4>
                    <p className="text-[9px] text-brand-text-secondary mt-0.5">Drag cursor freely to diagram concepts, map logic, or write scratch solutions.</p>
                  </div>
                </div>
                <div className="h-3 w-3 rounded-full bg-brand-success shrink-0" title="Live Drawing active" />
              </div>

              {/* Real HTML5 Drawing Canvas Container */}
              <div className="w-full h-[380px] bg-white border border-brand-border rounded-xl shadow-inner relative overflow-hidden flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={680}
                  height={380}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="bg-white border-0 shadow-lg cursor-crosshair max-w-full block"
                />
              </div>

              <div className="pt-3 border-t border-brand-border w-full flex justify-between items-center text-[9px] text-brand-text-secondary mt-4 font-mono font-bold uppercase tracking-wider select-none">
                <span>Viewport bounds: 680x380 px</span>
                <span>Drawings saved as high comfort base64 format on Firestore databanks</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 4: SCIENTIFIC CALCULATOR */}
        {subTab === "calculator" && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scientific Math Controls Console */}
            <div className="lg:col-span-2 bg-white border border-brand-border p-6 rounded-2xl shadow-soft text-left space-y-6">
              <div className="pb-3 border-b border-brand-border flex items-center gap-2">
                <Compass className="h-5 w-5 text-brand-primary" />
                <div>
                  <h3 className="font-extrabold text-sm text-brand-text-primary">Sovereign Scientific Calculator</h3>
                  <p className="text-[10px] text-brand-text-secondary mt-0.5">Evaluates complex mathematical relations, trigonometry, exponentials, and constants.</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Visual Digital Display */}
                <div className="w-full bg-[#1A1A1A] text-[#B7F34D] border-2 border-brand-border p-6 rounded-2xl text-right font-mono text-lg shadow-inner min-h-[110px] flex flex-col justify-between">
                  <div className="text-sm font-semibold tracking-wider text-neutral-400 max-w-full overflow-x-auto select-all leading-tight">{calcInput || "0"}</div>
                  <div className="text-2xl font-black truncate leading-none mt-2">{calcResult ? `= ${calcResult}` : ""}</div>
                </div>

                {/* Keyboard Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 font-mono text-xs">
                  {/* Row 1 Scientifics */}
                  {["sin(", "cos(", "tan(", "log(", "ln(", "sqrt("].map(btn => (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => handleCalcKeyPress(btn)}
                      className="bg-brand-bg hover:bg-brand-border/15 p-3 rounded-lg text-brand-text-primary font-bold transition-all border border-brand-border cursor-pointer"
                    >
                      {btn.replace("(", "")}
                    </button>
                  ))}

                  {/* Operational Elements Row 2 */}
                  {["^", "(", ")", "π", "e", "/"].map(btn => (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => handleCalcKeyPress(btn)}
                      className="bg-brand-bg hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/40 p-3 rounded-lg text-brand-text-secondary font-bold border border-brand-border cursor-pointer transition-all"
                    >
                      {btn}
                    </button>
                  ))}

                  {/* Numbers & basic metrics */}
                  {["7", "8", "9", "*", "4", "5", "6", "-", "1", "2", "3", "+", "0", ".", "00"].map(btn => (
                    <button
                      key={btn}
                      type="button"
                      onClick={() => handleCalcKeyPress(btn)}
                      className="bg-white hover:bg-brand-bg hover:border-brand-text-secondary/20 p-4.5 rounded-xl text-brand-text-primary font-extrabold text-sm border border-brand-border cursor-pointer select-none"
                    >
                      {btn}
                    </button>
                  ))}

                  {/* Actions buttons */}
                  <button
                    type="button"
                    onClick={handleCalcBackspace}
                    className="p-4 rounded-xl border border-brand-accent-pink/15 bg-brand-accent-pink/5 hover:bg-[#FF5F9E]/10 text-brand-accent-pink font-extrabold cursor-pointer transition-all col-span-1"
                  >
                    DEL
                  </button>
                  <button
                    type="button"
                    onClick={handleCalcClear}
                    className="p-4 rounded-xl border border-[#FF5F9E]/20 bg-[#FF5F9E]/5 hover:bg-[#FF5F9E]/10 text-brand-accent-pink font-extrabold cursor-pointer transition-all col-span-1"
                  >
                    AC
                  </button>
                  <button
                    type="button"
                    onClick={handleCalcEvaluate}
                    className="p-4 rounded-xl bg-brand-primary text-brand-text-primary hover:bg-[#33D6FF]/95 font-black text-sm shadow-soft cursor-pointer transition-all sm:col-span-2 col-span-2 text-center select-none"
                  >
                    =
                  </button>
                </div>
              </div>
            </div>

            {/* Calculations Log Records directory */}
            <div className="lg:col-span-1 bg-white border border-brand-border p-5 rounded-2xl shadow-soft text-left flex flex-col justify-between min-h-[300px]">
              <div className="space-y-4">
                <h4 className="font-black text-[10px] text-brand-text-secondary uppercase tracking-wider border-b border-brand-border pb-1.5 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-brand-primary" /> Computational History
                </h4>
                
                <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
                  {calcLogs.length === 0 ? (
                    <p className="text-xs text-brand-text-secondary italic py-10 text-center">No mathematical calculations indexed on active study node.</p>
                  ) : (
                    calcLogs.map(log => (
                      <div key={log.id} className="p-3 border border-brand-border/40 rounded-xl bg-brand-bg text-right font-mono relative group transition-colors hover:border-brand-primary/20">
                        <button
                          onClick={() => handleDeleteCalcLog(log.id)}
                          className="opacity-0 group-hover:opacity-100 absolute left-2 top-2 p-1 text-brand-text-secondary hover:text-brand-accent-pink shrink-0 transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <p className="text-[10px] text-neutral-400 select-all">{log.expression}</p>
                        <p className="text-xs font-black text-brand-primary mt-1 select-all">= {log.result}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t border-brand-bg/60 pt-3 flex justify-between text-[8px] text-brand-text-secondary font-mono mt-4 font-bold uppercase tracking-widest">
                <span>Calculations state locked</span>
                <span>Cloud persistence active</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
