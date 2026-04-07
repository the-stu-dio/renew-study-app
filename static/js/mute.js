(function(){
    const STORAGE_KEY = 'renew_mute_all';
    const ICON_MUTED = '🔇';
    const ICON_UNMUTED = '🔊';

    function isMutedStored() {
        return localStorage.getItem(STORAGE_KEY) === '1';
    }

    function setMutedStored(val) {
        localStorage.setItem(STORAGE_KEY, val ? '1' : '0');
    }

    function applyMuteToAll(muted) {
        const selector = 'video, audio';
        const els = Array.from(document.querySelectorAll(selector));
        console.debug('[mute] applyMuteToAll ->', muted, 'elements:', els.length);
        els.forEach(el => {
            try {
                el.muted = !!muted;
                // If element is audio and browser ignores muted, also set volume to 0 when muting
                if (muted) {
                    try { el.dataset._prevVolume = el.volume; } catch (e) {}
                    try { el.volume = 0; } catch (e) {}
                } else {
                    try {
                        if (el.dataset && el.dataset._prevVolume !== undefined) {
                            el.volume = parseFloat(el.dataset._prevVolume) || 1;
                            delete el.dataset._prevVolume;
                        } else {
                            // If no saved volume (e.g., dynamically added element), default to full volume
                            el.volume = 1;
                        }
                    } catch (e) {}
                }
            } catch (e) { /* ignore */ }
        });
    }

    function setupButton(btn) {
        function updateUI(muted) {
            btn.textContent = muted ? ICON_MUTED : ICON_UNMUTED;
            btn.title = muted ? 'Unmute videos' : 'Mute videos';
            btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
        }

        // Initialize from storage
        updateUI(isMutedStored());
        applyMuteToAll(isMutedStored());

        // Toggle uses storage as the single source of truth
        btn.addEventListener('click', () => {
            const newMuted = !isMutedStored();
            setMutedStored(newMuted);
            updateUI(newMuted);
            applyMuteToAll(newMuted);
        });

        // Ensure dynamically added videos inherit the mute state
        const mo = new MutationObserver(mutations => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (!node) continue;
                    if (node.nodeType !== 1) continue;
                    if (node.tagName === 'VIDEO') {
                        node.muted = isMutedStored();
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll('video').forEach(v => v.muted = isMutedStored());
                    }
                }
            }
        });
        mo.observe(document.body, { childList: true, subtree: true });

        // Keep UI and storage in sync if user changes mute via native controls
        function handleVolumeChange(e) {
            const anyVideo = Array.from(document.querySelectorAll('video'));
            if (!anyVideo.length) return;
            // If all videos are muted, consider global muted true; if any unmuted, false
            const allMuted = anyVideo.every(v => v.muted === true);
            setMutedStored(allMuted);
            updateUI(allMuted);
        }

        document.addEventListener('volumechange', handleVolumeChange, true);
    }

    document.addEventListener('DOMContentLoaded', () => {
        const buttons = Array.from(document.querySelectorAll('#mute-toggle'));
        if (!buttons.length) return;
        buttons.forEach(setupButton);
    });
})();
