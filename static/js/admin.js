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

  function setupButton(btn) {
    function updateUI() {
      if (isAdminUnlocked()) {
        btn.textContent = '🔒';
        btn.title = 'Admin unlocked';
        btn.disabled = true;
      } else {
        btn.textContent = '🔑';
        btn.title = 'Enter admin code';
        btn.disabled = false;
      }
    }

    updateUI();

    btn.addEventListener('click', () => {
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
      } else {
        alert('Incorrect admin code.');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById(BTN_ID);
    if (btn) setupButton(btn);
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
  });
})();
