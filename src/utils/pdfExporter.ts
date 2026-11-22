import type { StudyBook } from '../types/erpan';

function escapeHtml(text: string): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildPrintableBookHtml(books: StudyBook[]): string {
  const dateLabel = new Date().toLocaleDateString('ug-Arab', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sectionsHtml = books
    .map((book) => {
      const masteredCount = book.questions.filter((q) => q.mastered).length;
      const questionsHtml = book.questions
        .map(
          (q, idx) => `
          <article class="q-card">
            <div class="q-meta">
              <span>سۇئال ${idx + 1}</span>
              <span>·</span>
              <span>${escapeHtml(q.topic || 'ئاساسىي تېما')}</span>
              <span>·</span>
              <span>${escapeHtml(q.difficulty || 'ئوتتۇرا')}</span>
              ${q.mastered ? '<span>·</span><span class="mastered">ئۆزلەشتۈرۈلدى</span>' : ''}
            </div>
            <h3 class="q-title">${idx + 1}. ${escapeHtml(q.question)}</h3>
            <p class="q-answer">${escapeHtml(q.answer)}</p>
            ${
              q.keyPoint
                ? `<div class="q-key"><strong>مۇھىم نۇقتا:</strong> ${escapeHtml(q.keyPoint)}</div>`
                : ''
            }
          </article>
        `
        )
        .join('');

      return `
        <section class="book-section">
          <header class="book-header">
            <div class="eyebrow">ئېرپان ئۆگىنىش قورالى · سۇئال-جاۋاب توپلىمى</div>
            <h1>${escapeHtml(book.bookTitle)}</h1>
            <div class="book-meta">
              <span>ئاپتور: ${escapeHtml(book.author || 'ئېنىقلىمىغان')}</span>
              <span>·</span>
              <span>تۈرى: ${escapeHtml(book.category || 'ئومۇمىي بىلىم')}</span>
              <span>·</span>
              <span>جەمئىي ${book.questions.length} سۇئال (${masteredCount} ئۆزلەشتۈرۈلدى)</span>
              <span>·</span>
              <span>چىقىرىلغان ۋاقىت: ${escapeHtml(dateLabel)}</span>
            </div>
            ${book.description ? `<p class="book-desc">${escapeHtml(book.description)}</p>` : ''}
          </header>
          <div class="q-list">${questionsHtml}</div>
        </section>
      `;
    })
    .join('');

  return `<!doctype html>
<html lang="ug" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>ئېرپان ئۆگىنىش قورالى — PDF سۇئال توپلىمى</title>
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      color: #0F172A;
      background: #FFFFFF;
      font-family: 'UKIJ Tuz', 'ALKATIP Basma', 'Uyghur Pashto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, sans-serif;
      font-size: 13.5px;
      line-height: 1.85;
      direction: rtl;
    }
    .book-section { page-break-after: always; }
    .book-section:last-child { page-break-after: auto; }
    .book-header {
      border-bottom: 1.5px solid #CBD5E1;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .eyebrow {
      font-size: 11px;
      color: #1D4ED8;
      font-weight: 600;
      margin-bottom: 4px;
    }
    h1 {
      font-size: 21px;
      margin: 0 0 8px 0;
      color: #0F172A;
    }
    .book-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 11.5px;
      color: #475569;
    }
    .book-desc {
      margin: 10px 0 0 0;
      color: #334155;
      text-align: justify;
      text-justify: inter-word;
      text-indent: 1.8em;
    }
    .q-card {
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .q-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 11px;
      color: #64748B;
      margin-bottom: 6px;
    }
    .mastered { color: #059669; font-weight: 600; }
    .q-title {
      font-size: 14.5px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #0F172A;
    }
    .q-answer {
      margin: 0 0 8px 0;
      color: #1E293B;
      text-align: justify;
      text-justify: inter-word;
      text-indent: 1.8em;
    }
    .q-key {
      font-size: 12.5px;
      color: #334155;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 7px 10px;
    }
  </style>
</head>
<body>
  ${sectionsHtml}
</body>
</html>`;
}

/**
 * Triggers native browser Print-to-PDF via an isolated hidden iframe.
 * Avoids window.open so it works reliably inside sandboxed iframes.
 */
export function exportBooksToPdfPrint(books: StudyBook[]): boolean {
  if (!books.length) return false;
  const html = buildPrintableBookHtml(books);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc || !iframe.contentWindow) {
    iframe.remove();
    return false;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    setTimeout(() => iframe.remove(), 1200);
  };

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      cleanup();
    }
  }, 150);

  return true;
}
