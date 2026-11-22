import React, { useState } from 'react';
import { Check, Copy, Download, FileCode2, ShieldCheck } from 'lucide-react';
import { MANIFEST_JSON, POPUP_HTML, POPUP_JS } from '../data/extensionSource';
import { triggerBlobDownload } from '../utils/zipBuilder';

interface CodeExplorerProps {
  onDownloadZip: () => void;
}

type ExtensionFileKey = 'manifest.json' | 'popup.html' | 'popup.js';

const EXTENSION_FILES: Record<
  ExtensionFileKey,
  {
    filename: ExtensionFileKey;
    subtitle: string;
    mime: string;
    content: string;
  }
> = {
  'manifest.json': {
    filename: 'manifest.json',
    subtitle: 'Manifest V3 · قاتتىق CSP (connect-src none) · ئەڭ تۆۋەن ئىجازەت',
    mime: 'application/json;charset=utf-8',
    content: MANIFEST_JSON,
  },
  'popup.html': {
    filename: 'popup.html',
    subtitle: '372px RTL ئۇيغۇرچە كۆرۈنمە يۈز · UKIJ Tuz · Light/Dark Glassmorphism · PDF بېسىش قېلىپى',
    mime: 'text/html;charset=utf-8',
    content: POPUP_HTML,
  },
  'popup.js': {
    filename: 'popup.js',
    subtitle: 'Dual-Context (Service Worker ئەسكەرتىش + Popup كونترول) · try/catch · نۆل TODO',
    mime: 'application/javascript;charset=utf-8',
    content: POPUP_JS,
  },
};

export const CodeExplorer: React.FC<CodeExplorerProps> = ({ onDownloadZip }) => {
  const [activeFile, setActiveFile] = useState<ExtensionFileKey>('manifest.json');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const current = EXTENSION_FILES[activeFile];
  const lines = current.content.split('\n');
  const byteSize = new TextEncoder().encode(current.content).length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(current.content);
      setCopiedKey(activeFile);
      window.setTimeout(() => setCopiedKey(null), 2200);
    } catch {
      // Fallback
      const temp = document.createElement('textarea');
      temp.value = current.content;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
      setCopiedKey(activeFile);
      window.setTimeout(() => setCopiedKey(null), 2200);
    }
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([current.content], { type: current.mime });
    triggerBlobDownload(blob, current.filename);
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="glass-3d-card rounded-[24px] p-6">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Chrome Load Unpacked غا 100% تەييار · 3D ئەينەك ئۇسلۇبىدىكى دەل 3 ھۆججەت</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              قىستۇرمىنىڭ تولۇق كود ھۆججەتلىرى
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              manifest.json · popup.html · popup.js — ھېچقانداق تاشقى CDN، خىتاي API سى ياكى ئىز قوغلاش كودى يوق
            </p>
          </div>

          <button
            type="button"
            onClick={onDownloadZip}
            className="btn-glass-amber inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>بارلىق ھۆججەتلەرنى ZIP قىلىپ چۈشۈرۈش</span>
          </button>
        </div>
      </div>

      {/* File Selector Bar + Code Container */}
      <div className="glass-3d-card rounded-[24px] overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-900/10 dark:border-white/10">
          {/* Segmented File Tabs */}
          <div className="flex items-center gap-1.5">
            {(Object.keys(EXTENSION_FILES) as ExtensionFileKey[]).map((key) => {
              const isActive = activeFile === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveFile(key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer ${
                    isActive ? 'btn-glass-blue' : 'btn-glass-clear'
                  }`}
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span dir="ltr">{key}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap hidden sm:inline">
              {lines.length} قۇر · {(byteSize / 1024).toFixed(1)} KB
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="btn-glass-clear inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              {copiedKey === activeFile ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>كۆچۈرۈلدى</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>كودنى كۆچۈرۈش</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownloadSingle}
              className="btn-glass-clear inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>چۈشۈرۈش</span>
            </button>
          </div>
        </div>

        {/* File Description Line */}
        <div className="relative z-10 px-5 py-2.5 border-b border-slate-900/10 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200">
          {current.subtitle}
        </div>

        {/* LTR Monospace Code Viewer */}
        <div className="relative z-10 code-ltr bg-[#0D1117]/95 text-slate-200 overflow-x-auto max-h-[640px] overflow-y-auto p-4 text-[12.5px] leading-6">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-white/[0.03]">
                  <td className="select-none pr-4 text-right text-slate-500 tabular-nums w-12 align-top">
                    {i + 1}
                  </td>
                  <td className="whitespace-pre font-mono text-slate-100">{line || ' '}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
