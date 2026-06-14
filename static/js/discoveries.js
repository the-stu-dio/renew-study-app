/*
 * RENEW Discoveries
 * --------------------------------------------------------------------------
 * A "collection" of personalized discoveries the student earns as they finish
 * activities. Each collectible is either:
 *   - a personalized card (reflects the student's own answer), or
 *   - a section badge (earned by completing a section).
 *
 * This file is the engine: it defines the collectibles, detects newly-earned
 * ones on every page (showing a small toast), and exposes window.RENEWDiscoveries
 * so the My Discoveries page can render the collection and celebrate new finds.
 * All data is read from localStorage — no backend needed.
 */
(function () {
    'use strict';

    var DATA_KEY = 'renew_study_data';
    var EARNED_KEY = 'renew_discoveries_earned';   // ids ever earned (for the toast)
    var VIEWED_KEY = 'renew_discoveries_viewed';    // ids seen on the collection page

    function readJSON(key) {
        try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) { return {}; }
    }
    function readArr(key) {
        try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; }
    }
    function writeArr(key, arr) {
        try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) {}
    }
    function studyData() { return readJSON(DATA_KEY); }
    function ironSponge() { return readJSON('ironSpongeResults'); }
    function nonempty(s) { return typeof s === 'string' && s.trim().length > 0; }
    function countNonEmpty(obj) {
        var c = 0;
        if (obj) { for (var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k) && nonempty(obj[k])) c++; } }
        return c;
    }
    function joinList(arr) {
        if (arr.length <= 1) return arr.join('');
        if (arr.length === 2) return arr[0] + ' and ' + arr[1];
        return arr.slice(0, -1).join(', ') + ', and ' + arr[arr.length - 1];
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // Posplan field can be stored under response/category/activity/timing.
    function planVal(o, altKey) {
        if (!o) return '';
        return (o.response || o.category || (altKey && o[altKey]) || '').toString().trim();
    }
    var FEELING_LABELS = { relaxed: 'Relaxed 😌', stressed: 'More stressed 😣', same: 'About the same 😐' };
    function feelingLabel(v) { return FEELING_LABELS[v] || String(v).replace(/_/g, ' '); }

    function posEvent(d, k) { return d.responses && d.responses.positive_events && d.responses.positive_events[k]; }
    function negEvent(d, k) { return d.responses && d.responses.negative_events && d.responses.negative_events[k]; }
    function journal(d, k) { return d.journal_entries && d.journal_entries[k] && d.journal_entries[k].content; }

    // ---- Collectible definitions ----------------------------------------
    // get(d)  -> personal string (card unlocked when non-empty; body = the text)
    // section -> badge unlocked when that section is in completed_sections
    // unlocked(d,iron)/bodyFn(d,iron) -> custom predicate + body
    var DEFS = [
        // Positive Events
        { id: 'pos_recreation', cat: 'Positive Events', icon: '🎮', title: 'Something Fun',
          label: 'A fun event that matters to you', hint: 'Share a recreational positive event',
          get: function (d) { return posEvent(d, 'recreation'); } },
        { id: 'pos_achievement', cat: 'Positive Events', icon: '🏆', title: 'A Proud Moment',
          label: "An achievement you're proud of", hint: 'Share an achievement',
          get: function (d) { return posEvent(d, 'achievement'); } },
        { id: 'pos_relationship', cat: 'Positive Events', icon: '💞', title: 'Someone Who Matters',
          label: 'A relationship that matters to you', hint: 'Share a relationship event',
          get: function (d) { return posEvent(d, 'relationship'); } },
        { id: 'pos_other', cat: 'Positive Events', icon: '🌟', title: 'Another Bright Spot',
          label: 'Another positive event', hint: 'Share another positive event',
          get: function (d) { return posEvent(d, 'other'); } },

        // Negative Events
        { id: 'neg_adverse', cat: 'Negative Events', icon: '🚨', title: 'Facing Hard Things',
          label: "An adversity you've faced", hint: 'Reflect on an adversity',
          get: function (d) { return negEvent(d, 'adverse'); } },
        { id: 'neg_neighbor', cat: 'Negative Events', icon: '🏘️', title: 'My Neighborhood',
          label: 'A neighborhood challenge', hint: 'Reflect on a neighborhood issue',
          get: function (d) { return negEvent(d, 'neighbor'); } },
        { id: 'neg_discriminate', cat: 'Negative Events', icon: '🛡️', title: 'Standing Tall',
          label: 'An experience with discrimination', hint: 'Reflect on discrimination',
          get: function (d) { return negEvent(d, 'discriminate'); } },
        { id: 'neg_stress', cat: 'Negative Events', icon: '😮‍💨', title: 'Everyday Stress',
          label: 'A stressor you deal with', hint: 'Reflect on a stressor',
          get: function (d) { return negEvent(d, 'stress'); } },

        // About You — iron / sponge
        { id: 'iron_sponge', cat: 'About You', icon: '🧽', title: 'Iron or Sponge',
          hint: 'Take the iron / sponge quiz',
          unlocked: function (d, iron) { return iron && iron.responses && Object.keys(iron.responses).length > 0; },
          bodyFn: function (d, iron) {
              function t(x) { return x && x.type ? x.type : null; }
              var parts = [];
              if (t(iron.school)) parts.push('At school: ' + t(iron.school));
              if (t(iron.friend)) parts.push('With friends: ' + t(iron.friend));
              if (t(iron.family)) parts.push('With family: ' + t(iron.family));
              return parts.length ? parts.join(' · ') : 'You explored how you respond to hard things.';
          } },

        // Journaling
        { id: 'journal_change', cat: 'Journaling', icon: '✏️', title: "Something I'd Change",
          label: "Something you'd like to change", hint: 'Write the first journal prompt',
          get: function (d) { return journal(d, 'things_to_change'); } },
        { id: 'journal_shaped', cat: 'Journaling', icon: '🌱', title: 'What Shaped Me',
          label: 'An experience that shaped you', hint: 'Write the second journal prompt',
          get: function (d) { return journal(d, 'experiences_shaped_me'); } },

        // Skills — PMR
        { id: 'pmr_feelings', cat: 'Skills', icon: '🧘', title: 'How Calm Feels',
          hint: 'Try Progressive Muscle Relaxation',
          unlocked: function (d) {
              var f = d.survey_responses && d.survey_responses.pmr_sidebar_survey && d.survey_responses.pmr_sidebar_survey.selected_feelings;
              return !!(f && f.length);
          },
          bodyFn: function (d) {
              var f = (d.survey_responses.pmr_sidebar_survey.selected_feelings || []).map(feelingLabel);
              return 'After relaxing, your body felt: ' + f.join(', ');
          } },

        // Skills — Positive Activity Plan
        { id: 'posplan', cat: 'Skills', icon: '📋', title: 'My Activity Plan',
          hint: 'Make a positive activity plan',
          unlocked: function (d) {
              var p = d.posplan_responses || {};
              return !!(planVal(p.who) || planVal(p.where) || planVal(p.what, 'activity') || planVal(p.when, 'timing'));
          },
          bodyFn: function (d) {
              var p = d.posplan_responses || {};
              var bits = [];
              var what = planVal(p.what, 'activity'), who = planVal(p.who), where = planVal(p.where), when = planVal(p.when, 'timing');
              if (what) bits.push('What: ' + what);
              if (who) bits.push('Who: ' + who);
              if (where) bits.push('Where: ' + where);
              if (when) bits.push('When: ' + when);
              return bits.join(' · ');
          } },

        // Section badges
        { id: 'badge_positive', cat: 'Badges', icon: '🌟', title: 'Positive Pioneer', badge: true,
          section: 'positive_events', desc: 'Completed the Positive Events section!', hint: 'Finish Positive Events' },
        { id: 'badge_negative', cat: 'Badges', icon: '⚡', title: 'Resilience Builder', badge: true,
          section: 'negative_events', desc: 'Completed the Negative Events section!', hint: 'Finish Negative Events' },
        { id: 'badge_thoughts', cat: 'Badges', icon: '🧠', title: 'Mind Mapper', badge: true,
          section: 'thoughts_feelings', desc: 'Completed the Thoughts & Feelings section!', hint: 'Finish Thoughts & Feelings' },
        { id: 'badge_skills', cat: 'Badges', icon: '🎯', title: 'Skills Master', badge: true,
          section: 'skills', desc: 'Completed the Skills section!', hint: 'Finish Skills' }
    ];

    // Resolve unlocked state + personalized body for a definition.
    function evalDef(def, d, iron) {
        if (def.unlocked) {
            var ok = !!def.unlocked(d, iron);
            return { unlocked: ok, body: ok && def.bodyFn ? def.bodyFn(d, iron) : (def.desc || '') };
        }
        if (def.section) {
            var cs = d.completed_sections || [];
            var done = cs.indexOf(def.section) !== -1;
            return { unlocked: done, body: def.desc || '' };
        }
        if (def.get) {
            var v = def.get(d);
            return { unlocked: nonempty(v), body: nonempty(v) ? v.trim() : '' };
        }
        return { unlocked: false, body: '' };
    }

    function unlockedIds() {
        var d = studyData(), iron = ironSponge();
        return DEFS.filter(function (def) { return evalDef(def, d, iron).unlocked; })
                   .map(function (def) { return def.id; });
    }

    // ---- Newly-earned detection + toast ---------------------------------
    function injectToastStyle() {
        if (document.getElementById('renew-discovery-toast-style')) return;
        var s = document.createElement('style');
        s.id = 'renew-discovery-toast-style';
        s.textContent =
            ".renew-discovery-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(20px);" +
            "background:linear-gradient(135deg,#5a3e8c,#7c4dff);color:#fff;padding:12px 22px;border-radius:999px;" +
            "font-family:'Work Sans',sans-serif;font-weight:700;font-size:15px;box-shadow:0 8px 24px rgba(90,62,140,.35);" +
            "z-index:99998;opacity:0;transition:opacity .35s ease,transform .35s ease;pointer-events:none;max-width:92%;text-align:center;}" +
            ".renew-discovery-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}";
        document.head.appendChild(s);
    }
    function showToast(text) {
        if (!document.body) return;
        injectToastStyle();
        var t = document.createElement('div');
        t.className = 'renew-discovery-toast';
        t.textContent = text;
        document.body.appendChild(t);
        requestAnimationFrame(function () { t.classList.add('show'); });
        setTimeout(function () {
            t.classList.remove('show');
            setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 450);
        }, 3600);
    }

    // On every page: detect collectibles newly unlocked since last time and
    // nudge the student toward the collection. The very first run just records
    // a baseline (no toast), so existing progress isn't announced retroactively.
    function checkNewlyEarned() {
        var current = unlockedIds();
        var raw = localStorage.getItem(EARNED_KEY);
        if (raw === null) { writeArr(EARNED_KEY, current); return; }
        var earned = readArr(EARNED_KEY);
        var fresh = current.filter(function (id) { return earned.indexOf(id) === -1; });
        if (fresh.length) {
            writeArr(EARNED_KEY, earned.concat(fresh));
            showToast(fresh.length === 1
                ? '✨ New discovery unlocked! See it in My Discoveries'
                : '✨ ' + fresh.length + ' new discoveries unlocked!');
        }
    }

    // ---- Public API for the collection page -----------------------------
    window.RENEWDiscoveries = {
        // Full list with resolved state, for rendering.
        list: function () {
            var d = studyData(), iron = ironSponge();
            return DEFS.map(function (def) {
                var r = evalDef(def, d, iron);
                return {
                    id: def.id, cat: def.cat, icon: def.icon, title: def.title,
                    badge: !!def.badge, label: def.label || '', hint: def.hint || '',
                    // verbatim = body is the student's own words (quote it); the
                    // composed sentences (iron/sponge, PMR, plan) and badges aren't.
                    verbatim: !!def.get,
                    unlocked: r.unlocked, body: r.body
                };
            });
        },
        escapeHtml: escapeHtml,
        // A personalized end-of-journey recap pulling together the student's
        // completed sections, Iron/Sponge profile, and planned activity.
        recap: function () {
            var d = studyData(), iron = ironSponge();
            var cs = d.completed_sections || [];

            var p = d.posplan_responses || {};
            var plan = {
                what: planVal(p.what, 'activity'), who: planVal(p.who),
                where: planVal(p.where), when: planVal(p.when, 'timing')
            };
            var hasPlan = !!(plan.what || plan.who || plan.where || plan.when);

            // Personalized one-line takeaway for each section, from their data.
            var posCount = countNonEmpty(d.responses && d.responses.positive_events);
            var negCount = countNonEmpty(d.responses && d.responses.negative_events);
            var je = d.journal_entries || {};
            var journalDone = nonempty((je.things_to_change || {}).content) || nonempty((je.experiences_shaped_me || {}).content);
            var pmrDone = !!(d.survey_responses && d.survey_responses.pmr_sidebar_survey &&
                            (d.survey_responses.pmr_sidebar_survey.selected_feelings || []).length);
            var skills = [];
            if (pmrDone) skills.push('relaxation');
            if (journalDone) skills.push('journaling');
            if (hasPlan) skills.push('planning');

            var NOTES = {
                positive_events: posCount
                    ? 'Shared ' + posCount + ' positive event' + (posCount === 1 ? '' : 's') + ' that matter to you'
                    : 'Explored what brings you joy',
                negative_events: negCount
                    ? 'Named ' + negCount + ' kind' + (negCount === 1 ? '' : 's') + " of hard things you've faced"
                    : 'Learned about different kinds of negative events',
                thoughts_feelings: 'Explored how you respond to tough moments',
                skills: skills.length ? 'Practiced ' + joinList(skills) : 'Built new coping skills'
            };

            var SECTIONS = [
                { key: 'positive_events', name: 'Positive Events', icon: '🌟' },
                { key: 'negative_events', name: 'Negative Events', icon: '⚡' },
                { key: 'thoughts_feelings', name: 'Thoughts & Feelings', icon: '🧠' },
                { key: 'skills', name: 'Skills', icon: '🎯' }
            ];
            var sections = SECTIONS.map(function (s) {
                return { name: s.name, icon: s.icon, done: cs.indexOf(s.key) !== -1, note: NOTES[s.key] || '' };
            });
            var allDone = sections.every(function (s) { return s.done; });

            function t(x) { return x && x.type ? x.type : null; }
            var ironProfile = (iron && iron.responses && Object.keys(iron.responses).length)
                ? { school: t(iron.school), friend: t(iron.friend), family: t(iron.family) }
                : null;

            return {
                ready: allDone,
                nickname: d.nickname || '',
                sections: sections,
                ironSponge: ironProfile,
                plan: hasPlan ? plan : null
            };
        },
        // ids unlocked but not yet seen on the collection page.
        newlyViewableIds: function () {
            var viewed = readArr(VIEWED_KEY);
            return unlockedIds().filter(function (id) { return viewed.indexOf(id) === -1; });
        },
        // call after rendering the page so the "New" highlight clears next time.
        markViewed: function () { writeArr(VIEWED_KEY, unlockedIds()); }
    };

    // ---- Reusable recap card --------------------------------------------
    // Self-contained so it can be dropped onto any page (the collection page,
    // the finalize/profile page, the completion screen) via a placeholder
    // element: <div data-renew-recap></div>  (use "hide-locked" to render
    // nothing until the journey is complete).
    function injectRecapStyles() {
        if (document.getElementById('renew-recap-style')) return;
        var s = document.createElement('style');
        s.id = 'renew-recap-style';
        s.textContent =
            ".recap-hero{margin:0 0 28px;border-radius:20px;padding:30px 28px;color:#fff;" +
            "background:linear-gradient(135deg,#5a3e8c 0%,#7c3aed 55%,#9333ea 100%);" +
            "box-shadow:0 16px 40px rgba(90,62,140,.35);font-family:'Work Sans',sans-serif;animation:recapIn .7s ease-out;}" +
            ".recap-hero h2{margin:0 0 6px;font-size:1.9rem;font-weight:800;}" +
            ".recap-hero .recap-sub{margin:0 0 22px;opacity:.92;font-size:1.05rem;}" +
            ".recap-block{background:rgba(255,255,255,.12);border-radius:14px;padding:16px 18px;margin-bottom:14px;}" +
            ".recap-block:last-child{margin-bottom:0;}" +
            ".recap-block h3{margin:0 0 12px;font-size:1.05rem;font-weight:700;display:flex;align-items:center;gap:8px;}" +
            ".recap-sec-list{display:grid;gap:12px;}" +
            ".recap-sec{display:flex;align-items:flex-start;gap:12px;}" +
            ".recap-sec-ic{font-size:1.6rem;line-height:1.2;flex:0 0 auto;}" +
            ".recap-sec-name{font-weight:700;font-size:1rem;}" +
            ".recap-sec-note{font-size:.92rem;opacity:.9;line-height:1.35;}" +
            ".recap-rows{display:grid;gap:8px;}" +
            ".recap-row{display:flex;gap:8px;font-size:1rem;line-height:1.4;}" +
            ".recap-row .rk{font-weight:700;min-width:64px;opacity:.9;}" +
            ".recap-row .rv{white-space:pre-wrap;word-break:break-word;}" +
            ".recap-locked{margin:0 0 28px;border-radius:20px;padding:28px;text-align:center;background:#f3eefb;" +
            "border:2px dashed #cbbce6;color:#6f6388;font-family:'Work Sans',sans-serif;}" +
            ".recap-locked h2{color:#5a3e8c;margin:0 0 8px;font-size:1.4rem;}" +
            "@keyframes recapIn{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}" +
            "@media (prefers-reduced-motion:reduce){.recap-hero{animation:none;}}";
        document.head.appendChild(s);
    }

    function recapRow(k, v) {
        return v ? '<div class="recap-row"><span class="rk">' + k + '</span><span class="rv">' + escapeHtml(v) + '</span></div>' : '';
    }

    function buildRecapHtml(r) {
        if (!r.ready) {
            return '<div class="recap-locked"><h2>🎓 Your RENEW Recap</h2>' +
                   '<p>Finish all four sections to unlock a personalized recap of your whole journey.</p></div>';
        }
        var sectionRows = r.sections.map(function (s) {
            return '<div class="recap-sec"><span class="recap-sec-ic">' + s.icon + '</span>' +
                       '<div class="recap-sec-tx">' +
                           '<div class="recap-sec-name">' + escapeHtml(s.name) + ' ✓</div>' +
                           (s.note ? '<div class="recap-sec-note">' + escapeHtml(s.note) + '</div>' : '') +
                       '</div></div>';
        }).join('');

        var ironBlock = '';
        if (r.ironSponge) {
            var parts = [];
            if (r.ironSponge.school) parts.push(recapRow('School', r.ironSponge.school));
            if (r.ironSponge.friend) parts.push(recapRow('Friends', r.ironSponge.friend));
            if (r.ironSponge.family) parts.push(recapRow('Family', r.ironSponge.family));
            if (parts.length) {
                ironBlock = '<div class="recap-block"><h3>🧽 Your Iron &amp; Sponge profile</h3>' +
                            '<div class="recap-rows">' + parts.join('') + '</div></div>';
            }
        }

        var planBlock = '';
        if (r.plan) {
            planBlock = '<div class="recap-block"><h3>📋 Your positive activity plan</h3><div class="recap-rows">' +
                        recapRow('What', r.plan.what) + recapRow('Who', r.plan.who) +
                        recapRow('Where', r.plan.where) + recapRow('When', r.plan.when) + '</div></div>';
        }

        var title = r.nickname ? ('🎓 ' + escapeHtml(r.nickname) + "'s RENEW Recap") : '🎓 Your RENEW Recap';
        return '<div class="recap-hero"><h2>' + title + '</h2>' +
               '<p class="recap-sub">Look how far you\'ve come — here\'s everything you discovered.</p>' +
               '<div class="recap-block"><h3>🏁 Sections completed</h3><div class="recap-sec-list">' + sectionRows + '</div></div>' +
               ironBlock + planBlock + '</div>';
    }

    function renderRecaps() {
        var slots = document.querySelectorAll('[data-renew-recap]');
        if (!slots.length) return;
        injectRecapStyles();
        var r = window.RENEWDiscoveries.recap();
        var html = buildRecapHtml(r);
        Array.prototype.forEach.call(slots, function (slot) {
            if (!r.ready && slot.getAttribute('data-renew-recap') === 'hide-locked') {
                slot.innerHTML = '';
            } else {
                slot.innerHTML = html;
            }
        });
    }
    window.RENEWDiscoveries.renderRecaps = renderRecaps;

    document.addEventListener('DOMContentLoaded', function () {
        checkNewlyEarned();
        renderRecaps();
    });
})();
