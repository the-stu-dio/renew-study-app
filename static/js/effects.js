/*
 * RENEW Effects
 * --------------------------------------------------------------------------
 * Global, asset-free feedback layer wired in via base.html, so it applies to
 * every page in the app automatically:
 *   1. Card flips  -> a soft "whoosh" sound whenever a .flip-card gains/loses
 *                     the .flip class (the existing 3D CSS flip is the visual).
 *   2. Button press -> a crisp click sound on any button-like element.
 *   3. Section done -> a short chime + confetti burst whenever a new section
 *                      is appended to completed_sections in renew_study_data.
 *
 * All sounds are synthesized with the Web Audio API (no audio files), and all
 * audio respects the existing global mute toggle (localStorage 'renew_mute_all').
 */
(function () {
    'use strict';

    var MUTE_KEY = 'renew_mute_all';
    var DATA_KEY = 'renew_study_data';

    function isMuted() {
        try {
            return localStorage.getItem(MUTE_KEY) === '1';
        } catch (e) {
            return false;
        }
    }

    /* ----------------------------------------------------------------------
     * Web Audio: a single shared, lazily-created context. Browsers require a
     * user gesture before audio can play; since every effect here is triggered
     * by a click/flip, the context unlocks naturally on first interaction.
     * -------------------------------------------------------------------- */
    var audioCtx = null;

    function getCtx() {
        if (audioCtx === null) {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            try {
                audioCtx = new AC();
            } catch (e) {
                audioCtx = null;
                return null;
            }
        }
        // A context that the browser has put to sleep ('suspended'), that iOS
        // has taken away ('interrupted'), or that somehow got 'closed' will be
        // silent forever unless we revive it. Recreate if closed, otherwise
        // resume on anything that isn't actively running.
        if (audioCtx.state === 'closed') {
            audioCtx = null;
            return getCtx();
        }
        if (audioCtx.state !== 'running') {
            audioCtx.resume().catch(function () {});
        }
        return audioCtx;
    }

    // A single tone with an attack/decay envelope.
    function tone(opts) {
        var ctx = getCtx();
        if (!ctx) return;
        var now = ctx.currentTime + (opts.delay || 0);
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = opts.type || 'sine';
        osc.frequency.setValueAtTime(opts.freq, now);
        if (opts.toFreq) {
            osc.frequency.exponentialRampToValueAtTime(opts.toFreq, now + opts.duration);
        }
        var peak = opts.gain || 0.2;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(peak, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + opts.duration);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + opts.duration + 0.02);
    }

    // Short filtered noise burst (used for the card whoosh).
    function noiseWhoosh() {
        var ctx = getCtx();
        if (!ctx) return;
        var now = ctx.currentTime;
        var dur = 0.22;
        var frames = Math.floor(ctx.sampleRate * dur);
        var buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
        var ch = buffer.getChannelData(0);
        for (var i = 0; i < frames; i++) {
            // fade the noise out over the burst
            ch[i] = (Math.random() * 2 - 1) * (1 - i / frames);
        }
        var src = ctx.createBufferSource();
        src.buffer = buffer;
        var band = ctx.createBiquadFilter();
        band.type = 'bandpass';
        band.frequency.setValueAtTime(1100, now);
        band.frequency.exponentialRampToValueAtTime(380, now + dur);
        band.Q.value = 0.6;
        var gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.5, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        src.connect(band).connect(gain).connect(ctx.destination);
        src.start(now);
        src.stop(now + dur);
    }

    var Effects = {
        flipSound: function () {
            if (isMuted()) return;
            noiseWhoosh();
        },
        clickSound: function () {
            if (isMuted()) return;
            tone({ freq: 880, toFreq: 660, type: 'triangle', duration: 0.07, gain: 0.16 });
        },
        celebrateSound: function () {
            if (isMuted()) return;
            // A short fanfare: a bright ascending arpeggio (C5, E5, G5, C6)
            // resolving into a sustained major chord.
            var arp = [523.25, 659.25, 783.99, 1046.5];
            arp.forEach(function (f, idx) {
                tone({ freq: f, type: 'triangle', duration: 0.3, gain: 0.2, delay: idx * 0.1 });
            });
            arp.forEach(function (f) {
                tone({ freq: f, type: 'triangle', duration: 0.8, gain: 0.13, delay: 0.45 });
            });
        },
        celebrate: function () {
            this.celebrateSound();
            launchConfetti();
        },
        // Play an <audio>/<video> element as soon as the browser permits.
        // Tries immediately (works when autoplay is allowed, e.g. high media
        // engagement); if the browser blocks it, retries on the first real user
        // interaction — so congrats voiceovers are never silently dropped.
        // Pass the media element; an optional playFn lets callers route through
        // their own play wrapper (it should return the play() promise).
        playWhenAllowed: function (media, playFn) {
            if (!media) return;
            var events = ['pointerdown', 'touchstart', 'keydown', 'click'];
            var done = false;
            function cleanup() {
                events.forEach(function (ev) {
                    document.removeEventListener(ev, onGesture, true);
                });
            }
            function attempt() {
                if (done || !media.paused) {
                    if (!media.paused) { done = true; cleanup(); }
                    return;
                }
                var p;
                try {
                    p = playFn ? playFn(media) : media.play();
                } catch (e) {
                    return;
                }
                if (p && p.then) {
                    p.then(function () { done = true; cleanup(); })
                     .catch(function () { /* blocked — wait for a gesture */ });
                }
            }
            function onGesture() { attempt(); }
            attempt();
            if (!done) {
                events.forEach(function (ev) {
                    document.addEventListener(ev, onGesture, true);
                });
            }
        }
    };

    /* ----------------------------------------------------------------------
     * Confetti: a self-contained canvas burst, no external library. Honors
     * prefers-reduced-motion by skipping the animation.
     * -------------------------------------------------------------------- */
    function prefersReducedMotion() {
        return window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function launchConfetti() {
        if (prefersReducedMotion()) return;
        if (typeof document === 'undefined' || !document.body) return;

        var canvas = document.createElement('canvas');
        canvas.style.cssText =
            'position:fixed;top:0;left:0;width:100%;height:100%;' +
            'pointer-events:none;z-index:99999;';
        var dpr = window.devicePixelRatio || 1;
        var w = window.innerWidth;
        var h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        document.body.appendChild(canvas);
        var ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        var colors = ['#5a3e8c', '#7c3aed', '#28a745', '#f4b942', '#e74c3c', '#3aa0ff'];
        var pieces = [];
        var count = 110;
        for (var i = 0; i < count; i++) {
            pieces.push({
                x: w / 2 + (Math.random() - 0.5) * w * 0.3,
                y: h * 0.42 + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 12,
                vy: Math.random() * -11 - 4,
                size: Math.random() * 8 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                rot: Math.random() * Math.PI * 2,
                vr: (Math.random() - 0.5) * 0.3,
                shape: Math.random() < 0.5 ? 'rect' : 'circle'
            });
        }

        var gravity = 0.32;
        var start = null;
        var DURATION = 2200;

        function frame(ts) {
            if (start === null) start = ts;
            var elapsed = ts - start;
            ctx.clearRect(0, 0, w, h);
            var fade = elapsed > DURATION - 500
                ? Math.max(0, (DURATION - elapsed) / 500)
                : 1;

            for (var i = 0; i < pieces.length; i++) {
                var p = pieces[i];
                p.vy += gravity;
                p.vx *= 0.99;
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vr;

                ctx.save();
                ctx.globalAlpha = fade;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                if (p.shape === 'rect') {
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }

            if (elapsed < DURATION) {
                requestAnimationFrame(frame);
            } else if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        }
        requestAnimationFrame(frame);
    }

    /* ----------------------------------------------------------------------
     * Wiring 1: button press sounds (event delegation, capture phase so it
     * still fires even if a handler stops propagation).
     *
     * The app uses a wide variety of button-like elements (plain <button>,
     * links styled as buttons, accordion headers, quiz/survey options, and
     * many custom "*-btn"/"*-button" classes), so the matcher is broad:
     * anything semantically clickable counts as a "button press".
     * -------------------------------------------------------------------- */
    var BUTTON_SELECTOR = [
        'button',
        'a',
        'input[type="button"]',
        'input[type="submit"]',
        'summary',
        '[role="button"]',
        '[onclick]',
        '[class*="btn"]',
        '[class*="button"]',
        '.quiz-option',
        '.survey-option',
        '.review-link',
        '.acc-header',
        '.impl-acc-header',
        '.neg-acc-header',
        '.info-acc-header',
        '.skill-card'
    ].join(',');

    // Many buttons navigate or submit synchronously (an <a href>, a form
    // submit, or an onclick that sets window.location). That unloads the page
    // instantly and cuts off the just-started sound. We can't tell in advance
    // whether a given click will navigate, so we take a uniform approach:
    // swallow the original click, play the sound, then re-fire the click a
    // moment later so the element's real behavior (navigation, submit, modal,
    // toggle, ...) runs once the sound has had time to be heard.
    var DEFER_MS = 100;
    var replaying = false;

    document.addEventListener('click', function (e) {
        // Our own re-fired click — let it pass straight through untouched.
        if (replaying) return;

        var el = e.target;
        if (!el || typeof el.closest !== 'function') return;
        var node = el.closest(BUTTON_SELECTOR);
        if (!node) return;

        // Modified / non-primary clicks (open-in-new-tab, middle-click, etc.):
        // give audible feedback but never interfere with the browser's action.
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
            Effects.clickSound();
            return;
        }

        // If something earlier already cancelled this click, just play the
        // sound — there's no real action left to defer.
        if (e.defaultPrevented) {
            Effects.clickSound();
            return;
        }

        Effects.clickSound();

        // Hold the action, then replay the exact same click.
        e.preventDefault();
        e.stopImmediatePropagation();
        setTimeout(function () {
            replaying = true;
            try {
                node.click();
            } finally {
                replaying = false;
            }
        }, DEFER_MS);
    }, true);

    /* ----------------------------------------------------------------------
     * Wiring 2: card flip sounds. Watch for the .flip class toggling on any
     * .flip-card element anywhere in the document, now or added later.
     * -------------------------------------------------------------------- */
    function observeFlips() {
        if (!('MutationObserver' in window)) return;
        var mo = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var m = mutations[i];
                if (m.type !== 'attributes' || m.attributeName !== 'class') continue;
                var t = m.target;
                if (t && t.classList && t.classList.contains('flip-card')) {
                    Effects.flipSound();
                }
            }
        });
        mo.observe(document.body, {
            attributes: true,
            attributeFilter: ['class'],
            subtree: true
        });
    }

    /* ----------------------------------------------------------------------
     * Wiring 3: section-completion celebration. Every page's
     * markSectionComplete() ultimately appends to completed_sections inside
     * the renew_study_data localStorage entry. We intercept setItem so a
     * celebration fires no matter which page/function did the write.
     * -------------------------------------------------------------------- */
    function completedCount() {
        try {
            var data = JSON.parse(localStorage.getItem(DATA_KEY) || '{}');
            return Array.isArray(data.completed_sections)
                ? data.completed_sections.length
                : 0;
        } catch (e) {
            return 0;
        }
    }

    // Fire the celebration at most once per page. The confetti is purely
    // visual so it always runs immediately; the sound, however, may be blocked
    // by the browser's autoplay policy when a "Section Complete" page has just
    // loaded with no user gesture yet (this is exactly why the pages' own
    // <audio> congrats clips stay silent). In that case we play the fanfare on
    // the very first interaction instead, so it is never lost.
    var celebratedThisPage = false;

    function playCelebrationSound() {
        if (isMuted()) return;
        var events = ['pointerdown', 'touchstart', 'keydown', 'click'];
        var played = false;

        function cleanup() {
            events.forEach(function (ev) {
                document.removeEventListener(ev, onGesture, true);
            });
        }
        function doPlay() {
            if (played || isMuted()) return;
            played = true;
            cleanup();
            Effects.celebrateSound();
        }
        function onGesture() {
            // The gesture lets the context resume; give it a tick, then play.
            setTimeout(doPlay, 40);
        }

        var ctx = getCtx();
        if (ctx) {
            if (ctx.state === 'running') {
                doPlay();
                return;
            }
            // Autoplay may be permitted (e.g. high media engagement); if the
            // resume succeeds without a gesture, play right away.
            ctx.resume().then(function () {
                if (ctx.state === 'running') doPlay();
            }).catch(function () {});
        }
        // Otherwise, wait for the first real user interaction on this page.
        events.forEach(function (ev) {
            document.addEventListener(ev, onGesture, true);
        });
    }

    function triggerCelebration() {
        if (celebratedThisPage) return;
        celebratedThisPage = true;
        launchConfetti();
        playCelebrationSound();
    }

    function installSectionHook() {
        var lastCount = completedCount();
        var nativeSetItem = localStorage.setItem.bind(localStorage);

        localStorage.setItem = function (key, value) {
            nativeSetItem(key, value);
            if (key !== DATA_KEY) return;
            try {
                var parsed = JSON.parse(value);
                var n = Array.isArray(parsed.completed_sections)
                    ? parsed.completed_sections.length
                    : 0;
                if (n > lastCount) {
                    lastCount = n;
                    triggerCelebration();
                } else {
                    lastCount = n;
                }
            } catch (e) {
                /* ignore malformed writes */
            }
        };
    }

    // Dedicated "Section Complete" / congratulations screens (e.g. pos_p5,
    // neg_p10, emo_p5) are reached *after* the section was already recorded on
    // an earlier page, so the setItem hook above sees no growth here. Detect
    // these screens on load and celebrate so the congrats page always has its
    // fanfare + confetti.
    function celebrateOnCompletionScreen() {
        var hasVoiceover = document.getElementById('congratsAudio');
        var isCompletionScreen = hasVoiceover ||
            document.querySelector('.completion-title, .completion-subtitle');
        if (!isCompletionScreen) return;

        if (hasVoiceover) {
            // The page provides its own celebratory voiceover (and its own
            // confetti). Don't layer our synth fanfare / canvas confetti on top
            // — just make sure nothing else here fires a competing celebration.
            celebratedThisPage = true;
            return;
        }
        // A completion screen with no built-in audio: use our own fanfare.
        triggerCelebration();
    }

    // Keep the audio context warm. Browsers suspend an idle/backgrounded
    // context (and iOS can "interrupt" it) after a while, which would silence
    // the click sounds. Resuming on *every* pointer/key gesture — not just the
    // first — means it is revived right before the click that needs it, so the
    // sounds keep working no matter how long the session runs. getCtx() is
    // cheap and a no-op when the context is already running.
    function warmUpAudio() {
        getCtx();
    }
    document.addEventListener('pointerdown', warmUpAudio, true);
    document.addEventListener('touchstart', warmUpAudio, true);
    document.addEventListener('keydown', warmUpAudio, true);
    // Also revive it when the tab becomes visible again after being hidden.
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) getCtx();
    });

    document.addEventListener('DOMContentLoaded', function () {
        // Create (and attempt to resume) the audio engine as early as page load
        // so it has a head start waking up before the first click — this trims
        // the lag on that first click's sound. (It stays suspended until a real
        // gesture if the browser blocks it, which is fine.)
        getCtx();
        observeFlips();
        installSectionHook();
        celebrateOnCompletionScreen();
    });

    // Expose for manual use / debugging.
    window.RENEWEffects = Effects;
})();
