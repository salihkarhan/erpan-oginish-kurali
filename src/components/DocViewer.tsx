import React, { useState } from 'react';
import { Check, Copy, Download, FileText } from 'lucide-react';
import { triggerBlobDownload } from '../utils/zipBuilder';

interface DocViewerProps {
  title: string;
  filename: string;
  subtitle: string;
  markdown: string;
  showDesignShowcase?: boolean;
}

const LIGHT_SWATCHES = [
  { name: '3D تەگلىك (60%)', hex: '#E7EBF1', border: true },
  { name: 'ئەينەك يۈز (30%)', hex: '#FFFFFF', border: true },
  { name: 'قىزغۇچ 3D كۇنۇپكا', hex: '#EA580C', border: false },
  { name: 'كۆك 3D كۇنۇپكا', hex: '#2563EB', border: false },
  { name: 'ئاساسىي تېكىست', hex: '#0F172A', border: false },
  { name: 'يېشىل 3D ئۈزچات', hex: '#059669', border: false },
  { name: 'خاتالىق ھالەت', hex: '#DC2626', border: false },
];

const DARK_SWATCHES = [
  { name: 'ئارقا كۆرۈنۈش (60%)', hex: '#0B0F17', border: true },
  { name: 'قۇرۇلما يۈزى (30%)', hex: '#141A26', border: true },
  { name: 'ئاساسىي رەڭ (10%)', hex: '#3B82F6', border: false },
  { name: 'قوشۇمچە رەڭ', hex: '#22D3EE', border: false },
  { name: 'ئاساسىي تېكىست', hex: '#F1F5F9', border: true },
  { name: 'ئوڭۇشلۇق ھالەت', hex: '#10B981', border: false },
  { name: 'خاتالىق ھالەت', hex: '#F87171', border: false },
];

