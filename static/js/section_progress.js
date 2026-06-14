/*
 * RENEW Section Progress — "adventure" within-section navigation
 * --------------------------------------------------------------------------
 * Adds a slim adventure-style trail bar across the top of every sequential
 * section page (Positive / Negative / Thoughts & Feelings / Skills). The
 * student's avatar walks one step further along the trail each page, so
 * clicking through a section feels like progressing on the map rather than
 * mashing "Next". Also re-themes the page's Next button into a "Continue the
 * journey" button and gives each page a gentle slide-in (page-turn) entrance.
 *
 * Everything is derived from the URL (e.g. /accounts/neg-p3/ -> Negative,
 * step 3 of 10), so it needs no per-page edits. Loaded globally via
 * mute_button.html; it quietly does nothing on pages it doesn't recognize.
 */
(function () {
    'use strict';

    var BAR_H = 50; // px

    // Section name + length, keyed by the URL slug prefix.
    var SECTIONS = {
        pos:   { name: 'Positive Events',     total: 5 },
        neg:   { name: 'Negative Events',     total: 10 },
        emo:   { name: 'Thoughts & Feelings', total: 5 },
        skill: { name: 'Skills',              total: 4 }
    };

    // Swap for an <img> later if you want a custom character.
    var AVATAR = '🧑‍🎓';

    // 1-based position of a journal prompt in this session's visit order,
    // recording it on first read. 1 = first prompt opened this session, 2 =
    // second. The order resets each time the student re-enters journaling, so
    // step 3 is always the first prompt they click and step 4 the second.
    function journalVisitPos(opt) {
        var order = [];
        try { order = JSON.parse(sessionStorage.getItem('renew_journal_order') || '[]'); } catch (e) {}
        if (order.indexOf(opt) === -1) {
            order.push(opt);
            try { sessionStorage.setItem('renew_journal_order', JSON.stringify(order)); } catch (e) {}
        }
        return order.indexOf(opt) + 1;
    }

    // Each Skills sub-activity is its OWN independent trail — its own title and
    // its own page count — so the avatar tracks progress within that activity
    // only (PMR's trail covers PMR pages, Journaling's covers journaling, etc).
    function detectSkillSub(path) {
        var m;
        // Progressive Muscle Relaxation — one page; the avatar starts at the
        // first stop and advances to the second when the activity is submitted.
        if (/pmr-p\d+/.test(path)) {
            return { key: 'pmr', name: 'Progressive Muscle Relaxation', step: 1, total: 2 };
        }
        // Journaling — 4 steps: video (1), prompt overview (2), one prompt
        // answered (3), both answered (4). The answering pages compute their
        // step from how many prompts actually have content.
        // 4 steps: video 1, overview 2, first prompt clicked 3, second prompt
        // clicked 4. The prompt step comes from the visit ORDER this session
        // (not which file), and resets on re-entry, so the sequence is always
        // 1 -> 2 -> 3 -> 4 regardless of prior completion or which prompt first.
        if (/journal-p1\b/.test(path))      return { key: 'journal', name: 'Journaling', step: 1, total: 4 };
        if (/journal-p2\b/.test(path))      return { key: 'journal', name: 'Journaling', step: 2, total: 4 };
        if (/journal-option1\b/.test(path)) return { key: 'journal', name: 'Journaling', step: 2 + journalVisitPos('option1'), total: 4 };
        if (/journal-option2\b/.test(path)) return { key: 'journal', name: 'Journaling', step: 2 + journalVisitPos('option2'), total: 4 };
        // Positive Planned Activities — 5 planning pages then 4 summary pages.
        m = path.match(/posplan-summary-p(\d+)\b/);
        if (m) return { key: 'posplan', name: 'Positive Planned Activities', step: 5 + parseInt(m[1], 10), total: 9 };
        m = path.match(/posplan-p(\d+)\b/);
        if (m) return { key: 'posplan', name: 'Positive Planned Activities', step: parseInt(m[1], 10), total: 9 };
        return null;
    }

    function detectSection() {
        var path = window.location.pathname || '';

        // Main sections: a step-per-page trail (e.g. neg-p3 -> step 3 of 10).
        var m = path.match(/(pos|neg|emo|skill)-p(\d+)\b/);
        if (m) {
            var cfg = SECTIONS[m[1]];
            if (!cfg) return null;
            var step = parseInt(m[2], 10);
            if (!step || step > cfg.total) return null;
            return { key: m[1], name: cfg.name, step: step, total: cfg.total };
        }

        // Skills sub-activities each get their own trail.
        return detectSkillSub(path);
    }

    function reducedMotion() {
        return window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function injectStyles() {
        if (document.getElementById('renew-trailbar-style')) return;
        var css = [
            '#renew-trailbar{position:fixed;top:0;left:0;right:0;height:' + BAR_H + 'px;',
            'z-index:1400;display:flex;align-items:center;gap:14px;padding:0 16px;',
            'background:linear-gradient(90deg,#5a3e8c,#7c4dff);color:#fff;',
            "font-family:'Work Sans',sans-serif;box-shadow:0 2px 12px rgba(0,0,0,.22);box-sizing:border-box;}",
            '#renew-trailbar .rt-name{font-weight:700;font-size:14px;white-space:nowrap;}',
            '#renew-trailbar .rt-track{position:relative;flex:1;height:30px;margin:0 4px;min-width:80px;}',
            '#renew-trailbar .rt-line{position:absolute;top:50%;left:0;right:0;height:4px;transform:translateY(-50%);background:rgba(255,255,255,.28);border-radius:2px;}',
            '#renew-trailbar .rt-fill{position:absolute;top:50%;left:0;height:4px;transform:translateY(-50%);background:#ffd45e;border-radius:2px;width:0;}',
            '#renew-trailbar .rt-node{position:absolute;top:50%;width:12px;height:12px;border-radius:50%;transform:translate(-50%,-50%);background:rgba(255,255,255,.4);border:2px solid rgba(255,255,255,.6);box-sizing:border-box;}',
            '#renew-trailbar .rt-node.done{background:#ffd45e;border-color:#fff;}',
            '#renew-trailbar .rt-node.current{background:#fff;box-shadow:0 0 0 4px rgba(255,255,255,.35);}',
            '#renew-trailbar .rt-avatar{position:absolute;top:50%;left:0;transform:translate(-50%,-82%);font-size:22px;line-height:1;filter:drop-shadow(0 2px 1px rgba(0,0,0,.35));will-change:left;}',
            '#renew-trailbar .rt-avatar.walking{animation:rtBob .42s ease-in-out infinite;}',
            '#renew-trailbar .rt-step{font-weight:600;font-size:13px;white-space:nowrap;}',
            '@keyframes rtBob{0%,100%{transform:translate(-50%,-82%)}50%{transform:translate(-50%,-102%)}}',
            'body.renew-has-trailbar{padding-top:' + BAR_H + 'px;box-sizing:border-box;}',
            // page entrance (gentle page-turn)
            // Opacity-only entrance. (A transform here would create a
            // containing block and break position:fixed descendants — e.g. the
            // Previous/Next buttons on pages that extend base.html.)
            '.renew-page-enter{animation:rtEnter .45s ease-out both;}',
            '@keyframes rtEnter{from{opacity:0}to{opacity:1}}',
            // themed continue button
            '.rt-continue{box-shadow:0 4px 14px rgba(124,77,255,.35)!important;transition:transform .2s ease,box-shadow .2s ease!important;}',
            '.rt-continue:hover{transform:translateY(-2px) scale(1.03)!important;box-shadow:0 8px 20px rgba(124,77,255,.45)!important;}',
            '@media (max-width:560px){#renew-trailbar .rt-name{display:none;}#renew-trailbar .rt-avatar{font-size:18px;}}',
            '@media (prefers-reduced-motion:reduce){#renew-trailbar .rt-avatar.walking{animation:none;}.renew-page-enter{animation:none;}}'
        ].join('');
        var style = document.createElement('style');
        style.id = 'renew-trailbar-style';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // Fraction (0..1) along the track for a 1-based step. A single-stop trail
    // (e.g. PMR) places its one node at the start of the trail.
    function frac(step, total) {
        if (total <= 1) return 0;
        return (step - 1) / (total - 1);
    }

    function buildBar(info) {
        var bar = document.createElement('div');
        bar.id = 'renew-trailbar';

        var nodes = '';
        for (var i = 1; i <= info.total; i++) {
            var cls = i < info.step ? 'done' : (i === info.step ? 'current' : '');
            var leftPct = frac(i, info.total) * 100;
            nodes += '<div class="rt-node ' + cls + '" style="left:' + leftPct + '%"></div>';
        }

        bar.innerHTML =
            '<div class="rt-name">' + info.name + '</div>' +
            '<div class="rt-track">' +
                '<div class="rt-line"></div>' +
                '<div class="rt-fill"></div>' +
                nodes +
                '<div class="rt-avatar">' + AVATAR + '</div>' +
            '</div>' +
            '<div class="rt-step">Step ' + info.step + ' of ' + info.total + '</div>';
        return bar;
    }

    // Keep full-viewport layouts from overflowing once the bar takes 50px:
    // cap any direct body child that is ~100vh tall, and shrink the body if it
    // is itself locked to 100vh.
    function fixViewportHeights(bar) {
        try {
            var vh = window.innerHeight;
            Array.prototype.forEach.call(document.body.children, function (el) {
                if (el === bar) return;
                var tag = el.tagName;
                if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'AUDIO' || tag === 'TEMPLATE') return;
                var cs = window.getComputedStyle(el);
                if (cs.position === 'fixed') return; // fixed elements aren't shifted by body padding
                var h = parseFloat(cs.height);
                if (isFinite(h) && Math.abs(h - vh) < 4) {
                    el.style.height = 'calc(100vh - ' + BAR_H + 'px)';
                }
            });
        } catch (e) { /* non-fatal */ }
    }

    // Where the avatar should start walking from. We remember the previous
    // page's step in sessionStorage so we can tell which way the student moved
    // *within the same trail*: forward (Next/Continue) walks ahead, Previous
    // walks back. Arriving from a DIFFERENT section/activity (e.g. returning to
    // the Skills hub after finishing PMR), or a fresh load, just places the
    // avatar at the current step — no replayed walk.
    function startStepFor(info) {
        var prev = null;
        try {
            prev = JSON.parse(sessionStorage.getItem('renew_trail_prev') || 'null');
        } catch (e) { /* ignore */ }
        try {
            sessionStorage.setItem('renew_trail_prev',
                JSON.stringify({ key: info.key, step: info.step }));
        } catch (e) { /* ignore */ }

        if (prev && prev.key === info.key && typeof prev.step === 'number') {
            return prev.step; // same trail -> walk from where we came
        }
        return info.step; // different trail / first load -> no walk, just place
    }

    // Trail state, kept so the avatar can be advanced later (e.g. on a submit).
    var trailBar = null, trailInfo = null, trailStep = 1;

    function placeAvatar(f) {
        if (!trailBar) return;
        var avatar = trailBar.querySelector('.rt-avatar');
        var fill = trailBar.querySelector('.rt-fill');
        if (avatar) avatar.style.left = (f * 100) + '%';
        if (fill) fill.style.width = (f * 100) + '%';
    }

    // Update node states + the "Step X of Y" label for the given current step.
    function setStepState(step) {
        if (!trailBar || !trailInfo) return;
        var nodes = trailBar.querySelectorAll('.rt-node');
        Array.prototype.forEach.call(nodes, function (n, i) {
            var idx = i + 1;
            n.className = 'rt-node ' + (idx < step ? 'done' : (idx === step ? 'current' : ''));
        });
        var label = trailBar.querySelector('.rt-step');
        if (label) label.textContent = 'Step ' + step + ' of ' + trailInfo.total;
        trailStep = step;
    }

    // Walk the avatar between two steps. delayMs lets the page entrance play
    // first on the initial load; pass 0 for an interactive advance.
    function walkAvatar(fromStep, toStep, delayMs) {
        if (!trailBar || !trailInfo) return;
        var fromFrac = frac(fromStep, trailInfo.total);
        var toFrac = frac(toStep, trailInfo.total);

        placeAvatar(fromFrac);
        if (reducedMotion() || fromFrac === toFrac) {
            placeAvatar(toFrac);
            setStepState(toStep);
            return;
        }

        var avatar = trailBar.querySelector('.rt-avatar');
        var startTs = null;
        var duration = 820;
        function frameStep(ts) {
            if (startTs === null) startTs = ts;
            var t = (ts - startTs) / duration;
            if (t > 1) t = 1;
            var eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            placeAvatar(fromFrac + (toFrac - fromFrac) * eased);
            if (t < 1) requestAnimationFrame(frameStep);
            else {
                if (avatar) avatar.classList.remove('walking');
                setStepState(toStep);
            }
        }
        if (avatar) avatar.classList.add('walking');
        setTimeout(function () { requestAnimationFrame(frameStep); }, delayMs || 0);
    }

    function startInitialWalk() {
        if (!trailInfo) return;
        walkAvatar(startStepFor(trailInfo), trailInfo.step, 250);
    }

    // Advance the avatar forward one step (no-op if already at the end or if
    // there is no trail on this page). Exposed via window.RENEWTrail so a page
    // can move it on, e.g., a survey submit.
    function advanceTrail() {
        if (!trailBar || !trailInfo) return;
        if (trailStep >= trailInfo.total) return;
        walkAvatar(trailStep, trailStep + 1, 0);
    }

    // Walk the avatar to a specific step (clamped). Also records it as the
    // "previous" position so navigating to the next page doesn't re-walk.
    function goToStepTrail(step) {
        if (!trailBar || !trailInfo) return;
        var target = Math.max(1, Math.min(trailInfo.total, step));
        try {
            sessionStorage.setItem('renew_trail_prev',
                JSON.stringify({ key: trailInfo.key, step: target }));
        } catch (e) { /* ignore */ }
        if (target === trailStep) return;
        walkAvatar(trailStep, target, 0);
    }

    // Only elements pinned to the *viewport* (position:fixed) get hidden behind
    // the bar; elements positioned inside their own container are already
    // shifted down by the body padding, so we must not touch those.
    function nudgeFixedTopButtons() {
        try {
            var sel = '.before-button,.next-button-container,.next-button-overlay,.back-button,#mute-toggle,#admin-unlock';
            Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) {
                var cs = window.getComputedStyle(el);
                if (cs.position !== 'fixed') return;
                var top = parseFloat(cs.top);
                if (isFinite(top) && top < BAR_H + 4) {
                    el.style.top = (top + BAR_H + 8) + 'px';
                }
            });
        } catch (e) { /* non-fatal */ }
    }

    function themeNextButtons() {
        var btns = document.querySelectorAll('#nextButton, .next-button-overlay, .next-button');
        Array.prototype.forEach.call(btns, function (btn) {
            btn.classList.add('rt-continue');
            // Relabel only plain-text "Next" buttons (don't disturb ones with child markup).
            if (!btn.children.length) {
                var t = (btn.textContent || '').trim();
                if (/^next/i.test(t)) btn.textContent = '🧭 Continue the journey →';
            }
        });
    }

    function pageEntrance(bar) {
        if (reducedMotion()) return;
        Array.prototype.forEach.call(document.body.children, function (el) {
            if (el === bar) return;
            var tag = el.tagName;
            if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'AUDIO' || tag === 'TEMPLATE') return;
            var cs = window.getComputedStyle(el);
            if (cs.position === 'fixed') return;
            el.classList.add('renew-page-enter');
        });
    }

    function init() {
        var info = detectSection();
        if (!info) return;
        if (document.getElementById('renew-trailbar')) return;

        injectStyles();
        var bar = buildBar(info);
        document.body.appendChild(bar);
        document.body.classList.add('renew-has-trailbar');

        trailBar = bar;
        trailInfo = info;
        trailStep = info.step;

        fixViewportHeights(bar);
        nudgeFixedTopButtons();
        pageEntrance(bar);
        themeNextButtons();
        startInitialWalk();
    }

    // Let pages move the avatar (e.g. after submitting/saving an activity).
    window.RENEWTrail = { advance: advanceTrail, goToStep: goToStepTrail };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
