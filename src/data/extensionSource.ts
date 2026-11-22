import { AI_PROMPT_TEMPLATE } from './sampleBooks';

export const MANIFEST_JSON = `{
  "manifest_version": 3,
  "name": "ئېرپان ئۆگىنىش قورالى",
  "version": "1.0.0",
  "description": "جېسون (JSON) ھۆججىتى ئاساسىدا كىتاب ۋە دەرسلىكلەردىن 30 مۇھىم سۇئال ئۆگىنىش، توركۆرگۈچ ئېچىلغاندا ئەسكەرتىش ۋە PDF چىقىرىش قىستۇرمىسى. نۆل ئىز قوغلاش، پۈتۈنلەي يەرلىك ساقلاش.",
  "permissions": [
    "storage",
    "notifications"
  ],
  "action": {
    "default_title": "ئېرپان ئۆگىنىش قورالى",
    "default_popup": "popup.html"
  },
  "background": {
    "service_worker": "popup.js"
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'none'; connect-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline';"
  }
}
`;

export const POPUP_HTML = `<!doctype html>
<html lang="ug" dir="rtl" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ئېرپان ئۆگىنىش قورالى</title>
  <style>
    :root {
      --text-primary: #0F172A;
      --text-secondary: #475569;
      --text-muted: #64748B;
      --accent-blue: #2563EB;
      --accent-amber: #EA580C;
      --success: #059669;
      --error: #DC2626;
      --ease: cubic-bezier(0.16, 1, 0.3, 1);
      --font-ug: 'UKIJ Tuz', 'ALKATIP Basma', 'Uyghur Pashto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, sans-serif;
    }

    html[data-theme="dark"] {
      --text-primary: #F1F5F9;
      --text-secondary: #CBD5E1;
      --text-muted: #94A3B8;
      --accent-blue: #38BDF8;
      --accent-amber: #FB923C;
      --success: #10B981;
      --error: #F87171;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      width: 372px;
      min-height: 540px;
      max-height: 600px;
      overflow-y: auto;
      direction: rtl;
      font-family: var(--font-ug);
      font-size: 13.5px;
      line-height: 1.75;
      color: var(--text-primary);
      background:
        radial-gradient(280px 200px at 85% 6%, rgba(255, 255, 255, 0.94), transparent 64%),
        radial-gradient(240px 200px at 14% 28%, rgba(125, 211, 252, 0.34), transparent 62%),
        radial-gradient(220px 180px at 82% 82%, rgba(251, 146, 60, 0.22), transparent 64%),
        radial-gradient(200px 180px at 18% 90%, rgba(52, 211, 153, 0.18), transparent 62%),
        linear-gradient(155deg, #EEF1F6 0%, #E3E8F0 52%, #DCE3EE 100%);
      -webkit-font-smoothing: antialiased;
    }

    html[data-theme="dark"] body {
      background:
        radial-gradient(280px 200px at 85% 6%, rgba(56, 189, 248, 0.18), transparent 64%),
        radial-gradient(240px 200px at 14% 28%, rgba(59, 130, 246, 0.20), transparent 62%),
        radial-gradient(220px 180px at 82% 82%, rgba(249, 115, 22, 0.14), transparent 64%),
        linear-gradient(155deg, #090D16 0%, #0E1525 52%, #0A101E 100%);
    }

    .app-shell {
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* 3D Crystal Pill Top Header */
    .top-bar {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 9px 14px;
      border-radius: 999px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(241, 245, 249, 0.68) 60%, rgba(232, 243, 255, 0.84) 100%);
      backdrop-filter: blur(22px) saturate(165%);
      border: 1px solid rgba(255, 255, 255, 0.94);
      box-shadow:
        0 12px 24px -10px rgba(15, 23, 42, 0.20),
        0 4px 12px -4px rgba(56, 189, 248, 0.24),
        inset 0 2px 2px rgba(255, 255, 255, 1),
        inset 0 -3px 6px rgba(148, 163, 184, 0.24);
    }

    html[data-theme="dark"] .top-bar {
      background: linear-gradient(180deg, rgba(39, 52, 74, 0.78) 0%, rgba(22, 31, 48, 0.72) 60%, rgba(27, 40, 62, 0.82) 100%);
      border-color: rgba(255, 255, 255, 0.18);
      box-shadow:
        0 12px 26px -10px rgba(0, 0, 0, 0.65),
        inset 0 1.5px 2px rgba(255, 255, 255, 0.25),
        inset 0 -3px 6px rgba(2, 6, 23, 0.55);
    }

    .brand-title {
      margin: 0;
      font-size: 14.5px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .top-controls {
      display: flex;
      align-items: center;
      gap: 7px;
      flex-shrink: 0;
    }

    /* 3D Emerald Translucent Glass Toggle Switch */
    .toggle-3d {
      position: relative;
      width: 46px;
      height: 26px;
      border-radius: 999px;
      padding: 3px;
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.86);
      background: linear-gradient(180deg, rgba(226, 232, 240, 0.92), rgba(203, 213, 225, 0.78));
      box-shadow:
        0 6px 14px -5px rgba(15, 23, 42, 0.22),
        inset 0 2px 4px rgba(15, 23, 42, 0.14);
      transition: background 180ms var(--ease), box-shadow 180ms var(--ease);
    }

    html[data-theme="dark"] .toggle-3d {
      background: linear-gradient(180deg, rgba(51, 65, 85, 0.85), rgba(30, 41, 59, 0.9));
      border-color: rgba(255, 255, 255, 0.18);
    }

    .toggle-3d.is-active {
      background: linear-gradient(180deg, rgba(52, 211, 153, 0.94), rgba(5, 150, 105, 0.98));
      border-color: rgba(209, 250, 229, 0.88);
      box-shadow:
        0 8px 18px -5px rgba(5, 150, 105, 0.56),
        inset 0 2px 3px rgba(255, 255, 255, 0.65),
        inset 0 -3px 6px rgba(6, 95, 70, 0.45);
    }

    .toggle-3d-knob {
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 100%);
      box-shadow: 0 3px 7px rgba(15, 23, 42, 0.28), inset 0 1.5px 2px #FFFFFF;
      transition: transform 180ms var(--ease);
      transform: translateX(0);
    }

    .toggle-3d.is-active .toggle-3d-knob {
      transform: translateX(-20px);
    }

    /* 3D Crystal Cube Theme Button */
    .cube-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 32px;
      min-width: 34px;
      padding: 0 9px;
      border-radius: 11px;
      font-family: inherit;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-primary);
      cursor: pointer;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(224, 242, 254, 0.78));
      border: 1px solid rgba(255, 255, 255, 0.95);
      box-shadow:
        0 8px 16px -6px rgba(15, 23, 42, 0.22),
        0 4px 10px -4px rgba(56, 189, 248, 0.28),
        inset 0 2px 2px #FFFFFF,
        inset 0 -2px 5px rgba(186, 230, 253, 0.65);
      transition: transform 150ms var(--ease);
      white-space: nowrap;
    }

    html[data-theme="dark"] .cube-btn {
      background: linear-gradient(180deg, rgba(51, 65, 85, 0.8), rgba(24, 34, 52, 0.8));
      border-color: rgba(255, 255, 255, 0.22);
      box-shadow: 0 8px 18px -6px rgba(0, 0, 0, 0.65), inset 0 1.5px 2px rgba(255, 255, 255, 0.28);
    }

    .cube-btn:hover { transform: translateY(-1px); }
    .cube-btn:active { transform: scale(0.96); }

    /* Main 3D Thick Beveled Liquid Glass Card */
    .main-card {
      position: relative;
      border-radius: 22px;
      padding: 14px;
      min-height: 296px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.86) 0%, rgba(248, 250, 252, 0.62) 48%, rgba(232, 242, 252, 0.76) 100%);
      backdrop-filter: blur(22px) saturate(165%);
      border: 1px solid rgba(255, 255, 255, 0.92);
      box-shadow:
        0 20px 40px -16px rgba(15, 23, 42, 0.24),
        0 8px 18px -8px rgba(56, 189, 248, 0.20),
        -4px 8px 16px -8px rgba(251, 146, 60, 0.16),
        inset 0 2px 3px rgba(255, 255, 255, 0.98),
        inset 0 -4px 10px rgba(148, 163, 184, 0.24);
    }

    html[data-theme="dark"] .main-card {
      background: linear-gradient(145deg, rgba(30, 41, 59, 0.78) 0%, rgba(17, 24, 39, 0.70) 52%, rgba(22, 34, 54, 0.76) 100%);
      border-color: rgba(255, 255, 255, 0.16);
      box-shadow:
        0 22px 44px -16px rgba(0, 0, 0, 0.72),
        0 8px 20px -8px rgba(56, 189, 248, 0.18),
        inset 0 1.5px 2px rgba(255, 255, 255, 0.26),
        inset 0 -4px 10px rgba(2, 6, 23, 0.55);
    }

    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    }

    html[data-theme="dark"] .section-head {
      border-bottom-color: rgba(255, 255, 255, 0.10);
    }

    .section-title {
      margin: 0;
      font-size: 13.5px;
      font-weight: 700;
    }

    .meta-inline {
      font-size: 11.5px;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    /* Book List */
    .book-list {
      list-style: none;
      margin: 0;
      padding: 2px 0;
      display: flex;
      flex-direction: column;
      gap: 9px;
      max-height: 248px;
      overflow-y: auto;
    }

    .book-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 16px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(238, 244, 252, 0.74));
      border: 1px solid rgba(255, 255, 255, 0.94);
      box-shadow:
        0 8px 16px -8px rgba(15, 23, 42, 0.18),
        inset 0 2px 2px rgba(255, 255, 255, 0.98),
        inset 0 -3px 6px rgba(148, 163, 184, 0.22);
      transition: transform 150ms var(--ease), box-shadow 150ms var(--ease), border-color 150ms var(--ease);
    }

    html[data-theme="dark"] .book-item {
      background: linear-gradient(180deg, rgba(39, 52, 74, 0.78), rgba(22, 31, 48, 0.74));
      border-color: rgba(255, 255, 255, 0.16);
      box-shadow: 0 10px 20px -8px rgba(0, 0, 0, 0.56), inset 0 1.5px 2px rgba(255, 255, 255, 0.22);
    }

    .book-item:hover {
      border-color: rgba(56, 189, 248, 0.8);
      transform: translateY(-1.5px);
      box-shadow:
        0 12px 22px -8px rgba(15, 23, 42, 0.22),
        0 4px 14px -4px rgba(56, 189, 248, 0.30),
        inset 0 2px 3px #FFFFFF;
    }

    .book-open-btn {
      flex: 1;
      min-width: 0;
      text-align: right;
      border: none;
      background: transparent;
      color: inherit;
      font-family: inherit;
      padding: 0;
      cursor: pointer;
    }

    .book-name {
      display: block;
      font-size: 13.5px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .book-sub {
      display: block;
      font-size: 11.5px;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
    }

    .book-delete-btn {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border-radius: 999px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background-color 150ms var(--ease), color 150ms var(--ease);
    }

    .book-delete-btn:hover {
      background: rgba(220, 38, 38, 0.12);
      color: var(--error);
    }

    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 20px 10px;
      color: var(--text-secondary);
      gap: 6px;
    }

    .empty-state p {
      margin: 0;
      font-size: 12.5px;
      text-align: justify;
      text-justify: inter-word;
      text-indent: 1.8em;
    }

    /* Study View */
    .study-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .text-btn {
      border: none;
      background: transparent;
      color: var(--accent-blue);
      font-family: inherit;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      padding: 4px 2px;
      white-space: nowrap;
    }

    .text-btn:hover { text-decoration: underline; }

    .progress-track {
      height: 7px;
      width: 100%;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.10);
      padding: 1.5px;
      overflow: hidden;
    }

    html[data-theme="dark"] .progress-track {
      background: rgba(255, 255, 255, 0.12);
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #2563EB, #38BDF8);
      border-radius: 999px;
      transition: width 200ms var(--ease);
    }

    .q-meta-line {
      font-size: 11.5px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      font-variant-numeric: tabular-nums;
    }

    .q-question {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
      text-align: justify;
      text-justify: inter-word;
      line-height: 1.8;
    }

    .q-answer-box {
      padding: 11px 12px;
      border-radius: 16px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(236, 244, 252, 0.72));
      border: 1px solid rgba(255, 255, 255, 0.90);
      box-shadow: inset 0 2px 2px #FFFFFF, 0 6px 14px -6px rgba(15, 23, 42, 0.14);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    html[data-theme="dark"] .q-answer-box {
      background: rgba(30, 41, 59, 0.72);
      border-color: rgba(255, 255, 255, 0.14);
      box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.15);
    }

    .uyghur-paragraph {
      margin: 0;
      font-size: 13px;
      color: var(--text-primary);
      text-align: justify;
      text-justify: inter-word;
      text-indent: 1.8em;
      line-height: 1.85;
    }

    .key-point {
      margin: 0;
      padding-top: 7px;
      border-top: 1px solid rgba(15, 23, 42, 0.08);
      font-size: 12px;
      color: var(--text-secondary);
      text-align: justify;
      text-justify: inter-word;
    }

    html[data-theme="dark"] .key-point {
      border-top-color: rgba(255, 255, 255, 0.10);
    }

    .study-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      margin-top: auto;
      padding-top: 6px;
    }

    /* 3D Liquid Glass Capsule Action Buttons */
    .action-grid {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      gap: 10px;
    }

    .btn {
      position: relative;
      overflow: hidden;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-height: 44px;
      padding: 9px 13px;
      border-radius: 999px;
      font-family: inherit;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 150ms var(--ease), box-shadow 150ms var(--ease), filter 150ms var(--ease);
    }

    .btn::before {
      content: '';
      position: absolute;
      top: 2px;
      left: 7%;
      right: 7%;
      height: 44%;
      border-radius: 999px;
      pointer-events: none;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0.04) 100%);
    }

    .btn:hover { transform: translateY(-1.5px); }
    .btn:active { transform: translateY(1px) scale(0.985); }

    /* Coral-Amber 3D Glass (matching Start project) */
    .btn-primary {
      color: #FFFFFF;
      text-shadow: 0 1px 2px rgba(124, 45, 18, 0.35);
      background: linear-gradient(180deg, #FB923C 0%, #EA580C 54%, #F59E0B 100%);
      border: 1px solid rgba(255, 237, 213, 0.78);
      box-shadow:
        0 12px 24px -8px rgba(234, 88, 12, 0.56),
        0 4px 10px -4px rgba(245, 158, 11, 0.38),
        inset 0 2px 2px rgba(255, 255, 255, 0.8),
        inset 0 -4px 8px rgba(254, 215, 170, 0.65);
    }

    /* Sapphire-Cobalt 3D Glass (matching Pro plan) */
    .btn-blue {
      color: #FFFFFF;
      text-shadow: 0 1px 2px rgba(15, 23, 42, 0.35);
      background: linear-gradient(180deg, #38BDF8 0%, #2563EB 54%, #1D4ED8 100%);
      border: 1px solid rgba(224, 242, 254, 0.78);
      box-shadow:
        0 12px 24px -8px rgba(37, 99, 235, 0.54),
        0 4px 10px -4px rgba(56, 189, 248, 0.36),
        inset 0 2px 2px rgba(255, 255, 255, 0.78),
        inset 0 -4px 8px rgba(125, 211, 252, 0.62);
    }

    /* Clear Crystal 3D Glass (matching Secondary) */
    .btn-secondary {
      color: var(--text-primary);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(241, 245, 249, 0.68) 54%, rgba(224, 242, 254, 0.80) 100%);
      border: 1px solid rgba(255, 255, 255, 0.95);
      box-shadow:
        0 12px 22px -10px rgba(15, 23, 42, 0.22),
        0 5px 14px -6px rgba(56, 189, 248, 0.30),
        inset 0 2px 2px #FFFFFF,
        inset 0 -3px 6px rgba(186, 230, 253, 0.64);
    }

    html[data-theme="dark"] .btn-secondary {
      background: linear-gradient(180deg, rgba(51, 65, 85, 0.80) 0%, rgba(24, 34, 52, 0.74) 55%, rgba(30, 58, 138, 0.44) 100%);
      border-color: rgba(255, 255, 255, 0.22);
      box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.68), inset 0 1.5px 2px rgba(255, 255, 255, 0.30);
    }

    html[data-theme="dark"] .btn-secondary::before {
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.02) 100%);
    }

    .btn-success {
      color: #FFFFFF;
      background: linear-gradient(180deg, #34D399 0%, #059669 100%);
      border: 1px solid rgba(209, 250, 229, 0.78);
      box-shadow: 0 10px 20px -6px rgba(5, 150, 105, 0.50), inset 0 2px 2px rgba(255, 255, 255, 0.72);
    }

    .btn-full { width: 100%; }
    .btn-sm { min-height: 34px; padding: 6px 11px; font-size: 11.5px; }

    /* Import Form */
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .form-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .text-input,
    .json-textarea {
      width: 100%;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.90);
      background: rgba(255, 255, 255, 0.85);
      box-shadow: inset 0 2px 4px rgba(15, 23, 42, 0.08), 0 4px 12px -6px rgba(15, 23, 42, 0.14);
      color: var(--text-primary);
      font-family: inherit;
      font-size: 12.5px;
      padding: 8px 12px;
      outline: none;
    }

    html[data-theme="dark"] .text-input,
    html[data-theme="dark"] .json-textarea {
      background: rgba(15, 23, 42, 0.72);
      border-color: rgba(255, 255, 255, 0.16);
    }

    .json-textarea {
      direction: ltr;
      text-align: left;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 11.5px;
      resize: vertical;
      min-height: 105px;
    }

    .text-input:focus,
    .json-textarea:focus {
      border-color: var(--accent-blue);
    }

    .file-input {
      width: 100%;
      font-family: inherit;
      font-size: 12px;
      color: var(--text-secondary);
    }

    /* 3D Glass Toast Banner */
    .toast {
      padding: 9px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid rgba(251, 146, 60, 0.75);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(241, 245, 249, 0.74));
      box-shadow: 0 10px 20px -8px rgba(15, 23, 42, 0.22), inset 0 2px 2px #FFFFFF;
      display: none;
    }

    html[data-theme="dark"] .toast {
      background: rgba(24, 34, 52, 0.88);
    }

    .toast.show { display: block; }
    .toast.success { color: var(--success); border-color: rgba(16, 185, 129, 0.65); }
    .toast.error { color: var(--error); border-color: rgba(248, 113, 113, 0.75); }
    .hidden { display: none !important; }

    /* Dedicated A4 Print-to-PDF sheet */
    #pdf-print-sheet { display: none; }

    @media print {
      @page { size: A4; margin: 16mm; }
      body {
        width: auto;
        min-height: auto;
        max-height: none;
        background: #FFFFFF !important;
        color: #0F172A !important;
      }
      .app-shell { display: none !important; }
      #pdf-print-sheet {
        display: block !important;
        font-family: var(--font-ug);
        direction: rtl;
        color: #0F172A;
      }
      .print-book { page-break-after: always; }
      .print-book:last-child { page-break-after: auto; }
      .print-book h1 {
        font-size: 20px;
        margin: 0 0 6px 0;
        border-bottom: 1.5px solid #CBD5E1;
        padding-bottom: 8px;
      }
      .print-q {
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        padding: 10px 12px;
        margin-bottom: 10px;
        page-break-inside: avoid;
      }
      .print-q h3 { margin: 0 0 6px 0; font-size: 14px; }
      .print-q p {
        margin: 0 0 6px 0;
        font-size: 12.5px;
        text-align: justify;
        text-justify: inter-word;
        text-indent: 1.8em;
        line-height: 1.85;
      }
      .print-key { font-size: 11.5px; color: #334155; }
    }
  </style>
</head>
<body>
  <main class="app-shell" id="app-root">
    <!-- Top 3D Crystal Header -->
    <header class="top-bar">
      <h1 class="brand-title">ئېرپان ئۆگىنىش قورالى</h1>
      <div class="top-controls">
        <button type="button" id="btn-reminder" class="toggle-3d" role="switch" aria-checked="true" title="توركۆرگۈچ ئېچىلغاندا ئەسكەرتىش">
          <span class="toggle-3d-knob"></span>
        </button>
        <button type="button" id="btn-theme" class="cube-btn" aria-label="كۆرۈنۈش ھالىتىنى ئالماشتۇرۇش">
          <span id="theme-label">قاراڭغۇ</span>
        </button>
      </div>
    </header>

    <!-- Status Feedback -->
    <div id="toast-box" class="toast" role="status" aria-live="polite"></div>

    <!-- Center 3D Liquid Glass Card: Home / Study / Import -->
    <section class="main-card">
      <!-- View 1: Book Library List -->
      <div id="view-home">
        <div class="section-head">
          <h2 class="section-title">ساقلانغان كىتابلار</h2>
          <span class="meta-inline" id="books-summary">0 كىتاب</span>
        </div>
        <ul id="book-list" class="book-list" aria-label="كىتابلار تىزىملىكى"></ul>
        <div id="empty-state" class="empty-state hidden">
          <strong>تېخى كىتاب قوشۇلمىغان</strong>
          <p>
            ئالدى بىلەن «جېسون ئۈچۈن پىروپىت كۆچۈرۈش» كۇنۇپكىسىنى بېسىپ پىرومپىتنى خالىغان سۈنئىي ئەقىل مودېلىغا بېرىڭ، چىقىرىپ بەرگەن 30 سۇئاللىق JSON نى «كىتاپ قوشۇش» ئارقىلىق يۈكلەڭ. بارلىق كىتابلىرىڭىز ئايرىم ساقلىنىدۇ ۋە يوقاپ كەتمەيدۇ.
          </p>
        </div>
      </div>

      <!-- View 2: Interactive Study Mode -->
      <div id="view-study" class="hidden">
        <div class="study-nav">
          <button type="button" id="btn-back-home" class="text-btn">← كىتابلارغا قايتىش</button>
          <span class="meta-inline" id="study-counter">1 / 30</span>
        </div>
        <div class="section-head">
          <h2 class="section-title" id="study-book-title">كىتاب ئىسمى</h2>
          <button type="button" id="btn-filter-mode" class="text-btn">ھەممىسى</button>
        </div>
        <div class="progress-track">
          <div id="study-progress-fill" class="progress-fill" style="width: 0%"></div>
        </div>
        <div class="q-meta-line" id="study-q-meta"></div>
        <h3 class="q-question" id="study-q-text"></h3>

        <div id="study-answer-box" class="q-answer-box hidden">
          <p class="uyghur-paragraph" id="study-a-text"></p>
          <p class="key-point" id="study-key-text"></p>
        </div>

        <div class="study-actions">
          <button type="button" id="btn-toggle-answer" class="btn btn-blue btn-sm">جاۋابنى كۆرۈش</button>
          <button type="button" id="btn-toggle-mastered" class="btn btn-secondary btn-sm">ئۆزلەشتۈردۈم</button>
          <div style="display:flex; gap:6px;">
            <button type="button" id="btn-prev-q" class="btn btn-secondary btn-sm">ئالدىنقى</button>
            <button type="button" id="btn-next-q" class="btn btn-secondary btn-sm">كېيىنكى</button>
          </div>
        </div>
      </div>

      <!-- View 3: Add Book (JSON Import) -->
      <div id="view-import" class="hidden">
        <div class="study-nav">
          <button type="button" id="btn-cancel-import" class="text-btn">← قايتىش</button>
          <span class="meta-inline">JSON يۈكلەش</span>
        </div>
        <div class="form-group">
          <label class="form-label" for="input-book-title">كىتاب ياكى دەرسلىك ئىسمى (ئىختىيارى، JSON دىن ئاپتوماتىك ئېلىنىدۇ)</label>
          <input type="text" id="input-book-title" class="text-input" placeholder="مەسىلەن: قۇتادغۇ بىلىك" />
        </div>
        <div class="form-group">
          <label class="form-label" for="input-json-file">1-ئۇسۇل: كومپيۇتېردىن .json ھۆججىتى تاللاش</label>
          <input type="file" id="input-json-file" class="file-input" accept=".json,application/json" />
        </div>
        <div class="form-group">
          <label class="form-label" for="input-json-text">2-ئۇسۇل: ياكى JSON تېكىستىنى بىۋاسىتە چاپلاش</label>
          <textarea id="input-json-text" class="json-textarea" placeholder='{"bookTitle": "...", "questions": [...]}'></textarea>
        </div>
        <button type="button" id="btn-save-book" class="btn btn-primary btn-full">ساقلاش ۋە كىتاب قوشۇش</button>
      </div>
    </section>

    <!-- Two 3D Capsule Action Buttons (Coral-Amber + Clear Crystal) -->
    <div class="action-grid">
      <button type="button" id="btn-add-book" class="btn btn-primary">كىتاپ قوشۇش</button>
      <button type="button" id="btn-copy-prompt" class="btn btn-secondary">جېسون ئۈچۈن پىروپىت كۆچۈرۈش</button>
    </div>

    <!-- Bottom Full-Width 3D Sapphire Glass PDF Button -->
    <button type="button" id="btn-export-pdf" class="btn btn-blue btn-full">سۇئاللارنى pdf قىلىپ چىقىرىش</button>
  </main>

  <!-- Print-to-PDF Container (Visible only during print/PDF export) -->
  <section id="pdf-print-sheet" aria-hidden="true"></section>

  <script src="popup.js"></script>
</body>
</html>
`;

