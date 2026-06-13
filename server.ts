import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client strictly server-side
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("GEMINI_API_KEY is not defined. AI functions will run in sandbox mode.");
}

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiEnabled: !!ai });
});

// 2. Onboarding Initial Analysis API
// Builds the initial custom analysis and designs 3 custom starter tasks
app.post("/api/onboarding-analysis", async (req, res) => {
  const { name, preferred_study_time, hours_per_day, focus_level, learning_style, subjects } = req.body;

  if (!name || !subjects || !Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({ error: "Missing required onboarding fields: name and subjects list" });
  }

  const subjectsStr = subjects.join(", ");

  const prompt = `Perform an initial learning system analysis for a student named "${name}".
Subjects: ${subjectsStr}
Preferences:
- Preferred Study Time: ${preferred_study_time || 'Flexible'}
- Hours Per Day: ${hours_per_day || 2} hours
- Focus Level Requirements: ${focus_level || 'Medium'}
- Learning Pace/Pref: ${learning_style || 'Flexible sessions'}

Provide:
1. A tailored Royal Welcome Greeting as KABAKA, the King of Learning Systems (encouraging, motivational, and structured).
2. A customized overall learning strategy for this profile (under 4 concise points).
3. Generate exactly 2 study starter tasks/milestones per subject in JSON format. Provide these in the standard JSON structure outlined below.`;

  try {
    if (!ai) {
      // Fallback sandbox response if API key is missing
      return res.json({
        greeting: `Welcome, ${name}! I am KABAKA, the King of Learning Systems. Together, we shall conquer ${subjectsStr} and construct the ultimate learning routine.`,
        strategy: [
          `Utilize your preferred time (${preferred_study_time || 'Flexible'}) to engage in high-focus exercises.`,
          `Target ${hours_per_day || 2} hours per day split cleanly into active recall sessions.`,
          `Keep task goals attainable to match your ${focus_level || 'Medium'} focus level.`
        ],
        suggestedTasks: subjects.flatMap((subj: string) => [
          { title: `Read introductory chapter of ${subj}`, subject_name: subj },
          { title: `Synthesize key formulas or terms for ${subj}`, subject_name: subj }
        ])
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are KABAKA, King of Learning Systems. Deliver encouraging, high-fidelity tutor recommendations. Output your final response strictly as valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["greeting", "strategy", "suggestedTasks"],
          properties: {
            greeting: {
              type: Type.STRING,
              description: "A tailored, royal welcome address to the student"
            },
            strategy: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of 3-4 strategic learning tips tailored to their learning_style and focus_level"
            },
            suggestedTasks: {
              type: Type.ARRAY,
              description: "Array of exactly 2 suggested starter tasks per subject",
              items: {
                type: Type.OBJECT,
                required: ["title", "subject_name"],
                properties: {
                  title: { type: Type.STRING, description: "A concrete, actionable study task (e.g. 'Read Chapter 1' or 'Solve algebra review questions')" },
                  subject_name: { type: Type.STRING, description: "The exact matching subject this task belongs to" }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText.trim());
    res.json(data);
  } catch (error: any) {
    console.warn("Gemini onboarding analysis error (falling back to sandbox):", error);
    res.json({
      greeting: `Welcome, ${name}! I am KABAKA, the King of Learning Systems. Together, we shall conquer ${subjectsStr} and construct the ultimate learning routine.`,
      strategy: [
        `Utilize your preferred time (${preferred_study_time || 'Flexible'}) to engage in high-focus exercises.`,
        `Target ${hours_per_day || 2} hours per day split cleanly into active recall sessions.`,
        `Keep task goals attainable to match your ${focus_level || 'Medium'} focus level.`
      ],
      suggestedTasks: subjects.flatMap((subj: string) => [
        { title: `Read introductory chapter of ${subj}`, subject_name: subj },
        { title: `Synthesize key formulas or terms for ${subj}`, subject_name: subj }
      ]),
      is_fallback: true,
      fallback_reason: error.message || "Quota limit reached"
    });
  }
});

// 2.5: Book Syllabus Parser API (Module 3 - Book System)
// Extracts units and lessons structured from book details/syllabus using GenAI
app.post("/api/analyze-book", async (req, res) => {
  const { subject_name, book_name } = req.body;

  if (!subject_name || !book_name) {
    return res.status(400).json({ error: "subject_name and book_name are required" });
  }

  const prompt = `Act as KABAKA's royal analytical engine. The student uploaded a book/reference titled "${book_name}" for the course "${subject_name}".
Analyze the concepts of this reference and construct a complete, tailored learning structure (syllabus).
Divide the material into exactly 3 structured Units, with each Unit containing exactly 3 focused, actionable Lessons (e.g., 'Introduction to Vectors' or 'First Law of Thermodynamics').

Output format must strictly be JSON containing a "units" list.`;

  try {
    if (!ai) {
      // Sandbox fallback if API key is not ready
      return res.json({
        units: [
          { id: "unit-1", title: "Unit 1: Fundamental Concepts in " + subject_name, lessons: ["Lesson 1.1: Core Definitions", "Lesson 1.2: Essential Laws and Theories", "Lesson 1.3: Introductory Problems"] },
          { id: "unit-2", title: "Unit 2: Practical Core of " + subject_name, lessons: ["Lesson 2.1: Key Principles", "Lesson 2.2: Advanced Conceptual Logic", "Lesson 2.3: Empirical Methods"] },
          { id: "unit-3", title: "Unit 3: Comprehensive Synthesis of " + subject_name, lessons: ["Lesson 3.1: Complex Calculations", "Lesson 3.2: Integrative Case Studies", "Lesson 3.3: Royal Advanced Mastery"] }
        ]
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are KABAKA's royal scientific advisor. Systematically break down the book into logical learning courses. Return output strictly as JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["units"],
          properties: {
            units: {
              type: Type.ARRAY,
              description: "Structured units and lessons for the syllabus",
              items: {
                type: Type.OBJECT,
                required: ["id", "title", "lessons"],
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  lessons: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text || '{"units": []}';
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.warn("Gemini book analysis error (falling back to sandbox):", error);
    res.json({
      units: [
        { id: "unit-1", title: "Unit 1: Fundamental Concepts in " + subject_name, lessons: ["Lesson 1.1: Core Definitions", "Lesson 1.2: Essential Laws and Theories", "Lesson 1.3: Introductory Problems"] },
        { id: "unit-2", title: "Unit 2: Practical Core of " + subject_name, lessons: ["Lesson 2.1: Key Principles", "Lesson 2.2: Advanced Conceptual Logic", "Lesson 2.3: Empirical Methods"] },
        { id: "unit-3", title: "Unit 3: Comprehensive Synthesis of " + subject_name, lessons: ["Lesson 3.1: Complex Calculations", "Lesson 3.2: Integrative Case Studies", "Lesson 3.3: Royal Advanced Mastery"] }
      ],
      is_fallback: true,
      fallback_reason: error.message || "Quota limit reached"
    });
  }
});

// 2.6: AI Study Plan Generator API (Module 5)
// Formulates 3 to 6 optimized daily actions based on current subjects and study profile
app.post("/api/generate-study-plan", async (req, res) => {
  const { profile, subjects, tasks } = req.body;

  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({ error: "List of current subjects is required to formulate the plan" });
  }

  const studentName = profile?.name || "Student Scholar";
  const hoursPerDay = profile?.hours_per_day || 2;
  const focusLevel = profile?.focus_level || "Medium";
  const learningStyle = profile?.learning_style || "Flexible sessions";
  const preferredTime = profile?.preferred_study_time || "Flexible";

  const subjectsPromptData = subjects.map(s => {
    return `- Subject: ${s.name} (${s.units_count || 0} Units, ${s.lessons_count || 0} Lessons). ${s.book_name ? `Book: ${s.book_name}` : 'No specific textbook upload'}`;
  }).join("\n");

  const prompt = `Formulate an optimized daily study plan for our sovereign scholar ${studentName}.
Our scholar's study parameters:
- Available Time: ${hoursPerDay} hours/day
- Preferred Time: ${preferredTime}
- Fatigue Focus Level: ${focusLevel}
- Learning Style: ${learningStyle}

Active Courses and Materials:
${subjectsPromptData}

Formulate exactly 4 actionable, highly specific learning tasks for today.
Distribute these tasks across 1 or more subjects.
Assign a recommended duration to each task in minutes (the sum should align with their daily target of ${hoursPerDay * 60} minutes).
For each task, specify:
- title: clear actionable study goal (e.g., "Active recall review of Unit 1 definitions key terms in Biology")
- subject_id: matching subject id
- subject_name: matching subject name
- priority: "High", "Medium", or "Low"
- duration: duration in minutes

Output format must be strictly JSON.`;

  try {
    if (!ai) {
      // Sandbox fallback if API key is not ready
      const starterTasks = subjects.flatMap((s: any, idx) => {
        return [
          {
            title: `Read active lesson in ${s.name}`,
            subject_id: s.id,
            subject_name: s.name,
            priority: idx === 0 ? "High" : "Medium",
            duration: Math.round((hoursPerDay * 60) / 4)
          }
        ];
      }).slice(0, 4);

      // Pad if it's less than 4 tasks
      while (starterTasks.length < 4 && subjects.length > 0) {
        starterTasks.push({
          title: `Solve core revision prompt in ${subjects[0].name}`,
          subject_id: subjects[0].id,
          subject_name: subjects[0].name,
          priority: "Low",
          duration: 30
        });
      }

      return res.json({ tasks: starterTasks });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are KABAKA's Grand Planner. Schedule optimized tasks that match available study hours without overwhelming the scholar. Return output strictly as JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["tasks"],
          properties: {
            tasks: {
              type: Type.ARRAY,
              description: "Array of exactly 4 study tasks",
              items: {
                type: Type.OBJECT,
                required: ["title", "subject_id", "subject_name", "priority", "duration"],
                properties: {
                  title: { type: Type.STRING },
                  subject_id: { type: Type.STRING },
                  subject_name: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                  duration: { type: Type.INTEGER }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text || '{"tasks": []}';
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.warn("Gemini study plan generation error (falling back to sandbox):", error);
    const starterTasks = subjects.flatMap((s: any, idx) => {
      return [
        {
          title: `Read active lesson in ${s.name}`,
          subject_id: s.id,
          subject_name: s.name,
          priority: idx === 0 ? "High" : "Medium",
          duration: Math.round((hoursPerDay * 60) / 4)
        }
      ];
    }).slice(0, 4);

    while (starterTasks.length < 4 && subjects.length > 0) {
      starterTasks.push({
        title: `Solve core revision prompt in ${subjects[0].name}`,
        subject_id: subjects[0].id,
        subject_name: subjects[0].name,
        priority: "Low",
        duration: 30
      });
    }

    if (starterTasks.length === 0) {
      starterTasks.push({
        title: "Explore KABAKA AI Tutor explain tab",
        subject_id: "general",
        subject_name: "General Studies",
        priority: "High",
        duration: 30
      });
    }

    res.json({ tasks: starterTasks, is_fallback: true });
  }
});

// 3. AI Chat endpoint (Ask KABAKA AI)
app.post("/api/chat", async (req, res) => {
  const { messages, profile, subjects } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages history array is required" });
  }

  const studentName = profile?.name || "Student";
  const subjectsStr = Array.isArray(subjects) ? subjects.join(", ") : "general topics";
  const preferredTime = profile?.preferred_study_time || "Flexible";
  const focusLevel = profile?.focus_level || "Medium";
  const learningStyle = profile?.learning_style || "Flexible sessions";

  const systemInstruction = `You are KABAKA, the King of Learning Systems—the ultimate intelligent companion and royal tutor. 
Your tone is royal yet deeply kind, encouraging, humble, and analytical. 

Student Information:
- Name: ${studentName}
- Current Subjects: ${subjectsStr}
- Study Hours: ${profile?.hours_per_day || 2} hr(s) daily
- Target Focus: ${focusLevel}
- Learning Style Preference: ${learningStyle}
- Preferred Study Time: ${preferredTime}

Behavioral Guidelines:
1. Always address the student with high respect (e.g., "Scholar ${studentName}", or "Noble Student").
2. Format your responses beautifully using paragraphs and lists. 
3. Offer constructive advice, clear conceptual breakdowns, or timetables as requested.
4. If asked about study plans, build a step-by-step royal study formula matching their daily hours (${profile?.hours_per_day || 2}h).
5. Never break character. Keep answers concise, direct, helpful, and highly legible.`;

  try {
    if (!ai) {
      // Fallback response
      const lastMsg = messages[messages.length - 1];
      const fallbackText = `Noble Scholar ${studentName}, KABAKA hears your query. (KABAKA AI Sandbox Mode): Regarding "${lastMsg?.content || 'study support'}": Keep utilizing your "${learningStyle}" style! How else may I guide your journey through ${subjectsStr}?`;
      return res.json({ text: fallbackText });
    }

    // Convert message list to Gemini chat format
    // Map roles: 'user' keeps 'user', 'assistant' or 'model' maps to 'model'
    const formattedContents = messages.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    res.json({ text: response.text || "Hearing you loud and clear. Let's tackle these subjects together!" });
  } catch (error: any) {
    console.warn("Gemini chat error (falling back to sandbox):", error);
    const lastMsg = messages[messages.length - 1];
    let note = "";
    if (error.message && (error.message.includes("quota") || error.message.includes("limit") || error.message.includes("429") || error.message.includes("EXHAUSTED"))) {
      note = "\n\n*(Note: Gemini quota is temporarily exceeded. Running in offline helper mode)*";
    }
    const fallbackText = `Noble Scholar ${studentName}, KABAKA hears your query. Regarding "${lastMsg?.content || 'study support'}": Keep utilizing your "${learningStyle}" style! How else may I guide your journey through ${subjectsStr}?${note}`;
    res.json({ text: fallbackText, is_fallback: true });
  }
});

// 3.1. EXPLAIN MODE / INTERACTIVE AI TUTORIAL
app.post("/api/ai-tutor/explain", async (req, res) => {
  const { topic, mode, subject_name } = req.body;

  if (!topic || !mode || !subject_name) {
    return res.status(400).json({ error: "Missing required fields: topic, mode, subject_name" });
  }

  // Set default system rules by explain style
  let innerInstruction = "";
  if (mode === "explain") {
    innerInstruction = "Provide a simple conceptual breakdown of the topic and provide 1 very clear everyday practical example.";
  } else if (mode === "exam") {
    innerInstruction = "Provide an exam-style answer outline. Outline the core points, typical exam traps, and focus scoring parameters.";
  } else if (mode === "summary") {
    innerInstruction = "Provide a high-density, bulleted quick revision note list. Maximize formulas, shorthand notations, and quick mnemonics.";
  } else if (mode === "deep") {
    innerInstruction = "Provide a comprehensive step-by-step master logical proof or historical progression explaining the core 'why' and 'how'.";
  }

  const prompt = `Act as KABAKA, the supreme sovereign learning tutor.
Topic: "${topic}"
Course: "${subject_name}"
Mode: ${mode.toUpperCase()}
  
Instruction: ${innerInstruction}
Address the student directly as a "Sovereign Scholar" or "Noble Scholar". Keep the pacing structured and layout highly readable with bullet points or custom highlights.`;

  try {
    if (!ai) {
      return res.json({
        explanation: `Noble Scholar, here is a sandbox breakdown of "${topic}" for ${subject_name} (${mode.toUpperCase()}): Keep practicing active recall and focus metrics!`
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are KABAKA, King of Learning Systems and King of Tutors. Be majestic, encouraging, insightful, with impeccable structure.",
        temperature: 0.6
      }
    });

    res.json({ explanation: response.text || "Your analytical explanation could not be fully compiled." });
  } catch (error: any) {
    console.warn("Explain Mode error (falling back to sandbox):", error);
    let note = "";
    if (error.message && (error.message.includes("quota") || error.message.includes("limit") || error.message.includes("429") || error.message.includes("EXHAUSTED"))) {
      note = "\n\n*(Note: Gemini quota is temporarily exceeded. Showing cached lesson overview)*";
    }

    let conceptualBreakdown = "";
    if (mode === "explain") {
      conceptualBreakdown = `Noble Scholar, let us explore "${topic}" under "${subject_name}". 

Concept Overview: This subject introduces the core logic of ${topic}. Understanding it involves grasping how parts fit together to achieve a larger goal.

Everyday Analogy: Think of it like a chain of gears—when one moves, it drives the others. For example, in a bicycle, turning the pedals rotates the wheels to propel you forward!

Keep using active recall to solidify this concept.`;
    } else if (mode === "exam") {
      conceptualBreakdown = `Study Prep Notes: "${topic}" (${subject_name})

Key Concepts: Primary definitions, central mechanics, and formula structures.

Exam Traps to Avoid: Do not miss unit conversions or step-by-step proofs of intermediate values!

Scoring Keys: Clearly state the governing rule, show formulas, and supply steps.`;
    } else if (mode === "summary") {
      conceptualBreakdown = `Quick Key Points for "${topic}":
• Core Rule: Keep it structured and focus on recall.
• Mnemonics: ARCS - Active Recall, Consistent Study.
• Vital Formulas: focus_hours x quality_sessions = retention_gain.`;
    } else {
      conceptualBreakdown = `Detailed Breakdown of "${topic}":
We study "${topic}" inside "${subject_name}" to analyze how variables interact under stress conditions. Grasping the underlying structural formulas allows us to build rigorous mental models for active learning.`;
    }

    res.json({
      explanation: `${conceptualBreakdown}${note}`,
      is_fallback: true
    });
  }
});

// 3.2. DYNAMIC QUIZ GENERATION ENGINE
app.post("/api/ai-tutor/generate-quiz", async (req, res) => {
  const { subject_name, quiz_type, difficulty, weak_points } = req.body;

  if (!subject_name || !quiz_type || !difficulty) {
    return res.status(400).json({ error: "Missing required parameters: subject_name, quiz_type, difficulty" });
  }

  const weakPointsList = Array.isArray(weak_points) && weak_points.length > 0 
    ? `Incorporate questions that specifically address the student's recurrent errors/weaknesses: [${weak_points.join(", ")}].`
    : "";

  const prompt = `Formulate a study evaluation quiz for the course "${subject_name}".
Parameters:
- Quiz Type: ${quiz_type.toUpperCase()}
- Difficulty Rating: ${difficulty.toUpperCase()}
${weakPointsList}

Generate exactly 3 diverse questions of various formats:
1. Multiple Choice ("multiple_choice") -> with exactly 4 options.
2. True/False ("true_false") -> true or false options.
3. Short Answer ("short_answer") -> direct concise phrase or statement.

Provide an explanation per question detailing step-by-step logic.
Output strictly as JSON conforming to the responseSchema object.`;

  try {
    if (!ai) {
      // Sandbox fallback quiz
      return res.json({
        questions: [
          {
            question: `Identify the fundamental theorem of ${subject_name}?`,
            type: "multiple_choice",
            options: ["The Rule of Universal Sovereignty", "The Conservation Principal", "Sovereign Learning Directive", "N/A"],
            correct_answer: "The Rule of Universal Sovereignty",
            explanation: "In KABAKA, learning sovereignty is the core principal."
          },
          {
            question: `In ${subject_name}, mistakes are considered valuable active recall fuel.`,
            type: "true_false",
            correct_answer: "True",
            explanation: "Mistakes are transformed directly into your custom study plan."
          },
          {
            question: `Explain the supreme study tip KABAKA endorses.`,
            type: "short_answer",
            correct_answer: "Active callback and focus timer blocks",
            explanation: "Combining targeted checklists with focused interval timers triggers maximum retention."
          }
        ]
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are KABAKA's royal scientific evaluator. Formulate structured educational questions. Output strictly as valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["questions"],
          properties: {
            questions: {
              type: Type.ARRAY,
              description: "Array of exactly 3 formatted quiz questions",
              items: {
                type: Type.OBJECT,
                required: ["question", "type", "correct_answer", "explanation"],
                properties: {
                  question: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["multiple_choice", "true_false", "short_answer"] },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Array of exactly 4 strings. Must only be provided when type is multiple_choice."
                  },
                  correct_answer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text || '{"questions": []}';
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.warn("Quiz formulation error (falling back to sandbox):", error);
    res.json({
      is_fallback: true,
      questions: [
        {
          question: `Which active learning method is most recommended for "${subject_name}"?`,
          type: "multiple_choice",
          options: ["Passive re-reading", "Active recall testing", "Scanning highlighting text", "Ignoring weak points"],
          correct_answer: "Active recall testing",
          explanation: "Testing your memory forces active retrieval, which yields maximum retention rates."
        },
        {
          question: `True or False: Focusing on weak points is a key part of KABAKA's study plan for "${subject_name}".`,
          type: "true_false",
          options: ["True", "False"],
          correct_answer: "True",
          explanation: "Revising mistakes and focusing on weak points solves conceptual bottlenecks."
        },
        {
          question: `Explain how to solidify a concept like "${difficulty}" in "${subject_name}".`,
          type: "short_answer",
          correct_answer: "By defining it simply, solving practice problems, and tracking focus sessions.",
          explanation: "Using simplified step-by-step breakdowns and tracking study streak results establishes mental mastery."
        }
      ]
    });
  }
});

// 3.3. FLASHCARDS COMPASS
app.post("/api/ai-tutor/generate-flashcards", async (req, res) => {
  const { subject_name, source, context } = req.body;

  if (!subject_name || !source) {
    return res.status(400).json({ error: "Missing required parameters: subject_name, source" });
  }

  const prompt = `Formulate 4 quick revision flashcards for "${subject_name}".
Source Mode: ${source.toUpperCase()}
Context parameters: ${context || "general course curriculum"}

Generate a "front" representing a question/prompt, and a "back" representing a concise answer/definition.
Output strictly as JSON conforming to the responseSchema object.`;

  try {
    if (!ai) {
      return res.json({
        flashcards: [
          { front: `Core Term: ${subject_name} Definition`, back: "The fundamental sovereign structure of this academic domain." },
          { front: "Feynman Study Hack", back: "Construct a simple translation so a child could understand the core principles." },
          { front: "Active Recall", back: "Testing our memory bounds instead of re-reading textbook indexes." },
          { front: "Pomodoro Focus Block", back: "Sustaining deep operational focus for 25-minute sprints backed by breaks." }
        ]
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are KABAKA's flashcard engine. Synthesize concepts into high-recall front/back pairings. Output strictly as JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["flashcards"],
          properties: {
            flashcards: {
              type: Type.ARRAY,
              description: "Array of exactly 4 flashcards",
              items: {
                type: Type.OBJECT,
                required: ["front", "back"],
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text || '{"flashcards": []}';
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.warn("Flashcards formulation error (falling back to sandbox):", error);
    res.json({
      is_fallback: true,
      flashcards: [
        { front: `What is the primary study focus for ${subject_name}?`, back: "Mastering core definitions and correcting recurring mistakes." },
        { front: "The Feynman Technique", back: "Explaining a concept to someone else simply until any gaps in your own understanding are resolved." },
        { front: "Active Recall", back: "Testing yourself on concepts instead of passively highlighting textbook chapters." },
        { front: "Space Repetition", back: "Reviewing materials at graduated intervals to convert knowledge into long-term memory." }
      ]
    });
  }
});

// 3.4. LEARNING INTELLIGENCE INSIGHTS
app.post("/api/ai-tutor/generate-insights", async (req, res) => {
  const { subjects, mistakes, focus_sessions, tasks } = req.body;

  const subjectsPromptStr = Array.isArray(subjects) ? subjects.map((s: any) => `${s.name} (Progress: ${s.progress || 0}%)`).join(", ") : "general";
  const mistakesPromptStr = Array.isArray(mistakes) ? mistakes.slice(0, 5).map((m: any) => `- Mistake in ${m.subject_name || "General"}: "${m.question}" (Student Answer: "${m.student_answer}", Correct: "${m.correct_answer}")`).join("\n") : "None";
  const focusPromptStr = Array.isArray(focus_sessions) ? `${focus_sessions.length} sessions completed, total duration: ${focus_sessions.reduce((a: number, b: any) => a + (b.duration || 0), 0)} focus minutes` : "None";
  const tasksPromptStr = Array.isArray(tasks) ? `${tasks.filter((t: any) => t.status === "completed").length}/${tasks.length} study tasks achieved` : "None";

  const prompt = `Perform a comprehensive cognitive analytics overview for our scholar using this database history:
1. Current Courses and Progress: [${subjectsPromptStr}]
2. Error Bank Mistakes Logs:
${mistakesPromptStr}
3. Focus Sessions Data:
${focusPromptStr}
4. Study Checklists Completed:
${tasksPromptStr}

Generate complete operational intelligence for the learning dashboard:
- best_study_time: e.g. "Morning (09:00 - 11:30) matches highest Pomodoro output"
- weakest_subject: choose the one with most mistakes or lowest completion
- strongest_subject: choose the one with highest progress or completed hours
- difficult_topics: exactly 2 to 3 conceptual topics derived from their mistakes or slow progress subjects
- revision_schedule: a quick 1-sentence recommended schedule matching their current weak points

Output strictly as JSON matching the responseSchema.`;

  try {
    if (!ai) {
      return res.json({
        best_study_time: "Late Afternoon (15:30 - 18:00) during focus sessions.",
        weakest_subject: subjects?.[0]?.name || "Unconfigured Course",
        strongest_subject: subjects?.[1]?.name || subjects?.[0]?.name || "Active Subjects",
        difficult_topics: ["Calculated analytical recall steps", "Syllabus formulas and terms recognition"],
        revision_schedule: "Engage in active quiz recall on mistakes before commencing new syllabus lessons."
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are KABAKA's Senior Cognitive Analyst. Evaluate learning behavior from active statistics and produce accurate actionable insights. Output strictly as JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["best_study_time", "weakest_subject", "strongest_subject", "difficult_topics", "revision_schedule"],
          properties: {
            best_study_time: { type: Type.STRING },
            weakest_subject: { type: Type.STRING },
            strongest_subject: { type: Type.STRING },
            difficult_topics: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            revision_schedule: { type: Type.STRING }
          }
        }
      }
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText.trim()));
  } catch (error: any) {
    console.warn("Insights formulation error (falling back to sandbox):", error);
    res.json({
      is_fallback: true,
      best_study_time: "Morning (09:00 - 11:30) or during your scheduled focus hours.",
      weakest_subject: subjects?.[0]?.name || "None added yet",
      strongest_subject: subjects?.[1]?.name || subjects?.[0]?.name || "Study Subjects",
      difficult_topics: ["Active Recall Application", "Formulas & Analytical Terms"],
      revision_schedule: "Complete 1 active recall flashcard session daily to bolster retention scores."
    });
  }
});

// Serve frontend assets cleanly via Vite middleware or Express assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`KABAKA Backend server booted successfully on port ${PORT}`);
  });
}

startServer();
