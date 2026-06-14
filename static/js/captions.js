(function () {
  const PREF_KEY = 'renew_captions_enabled';

  function getCaptionPreference() {
    const value = localStorage.getItem(PREF_KEY);
    return value !== 'false';
  }

  function setCaptionPreference(enabled) {
    localStorage.setItem(PREF_KEY, enabled ? 'true' : 'false');
  }

  function getToggleButton() {
    return document.getElementById('subtitle-toggle');
  }

  function injectStyles() {
    if (document.getElementById('renew-caption-style')) return;

    const style = document.createElement('style');
    style.id = 'renew-caption-style';
    style.textContent = `
      .renew-caption-overlay {
        position: absolute;
        left: 50%;
        bottom: var(--renew-caption-bottom, 40px);
        transform: translateX(-50%);
        z-index: 9999;
        max-width: min(92%, 840px);
        padding: 10px 16px;
        border-radius: 12px;
        background: rgba(0, 0, 0, 0.72);
        color: #fff;
        font-family: 'Work Sans', sans-serif;
        font-size: 16px;
        font-weight: 600;
        line-height: 1.35;
        text-align: center;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.45);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.18s ease;
        white-space: pre-wrap;
      }

      body.intro-page .renew-caption-overlay {
        --renew-caption-bottom: 54px;
      }

      .renew-caption-overlay.is-visible {
        opacity: 1;
      }

      .renew-caption-overlay.is-fullscreen {
        opacity: 0;
        visibility: hidden;
      }

      .renew-caption-overlay.is-disabled {
        opacity: 0 !important;
        visibility: hidden !important;
      }
    `;
    document.head.appendChild(style);
  }

  function parseTimestamp(value) {
    const parts = value.trim().split(':');
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    if (parts.length === 3) {
      hours = Number(parts[0]);
      minutes = Number(parts[1]);
      seconds = Number(parts[2]);
    } else if (parts.length === 2) {
      minutes = Number(parts[0]);
      seconds = Number(parts[1]);
    }

    return (hours * 3600) + (minutes * 60) + seconds;
  }

  function parseVtt(text) {
    const normalized = String(text || '').replace(/\r/g, '');
    const blocks = normalized.split(/\n\n+/);
    const cues = [];

    blocks.forEach(block => {
      const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
      if (lines.length < 2) return;

      const timeLineIndex = lines.findIndex(line => line.includes('-->'));
      if (timeLineIndex === -1) return;

      const timing = lines[timeLineIndex].split('-->');
      if (timing.length < 2) return;

      const startPart = timing[0].trim().split(' ')[0];
      const endPart = timing[1].trim().split(' ')[0];
      const start = parseTimestamp(startPart);
      const end = parseTimestamp(endPart);
      const textLines = lines.slice(timeLineIndex + 1);

      if (Number.isFinite(start) && Number.isFinite(end) && textLines.length) {
        cues.push({ start, end, text: textLines.join('\n') });
      }
    });

    return cues;
  }

  function ensureContainer(video) {
    const container = video.closest('.video-wrapper') || video.closest('.video-container') || video.parentElement;
    if (!container) return null;

    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }

    return container;
  }

  function getOverlay(container, videoId) {
    let overlay = container.querySelector('.renew-caption-overlay[data-for="' + videoId + '"]');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'renew-caption-overlay';
      overlay.dataset.for = videoId;
      overlay.setAttribute('aria-live', 'polite');
      container.appendChild(overlay);
    }
    return overlay;
  }

  function attachVideo(video, attachToggleButton) {
    const src = video.dataset.track;
    if (!src) return;

    const container = ensureContainer(video);
    if (!container) return;

    const overlay = getOverlay(container, video.id || src);
    const toggleButton = getToggleButton();
    let captionsEnabled = getCaptionPreference();

    if (toggleButton && attachToggleButton) {
      if (!container.contains(toggleButton)) {
        container.appendChild(toggleButton);
      }
      toggleButton.style.position = 'absolute';
      toggleButton.style.right = '16px';
      toggleButton.style.bottom = '16px';
      // Keep it above the video but BELOW page modals/feedback surveys (which
      // sit at z-index 1000+), so the CC button never floats over a question.
      toggleButton.style.zIndex = '30';
      toggleButton.style.display = 'flex';
    }

    // Move the action stack into the video container so it can be positioned
    // next to each video without affecting layout flow.
    try {
      const actionStack = document.querySelector('.renew-video-actions');
      if (actionStack && attachToggleButton && !container.contains(actionStack)) {
        container.appendChild(actionStack);
      }
    } catch (e) {}

    let nativeTrack = video.querySelector('track[data-renew-captions="true"]');
    if (!nativeTrack) {
      nativeTrack = document.createElement('track');
      nativeTrack.kind = 'captions';
      nativeTrack.label = 'English';
      nativeTrack.srclang = 'en';
      nativeTrack.src = src;
      nativeTrack.default = true;
      nativeTrack.dataset.renewCaptions = 'true';
      video.appendChild(nativeTrack);
    }

    const isFullscreenMode = () => {
      const fullscreenElement = document.fullscreenElement;
      if (!fullscreenElement) return false;
      return fullscreenElement === video || fullscreenElement === container || (fullscreenElement.contains && fullscreenElement.contains(video));
    };

    const syncFullscreenStyle = () => {
      overlay.classList.toggle('is-fullscreen', isFullscreenMode());
      overlay.classList.toggle('is-disabled', !captionsEnabled);
      if (toggleButton) {
        toggleButton.classList.toggle('is-active', captionsEnabled);
        toggleButton.setAttribute('aria-pressed', captionsEnabled ? 'true' : 'false');
        toggleButton.title = captionsEnabled ? 'Hide subtitles' : 'Show subtitles';
      }
      if (!video.textTracks || !video.textTracks.length) return;

      const fullscreen = isFullscreenMode();
      for (let i = 0; i < video.textTracks.length; i++) {
        try {
          video.textTracks[i].mode = (fullscreen && captionsEnabled) ? 'showing' : 'hidden';
        } catch (e) {}
      }
    };

    function showCaption(text) {
      if (text && captionsEnabled && !isFullscreenMode()) {
        overlay.textContent = text;
        overlay.classList.add('is-visible');
      } else {
        overlay.textContent = '';
        overlay.classList.remove('is-visible');
      }
    }

    function updateCaption() {
      syncFullscreenStyle();
      const currentTime = Number(video.currentTime || 0);
      const cues = video._renewCues || [];
      const activeCue = cues.find(cue => currentTime >= cue.start && currentTime <= cue.end);
      const text = activeCue ? activeCue.text.trim() : '';
      showCaption(text);
    }

    fetch(src, { cache: 'no-store' })
      .then(response => {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.text();
      })
      .then(text => {
        video._renewCues = parseVtt(text);
        updateCaption();
      })
      .catch(error => {
        console.warn('Failed to load captions from', src, error);
      });

    video.addEventListener('loadedmetadata', updateCaption);
    video.addEventListener('loadeddata', updateCaption);
    video.addEventListener('canplay', updateCaption);
    video.addEventListener('timeupdate', updateCaption);
    video.addEventListener('seeked', updateCaption);
    video.addEventListener('play', updateCaption);
    video.addEventListener('pause', updateCaption);
    video.addEventListener('ended', () => showCaption(''));

    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement === video || (document.fullscreenElement && document.fullscreenElement.contains && document.fullscreenElement.contains(video))) {
        syncFullscreenStyle();
        updateCaption();
      }
    });

    if (toggleButton) {
      toggleButton.addEventListener('click', () => {
        captionsEnabled = !captionsEnabled;
        setCaptionPreference(captionsEnabled);
        syncFullscreenStyle();
        updateCaption();
      });
    }

    setTimeout(updateCaption, 100);
    setTimeout(updateCaption, 500);
  }

  function init() {
    injectStyles();
    const videos = document.querySelectorAll('video[data-track]');
    if (!videos.length) {
      const toggleButton = getToggleButton();
      if (toggleButton) toggleButton.remove();
      const actionStack = document.querySelector('.renew-video-actions');
      if (actionStack) {
        actionStack.style.display = 'none';
        actionStack.classList.add('is-floating');
        document.body.appendChild(actionStack);
      }
      return;
    }

    const visibleVideos = Array.from(videos).filter(video => video.offsetParent !== null || video.getClientRects().length > 0);
    const activeVideo = visibleVideos[0] || videos[0];

    const actionStack = document.querySelector('.renew-video-actions');
    if (actionStack) actionStack.style.display = '';

    videos.forEach(video => attachVideo(video, video === activeVideo));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
