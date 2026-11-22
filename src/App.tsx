import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { CodeExplorer } from './components/CodeExplorer';
import { DocViewer } from './components/DocViewer';
import { ExtensionSimulator } from './components/ExtensionSimulator';
import { PRD_DOCUMENT, SPEC_DOCUMENT, STYLE_DOCUMENT } from './data/enterpriseDocs';
import { MANIFEST_JSON, POPUP_HTML, POPUP_JS } from './data/extensionSource';
import { SAMPLE_BOOKS } from './data/sampleBooks';
import type { ExtensionSettings, StudyBook, WorkspaceTab } from './types/erpan';
import { buildZipBlob, triggerBlobDownload } from './utils/zipBuilder';

const STORAGE_BOOKS_KEY = 'erpan_studio_books_v1';
const STORAGE_SETTINGS_KEY = 'erpan_studio_settings_v1';

const NAV_ITEMS: { id: WorkspaceTab; label: string }[] = [
  { id: 'simulator', label: 'جانلىق سىناق' },
  { id: 'code', label: 'كود ھۆججەتلىرى' },
  { id: 'prd', label: 'PRD ھۆججىتى' },
  { id: 'spec', label: 'SPEC ئۆلچىمى' },
  { id: 'style', label: 'ئۇسلۇب كۆرسەتمىسى' },
];

function loadInitialBooks(): StudyBook[] {
  try {
    const raw = localStorage.getItem(STORAGE_BOOKS_KEY);
    if (!raw) return SAMPLE_BOOKS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SAMPLE_BOOKS;
  } catch {
    return SAMPLE_BOOKS;
  }
}

function loadInitialSettings(): ExtensionSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return { reminderEnabled: true, theme: 'light' };
    const parsed = JSON.parse(raw);
    return {
      reminderEnabled:
        typeof parsed?.reminderEnabled === 'boolean' ? parsed.reminderEnabled : true,
      theme: parsed?.theme === 'dark' ? 'dark' : 'light',
    };
  } catch {
    return { reminderEnabled: true, theme: 'light' };
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('simulator');
  const [books, setBooks] = useState<StudyBook[]>(loadInitialBooks);
  const [settings, setSettings] = useState<ExtensionSettings>(loadInitialSettings);
  const [zipBanner, setZipBanner] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }
  }, [settings]);

  const handleBooksChange = (nextBooks: StudyBook[]) => {
    setBooks(nextBooks);
    try {
      localStorage.setItem(STORAGE_BOOKS_KEY, JSON.stringify(nextBooks));
    } catch {
      // Ignore storage quota errors
    }
  };

  const handleToggleReminder = () => {
    setSettings((prev) => ({ ...prev, reminderEnabled: !prev.reminderEnabled }));
  };

  const handleToggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const handleDownloadZip = () => {
    const sampleBook = SAMPLE_BOOKS[0];
    const sampleJson = JSON.stringify(
      {
        bookTitle: sampleBook.bookTitle,
        author: sampleBook.author,
        category: sampleBook.category,
        description: sampleBook.description,
        questions: sampleBook.questions.map(({ mastered: _m, ...rest }) => rest),
      },
      null,
      2
    );

    const blob = buildZipBlob([
      { path: 'erpan-extension/manifest.json', content: MANIFEST_JSON },
      { path: 'erpan-extension/popup.html', content: POPUP_HTML },
      { path: 'erpan-extension/popup.js', content: POPUP_JS },
      { path: 'docs/PRD.md', content: PRD_DOCUMENT },
      { path: 'docs/SPEC.md', content: SPEC_DOCUMENT },
      { path: 'design/style.md', content: STYLE_DOCUMENT },
      { path: 'sample-book-qutadghu-bilik-30.json', content: sampleJson },
    ]);

    triggerBlobDownload(blob, 'erpan-oginish-qorali-extension.zip');
    setZipBanner(
      '«erpan-oginish-qorali-extension.zip» چۈشۈرۈلدى (3 قىستۇرما ھۆججىتى + PRD.md + SPEC.md + design/style.md + 30 سۇئاللىق ئۈلگە JSON).'
    );
    window.setTimeout(() => setZipBanner(null), 5000);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col studio-3d-bg text-[#0F172A] dark:text-[#F1F5F9] transition-colors duration-200"
    >
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 glass-panel border-b border-white/65 dark:border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            ئېرپان ئۆگىنىش قورالى
          </button>

          {/* Zone 2: 5 Clean Single-Line Nav Links */}
          <nav
            aria-label="ئاساسىي بۆلەكلەر"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                    isActive
                      ? 'border-[#EA580C] dark:border-[#38BDF8] text-[#C2410C] dark:text-[#38BDF8] font-semibold'
                      : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary 3D Liquid Glass CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleDownloadZip}
              className="btn-glass-amber inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>ZIP چۈشۈرۈش</span>
            </button>
          </div>
        </div>

        {/* Mobile Compact Horizontal Nav */}
        <nav
          aria-label="يانفون بۆلەك تاللاش"
          className="md:hidden flex items-center gap-2 px-4 pb-2.5 overflow-x-auto"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive ? 'btn-glass-blue' : 'btn-glass-clear'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        {zipBanner && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-300"
          >
            {zipBanner}
          </div>
        )}

        {activeTab === 'simulator' && (
          <ExtensionSimulator
            books={books}
            onBooksChange={handleBooksChange}
            reminderEnabled={settings.reminderEnabled}
            onToggleReminder={handleToggleReminder}
            theme={settings.theme}
            onToggleTheme={handleToggleTheme}
            onDownloadZip={handleDownloadZip}
          />
        )}

        {activeTab === 'code' && <CodeExplorer onDownloadZip={handleDownloadZip} />}

        {activeTab === 'prd' && (
          <DocViewer
            title="مەھسۇلات تەلەپ ھۆججىتى (PRD)"
            filename="docs/PRD.md"
            subtitle="ئېنترىپرايس سەۋىيىدىكى ئىقتىدار تەلەپلىرى، مەخپىيەتلىك پىرىنسىپلىرى ۋە ئىشلەتكۈچى ئېقىمى"
            markdown={PRD_DOCUMENT}
          />
        )}

        {activeTab === 'spec' && (
          <DocViewer
            title="تېخنىكىلىق لايىھە ئۆلچىمى (SPEC)"
            filename="docs/SPEC.md"
            subtitle="Manifest V3 ئارخىتېكتورى، Dual-Context Service Worker، JSON Schema، CSP ۋە PDF چىقىرىش ئۆلچىمى"
            markdown={SPEC_DOCUMENT}
          />
        )}

        {activeTab === 'style' && (
          <DocViewer
            title="ئۇيغۇرچە ئۇسلۇب كۆرسەتمىسى (design/style.md)"
            filename="design/style.md"
            subtitle="رەڭ تاختىسى (HEX)، UKIJ Tuz مەتبەئە قائىدىسى، شەكىل، كارتا-كۇنۇپكا ۋە سىلىق ھەرىكەت ئۆلچىمى"
            markdown={STYLE_DOCUMENT}
            showDesignShowcase
          />
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-5 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <span>ئېرپان ئۆگىنىش قورالى · Chrome Manifest V3 · پۈتۈنلەي يەرلىك ۋە مەخپىي</span>
          <span>نۆل ئىز قوغلاش · تاشقى مۇلازىمېتىر يوق · شەرقىي تۈركىستان ئىلىم-مەرىپىتى ئۈچۈن</span>
        </div>
      </footer>
    </div>
  );
}