function renderMarkdownBlocks(markdown: string): React.ReactNode[] {
  const lines = markdown.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre
          key={`code-${i}`}
          className="code-ltr my-4 rounded-xl bg-[#0D1117] text-slate-100 p-4 text-xs leading-6 overflow-x-auto border border-slate-800"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      i++;
      continue;
    }

    // Markdown table
    if (line.trim().startsWith('|') && i + 1 < lines.length && lines[i + 1].includes('---')) {
      const parseRow = (row: string) =>
        row
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((cell) => cell.trim());

      const headers = parseRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(parseRow(lines[i]));
        i++;
      }

      nodes.push(
        <div
          key={`table-${i}`}
          className="my-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"
        >
          <table className="w-full text-right text-xs sm:text-sm border-collapse">
            <thead className="bg-[#F7F8FA] dark:bg-[#0F1522] border-b border-slate-200 dark:border-slate-800">
              <tr>
                {headers.map((h, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {rows.map((r, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                  {r.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="px-4 py-3 text-slate-700 dark:text-slate-300 align-top leading-relaxed"
                    >
                      {formatInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (line.startsWith('# ')) {
      nodes.push(
        <h1
          key={`h1-${i}`}
          className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 mb-2"
        >
          {line.slice(2)}
        </h1>
      );
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      nodes.push(
        <h2
          key={`h2-${i}`}
          className="text-lg font-bold text-[#1D4ED8] dark:text-[#60A5FA] mt-4 mb-3"
        >
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      nodes.push(
        <h3
          key={`h3-${i}`}
          className="text-base font-bold text-slate-900 dark:text-slate-100 mt-7 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800"
        >
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith('#### ')) {
      nodes.push(
        <h4
          key={`h4-${i}`}
          className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-5 mb-2"
        >
          {line.slice(5)}
        </h4>
      );
      i++;
      continue;
    }

    if (line.trim() === '---') {
      nodes.push(
        <hr
          key={`hr-${i}`}
          className="my-6 border-slate-200/90 dark:border-slate-800"
        />
      );
      i++;
      continue;
    }

    if (line.startsWith('> ')) {
      nodes.push(
        <blockquote
          key={`bq-${i}`}
          className="my-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F7F8FA] dark:bg-[#0B0F17] text-sm text-slate-700 dark:text-slate-300 uyghur-prose"
        >
          {formatInline(line.slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }

    // Bullet list
    if (line.trim().startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} className="my-3 space-y-2 pr-5 list-disc text-sm text-slate-700 dark:text-slate-300">
          {items.map((item, idx) => (
            <li key={idx} className="uyghur-justify">
              {formatInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      nodes.push(
        <ol key={`ol-${i}`} className="my-3 space-y-2 pr-5 list-decimal text-sm text-slate-700 dark:text-slate-300">
          {items.map((item, idx) => (
            <li key={idx} className="uyghur-justify">
              {formatInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.trim().length > 0) {
      nodes.push(
        <p
          key={`p-${i}`}
          className="my-3 text-sm text-slate-700 dark:text-slate-300 uyghur-prose"
        >
          {formatInline(line)}
        </p>
      );
    }
    i++;
  }

  return nodes;
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-slate-900 dark:text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          dir="ltr"
          className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#1D4ED8] dark:text-[#60A5FA] font-mono text-[12px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export const DocViewer: React.FC<DocViewerProps> = ({
  title,
  filename,
  subtitle,
  markdown,
  showDesignShowcase = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const handleCopyDoc = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      const temp = document.createElement('textarea');
      temp.value = markdown;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  const handleDownloadDoc = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    triggerBlobDownload(blob, filename.split('/').pop() || 'document.md');
  };

  const handleCopyHex = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      window.setTimeout(() => setCopiedHex(null), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass-3d-card rounded-[24px] p-6">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <FileText className="w-4 h-4 text-[#EA580C] dark:text-[#38BDF8]" />
              <span dir="ltr" className="font-mono">
                {filename}
              </span>
              <span aria-hidden="true">·</span>
              <span>Enterprise Documentation</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyDoc}
              className="btn-glass-clear inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>كۆچۈرۈلدى</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Markdown كۆچۈرۈش</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownloadDoc}
              className="btn-glass-blue inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>چۈشۈرۈش</span>
            </button>
          </div>
        </div>
      </div>

      {/* Optional Visual Token Showcase for design/style.md */}
      {showDesignShowcase && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8 glass-3d-card rounded-[24px] p-6">
            <div className="relative z-10 space-y-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                3D سۈزۈك ئەينەك رەڭ تاختىسى (HEX كودىنى بېسىپ كۆچۈرۈڭ)
              </h3>

              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  يورۇق ھالەت (Light Mode)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                  {LIGHT_SWATCHES.map((sw) => (
                    <button
                      key={`l-${sw.hex}`}
                      type="button"
                      onClick={() => handleCopyHex(sw.hex)}
                      className="glass-3d-row text-right rounded-2xl p-2 cursor-pointer"
                    >
                      <div
                        className={`h-10 w-full rounded-xl mb-2 ${
                          sw.border ? 'border border-slate-300/80' : ''
                        }`}
                        style={{ backgroundColor: sw.hex }}
                      />
                      <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {sw.name}
                      </div>
                      <div dir="ltr" className="text-[10.5px] font-mono text-slate-500 tabular-nums">
                        {copiedHex === sw.hex ? 'Copied!' : sw.hex}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  قاراڭغۇ ھالەت (Dark Mode)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                  {DARK_SWATCHES.map((sw) => (
                    <button
                      key={`d-${sw.hex}`}
                      type="button"
                      onClick={() => handleCopyHex(sw.hex)}
                      className="glass-3d-row text-right rounded-2xl p-2 cursor-pointer"
                    >
                      <div
                        className={`h-10 w-full rounded-xl mb-2 ${
                          sw.border ? 'border border-slate-600/70' : ''
                        }`}
                        style={{ backgroundColor: sw.hex }}
                      />
                      <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {sw.name}
                      </div>
                      <div dir="ltr" className="text-[10.5px] font-mono text-slate-500 tabular-nums">
                        {copiedHex === sw.hex ? 'Copied!' : sw.hex}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 glass-3d-card rounded-[24px] p-6 flex flex-col gap-3">
            <div className="relative z-10 flex-1 flex flex-col gap-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                3D سۈزۈك ئەينەك ئۇسلۇب پايدىلىنىشى
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                پەقەت 3D ئەينەك سۇنۇش، گىرۋەك يورۇقلۇقى ۋە كۆلەڭگە ئۇسلۇبى ئېلىندى
              </p>
              <div className="flex-1 rounded-2xl border border-white/70 dark:border-white/15 bg-white/70 dark:bg-slate-900/50 p-3 flex items-center justify-center overflow-hidden min-h-[210px]">
                {!imgFailed ? (
                  <img
                    src="/assets/aistudio/image_6be36431.png"
                    alt="3D سۈزۈك ئەينەك ئۇسلۇب پايدىلىنىش رەسىمى"
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed(true)}
                    className="max-h-[240px] w-auto object-contain rounded-xl"
                  />
                ) : (
                  <div className="text-xs text-slate-500 text-center">
                    3D سۈزۈك كىرىستال ئەينەك (Liquid Glass) لايىھە ئۇسلۇبى
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Markdown Prose Container */}
      <article className="glass-3d-card rounded-[24px] p-6 sm:p-8">
        <div className="relative z-10">{renderMarkdownBlocks(markdown)}</div>
      </article>
    </div>
  );
};