// Valid 1x1 sapphire PNG data URI (zero external URLs, 100% local notification icon)
const EMBEDDED_NOTIFICATION_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk2P7/PwAFfwL+vV4yAAAAAElFTkSuQmCC';

export const POPUP_JS = `/**
 * ئېرپان ئۆگىنىش قورالى — Chrome Manifest V3 (Dual-Context: Service Worker + Popup Controller)
 * نۆل ئىز قوغلاش، پۈتۈنلەي يەرلىك ساقلاش (chrome.storage.local)، تاشقى تور ئۇلىنىشى يوق.
 */
(function () {
  'use strict';

  var STORAGE_BOOKS_KEY = 'erpan_books';
  var STORAGE_SETTINGS_KEY = 'erpan_settings';
  var DEFAULT_SETTINGS = { reminderEnabled: true, theme: 'light' };
  var NOTIFICATION_ICON = ${JSON.stringify(EMBEDDED_NOTIFICATION_ICON)};

  var AI_PROMPT_TEXT = ${JSON.stringify(AI_PROMPT_TEMPLATE)};

  /* =========================================================================
   * 1. Chrome MV3 Service Worker Context (Browser Startup Reminder Engine)
   * ========================================================================= */
  if (typeof document === 'undefined') {
    function updateExtensionBadge() {
      try {
        chrome.storage.local.get([STORAGE_BOOKS_KEY, STORAGE_SETTINGS_KEY], function (res) {
          if (chrome.runtime.lastError) return;
          var books = Array.isArray(res[STORAGE_BOOKS_KEY]) ? res[STORAGE_BOOKS_KEY] : [];
          var settings = Object.assign({}, DEFAULT_SETTINGS, res[STORAGE_SETTINGS_KEY] || {});
          var remaining = 0;
          for (var i = 0; i < books.length; i++) {
            var qs = Array.isArray(books[i].questions) ? books[i].questions : [];
            for (var j = 0; j < qs.length; j++) {
              if (!qs[j].mastered) remaining++;
            }
          }
          if (settings.reminderEnabled && remaining > 0) {
            chrome.action.setBadgeText({ text: String(remaining > 99 ? '99+' : remaining) });
            chrome.action.setBadgeBackgroundColor({ color: '#1D4ED8' });
          } else {
            chrome.action.setBadgeText({ text: '' });
          }
        });
      } catch (err) {
        // Silent safe fallback inside service worker
      }
    }

    function dispatchStartupReminder() {
      try {
        chrome.storage.local.get([STORAGE_BOOKS_KEY, STORAGE_SETTINGS_KEY], function (res) {
          if (chrome.runtime.lastError) return;
          var settings = Object.assign({}, DEFAULT_SETTINGS, res[STORAGE_SETTINGS_KEY] || {});
          if (!settings.reminderEnabled) {
            chrome.action.setBadgeText({ text: '' });
            return;
          }

          var books = Array.isArray(res[STORAGE_BOOKS_KEY]) ? res[STORAGE_BOOKS_KEY] : [];
          var totalQuestions = 0;
          var unmastered = 0;
          for (var i = 0; i < books.length; i++) {
            var qs = Array.isArray(books[i].questions) ? books[i].questions : [];
            totalQuestions += qs.length;
            for (var j = 0; j < qs.length; j++) {
              if (!qs[j].mastered) unmastered++;
            }
          }

          var message = books.length > 0
            ? 'سىزدە ' + books.length + ' كىتاب ۋە تەكرارلايدىغان ' + unmastered + ' سۇئال بار. بۈگۈن بىر قانچە سۇئال ئۆگىنىپ قويۇڭ!'
            : 'توركۆرگۈچ ئېچىلدى! «ئېرپان ئۆگىنىش قورالى» غا تۇنجى كىتابىڭىزنىڭ JSON سۇئاللىرىنى قوشۇپ ئۆگىنىشنى باشلاڭ.';

          chrome.notifications.create('erpan-startup-reminder-' + Date.now(), {
            type: 'basic',
            iconUrl: NOTIFICATION_ICON,
            title: 'ئېرپان ئۆگىنىش قورالى — ئۆگىنىش ئەسكەرتمىسى',
            message: message,
            priority: 1
          });
          updateExtensionBadge();
        });
      } catch (err) {
        // Safe error isolation
      }
    }

    chrome.runtime.onInstalled.addListener(function () {
      try {
        chrome.storage.local.get([STORAGE_SETTINGS_KEY, STORAGE_BOOKS_KEY], function (res) {
          var patch = {};
          if (!res[STORAGE_SETTINGS_KEY]) patch[STORAGE_SETTINGS_KEY] = DEFAULT_SETTINGS;
          if (!Array.isArray(res[STORAGE_BOOKS_KEY])) patch[STORAGE_BOOKS_KEY] = [];
          if (Object.keys(patch).length > 0) {
            chrome.storage.local.set(patch, updateExtensionBadge);
          } else {
            updateExtensionBadge();
          }
        });
      } catch (err) {
        // Safe isolation
      }
    });

    chrome.runtime.onStartup.addListener(function () {
      dispatchStartupReminder();
    });

    chrome.notifications.onClicked.addListener(function (notificationId) {
      try {
        chrome.notifications.clear(notificationId);
      } catch (err) {
        // Safe isolation
      }
    });

    chrome.runtime.onMessage.addListener(function (msg, _sender, sendResponse) {
      try {
        if (msg && msg.type === 'SYNC_BADGE') {
          updateExtensionBadge();
          sendResponse({ ok: true });
        } else if (msg && msg.type === 'TEST_REMINDER') {
          dispatchStartupReminder();
          sendResponse({ ok: true });
        }
      } catch (err) {
        sendResponse({ ok: false });
      }
      return true;
    });

    return;
  }

  /* =========================================================================
   * 2. Popup DOM Controller Context
   * ========================================================================= */
  var state = {
    books: [],
    settings: Object.assign({}, DEFAULT_SETTINGS),
    activeView: 'home',
    activeBookId: null,
    questionIndex: 0,
    showAnswer: false,
    unmasteredOnly: false
  };

  var toastTimer = null;

  function el(id) {
    return document.getElementById(id);
  }

  function showToast(message, type) {
    try {
      var box = el('toast-box');
      if (!box) return;
      box.textContent = message;
      box.className = 'toast show ' + (type === 'error' ? 'error' : 'success');
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        box.className = 'toast';
      }, 3600);
    } catch (err) {
      // Safe fallback
    }
  }

  function storageGet(keys) {
    return new Promise(function (resolve, reject) {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(keys, function (res) {
            if (chrome.runtime && chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(res || {});
            }
          });
        } else {
          var result = {};
          for (var i = 0; i < keys.length; i++) {
            var raw = localStorage.getItem(keys[i]);
            result[keys[i]] = raw ? JSON.parse(raw) : undefined;
          }
          resolve(result);
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  function storageSet(payload) {
    return new Promise(function (resolve, reject) {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set(payload, function () {
            if (chrome.runtime && chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              try {
                chrome.runtime.sendMessage({ type: 'SYNC_BADGE' });
              } catch (_ignored) {}
              resolve();
            }
          });
        } else {
          var ks = Object.keys(payload);
          for (var i = 0; i < ks.length; i++) {
            localStorage.setItem(ks[i], JSON.stringify(payload[ks[i]]));
          }
          resolve();
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  function applyTheme(theme) {
    var mode = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', mode);
    var label = el('theme-label');
    if (label) {
      label.textContent = mode === 'dark' ? 'يورۇق' : 'قاراڭغۇ';
    }
  }

  function applyReminderUI(enabled) {
    var btn = el('btn-reminder');
    if (btn) {
      btn.setAttribute('aria-checked', enabled ? 'true' : 'false');
      btn.title = enabled
        ? 'توركۆرگۈچ ئېچىلغاندا ئەسكەرتىش: ئوچۇق'
        : 'توركۆرگۈچ ئېچىلغاندا ئەسكەرتىش: ئېتىك';
      if (enabled) btn.classList.add('is-active');
      else btn.classList.remove('is-active');
    }
  }

  function switchView(viewName) {
    state.activeView = viewName;
    el('view-home').classList.toggle('hidden', viewName !== 'home');
    el('view-study').classList.toggle('hidden', viewName !== 'study');
    el('view-import').classList.toggle('hidden', viewName !== 'import');
  }

  function getActiveBook() {
    for (var i = 0; i < state.books.length; i++) {
      if (state.books[i].id === state.activeBookId) return state.books[i];
    }
    return null;
  }

  function getVisibleQuestions(book) {
    if (!book || !Array.isArray(book.questions)) return [];
    if (!state.unmasteredOnly) return book.questions;
    return book.questions.filter(function (q) { return !q.mastered; });
  }

  function renderHome() {
    var listEl = el('book-list');
    var emptyEl = el('empty-state');
    var summaryEl = el('books-summary');

    listEl.textContent = '';
    var totalQ = 0;
    for (var k = 0; k < state.books.length; k++) {
      totalQ += Array.isArray(state.books[k].questions) ? state.books[k].questions.length : 0;
    }
    summaryEl.textContent = state.books.length + ' كىتاب · ' + totalQ + ' سۇئال';

    if (state.books.length === 0) {
      emptyEl.classList.remove('hidden');
      return;
    }
    emptyEl.classList.add('hidden');

    state.books.forEach(function (book, index) {
      var li = document.createElement('li');
      li.className = 'book-item';

      var openBtn = document.createElement('button');
      openBtn.type = 'button';
      openBtn.className = 'book-open-btn';

      var mastered = 0;
      var qCount = Array.isArray(book.questions) ? book.questions.length : 0;
      for (var j = 0; j < qCount; j++) {
        if (book.questions[j].mastered) mastered++;
      }

      var nameSpan = document.createElement('span');
      nameSpan.className = 'book-name';
      nameSpan.textContent = (index + 1) + '. ' + book.bookTitle;

      var subSpan = document.createElement('span');
      subSpan.className = 'book-sub';
      subSpan.textContent = qCount + ' سۇئال · ئۆزلەشتۈرۈلگەن: ' + mastered + '/' + qCount;

      openBtn.appendChild(nameSpan);
      openBtn.appendChild(subSpan);
      openBtn.addEventListener('click', function () {
        openBookForStudy(book.id);
      });

      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'book-delete-btn';
      delBtn.title = 'كىتابنى ئۆچۈرۈش';
      delBtn.setAttribute('aria-label', book.bookTitle + ' نى ئۆچۈرۈش');
      delBtn.textContent = '×';
      delBtn.addEventListener('click', function (evt) {
        evt.stopPropagation();
        deleteBook(book.id);
      });

      li.appendChild(openBtn);
      li.appendChild(delBtn);
      listEl.appendChild(li);
    });
  }

  function openBookForStudy(bookId) {
    state.activeBookId = bookId;
    state.questionIndex = 0;
    state.showAnswer = false;
    state.unmasteredOnly = false;
    switchView('study');
    renderStudy();
  }

  function renderStudy() {
    var book = getActiveBook();
    if (!book) {
      switchView('home');
      renderHome();
      return;
    }

    el('study-book-title').textContent = book.bookTitle;
    el('btn-filter-mode').textContent = state.unmasteredOnly ? 'قېلىپ قالغانلار' : 'ھەممىسى';

    var totalAll = book.questions.length;
    var masteredAll = book.questions.filter(function (q) { return q.mastered; }).length;
    var pct = totalAll > 0 ? Math.round((masteredAll / totalAll) * 100) : 0;
    el('study-progress-fill').style.width = pct + '%';

    var list = getVisibleQuestions(book);
    if (list.length === 0) {
      el('study-counter').textContent = '0 / 0';
      el('study-q-meta').textContent = 'تەبرىك! بۇ كىتابتىكى بارلىق سۇئاللارنى ئۆزلەشتۈرۈپ بولدىڭىز.';
      el('study-q-text').textContent = '«قېلىپ قالغانلار» سۈزگۈچىنى بېسىپ بارلىق سۇئاللارنى قايتا كۆرەلەيسىز.';
      el('study-answer-box').classList.add('hidden');
      el('btn-toggle-answer').disabled = true;
      el('btn-toggle-mastered').disabled = true;
      return;
    }

    el('btn-toggle-answer').disabled = false;
    el('btn-toggle-mastered').disabled = false;

    if (state.questionIndex >= list.length) state.questionIndex = list.length - 1;
    if (state.questionIndex < 0) state.questionIndex = 0;

    var q = list[state.questionIndex];
    el('study-counter').textContent = (state.questionIndex + 1) + ' / ' + list.length;
    el('study-q-meta').textContent =
      (q.topic || 'ئاساسىي تېما') +
      ' · ' +
      (q.difficulty || 'ئوتتۇرا') +
      ' · ' +
      (q.mastered ? 'ئۆزلەشتۈرۈلدى' : 'ئۆگىنىش باسقۇچىدا');

    el('study-q-text').textContent = (state.questionIndex + 1) + '. ' + q.question;
    el('study-a-text').textContent = q.answer;
    el('study-key-text').textContent = q.keyPoint ? 'مۇھىم نۇقتا: ' + q.keyPoint : '';
    el('study-key-text').classList.toggle('hidden', !q.keyPoint);

    el('study-answer-box').classList.toggle('hidden', !state.showAnswer);
    el('btn-toggle-answer').textContent = state.showAnswer ? 'جاۋابنى يوشۇرۇش' : 'جاۋابنى كۆرۈش';

    var masterBtn = el('btn-toggle-mastered');
    masterBtn.textContent = q.mastered ? 'ئۆزلەشتۈرۈلدى ✓' : 'ئۆزلەشتۈردۈم';
    masterBtn.className = q.mastered ? 'btn btn-success btn-sm' : 'btn btn-secondary btn-sm';
  }

  function stripCodeFences(raw) {
    var trimmed = String(raw || '').trim();
    if (trimmed.indexOf('\`\`\`') === 0) {
      trimmed = trimmed.replace(/^\`\`\`(?:json)?\s*/i, '').replace(/\s*\`\`\`$/, '');
    }
    return trimmed.trim();
  }

  function parseBookJson(rawText, overrideTitle) {
    var clean = stripCodeFences(rawText);
    if (!clean) {
      throw new Error('JSON مەزمۇنى بوش. ئالدى بىلەن ھۆججەت تاللاڭ ياكى تېكىست چاپلاڭ.');
    }

    var parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (err) {
      throw new Error('JSON فورماتى خاتا: ' + err.message);
    }

    var rawQuestions = Array.isArray(parsed)
      ? parsed
      : (parsed.questions || parsed.items || parsed.qa || []);

    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      throw new Error('JSON ئىچىدە ئىناۋەتلىك «questions» سۇئال تىزىملىكى تېپىلمىدى.');
    }

    var questions = [];
    for (var i = 0; i < rawQuestions.length; i++) {
      var item = rawQuestions[i];
      if (!item || typeof item !== 'object') continue;
      var qText = String(item.question || item.q || item.sual || '').trim();
      var aText = String(item.answer || item.a || item.jawab || '').trim();
      if (!qText || !aText) continue;
      questions.push({
        id: Number(item.id) || (questions.length + 1),
        topic: String(item.topic || item.chapter || 'ئاساسىي تېما').trim(),
        difficulty: String(item.difficulty || item.level || 'ئوتتۇرا').trim(),
        question: qText,
        answer: aText,
        keyPoint: String(item.keyPoint || item.summary || item.note || '').trim(),
        mastered: Boolean(item.mastered)
      });
    }

    if (questions.length === 0) {
      throw new Error('ھېچقانداق تولۇق سۇئال-جاۋاب تۈرى تېپىلمىدى (ھەر تۈردە question ۋە answer بولۇشى شەرت).');
    }

    var title = String(overrideTitle || '').trim() ||
      String(parsed.bookTitle || parsed.title || parsed.name || '').trim() ||
      ('يېڭى كىتاب ' + (state.books.length + 1));

    return {
      id: 'book-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
      bookTitle: title,
      author: String(parsed.author || 'ئېنىقلىمىغان').trim(),
      category: String(parsed.category || 'ئومۇمىي بىلىم').trim(),
      description: String(parsed.description || '').trim(),
      createdAt: new Date().toISOString(),
      questions: questions
    };
  }

  async function saveNewBook() {
    try {
      var raw = el('input-json-text').value;
      var overrideTitle = el('input-book-title').value;
      var newBook = parseBookJson(raw, overrideTitle);

      // Append without deleting any existing books
      state.books.push(newBook);
      await storageSet({ [STORAGE_BOOKS_KEY]: state.books });

      el('input-book-title').value = '';
      el('input-json-text').value = '';
      el('input-json-file').value = '';
      switchView('home');
      renderHome();
      showToast('«' + newBook.bookTitle + '» (' + newBook.questions.length + ' سۇئال) مۇۋەپپەقىيەتلىك ساقلاندى!', 'success');
    } catch (err) {
      showToast(err.message || 'ساقلاشتا خاتالىق كۆرۈلدى.', 'error');
    }
  }

  async function deleteBook(bookId) {
    try {
      state.books = state.books.filter(function (b) { return b.id !== bookId; });
      if (state.activeBookId === bookId) state.activeBookId = null;
      await storageSet({ [STORAGE_BOOKS_KEY]: state.books });
      renderHome();
      showToast('كىتاب تىزىملىكتىن ئۆچۈرۈلدى.', 'success');
    } catch (err) {
      showToast('كىتابنى ئۆچۈرۈشتە خاتالىق كۆرۈلدى.', 'error');
    }
  }

  async function toggleMastered() {
    try {
      var book = getActiveBook();
      if (!book) return;
      var list = getVisibleQuestions(book);
      var currentQ = list[state.questionIndex];
      if (!currentQ) return;
      currentQ.mastered = !currentQ.mastered;
      await storageSet({ [STORAGE_BOOKS_KEY]: state.books });
      renderStudy();
    } catch (err) {
      showToast('ھالەتنى ساقلاشتا خاتالىق كۆرۈلدى.', 'error');
    }
  }

  async function copyAiPrompt() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(AI_PROMPT_TEXT);
      } else {
        var temp = document.createElement('textarea');
        temp.value = AI_PROMPT_TEXT;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
      }
      showToast('30 سۇئاللىق AI پىرومپىت كۆچۈرۈلدى! خالىغان مودېلغا چاپلاپ ئىشلىتىڭ.', 'success');
    } catch (err) {
      showToast('پىرومپىتنى كۆچۈرۈشتە خاتالىق كۆرۈلدى.', 'error');
    }
  }

  function exportToPdf() {
    try {
      var targets = state.activeView === 'study' && getActiveBook()
        ? [getActiveBook()]
        : state.books;

      if (!targets || targets.length === 0) {
        showToast('PDF قىلىپ چىقىرىش ئۈچۈن ئالدى بىلەن كىتاب قوشۇڭ.', 'error');
        return;
      }

      var sheet = el('pdf-print-sheet');
      sheet.textContent = '';

      targets.forEach(function (book) {
        var section = document.createElement('div');
        section.className = 'print-book';

        var titleEl = document.createElement('h1');
        titleEl.textContent = book.bookTitle + ' (' + book.questions.length + ' سۇئال)';
        section.appendChild(titleEl);

        book.questions.forEach(function (q, idx) {
          var card = document.createElement('div');
          card.className = 'print-q';

          var h3 = document.createElement('h3');
          h3.textContent = (idx + 1) + '. ' + q.question;
          card.appendChild(h3);

          var p = document.createElement('p');
          p.textContent = q.answer;
          card.appendChild(p);

          if (q.keyPoint) {
            var kp = document.createElement('div');
            kp.className = 'print-key';
            kp.textContent = 'مۇھىم نۇقتا: ' + q.keyPoint;
            card.appendChild(kp);
          }
          section.appendChild(card);
        });

        sheet.appendChild(section);
      });

      window.print();
    } catch (err) {
      showToast('PDF چىقىرىشتا خاتالىق كۆرۈلدى.', 'error');
    }
  }

  async function init() {
    try {
      var data = await storageGet([STORAGE_BOOKS_KEY, STORAGE_SETTINGS_KEY]);
      state.books = Array.isArray(data[STORAGE_BOOKS_KEY]) ? data[STORAGE_BOOKS_KEY] : [];
      state.settings = Object.assign({}, DEFAULT_SETTINGS, data[STORAGE_SETTINGS_KEY] || {});

      applyTheme(state.settings.theme);
      applyReminderUI(state.settings.reminderEnabled);
      renderHome();
      switchView('home');
    } catch (err) {
      showToast('سانلىق مەلۇماتنى ئوقۇشتا خاتالىق كۆرۈلدى.', 'error');
    }

    el('btn-theme').addEventListener('click', async function () {
      try {
        state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
        applyTheme(state.settings.theme);
        await storageSet({ [STORAGE_SETTINGS_KEY]: state.settings });
      } catch (err) {
        showToast('كۆرۈنۈش ھالىتىنى ساقلىغىلى بولمىدى.', 'error');
      }
    });

    el('btn-reminder').addEventListener('click', async function () {
      try {
        state.settings.reminderEnabled = !state.settings.reminderEnabled;
        applyReminderUI(state.settings.reminderEnabled);
        await storageSet({ [STORAGE_SETTINGS_KEY]: state.settings });
        showToast(
          state.settings.reminderEnabled
            ? 'توركۆرگۈچ ئېچىلغاندا ئەسكەرتىش ئېچىلدى.'
            : 'توركۆرگۈچ ئېچىلغاندا ئەسكەرتىش ئېتىلدى.',
          'success'
        );
      } catch (err) {
        showToast('ئەسكەرتىش تەڭشىكىنى ساقلىغىلى بولمىدى.', 'error');
      }
    });

    el('btn-add-book').addEventListener('click', function () {
      switchView('import');
    });

    el('btn-cancel-import').addEventListener('click', function () {
      switchView('home');
      renderHome();
    });

    el('input-json-file').addEventListener('change', function (evt) {
      try {
        var file = evt.target.files && evt.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (loadEvt) {
          el('input-json-text').value = String(loadEvt.target.result || '');
          showToast('ھۆججەت ئوقۇلدى. ئەمدى «ساقلاش» نى بېسىڭ.', 'success');
        };
        reader.onerror = function () {
          showToast('ھۆججەتنى ئوقۇشتا خاتالىق كۆرۈلدى.', 'error');
        };
        reader.readAsText(file, 'UTF-8');
      } catch (err) {
        showToast('ھۆججەت تاللاشتا خاتالىق كۆرۈلدى.', 'error');
      }
    });

    el('btn-save-book').addEventListener('click', saveNewBook);
    el('btn-copy-prompt').addEventListener('click', copyAiPrompt);
    el('btn-export-pdf').addEventListener('click', exportToPdf);

    el('btn-back-home').addEventListener('click', function () {
      switchView('home');
      renderHome();
    });

    el('btn-filter-mode').addEventListener('click', function () {
      state.unmasteredOnly = !state.unmasteredOnly;
      state.questionIndex = 0;
      state.showAnswer = false;
      renderStudy();
    });

    el('btn-toggle-answer').addEventListener('click', function () {
      state.showAnswer = !state.showAnswer;
      renderStudy();
    });

    el('btn-toggle-mastered').addEventListener('click', toggleMastered);

    el('btn-prev-q').addEventListener('click', function () {
      var book = getActiveBook();
      var list = getVisibleQuestions(book);
      if (list.length === 0) return;
      state.questionIndex = (state.questionIndex - 1 + list.length) % list.length;
      state.showAnswer = false;
      renderStudy();
    });

    el('btn-next-q').addEventListener('click', function () {
      var book = getActiveBook();
      var list = getVisibleQuestions(book);
      if (list.length === 0) return;
      state.questionIndex = (state.questionIndex + 1) % list.length;
      state.showAnswer = false;
      renderStudy();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
`;
