# تېخنىكىلىق لايىھە ئۆلچىمى (Technical SPEC)
## ئېرپان ئۆگىنىش قورالى — Enterprise Chrome MV3 Architecture

---

### 1. سىستېما ئارخىتېكتورى (3-File Strict MV3 Topology)

بۇ قىستۇرما Chrome Manifest V3 نىڭ ئەڭ قاتتىق بىخەتەرلىك ۋە ئىخچاملىق ئۆلچىمىگە ئۇيغۇن ھالدا **دەل 3 يادرولۇق ھۆججەت** بىلەن قۇرۇلىدۇ:

1. **manifest.json** — MV3 سەپلىمىسى، ئەڭ تۆۋەن ئىجازەت (`storage`, `notifications`) ۋە قاتتىق CSP قائىدىسى.
2. **popup.html** — 372px كەڭلىكتىكى RTL ئۇيغۇرچە كۆرۈنمە يۈز، ئىچكى CSS ئۆزگەرگۈچىلىرى (Light/Dark Glassmorphism) ۋە `@media print` A4 PDF چىقىرىش قۇرۇلمىسى.
3. **popup.js** — قوش مۇھىتلىق (Dual-Context) مەنتىقە باشقۇرغۇچى:
   - **Service Worker مۇھىتى (`typeof document === 'undefined'`):** `chrome.runtime.onInstalled`، `chrome.runtime.onStartup`، `chrome.notifications` ۋە قىستۇرما بەلگە سانى (`chrome.action.setBadgeText`) نى باشقۇرىدۇ.
   - **Popup DOM مۇھىتى (`typeof document !== 'undefined'`):** كىتاب باشقۇرۇش، JSON تەكشۈرۈش، 30 سۇئاللىق تەكرارلاش ماتورى، پىرومپىت كۆچۈرۈش ۋە يەرلىك PDF بېسىش فۇنكسىيەلىرىنى ئىجرا قىلىدۇ.

---

### 2. مەخپىيەتلىك ۋە CSP بىخەتەرلىك قاتلىمى

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'none'; connect-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline';"
}
```

- **`connect-src 'none'`:** توركۆرگۈچ ماتورى سەۋىيىسىدە ھەر قانداق `fetch`، `XMLHttpRequest` ياكى WebSocket ئۇلىنىشىنى قەتئىي توسىدۇ.
- **XSS دىن مۇداپىئە:** بارلىق ئىشلەتكۈچى JSON تېكىستلىرى DOM غا پەقەت `.textContent` ئارقىلىق كىرگۈزۈلىدۇ؛ ھېچقانداق `innerHTML` ياكى `eval` ئىشلىتىلمەيدۇ.
- **ئىجازەت چەكلىمىسى:** پەقەت `["storage", "notifications"]` تەلەپ قىلىنىدۇ؛ `host_permissions` پۈتۈنلەي يوق.

---

### 3. JSON سانلىق مەلۇمات قۇرۇلمىسى (JSON Schema v1.0)

```json
{
  "bookTitle": "string (مەجبۇرىي ياكى ئاپتوماتىك تولدۇرۇلىدۇ)",
  "author": "string (ئىختىيارى)",
  "category": "string (ئىختىيارى)",
  "description": "string (ئىختىيارى)",
  "questions": [
    {
      "id": 1,
      "topic": "string",
      "difficulty": "ئاساسىي | ئوتتۇرا | چوڭقۇر",
      "question": "string (مەجبۇرىي)",
      "answer": "string (مەجبۇرىي)",
      "keyPoint": "string (ئىختىيارى)"
    }
  ]
}
```

**چىداملىق تەھلىل (Resilient Parsing):** `parseBookJson()` فۇنكسىيەسى AI مودېللىرى بەزىدە قوشۇپ قويىدىغان Markdown كود رامكىسىنى ئاپتوماتىك تازىلايدۇ، `title` / `items` / `q` / `a` قاتارلىق قوشۇمچە ئاتالغۇلارنىمۇ قوللايدۇ ۋە خاتا فورماتتا ئېنىق ئۇيغۇرچە خاتالىق ئۇچۇرى قايتۇرىدۇ.

---

### 4. يەرلىك ساقلاش مودېلى (`chrome.storage.local`)

| ئاچقۇچ (Key) | تىپى | چۈشەندۈرۈشى |
| :--- | :--- | :--- |
| `erpan_books` | `StudyBook[]` | ساقلانغان بارلىق كىتابلارنىڭ ئايرىم تىزىملىكى. يېڭى كىتاب `push` قىلىنىپ ساقلىنىدۇ، كونا كىتابلارغا تەگمەيدۇ. |
| `erpan_settings` | `{ reminderEnabled: boolean, theme: 'light' / 'dark' }` | توركۆرگۈچ قوزغالغاندا ئەسكەرتىش ھالىتى ۋە يورۇق/قاراڭغۇ تېما تاللىشى. |

---

### 5. PDF چىقىرىش مېخانىزمى (Zero-Dependency Print Engine)

تاشقى PDF كۈتۈپخانىسىغا ياكى CDN غا تايانماسلىق ئۈچۈن، `popup.html` ئىچىدە مەخسۇس `#pdf-print-sheet` بۆلىكى ۋە `@media print` A4 قېلىپى تەمىنلەنگەن. ئىشلەتكۈچى «سۇئاللارنى pdf قىلىپ چىقىرىش» كۇنۇپكىسىنى باسقاندا:
1. تاللانغان كىتاب (ياكى باش بەتتە بارلىق كىتابلار) بىخەتەر DOM ئېلېمېنتلىرى بىلەن `#pdf-print-sheet` ئىچىگە يېزىلىدۇ.
2. `window.print()` ئارقىلىق Chrome نىڭ ئەسلى PDF ساقلاش كۆزنىكى ئېچىلىدۇ.
3. `@media print` ئۇسلۇبى `UKIJ Tuz` خەت نۇسخىسى، `dir="rtl"`، ئىككى تەرەپكە تەڭلەنگەن ئابزاس (`text-align: justify; text-indent: 1.8em`) ۋە بەت بۆلۈش (`page-break-inside: avoid`) نى ئاپتوماتىك تەڭشەيدۇ.

---

### 6. خاتالىق باشقۇرۇش ۋە Chrome غا قاچىلاش (Load Unpacked)

- بارلىق ئاسىنخرون ساقلاش، ھۆججەت ئوقۇش (`FileReader`)، چاپلاش تاختىسى (`navigator.clipboard`) ۋە `JSON.parse` مەشغۇلاتلىرى `try/catch` ئىچىدە ئورالغان.
- **قاچىلاش قەدەملىرى:**
  1. ZIP ھۆججىتىنى چۈشۈرۈپ يېشىڭ ۋە `erpan-extension` قىسقۇچىنى تېپىڭ.
  2. Chrome ئادرېس بالدىقىدا `chrome://extensions` نى ئېچىڭ.
  3. يۇقىرى ئوڭ بۇلۇڭدىكى **Developer mode** نى ياندۇرۇڭ.
  4. **Load unpacked** نى بېسىپ `erpan-extension` قىسقۇچىنى تاللاڭ — قىستۇرما دەرھال خاتالىقسىز ئىشلەيدۇ.