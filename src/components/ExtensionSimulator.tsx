import React, { useMemo, useRef, useState } from 'react';
import {
  Bell,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileDown,
  FileJson,
  Moon,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { AI_PROMPT_TEMPLATE, SAMPLE_BOOKS } from '../data/sampleBooks';
import type { DifficultyLevel, StudyBook } from '../types/erpan';
import { exportBooksToPdfPrint } from '../utils/pdfExporter';
import { triggerBlobDownload } from '../utils/zipBuilder';

interface ExtensionSimulatorProps {
  books: StudyBook[];
  onBooksChange: (nextBooks: StudyBook[]) => void;
  reminderEnabled: boolean;
  onToggleReminder: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onDownloadZip: () => void;
}

type PopupView = 'home' | 'study' | 'import';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

function stripCodeFences(raw: string): string {
  let trimmed = raw.trim();
  if (trimmed.startsWith('```')) {
    trimmed = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  return trimmed.trim();
}

export const ExtensionSimulator: React.FC<ExtensionSimulatorProps> = ({
  books,
  onBooksChange,
  reminderEnabled,
  onToggleReminder,
  theme,
  onToggleTheme,
  onDownloadZip,
}) => {
  const [popupView, setPopupView] = useState<PopupView>('home');
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [unmasteredOnly, setUnmasteredOnly] = useState<boolean>(false);

  const [overrideTitle, setOverrideTitle] = useState<string>('');
  const [jsonInput, setJsonInput] = useState<string>('');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [chromeNotification, setChromeNotification] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [promptExpanded, setPromptExpanded] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3600);
  };

  const activeBook = useMemo(
    () => books.find((b) => b.id === activeBookId) ?? null,
    [books, activeBookId]
  );

  const visibleQuestions = useMemo(() => {
    if (!activeBook) return [];
    return unmasteredOnly
      ? activeBook.questions.filter((q) => !q.mastered)
      : activeBook.questions;
  }, [activeBook, unmasteredOnly]);

  const totalQuestionsCount = useMemo(
    () => books.reduce((sum, b) => sum + b.questions.length, 0),
    [books]
  );

  const remainingQuestionsCount = useMemo(
    () =>
      books.reduce(
        (sum, b) => sum + b.questions.filter((q) => !q.mastered).length,
        0
      ),
    [books]
  );

  const currentQuestion =
    visibleQuestions.length > 0
      ? visibleQuestions[Math.min(questionIndex, visibleQuestions.length - 1)]
      : null;

  const openBook = (bookId: string) => {
    setActiveBookId(bookId);
    setQuestionIndex(0);
    setShowAnswer(false);
    setUnmasteredOnly(false);
    setPopupView('study');
  };

  const handleDeleteBook = (bookId: string, title: string) => {
    const next = books.filter((b) => b.id !== bookId);
    onBooksChange(next);
    if (activeBookId === bookId) {
      setActiveBookId(null);
      setPopupView('home');
    }
    showToast(`«${title}» تىزىملىكتىن ئۆچۈرۈلدى.`, 'success');
  };

  const handleToggleMastered = () => {
    if (!activeBook || !currentQuestion) return;
    const nextBooks = books.map((book) => {
      if (book.id !== activeBook.id) return book;
      return {
        ...book,
        questions: book.questions.map((q) =>
          q.id === currentQuestion.id ? { ...q, mastered: !q.mastered } : q
        ),
      };
    });
    onBooksChange(nextBooks);
  };

  const handleCopyPrompt = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
      } else {
        const temp = document.createElement('textarea');
        temp.value = AI_PROMPT_TEMPLATE;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
      }
      showToast(
        '30 سۇئاللىق AI پىرومپىت كۆچۈرۈلدى! خالىغان مودېلغا چاپلاپ ئىشلىتىڭ.',
        'success'
      );
    } catch {
      showToast('پىرومپىتنى كۆچۈرۈشتە خاتالىق كۆرۈلدى.', 'error');
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setJsonInput(String(ev.target?.result ?? ''));
      showToast('JSON ھۆججىتى ئوقۇلدى. ئەمدى «ساقلاش» نى بېسىڭ.', 'success');
    };
    reader.onerror = () => {
      showToast('ھۆججەتنى ئوقۇشتا خاتالىق كۆرۈلدى.', 'error');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleSaveBook = () => {
    try {
      const clean = stripCodeFences(jsonInput);
      if (!clean) {
        showToast('JSON مەزمۇنى بوش. ھۆججەت تاللاڭ ياكى تېكىست چاپلاڭ.', 'error');
        return;
      }
      const parsed = JSON.parse(clean);
      const rawQuestions = Array.isArray(parsed)
        ? parsed
        : parsed.questions || parsed.items || parsed.qa || [];

      if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
        showToast('JSON ئىچىدە ئىناۋەتلىك «questions» سۇئال تىزىملىكى تېپىلمىدى.', 'error');
        return;
      }

      const normalized = rawQuestions
        .filter((item: Record<string, unknown>) => item && typeof item === 'object')
        .map((item: Record<string, unknown>, idx: number) => {
          const qText = String(item.question || item.q || item.sual || '').trim();
          const aText = String(item.answer || item.a || item.jawab || '').trim();
          if (!qText || !aText) return null;
          const rawDiff = String(item.difficulty || item.level || 'ئوتتۇرا').trim();
          const difficulty: DifficultyLevel =
            rawDiff === 'ئاساسىي' || rawDiff === 'ئوتتۇرا' || rawDiff === 'چوڭقۇر'
              ? rawDiff
              : 'ئوتتۇرا';
          return {
            id: Number(item.id) || idx + 1,
            topic: String(item.topic || item.chapter || 'ئاساسىي تېما').trim(),
            difficulty,
            question: qText,
            answer: aText,
            keyPoint: String(item.keyPoint || item.summary || item.note || '').trim(),
            mastered: Boolean(item.mastered),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (normalized.length === 0) {
        showToast('ھەر بىر سۇئال تۈرىدە question ۋە answer بولۇشى شەرت.', 'error');
        return;
      }

      const title =
        overrideTitle.trim() ||
        String(parsed.bookTitle || parsed.title || parsed.name || '').trim() ||
        `يېڭى كىتاب ${books.length + 1}`;

      const newBook: StudyBook = {
        id: `book-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        bookTitle: title,
        author: String(parsed.author || 'ئېنىقلىمىغان').trim(),
        category: String(parsed.category || 'ئومۇمىي بىلىم').trim(),
        description: String(parsed.description || '').trim(),
        createdAt: new Date().toISOString(),
        questions: normalized,
      };

      onBooksChange([...books, newBook]);
      setOverrideTitle('');
      setJsonInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setPopupView('home');
      showToast(
        `«${newBook.bookTitle}» (${newBook.questions.length} سۇئال) مۇۋەپپەقىيەتلىك ساقلاندى!`,
        'success'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'نامەلۇم خاتالىق';
      showToast(`JSON فورماتى خاتا: ${msg}`, 'error');
    }
  };

  const handleExportPdf = () => {
    const targets = popupView === 'study' && activeBook ? [activeBook] : books;
    if (targets.length === 0) {
      showToast('PDF قىلىپ چىقىرىش ئۈچۈن ئالدى بىلەن كىتاب قوشۇڭ.', 'error');
      return;
    }
    const ok = exportBooksToPdfPrint(targets);
    if (ok) {
      showToast('PDF بېسىش كۆزنىكى ئېچىلدى («Save as PDF» نى تاللاڭ).', 'success');
    } else {
      showToast('PDF چىقىرىشتا خاتالىق كۆرۈلدى.', 'error');
    }
  };

  const handleTestStartupNotification = () => {
    if (!reminderEnabled) {
      showToast(
        'ئەسكەرتىش ھازىر ئېتىك ھالەتتە. سىناش ئۈچۈن «ئەسكەرتىش» نى ئېچىڭ.',
        'error'
      );
      return;
    }
    const msg =
      books.length > 0
        ? `سىزدە ${books.length} كىتاب ۋە تەكرارلايدىغان ${remainingQuestionsCount} سۇئال بار. بۈگۈن بىر قانچە سۇئال ئۆگىنىپ قويۇڭ!`
        : 'توركۆرگۈچ ئېچىلدى! «ئېرپان ئۆگىنىش قورالى» غا تۇنجى كىتابىڭىزنىڭ JSON سۇئاللىرىنى قوشۇڭ.';

    setChromeNotification({
      title: 'ئېرپان ئۆگىنىش قورالى — ئۆگىنىش ئەسكەرتمىسى',
      message: msg,
    });
    window.setTimeout(() => {
      setChromeNotification(null);
    }, 5200);
  };

  const handleDownloadSampleJson = () => {
    const sample = SAMPLE_BOOKS[0];
    const cleanPayload = {
      bookTitle: sample.bookTitle,
      author: sample.author,
      category: sample.category,
      description: sample.description,
      questions: sample.questions.map(({ mastered: _m, ...rest }) => rest),
    };
    const blob = new Blob([JSON.stringify(cleanPayload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    triggerBlobDownload(blob, 'qutadghu-bilik-30-sual.json');
    showToast('30 سۇئاللىق ئۈلگە JSON ھۆججىتى چۈشۈرۈلدى.', 'success');
  };

  const handleRestoreSampleBooks = () => {
    onBooksChange(SAMPLE_BOOKS);
    setPopupView('home');
    setActiveBookId(null);
    showToast('ئۈلگە كىتابلار ئەسلىگە كەلتۈرۈلدى.', 'success');
  };

  const activeBookMastered = activeBook
    ? activeBook.questions.filter((q) => q.mastered).length
    : 0;
  const activeBookPct =
    activeBook && activeBook.questions.length > 0
      ? Math.round((activeBookMastered / activeBook.questions.length) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Primary Interactive Stage: Exact 372px 3D Liquid Glass Chrome Extension Popup */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <div className="w-full max-w-[412px] glass-3d-card rounded-[28px] p-4">
          {/* Simulated Chrome Toolbar Strip */}
          <div className="relative z-10 flex items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-900/10 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen className="w-3.5 h-3.5 text-[#EA580C] dark:text-[#38BDF8] shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                Chrome Popup كۆزنىكى · 372px · 3D ئەينەك
              </span>
            </div>
            <span className="tabular-nums whitespace-nowrap shrink-0 font-medium">
              {reminderEnabled && remainingQuestionsCount > 0
                ? `بەلگە: ${remainingQuestionsCount}`
                : 'بەلگە يوق'}
            </span>
          </div>

          {/* Exact 372px 3D Liquid Crystal Extension Viewport */}
          <div className="relative z-10 mx-auto w-full max-w-[372px] rounded-[26px] glass-3d-popup-shell text-[#0F172A] dark:text-[#F1F5F9] p-3.5 flex flex-col gap-3">
            {/* Extension Header matching wireframe top box — 3D Crystal Bar + Emerald Toggle + Crystal Cube */}
            <div className="glass-3d-row flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-full">
              <h2 className="text-[14.5px] font-bold tracking-tight truncate">
                ئېرپان ئۆگىنىش قورالى
              </h2>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  role="switch"
                  aria-checked={reminderEnabled}
                  onClick={() => {
                    onToggleReminder();
                    showToast(
                      !reminderEnabled
                        ? 'توركۆرگۈچ ئېچىلغاندا ئەسكەرتىش ئېچىلدى.'
                        : 'توركۆرگۈچ ئېچىلغاندا ئەسكەرتىش ئېتىلدى.',
                      'success'
                    );
                  }}
                  className={`toggle-glass-3d ${reminderEnabled ? 'is-on' : ''}`}
                  title={
                    reminderEnabled
                      ? 'توركۆرگۈچ ئېچىلغاندا ئەسكەرتىش: ئوچۇق'
                      : 'توركۆرگۈچ ئېچىلغاندا ئەسكەرتىش: ئېتىك'
                  }
                  aria-label="توركۆرگۈچ ئېچىلغاندا ئەسكەرتىشنى ئېچىش ياكى ئېتىش"
                >
                  <span className="toggle-glass-3d-knob" />
                </button>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="btn-glass-clear inline-flex items-center justify-center w-9 h-9 rounded-xl cursor-pointer"
                  aria-label="يورۇق ياكى قاراڭغۇ ھالەتكە ئالماشتۇرۇش"
                  title={theme === 'dark' ? 'يورۇق ھالەت' : 'قاراڭغۇ ھالەت'}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-300" />
                  ) : (
                    <Moon className="w-4 h-4 text-slate-700" />
                  )}
                </button>
              </div>
            </div>

            {/* Inline 3D Glass Toast Banner (inspired by "Toast" pill in reference image) */}
            {toast && (
              <div
                role="status"
                aria-live="polite"
                className={`glass-3d-row px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-2 ${
                  toast.type === 'error'
                    ? 'border-red-400/80 text-red-700 dark:text-red-300'
                    : 'border-amber-400/80 text-slate-800 dark:text-slate-100'
                }`}
              >
                <Check
                  className={`w-3.5 h-3.5 shrink-0 ${
                    toast.type === 'error'
                      ? 'text-red-500'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                />
                <span className="leading-relaxed">{toast.message}</span>
              </div>
            )}

            {/* Main Center 3D Crystal Card matching wireframe big rounded box */}
            <div className="glass-3d-card rounded-[22px] p-3.5 min-h-[296px] flex flex-col gap-2.5">
              <div className="relative z-10 flex-1 flex flex-col gap-2.5">
                {popupView === 'home' && (
                  <>
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-900/10 dark:border-white/10">
                      <h3 className="text-[13.5px] font-bold">ساقلانغان كىتابلار</h3>
                      <span className="text-[11.5px] text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap">
                        {books.length} كىتاب · {totalQuestionsCount} سۇئال
                      </span>
                    </div>

                    {books.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-6 px-2 gap-2 text-slate-600 dark:text-slate-300">
                        <BookOpen className="w-7 h-7 text-slate-400" />
                        <strong className="text-sm text-slate-800 dark:text-slate-100">
                          تېخى كىتاب قوشۇلمىغان
                        </strong>
                        <p className="text-xs uyghur-prose">
                          ئالدى بىلەن «جېسون ئۈچۈن پىروپىت كۆچۈرۈش» كۇنۇپكىسى بىلەن پىرومپىتنى كۆچۈرۈپ خالىغان مودېلغا بېرىڭ، ئاندىن «كىتاپ قوشۇش» ئارقىلىق JSON نى يۈكلەڭ.
                        </p>
                      </div>
                    ) : (
                      <ul className="flex flex-col gap-2.5 max-h-[246px] overflow-y-auto pl-0.5 py-0.5">
                        {books.map((book, index) => {
                          const mastered = book.questions.filter((q) => q.mastered).length;
                          const allDone =
                            book.questions.length > 0 && mastered === book.questions.length;
                          return (
                            <li
                              key={book.id}
                              className="glass-3d-row flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl"
                            >
                              <button
                                type="button"
                                onClick={() => openBook(book.id)}
                                className="flex-1 min-w-0 flex items-center gap-2.5 text-right cursor-pointer"
                              >
                                <span
                                  className={`w-6 h-6 rounded-lg inline-flex items-center justify-center text-[11px] font-bold shrink-0 tabular-nums ${
                                    allDone
                                      ? 'btn-glass-emerald'
                                      : 'bg-slate-900/5 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-white/70 dark:border-white/15'
                                  }`}
                                >
                                  {allDone ? <Check className="w-3.5 h-3.5" /> : index + 1}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {book.bookTitle}
                                  </span>
                                  <span className="block text-[11px] text-slate-600 dark:text-slate-300 tabular-nums mt-0.5">
                                    {book.questions.length} سۇئال · ئۆزلەشتۈرۈلگەن: {mastered}/
                                    {book.questions.length}
                                  </span>
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBook(book.id, book.bookTitle)}
                                className="w-7 h-7 rounded-full inline-flex items-center justify-center text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
                                title="كىتابنى ئۆچۈرۈش"
                                aria-label={`${book.bookTitle} نى ئۆچۈرۈش`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                )}

                {popupView === 'study' && activeBook && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setPopupView('home')}
                        className="text-xs font-semibold text-[#1D4ED8] dark:text-[#38BDF8] hover:underline whitespace-nowrap cursor-pointer"
                      >
                        ← كىتابلارغا قايتىش
                      </button>
                      <span className="text-xs text-slate-600 dark:text-slate-300 tabular-nums font-semibold">
                        {visibleQuestions.length > 0
                          ? `${Math.min(questionIndex + 1, visibleQuestions.length)} / ${visibleQuestions.length}`
                          : '0 / 0'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-900/10 dark:border-white/10">
                      <h3 className="text-[13.5px] font-bold truncate">{activeBook.bookTitle}</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setUnmasteredOnly((prev) => !prev);
                          setQuestionIndex(0);
                          setShowAnswer(false);
                        }}
                        className="text-[11.5px] font-semibold text-[#EA580C] dark:text-[#FB923C] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {unmasteredOnly ? 'قېلىپ قالغانلار' : 'ھەممىسى'}
                      </button>
                    </div>

                    {/* 3D Recessed Glass Progress Track */}
                    <div className="w-full h-2 rounded-full bg-slate-900/10 dark:bg-white/10 p-0.5 overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-l from-[#38BDF8] to-[#2563EB] transition-all duration-200 rounded-full"
                        style={{ width: `${activeBookPct}%` }}
                      />
                    </div>

                    {currentQuestion ? (
                      <div className="flex-1 flex flex-col gap-2.5">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 tabular-nums">
                          <span>{currentQuestion.topic}</span>
                          <span aria-hidden="true">·</span>
                          <span>{currentQuestion.difficulty}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              currentQuestion.mastered
                                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                                : ''
                            }
                          >
                            {currentQuestion.mastered ? 'ئۆزلەشتۈرۈلدى' : 'ئۆگىنىش باسقۇچىدا'}
                          </span>
                        </div>

                        <p className="text-[13.5px] font-bold leading-relaxed uyghur-justify">
                          {Math.min(questionIndex + 1, visibleQuestions.length)}.{' '}
                          {currentQuestion.question}
                        </p>

                        {showAnswer && (
                          <div className="glass-3d-row rounded-2xl p-3 flex flex-col gap-2">
                            <p className="text-[12.5px] text-slate-800 dark:text-slate-100 uyghur-prose">
                              {currentQuestion.answer}
                            </p>
                            {currentQuestion.keyPoint && (
                              <p className="text-[11.5px] text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-900/10 dark:border-white/10 uyghur-justify">
                                <strong className="text-slate-900 dark:text-slate-100">
                                  مۇھىم نۇقتا:
                                </strong>{' '}
                                {currentQuestion.keyPoint}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="mt-auto pt-2 flex items-center justify-between gap-1.5">
                          <button
                            type="button"
                            onClick={() => setShowAnswer((prev) => !prev)}
                            className="btn-glass-blue inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer"
                          >
                            {showAnswer ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                            <span>{showAnswer ? 'يوشۇرۇش' : 'جاۋابنى كۆرۈش'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleToggleMastered}
                            className={`inline-flex items-center gap-1 h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer ${
                              currentQuestion.mastered
                                ? 'btn-glass-emerald'
                                : 'btn-glass-clear'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>
                              {currentQuestion.mastered ? 'ئۆزلەشتۈرۈلدى' : 'ئۆزلەشتۈردۈم'}
                            </span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setQuestionIndex(
                                  (prev) =>
                                    (prev - 1 + visibleQuestions.length) %
                                    visibleQuestions.length
                                );
                                setShowAnswer(false);
                              }}
                              className="btn-glass-clear w-8 h-8 rounded-full inline-flex items-center justify-center cursor-pointer"
                              title="ئالدىنقى سۇئال"
                              aria-label="ئالدىنقى سۇئال"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setQuestionIndex((prev) => (prev + 1) % visibleQuestions.length);
                                setShowAnswer(false);
                              }}
                              className="btn-glass-clear w-8 h-8 rounded-full inline-flex items-center justify-center cursor-pointer"
                              title="كېيىنكى سۇئال"
                              aria-label="كېيىنكى سۇئال"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-8">
                        <Check className="w-8 h-8 text-emerald-500" />
                        <p className="text-sm font-semibold">
                          بۇ كىتابتىكى بارلىق سۇئاللار ئۆزلەشتۈرۈلدى!
                        </p>
                        <button
                          type="button"
                          onClick={() => setUnmasteredOnly(false)}
                          className="text-xs font-semibold text-[#1D4ED8] dark:text-[#38BDF8] hover:underline cursor-pointer"
                        >
                          بارلىق سۇئاللارنى قايتا كۆرۈش
                        </button>
                      </div>
                    )}
                  </>
                )}

                {popupView === 'import' && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-900/10 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => setPopupView('home')}
                        className="text-xs font-semibold text-[#1D4ED8] dark:text-[#38BDF8] hover:underline cursor-pointer"
                      >
                        ← قايتىش
                      </button>
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        يېڭى كىتاب (JSON) قوشۇش
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="sim-book-title"
                        className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200"
                      >
                        كىتاب ئىسمى (بوش قالسا JSON دىن ئېلىنىدۇ)
                      </label>
                      <input
                        id="sim-book-title"
                        type="text"
                        value={overrideTitle}
                        onChange={(e) => setOverrideTitle(e.target.value)}
                        placeholder="مەسىلەن: تارىخ دەرسلىكى"
                        className="glass-3d-row w-full rounded-full px-3.5 py-2 text-xs outline-none focus:border-[#2563EB]"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="sim-json-file"
                        className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200"
                      >
                        .json ھۆججىتى يۈكلەش
                      </label>
                      <input
                        ref={fileInputRef}
                        id="sim-json-file"
                        type="file"
                        accept=".json,application/json"
                        onChange={handleFileSelected}
                        className="text-xs text-slate-700 dark:text-slate-300 file:ml-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#2563EB]/15 file:text-[#1D4ED8] dark:file:bg-[#38BDF8]/20 dark:file:text-[#38BDF8] cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label
                        htmlFor="sim-json-text"
                        className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200"
                      >
                        ياكى JSON نى چاپلاڭ
                      </label>
                      <textarea
                        id="sim-json-text"
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        rows={4}
                        placeholder='{"bookTitle": "...", "questions": [{"question": "...", "answer": "..."}]}'
                        className="code-ltr glass-3d-row w-full rounded-2xl p-2.5 text-[11px] outline-none focus:border-[#2563EB]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveBook}
                      className="btn-glass-amber w-full h-10 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>ساقلاش ۋە كىتاب قوشۇش</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Two Side-by-Side 3D Glass Capsule Buttons (Amber + Clear Crystal) */}
            <div className="grid grid-cols-[1.15fr_1fr] gap-2.5">
              <button
                type="button"
                onClick={() => setPopupView('import')}
                className="btn-glass-amber min-h-[44px] px-3 py-2 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>كىتاپ قوشۇش</span>
              </button>

              <button
                type="button"
                onClick={handleCopyPrompt}
                className="btn-glass-clear min-h-[44px] px-3 py-2 rounded-full text-[11.5px] font-semibold inline-flex items-center justify-center gap-1.5 text-center leading-snug cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 shrink-0 text-[#1D4ED8] dark:text-[#38BDF8]" />
                <span>جېسون ئۈچۈن پىروپىت كۆچۈرۈش</span>
              </button>
            </div>

            {/* Full-Width 3D Sapphire Glass PDF Button (matching "Pro plan" blue capsule) */}
            <button
              type="button"
              onClick={handleExportPdf}
              className="btn-glass-blue w-full min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileDown className="w-4 h-4 shrink-0" />
              <span>سۇئاللارنى pdf قىلىپ چىقىرىش</span>
            </button>
          </div>
        </div>
      </div>

      {/* Companion Control & Guide Panel (3D Liquid Glass Cards) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {/* Simulated Chrome Startup Notification Banner */}
        {chromeNotification && (
          <div
            role="status"
            className="glass-3d-card rounded-[24px] p-4 flex items-start justify-between gap-4"
          >
            <div className="relative z-10 flex items-start gap-3">
              <div className="btn-glass-blue w-10 h-10 rounded-2xl flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Google Chrome · سىستېما ئۇقتۇرۇشى (onStartup)
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {chromeNotification.title}
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  {chromeNotification.message}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setChromeNotification(null)}
              className="relative z-10 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              تاقاش
            </button>
          </div>
        )}

        {/* Quick Workbench Controls */}
        <section className="glass-3d-card rounded-[24px] p-6">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  ئېرپان ئۆگىنىش قورالى — 3D سۈزۈك ئەينەك كۆرۈنۈشى
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Manifest V3 · دەل 3 ھۆججەت · 3D Liquid Glass · نۆل ئىز قوغلاش
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleTheme}
                className="btn-glass-clear inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
                <span>{theme === 'dark' ? 'يورۇق 3D ھالەت' : 'قاراڭغۇ 3D ھالەت'}</span>
              </button>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-200 uyghur-prose">
              پۈتۈن تەگلىك ۋە قىستۇرما كۆرۈنمە يۈزى سىز ئەۋەتكەن رەسىمدىكىدەك 3D سۈزۈك كىرىستال ئەينەك (Liquid Glass)، قىر يورۇقلۇقى، يۇمشاق رەڭلىك سۇنۇش كۆلەڭگىسى، يېشىل 3D ئەسكەرتىش ئۈزچاتى ۋە پارقىراق كاپسۇل كۇنۇپكىلار بىلەن يېڭىلاندى. بۇ ئۇسلۇب ھەم تور سىناق مۇھىتىدا ھەم ZIP دىكى ئەسلى Chrome قىستۇرمىسىدا (%100 يەرلىك CSS) بىردەك ئىشلەيدۇ.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleTestStartupNotification}
                className="btn-glass-blue inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>توركۆرگۈچ ئېچىلىش ئەسكەرتىشىنى سىناش</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSampleJson}
                className="btn-glass-clear inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer"
              >
                <FileJson className="w-3.5 h-3.5 text-[#0E7490] dark:text-[#38BDF8]" />
                <span>30 سۇئاللىق ئۈلگە JSON چۈشۈرۈش</span>
              </button>

              <button
                type="button"
                onClick={handleRestoreSampleBooks}
                className="btn-glass-clear inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ئۈلگە كىتابلارنى ئەسلىگە قايتۇرۇش</span>
              </button>
            </div>
          </div>
        </section>

        {/* AI Prompt Preview Card */}
        <section className="glass-3d-card rounded-[24px] p-6">
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  30 سۇئاللىق AI پىرومپىت قېلىپى
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  خالىغان مودېلغا كىتاب مەزمۇنى بىلەن بىللە بېرىپ ساپ JSON چىقىرىش ئۈچۈن
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPromptExpanded((prev) => !prev)}
                  className="btn-glass-clear px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  {promptExpanded ? 'يىغىش' : 'تولۇق كۆرۈش'}
                </button>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="btn-glass-amber inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>كۆچۈرۈش</span>
                </button>
              </div>
            </div>

            <pre
              className={`glass-3d-row text-xs leading-relaxed text-slate-800 dark:text-slate-200 rounded-2xl p-4 whitespace-pre-wrap overflow-x-auto ${
                promptExpanded ? 'max-h-[420px]' : 'max-h-[145px]'
              } overflow-y-auto`}
            >
              {AI_PROMPT_TEMPLATE}
            </pre>
          </div>
        </section>

        {/* Security & Load Unpacked Guide */}
        <section className="glass-3d-card rounded-[24px] p-6">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Chrome غا دەرھال قاچىلاش ۋە بىخەتەرلىك كاپالىتى
                </h3>
              </div>
              <button
                type="button"
                onClick={onDownloadZip}
                className="btn-glass-emerald inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تولۇق ZIP چۈشۈرۈش</span>
              </button>
            </div>

            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-200">
              <li className="glass-3d-row p-3.5 rounded-2xl">
                <strong className="block text-slate-900 dark:text-slate-100 mb-1">
                  1. ZIP نى چۈشۈرۈپ يېشىڭ
                </strong>
                ئىچىدە `erpan-extension/` (دەل 3 ھۆججەت)، `docs/PRD.md`، `docs/SPEC.md`، `design/style.md` ۋە ئۈلگە JSON بار.
              </li>
              <li className="glass-3d-row p-3.5 rounded-2xl">
                <strong className="block text-slate-900 dark:text-slate-100 mb-1">
                  2. chrome://extensions نى ئېچىڭ
                </strong>
                Chrome توركۆرگۈچىدە كېڭەيتىلمىلەر بېتىگە كىرىپ يۇقىرىدىكى Developer mode نى ياندۇرۇڭ.
              </li>
              <li className="glass-3d-row p-3.5 rounded-2xl">
                <strong className="block text-slate-900 dark:text-slate-100 mb-1">
                  3. Load unpacked نى بېسىڭ
                </strong>
                `erpan-extension` قىسقۇچىنى تاللىسىڭىزلا، 3D سۈزۈك ئەينەك قىستۇرما دەرھال قاچىلىنىدۇ.
              </li>
              <li className="glass-3d-row p-3.5 rounded-2xl">
                <strong className="block text-slate-900 dark:text-slate-100 mb-1">
                  4. قاتتىق مەخپىيەتلىك (CSP)
                </strong>
                `connect-src 'none'` بىلەن تاشقى تور قاتتىق چەكلەنگەن؛ پەقەت `storage` ۋە `notifications` رۇخسىتى بار.
              </li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
};
