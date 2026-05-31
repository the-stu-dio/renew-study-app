(function(){
  const ADMIN_KEY = 'renew_admin_unlocked';
  const DEFAULT_CODE = 'RENEWADMIN'; // change this to your desired admin code
  const BTN_ID = 'admin-unlock';

  const activityIds = [
    'emo_p1','emo_p2','emo_p3','emo_p4','emo_p5',
    'neg_p1','neg_p2','neg_p3','neg_p4','neg_p5','neg_p6','neg_p7','neg_p8','neg_p9','neg_p10',
    'pos_p1','pos_p2','pos_p3','pos_p4','pos_p5',
    'posplan_p1','posplan_p2','posplan_p3','posplan_p4','posplan_p5',
    'posplan_summary_p1','posplan_summary_p2','posplan_summary_p3','posplan_summary_p4',
    'pmr_p1','journal_p1','journal_p2','journal_option1','journal_option2',
    'skill_p1','skill_p2','skill_p3','skill_p4'
  ];

  const sections = ['positive_events','negative_events','skills','thoughts_feelings'];

  function readData() {
    try {
      return JSON.parse(localStorage.getItem('renew_study_data')) || {};
    } catch (e) {
      return {};
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem('renew_study_data', JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('admin: save failed', e);
      return false;
    }
  }

  function markAllComplete() {
    const data = readData();
    if (!data.progress) data.progress = {};
    if (!data.completed_sections) data.completed_sections = [];

    activityIds.forEach(id => data.progress[id] = true);
    sections.forEach(s => {
      data.progress[s + '_complete'] = true;
      if (!data.completed_sections.includes(s)) data.completed_sections.push(s);
    });

    saveData(data);

    // Also set a simple flag for quick checks
    localStorage.setItem(ADMIN_KEY, '1');
  }

  function isAdminUnlocked() {
    return localStorage.getItem(ADMIN_KEY) === '1';
  }

  function isPositiveEventsPage(pathname) {
    return /\/pos[-_]?p[1-5]\/?$/i.test(pathname || '');
  }

  function isNegativeEventsPage(pathname) {
    return /\/neg[-_]?p(?:10|[1-9])\/?$/i.test(pathname || '');
  }

  function isThoughtsFeelingsPage(pathname) {
    return /\/(emo[-_]?p[1-5]|pmr[-_]?p1|journal[-_]?p[1-2]|journal[-_]option[1-2])\/?$/i.test(pathname || '');
  }

  function isSkillsPage(pathname) {
    return /\/skill[-_]?p[1-4]\/?$/i.test(pathname || '');
  }

  function getSidebarHeadingText() {
    const heading = document.querySelector('.sidebar h1, .sidebar h2, .sidebar h3, .sidebar h4, .sidebar h5, .sidebar h6');
    return heading ? heading.textContent.trim().toLowerCase() : '';
  }

  function normalizePath(pathname) {
    const path = pathname || '';
    return path.endsWith('/') ? path : `${path}/`;
  }

  function buildSequentialPages(prefix, count) {
    return Array.from({ length: count }, (_, idx) => ({
      label: String(idx + 1),
      target: `/accounts/${prefix}${idx + 1}/`
    }));
  }

  function getCurrentIndex(pathname, pages) {
    const normalized = normalizePath(pathname);
    const idx = pages.findIndex(p => p.target === normalized);
    return idx >= 0 ? idx + 1 : 1;
  }

  function getJumpConfig(pathname) {
    if (isPositiveEventsPage(pathname)) {
      const pages = buildSequentialPages('pos-p', 5);
      return {
        section: 'positive',
        title: 'Admin Jump: Positive',
        pages,
        currentIndex: getCurrentIndex(pathname, pages)
      };
    }

    if (isNegativeEventsPage(pathname)) {
      const pages = buildSequentialPages('neg-p', 10);
      return {
        section: 'negative',
        title: 'Admin Jump: Negative',
        pages,
        currentIndex: getCurrentIndex(pathname, pages)
      };
    }

    // Explicit mappings for PMR, Journaling, and Positive Planned Activities
    if (/\/accounts\/pmr[-_]?p1\/?$/i.test(pathname)) {
      const pages = [ { label: '1', target: '/accounts/pmr-p1/' } ];
      return {
        section: 'pmr',
        title: 'Admin Jump: PMR',
        pages,
        currentIndex: getCurrentIndex(pathname, pages)
      };
    }

    if (/\/accounts\/journal[-_]?p[1-2]\/??$/i.test(pathname) || /\/accounts\/journal[-_]?option[1-2]\/??$/i.test(pathname)) {
      const pages = [
        { label: '1', target: '/accounts/journal-p1/' },
        { label: '2', target: '/accounts/journal-p2/' },
        { label: '3', target: '/accounts/journal-option1/' },
        { label: '4', target: '/accounts/journal-option2/' }
      ];
      return {
        section: 'journaling',
        title: 'Admin Jump: Journaling',
        pages,
        currentIndex: getCurrentIndex(pathname, pages)
      };
    }

    if (/\/accounts\/posplan[-_]?p[1-5]\/??$/i.test(pathname)) {
      const pages = buildSequentialPages('posplan-p', 5);
      return {
        section: 'posplan',
        title: 'Admin Jump: Positive Planned Activities',
        pages,
        currentIndex: getCurrentIndex(pathname, pages)
      };
    }

    if (isThoughtsFeelingsPage(pathname)) {
      const pages = [
        { label: '1', target: '/accounts/emo-p1/' },
        { label: '2', target: '/accounts/emo-p2/' },
        { label: '3', target: '/accounts/emo-p3/' },
        { label: '4', target: '/accounts/emo-p4/' },
        { label: '5', target: '/accounts/emo-p5/' }
      ];

      return {
        section: 'thoughts',
        title: 'Admin Jump: Thoughts',
        pages,
        currentIndex: getCurrentIndex(pathname, pages)
      };
    }

    if (isSkillsPage(pathname)) {
      const pages = buildSequentialPages('skill-p', 4);
      return {
        section: 'skills',
        title: 'Admin Jump: Skills',
        pages,
        currentIndex: getCurrentIndex(pathname, pages)
      };
    }

    // Fallback for environments/routes that don't match expected URL patterns.
    const headingText = getSidebarHeadingText();
    if (headingText.includes('positive events')) {
      const pages = buildSequentialPages('pos-p', 5);
      return {
        section: 'positive',
        title: 'Admin Jump: Positive',
        pages,
        currentIndex: getCurrentIndex(pathname, pages)
      };
    }

    if (headingText.includes('negative events')) {
      const pages = buildSequentialPages('neg-p', 10);
      return {
        section: 'negative',
        title: 'Admin Jump: Negative',
        pages,
        currentIndex: getCurrentIndex(pathname, pages)
      };
    }

    if (headingText.includes('thoughts') || headingText.includes('feelings')) {
      const pages = [
        { label: '1', target: '/accounts/emo-p1/' },
        { label: '2', target: '/accounts/emo-p2/' },
        { label: '3', target: '/accounts/emo-p3/' },
        { label: '4', target: '/accounts/emo-p4/' },
        { label: '5', target: '/accounts/emo-p5/' }
      ];

      return {
        section: 'thoughts',
        title: 'Admin Jump: Thoughts',
        pages,
        currentIndex: getCurrentIndex(pathname, pages)
      };
    }

    if (headingText.includes('skills')) {
      const pages = buildSequentialPages('skill-p', 4);
      return {
        section: 'skills',
        title: 'Admin Jump: Skills',
        pages,
        currentIndex: getCurrentIndex(pathname, pages)
      };
    }

    return null;
  }

  function openSectionJumpPrompt() {
    const path = window.location.pathname || '';
    const jumpConfig = getJumpConfig(path);
    if (!jumpConfig) {
      alert('Quick jump is available on Positive, Negative, Thoughts and Feelings, or Skills pages only.');
      return;
    }

    const input = window.prompt(
      `Jump to part (1-${jumpConfig.pages.length}):`,
      String(jumpConfig.currentIndex || 1)
    );
    if (!input) return;

    const part = String(input).trim();
    const partNumber = Number(part);
    if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > jumpConfig.pages.length) {
      alert(`Please enter a number from 1 to ${jumpConfig.pages.length}.`);
      return;
    }

    const target = jumpConfig.pages[partNumber - 1].target;
    if (target !== normalizePath(path)) {
      window.location.href = target;
    }
  }

  function ensureAdminNavigatorStyles() {
    if (document.getElementById('admin-nav-styles')) return;

    const style = document.createElement('style');
    style.id = 'admin-nav-styles';
    style.textContent = `
      #admin-section-navigator {
        position: fixed;
        left: 16px;
        top: 16px;
        z-index: 1400;
        background: #ffffff;
        border: 1px solid #d9cfee;
        border-radius: 8px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.14);
        padding: 8px;
        width: fit-content;
        max-width: calc(100vw - 24px);
        overflow-x: auto;
        font-family: 'Work Sans', sans-serif;
        box-sizing: border-box;
      }

      #admin-section-navigator.in-sidebar {
        position: static;
        left: auto;
        top: auto;
        width: 100%;
        max-width: 100%;
        overflow-x: hidden;
        margin: 6px 0 12px;
        padding: 7px;
      }

      #admin-section-navigator .admin-nav-title {
        font-size: 11px;
        color: #5a3e8c;
        font-weight: 700;
        margin-bottom: 6px;
      }

      #admin-section-navigator .admin-nav-row {
        display: flex;
        flex-wrap: nowrap;
        gap: 4px;
        width: 100%;
      }

      #admin-section-navigator.multi-row-layout .admin-nav-row {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
      }

      #admin-section-navigator .admin-part-btn {
        border: 1px solid #cbbde5;
        border-radius: 6px;
        padding: 4px;
        min-width: 34px;
        font-size: 11px;
        font-weight: 700;
        color: #4a3474;
        background: #f9f6ff;
        cursor: pointer;
        box-sizing: border-box;
      }

      #admin-section-navigator.multi-row-layout .admin-part-btn {
        min-width: 0;
        width: 100%;
      }

      #admin-section-navigator .admin-part-btn:hover {
        background: #ece2ff;
      }

      #admin-section-navigator .admin-part-btn.active {
        border-color: #5a3e8c;
        color: #fff;
        background: #5a3e8c;
      }

      @media (max-width: 640px) {
        #admin-section-navigator {
          left: 10px;
          top: 10px;
          max-width: calc(100vw - 16px);
          padding: 7px;
        }

        #admin-section-navigator.in-sidebar {
          left: auto;
          top: auto;
          max-width: 100%;
        }

        #admin-section-navigator .admin-nav-title {
          font-size: 10px;
        }

        #admin-section-navigator .admin-part-btn {
          font-size: 10px;
          padding: 4px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function removeAdminSectionNavigator() {
    const panel = document.getElementById('admin-section-navigator');
    if (panel) panel.remove();
  }

  function ensureAdminSectionNavigator() {
    const path = window.location.pathname || '';
    const jumpConfig = getJumpConfig(path);

    if (!isAdminUnlocked() || !jumpConfig) {
      removeAdminSectionNavigator();
      return;
    }

    ensureAdminNavigatorStyles();

    let panel = document.getElementById('admin-section-navigator');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'admin-section-navigator';
      document.body.appendChild(panel);
    }

    if (panel.dataset.section !== jumpConfig.section) {
      const buttonsMarkup = jumpConfig.pages
        .map(page => `<button class="admin-part-btn" data-target="${page.target}" type="button">${page.label}</button>`)
        .join('');

      panel.innerHTML = `
        <div class="admin-nav-title">${jumpConfig.title}</div>
        <div class="admin-nav-row">${buttonsMarkup}</div>
      `;
      panel.dataset.section = jumpConfig.section;

      const partButtons = Array.from(panel.querySelectorAll('.admin-part-btn'));
      partButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.target || '';
          if (target && target !== window.location.pathname) {
            window.location.href = target;
          }
        });
      });
    }

    panel.classList.toggle('multi-row-layout', jumpConfig.pages.length > 5);

    const sidebar = document.querySelector('.sidebar');
    const sidebarHeading = sidebar ? sidebar.querySelector('h1, h2, h3, h4, h5, h6') : null;

    if (sidebar) {
      panel.classList.add('in-sidebar');
      if (sidebarHeading && panel.previousElementSibling !== sidebarHeading) {
        sidebarHeading.insertAdjacentElement('afterend', panel);
      } else if (panel.parentElement !== sidebar) {
        sidebar.prepend(panel);
      }
    } else {
      panel.classList.remove('in-sidebar');
      if (panel.parentElement !== document.body) {
        document.body.appendChild(panel);
      }
    }

    panel.hidden = false;
    panel.style.display = 'block';

    // If this is the Negative section and we're on part 9 (or later), nudge the panel down
    // to avoid overlapping UI elements (e.g., the previous navigation button).
    try {
      if (!panel.classList.contains('in-sidebar') && jumpConfig.section === 'negative' && (jumpConfig.currentIndex || 1) >= 9) {
        panel.style.top = '88px';
      } else if (!panel.classList.contains('in-sidebar')) {
        panel.style.top = '';
      }
    } catch (e) { /* ignore */ }

    const normalized = normalizePath(path);
    const partButtons = Array.from(panel.querySelectorAll('.admin-part-btn'));
    partButtons.forEach(btn => {
      const isCurrent = (btn.dataset.target || '') === normalized;
      btn.classList.toggle('active', isCurrent);
      btn.title = isCurrent ? 'Current part' : `Go to Part ${btn.textContent}`;
    });
  }

  function setupButton(btn) {
    function updateUI() {
      if (isAdminUnlocked()) {
        btn.textContent = '🔒';
        btn.title = 'Admin unlocked (click to jump pages)';
        btn.disabled = false;
      } else {
        btn.textContent = '🔑';
        btn.title = 'Enter admin code';
        btn.disabled = false;
      }
    }

    updateUI();

    btn.addEventListener('click', () => {
      if (isAdminUnlocked()) {
        openSectionJumpPrompt();
        return;
      }

      const code = window.prompt('Enter admin code to unlock progress:');
      if (!code) return;
      if (code === DEFAULT_CODE) {
        markAllComplete();
        updateUI();
        alert('Admin unlocked — all activities marked complete.');
        // If RENEWStorage exists, use it to refresh any UI
        try {
          if (window.RENEWStorage && typeof window.RENEWStorage.markSectionComplete === 'function') {
            // mark the same sections via API where available
            sections.forEach(s => window.RENEWStorage.markSectionComplete(s));
          }
        } catch (e) { /* ignore */ }
        // Attempt to auto-skip intro content immediately after unlocking
        try { autoSkipIntro(); } catch (e) { /* ignore */ }
        try { autoSkipHub(); } catch (e) { /* ignore */ }
        try { autoShowPosNext(); } catch (e) { /* ignore */ }
        try { autoShowNegNext(); } catch (e) { /* ignore */ }
        try { autoShowThoughtsNext(); } catch (e) { /* ignore */ }
        try { autoShowSkills(); } catch (e) { /* ignore */ }
        try { ensureAdminSectionNavigator(); } catch (e) { /* ignore */ }
        setTimeout(() => { try { ensureAdminSectionNavigator(); } catch (e) { /* ignore */ } }, 300);
      } else {
        alert('Incorrect admin code.');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const buttons = Array.from(document.querySelectorAll(`#${BTN_ID}`));
    buttons.forEach(setupButton);
    // Auto-skip helper (exposed locally)
    function autoSkipIntro() {
      try {
        if (!isAdminUnlocked()) return;
        const path = window.location.pathname || '';
        // Match intro pages like /intro-1/, /intro_1/, /intro_video/, etc.
        if (!/intro/i.test(path)) return;

        // Seek any video elements near their end so page-level `ended` handlers run
        const videos = Array.from(document.querySelectorAll('video'));
        videos.forEach(v => {
          const seekToEnd = () => {
            try {
              if (v.duration && !isNaN(v.duration) && v.duration > 0) {
                v.currentTime = Math.max(0, v.duration - 0.5);
              }
            } catch (e) { /* ignore */ }
          };

          if (v.readyState >= 1) seekToEnd();
          else v.addEventListener('loadedmetadata', seekToEnd);
        });

        // Also try to click the Next/navigation link or a visible next button as a fallback
        const nextAnchor = document.querySelector('#navigationButtons a, .navigation a, a.next, a[rel="next"]');
        if (nextAnchor) setTimeout(() => nextAnchor.click(), 400);

        // Also check for button-style nexts inside navigationButtons
        const nextButton = document.querySelector('#navigationButtons button, .navigation button, button.next');
        if (nextButton) setTimeout(() => nextButton.click(), 400);
      } catch (e) { console.error('admin: auto-skip failed', e); }
    }

    // Auto-skip the Hub welcome modal when admin is unlocked
    function autoSkipHub() {
      try {
        if (!isAdminUnlocked()) return;
        const path = window.location.pathname || '';
        if (!/hub/i.test(path)) return;

        // Mark hub as visited so page logic won't show the modal
        try { localStorage.setItem('renew_hub_visited', 'true'); } catch (e) {}

        // If a global closeWelcomeModal exists, call it
        if (typeof window.closeWelcomeModal === 'function') {
          try { window.closeWelcomeModal(); } catch (e) { /* ignore */ }
        }

        // Otherwise, hide the modal element directly if present
        const modal = document.getElementById('welcomeModal');
        if (modal && modal.classList.contains('show')) {
          modal.classList.remove('show');
        }

        // Stop any welcome audio playing
        const welcomeAudio = document.getElementById('welcomeAudio');
        if (welcomeAudio && !welcomeAudio.paused) {
          try { welcomeAudio.pause(); welcomeAudio.currentTime = 0; } catch (e) { }
        }
      } catch (e) { console.error('admin: auto-skip hub failed', e); }
    }

    // Auto-show Next on positive-event pages (pos_p1..pos_p4) when admin is unlocked
    function autoShowPosNext() {
      try {
        if (!isAdminUnlocked()) return;
        const path = window.location.pathname || '';
        if (!/pos/i.test(path)) return;

        // If the page exposes a helper to show the next button, call it
        if (typeof window.showNextButtonMotivational === 'function') {
          try { window.showNextButtonMotivational(); } catch (e) { /* ignore */ }
        }

        if (typeof window.showNavigationButtons === 'function') {
          try { window.showNavigationButtons(); } catch (e) { /* ignore */ }
        }

        // Generic fallback: reveal any #nextButtonContainer or #nextButton
        const container = document.getElementById('nextButtonContainer');
        if (container) container.style.display = 'block';

        const nextBtn = document.getElementById('nextButton') || document.querySelector('.next-button, .next-button-overlay, a.next');
        if (nextBtn) {
          try {
            nextBtn.classList.add('visible');
            if (nextBtn.classList) nextBtn.classList.add('next-button-pulse');
          } catch (e) { }
        }

        // If we can infer page id (pos_p1..pos_p4) from the path, mark it complete via page function
        const m = path.match(/pos[-_]?p?(?:art-)?([1-4])|pos_p([1-4])|pos-([1-4])|pos_([1-4])/i);
        let idx = null;
        if (m) {
          for (let i = 1; i < m.length; i++) if (m[i]) { idx = m[i]; break; }
        }
        if (idx) {
          const pageId = 'pos_p' + idx;
          if (typeof window.markComplete === 'function') {
            try { window.markComplete(pageId); } catch (e) { /* ignore */ }
          }
          if (window.RENEWStorage && typeof window.RENEWStorage.markSectionComplete === 'function') {
            try { window.RENEWStorage.markSectionComplete('positive_events'); } catch (e) { }
          }
        }
      } catch (e) { console.error('admin: auto-show pos next failed', e); }
    }

    // Auto-show Next on negative-event pages (neg_p1..neg_p9) when admin is unlocked
    function autoShowNegNext() {
      try {
        if (!isAdminUnlocked()) return;
        const path = window.location.pathname || '';
        if (!/neg/i.test(path)) return;

        // If the page exposes a helper to show the next button, call it
        if (typeof window.showNextButtonMotivational === 'function') {
          try { window.showNextButtonMotivational(); } catch (e) { /* ignore */ }
        }

        if (typeof window.showNavigationButtons === 'function') {
          try { window.showNavigationButtons(); } catch (e) { /* ignore */ }
        }

        // Generic fallback: reveal any #nextButtonContainer or #nextButton
        const container = document.getElementById('nextButtonContainer');
        if (container) container.style.display = 'block';

        const nextBtn = document.getElementById('nextButton') || document.querySelector('.next-button, .next-button-overlay, a.next');
        if (nextBtn) {
          try {
            nextBtn.classList.add('visible');
            if (nextBtn.classList) nextBtn.classList.add('next-button-pulse');
          } catch (e) { }
        }

        // If we can infer page id (neg_p1..neg_p9) from the path, mark it complete via page function
        const m = path.match(/neg[-_]?p?(?:art-)?([1-9])|neg_p([1-9])|neg-([1-9])|neg_([1-9])/i);
        let idx = null;
        if (m) {
          for (let i = 1; i < m.length; i++) if (m[i]) { idx = m[i]; break; }
        }
        if (idx) {
          const pageId = 'neg_p' + idx;
          if (typeof window.markComplete === 'function') {
            try { window.markComplete(pageId); } catch (e) { /* ignore */ }
          }
          if (window.RENEWStorage && typeof window.RENEWStorage.markSectionComplete === 'function') {
            try { window.RENEWStorage.markSectionComplete('negative_events'); } catch (e) { }
          }
        }
      } catch (e) { console.error('admin: auto-show neg next failed', e); }
    }

    // Auto-show Next on thoughts & feelings pages (emo_*, pmr_*, journal_*) when admin is unlocked
    function autoShowThoughtsNext() {
      try {
        if (!isAdminUnlocked()) return;
        const path = window.location.pathname || '';
        if (!/(emo|pmr|journal)/i.test(path)) return;

        // Call page helpers if present
        if (typeof window.showNextButtonMotivational === 'function') {
          try { window.showNextButtonMotivational(); } catch (e) { /* ignore */ }
        }
        if (typeof window.showNavigationButtons === 'function') {
          try { window.showNavigationButtons(); } catch (e) { /* ignore */ }
        }

        // Generic fallback: reveal any #nextButtonContainer or #nextButton
        const container = document.getElementById('nextButtonContainer');
        if (container) container.style.display = 'block';

        const nextBtn = document.getElementById('nextButton') || document.querySelector('.next-button, .next-button-overlay, a.next');
        if (nextBtn) {
          try {
            nextBtn.classList.add('visible');
            if (nextBtn.classList) nextBtn.classList.add('next-button-pulse');
          } catch (e) { }
        }

        // Try to infer page id and mark complete
        const m = path.match(/(emo|pmr|journal)[-_%]?p?(?:art-)?([1-9])/i) || path.match(/(emo|pmr|journal)[-_]?([1-9])/i);
        let pageId = null;
        if (m) {
          const prefix = (m[1] || '').toLowerCase();
          const idx = m[2];
          if (prefix && idx) pageId = `${prefix}_p${idx}`;
        }
        // Fallback patterns for journal_option1 etc.
        if (!pageId) {
          const opt = path.match(/journal_option1|journal_option2/i);
          if (opt) pageId = opt[0].toLowerCase();
        }

        if (pageId) {
          if (typeof window.markComplete === 'function') {
            try { window.markComplete(pageId); } catch (e) { /* ignore */ }
          }
        }

        if (window.RENEWStorage && typeof window.RENEWStorage.markSectionComplete === 'function') {
          try { window.RENEWStorage.markSectionComplete('thoughts_feelings'); } catch (e) { }
        }
      } catch (e) { console.error('admin: auto-show thoughts next failed', e); }
    }

    // Auto-show Next on skills pages (skill_p1..skill_p4) when admin is unlocked
    function autoShowSkills() {
      try {
        if (!isAdminUnlocked()) return;
        const path = window.location.pathname || '';
        if (!/skill/i.test(path)) return;

        // Call page helpers if present
        if (typeof window.showNextButtonMotivational === 'function') {
          try { window.showNextButtonMotivational(); } catch (e) { /* ignore */ }
        }
        if (typeof window.showNavigationButtons === 'function') {
          try { window.showNavigationButtons(); } catch (e) { /* ignore */ }
        }

        // Generic fallback: reveal any #nextButtonContainer or #nextButton
        const container = document.getElementById('nextButtonContainer');
        if (container) container.style.display = 'block';

        const nextBtn = document.getElementById('nextButton') || document.querySelector('.next-button, .next-button-overlay, a.next');
        if (nextBtn) {
          try {
            nextBtn.classList.add('visible');
            if (nextBtn.classList) nextBtn.classList.add('next-button-pulse');
          } catch (e) { }
        }

        // Infer page id and mark complete
        const m = path.match(/skill[-_]?p?(?:art-)?([1-4])|skill_p([1-4])|skill-([1-4])|skill_([1-4])/i);
        let idx = null;
        if (m) {
          for (let i = 1; i < m.length; i++) if (m[i]) { idx = m[i]; break; }
        }
        if (idx) {
          const pageId = 'skill_p' + idx;
          if (typeof window.markComplete === 'function') {
            try { window.markComplete(pageId); } catch (e) { /* ignore */ }
          }
          if (window.RENEWStorage && typeof window.RENEWStorage.markSectionComplete === 'function') {
            try { window.RENEWStorage.markSectionComplete('skills'); } catch (e) { }
          }
        }
      } catch (e) { console.error('admin: auto-show skills next failed', e); }
    }

    // Run now on load
    autoSkipIntro();
    autoSkipHub();
    autoShowPosNext();
    autoShowNegNext();
    autoShowThoughtsNext();
    autoShowSkills();
    ensureAdminSectionNavigator();
    setTimeout(() => { try { ensureAdminSectionNavigator(); } catch (e) { /* ignore */ } }, 300);
  });
})();
