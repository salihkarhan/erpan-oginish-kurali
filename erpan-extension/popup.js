/**
 * ئېرپان ئۆگىنىش قورالى — Chrome Manifest V3 (Dual-Context: Service Worker + Popup Controller)
 * نۆل ئىز قوغلاش، پۈتۈنلەي يەرلىك ساقلاش (chrome.storage.local)، تاشقى تور ئۇلىنىشى يوق.
 */
(function () {
  'use strict';

  var STORAGE_BOOKS_KEY = 'erpan_books';
  var STORAGE_SETTINGS_KEY = 'erpan_settings';
  var DEFAULT_SETTINGS = { reminderEnabled: true, theme: 'light' };
  var NOTIFICATION_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk2P7/PwAFfwL+vV4yAAAAAElFTkSuQmCC";

  var AI_PROMPT_TEXT = "سەن ئىلمىي، تەجرىبىلىك ئوقۇتۇش لايىھەلىگۈچىسى ۋە مۇتەخەسسىس. مەن ساڭا تۆۋەندە بىر كىتاب ياكى دەرسلىكنىڭ مەزمۇنىنى بېرىمەن.\n\nۋەزىپەڭ:\nمەن بەرگەن مەزمۇندىن ئەڭ مۇھىم، ئەڭ تەپسىلىي ۋە بىلىمنى چوڭقۇر ئۆزلەشتۈرۈشكە ياردەم بېرىدىغان دەل 30 دانە سۇئال ۋە تولۇق جاۋاب تەييارلاپ، پەقەتلا تۆۋەندىكى قېلىپ بويىچە ساپ JSON (جېسون) فورماتىدا قايتۇرۇپ بەر.\n\nقاتتىق قائىدىلەر:\n1. سۇئاللارنىڭ سانى دەل 30 دانە بولسۇن (1 دىن 30 غىچە رەتلىك نومۇرلانسۇن).\n2. سۇئاللار دەرىجە بويىچە تەڭپۇڭ بولسۇن: 10 دانە «ئاساسىي»، 10 دانە «ئوتتۇرا»، 10 دانە «چوڭقۇر».\n3. ھەر بىر جاۋاب ئىلمىي، ئېنىق، چۈشىنىشلىك ۋە تولۇق ئۇيغۇرچە يېزىلسۇن (قوشۇمچە ئىزاھات، چۈشەندۈرۈش ياكى مۇقەددىمە قوشما، پەقەتلا ئىناۋەتلىك JSON چىقار).\n4. ئۇيغۇرچە ئاتالغۇلارنىڭ ساپلىقى ۋە مۇستەقىللىقىگە قەتئىي رىئايە قىل (جۇغراپىيەلىك ۋە تارىخىي ئاتالغۇلاردا دائىم «شەرقىي تۈركىستان» قاتارلىق توغرا، ئەسلىي ئاتالغۇلارنى ئىشلەت).\n5. مەزمۇن ئىلمىي، ئەدەپلىك ۋە ئەھلى سۈننەت ئەخلاقىغا ئۇيغۇن بولسۇن.\n\nچىقىرىش JSON قېلىپى (دەل مۇشۇ قۇرۇلمىدا چىقار):\n{\n  \"bookTitle\": \"كىتاب ياكى دەرسلىك ئىسمى\",\n  \"author\": \"ئاپتور ياكى مەنبە ئىسمى\",\n  \"category\": \"پەن ياكى تېما تۈرى\",\n  \"description\": \"بۇ كىتابنىڭ قىسقىچە تونۇشتۇرۇشى (2-3 جۈملە)\",\n  \"questions\": [\n    {\n      \"id\": 1,\n      \"topic\": \"باب ياكى تارماق تېما\",\n      \"difficulty\": \"ئاساسىي\",\n      \"question\": \"تەپسىلىي ۋە مۇھىم سۇئال تېكىستى؟\",\n      \"answer\": \"ئىلمىي، ئېنىق ۋە تولۇق جاۋاب تېكىستى.\",\n      \"keyPoint\": \"ئەستە ساقلاشقا تېگىشلىك ئەڭ مۇھىم خۇلاسە نۇقتىسى\"\n    }\n  ]\n}\n\nمەن بېرىدىغان كىتاب ياكى دەرسلىك مەزمۇنى:\n[بۇ يەرگە كىتاب ياكى دەرسلىك تېكىستىنى چاپلاڭ]";

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
    if (trimmed.indexOf('```') === 0) {
      trimmed = trimmed.replace(/^```(?:json)?s*/i, '').replace(/s*```$/, '');
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
