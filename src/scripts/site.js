const root = document.documentElement;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/* ---------- Home logo animation (plays by itself on arrival) ---------- */

const logoHero = document.querySelector('.logo-hero');

if (logoHero) {
  const logoVideo = logoHero.querySelector('.logo-video');
  // Reveals the navigation and the scroll cue (see global.css).
  const finishLogo = () => logoHero.classList.add('is-complete');

  if (!logoVideo || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    logoHero.classList.add('is-static', 'is-reduced');
    finishLogo();
  } else {
    // Skips the near-black opening frames so the logo starts appearing straight away.
    const START_TIME = 0.3;
    let started = false;

    // If the browser will not play the video (e.g. Low Power Mode), the still logo fades in instead.
    const showStillLogo = () => {
      logoHero.classList.add('is-static');
      window.setTimeout(finishLogo, 1600);
    };

    const playLogo = () => {
      const playPromise = logoVideo.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(showStillLogo);
      }
    };

    // Browsers pause silent video in background tabs, so only start (or resume) while the page is on screen.
    const startLogo = () => {
      if (document.hidden || logoVideo.ended) return;
      if (!started) {
        started = true;
        logoVideo.currentTime = START_TIME;
        playLogo();
      } else if (logoVideo.paused && !logoHero.classList.contains('is-static')) {
        playLogo();
      }
    };

    logoVideo.addEventListener('ended', finishLogo);
    logoVideo.addEventListener('error', showStillLogo);
    document.addEventListener('visibilitychange', startLogo);
    startLogo();
  }
}

/* ---------- Scroll reveal ---------- */

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.16,
    rootMargin: '0px 0px -8% 0px',
  }
);

document.querySelectorAll('.reveal').forEach((element) => {
  revealObserver.observe(element);
});

/* ---------- Scroll-driven UI ---------- */

const trackedSections = [...document.querySelectorAll('.tracked-section')];
const darkenEnd = document.querySelector('[data-darken-end]');
const scrollProgress = document.querySelector('.scroll-progress');

const updateVideoDarkness = () => {
  const scrollY = window.scrollY || window.pageYOffset;
  const fallbackDistance = Math.max((root.scrollHeight - window.innerHeight) * 0.55, 1);
  const targetY = darkenEnd ? Math.max(darkenEnd.getBoundingClientRect().top + scrollY, 1) : fallbackDistance;
  root.style.setProperty('--scroll-darkness', clamp(scrollY / targetY, 0, 1).toFixed(3));
};

const updatePageProgress = () => {
  const scrollY = window.scrollY || window.pageYOffset;
  const maxScrollable = Math.max(root.scrollHeight - window.innerHeight, 1);
  root.style.setProperty('--page-progress', clamp(scrollY / maxScrollable, 0, 1).toFixed(3));
};

const updateScrollHighlights = () => {
  const viewportHeight = window.innerHeight;
  trackedSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const start = viewportHeight * 0.82;
    const end = viewportHeight * 0.22;
    const distance = rect.height + (start - end);
    const progress = clamp((start - rect.top) / distance, 0, 1);
    section.style.setProperty('--title-progress', progress.toFixed(3));
  });
};

/* ---------- Tagline (appears gradually while scrolling) ---------- */

const tagline = document.querySelector('.tagline');
let updateTagline = () => {};

if (tagline && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  updateTagline = () => {
    const rect = tagline.getBoundingClientRect();
    const textTop = rect.top + parseFloat(getComputedStyle(tagline).paddingTop);
    const viewportHeight = window.innerHeight;
    // Starts as the text enters at the bottom of the screen; complete when it reaches the middle.
    const progress = clamp((viewportHeight * 0.92 - textTop) / (viewportHeight * 0.5), 0, 1);
    tagline.style.setProperty('--tagline-progress', progress.toFixed(3));
  };
}

/* ---------- Tagline glow (liquid light that follows the pointer) ---------- */

const taglineGlow = document.querySelector('.tagline-main');

if (taglineGlow && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // Positions are percentages of the text box. `near` follows the pointer closely and `far`
  // trails behind it; the gap between the two is what makes the light feel liquid.
  const near = { x: 30, y: 40 };
  const far = { x: 70, y: 60 };
  const target = { x: 50, y: 50 };
  let lastPointerMove = -Infinity;
  let glowFrame = 0;
  let glowVisible = false;

  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType === 'touch') return;
      const rect = taglineGlow.getBoundingClientRect();
      target.x = clamp(((event.clientX - rect.left) / rect.width) * 100, -40, 140);
      target.y = clamp(((event.clientY - rect.top) / rect.height) * 100, -150, 250);
      lastPointerMove = performance.now();
    },
    { passive: true }
  );

  const moveGlow = (now) => {
    glowFrame = 0;
    // With no recent pointer movement (and on touch screens) the light drifts by itself.
    if (now - lastPointerMove > 2500) {
      target.x = 50 + Math.sin(now / 1700) * 45;
      target.y = 50 + Math.cos(now / 2300) * 60;
    }
    near.x += (target.x - near.x) * 0.09;
    near.y += (target.y - near.y) * 0.09;
    far.x += (target.x - far.x) * 0.035;
    far.y += (target.y - far.y) * 0.035;
    taglineGlow.style.setProperty('--gx', `${near.x.toFixed(1)}%`);
    taglineGlow.style.setProperty('--gy', `${near.y.toFixed(1)}%`);
    taglineGlow.style.setProperty('--hx', `${far.x.toFixed(1)}%`);
    taglineGlow.style.setProperty('--hy', `${far.y.toFixed(1)}%`);
    if (glowVisible) glowFrame = requestAnimationFrame(moveGlow);
  };

  // Only animate while the words are on screen.
  new IntersectionObserver(([entry]) => {
    glowVisible = entry.isIntersecting;
    if (glowVisible && !glowFrame) glowFrame = requestAnimationFrame(moveGlow);
  }).observe(taglineGlow);
}

/* ---------- About banner (pinned picture that draws in while scrolling) ---------- */

const aboutBanner = document.querySelector('.about-banner');
let updateAboutBanner = () => {};

if (aboutBanner && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  aboutBanner.classList.add('is-animated');
  updateAboutBanner = () => {
    // Zero on narrow screens, where the banner is not pinned.
    const pinnedDistance = aboutBanner.offsetHeight - window.innerHeight;
    const progress = pinnedDistance > 0 ? clamp(window.scrollY / pinnedDistance, 0, 1) : 0;
    aboutBanner.style.setProperty('--banner-progress', progress.toFixed(3));
  };
}

const updateOnScroll = () => {
  updateTagline();
  updateAboutBanner();
  updateVideoDarkness();
  updatePageProgress();
  updateScrollHighlights();
};

let uiFrameId = 0;
const scheduleUiUpdate = () => {
  if (uiFrameId) return;
  uiFrameId = requestAnimationFrame(() => {
    uiFrameId = 0;
    updateOnScroll();
  });
};

updateOnScroll();
window.addEventListener('scroll', scheduleUiUpdate, { passive: true });
window.addEventListener('resize', updateOnScroll);

if (scrollProgress) {
  let isProgressDragging = false;
  let progressRect = null;

  const scrollToProgress = (progress) => {
    const maxScrollable = Math.max(root.scrollHeight - window.innerHeight, 1);
    window.scrollTo({ top: progress * maxScrollable, behavior: 'auto' });
    root.style.setProperty('--page-progress', clamp(progress, 0, 1).toFixed(3));
  };

  const refreshProgressRect = () => {
    progressRect = scrollProgress.getBoundingClientRect();
  };

  const progressFromPointer = (clientY) => {
    if (!progressRect) refreshProgressRect();
    if (!progressRect) return 0;
    return clamp((clientY - progressRect.top) / progressRect.height, 0, 1);
  };

  scrollProgress.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    isProgressDragging = true;
    refreshProgressRect();
    scrollProgress.setPointerCapture(event.pointerId);
    scrollToProgress(progressFromPointer(event.clientY));
  });

  scrollProgress.addEventListener('pointermove', (event) => {
    if (!isProgressDragging) return;
    scrollToProgress(progressFromPointer(event.clientY));
  });

  const stopProgressDragging = (event) => {
    if (!isProgressDragging) return;
    isProgressDragging = false;
    if (scrollProgress.hasPointerCapture(event.pointerId)) {
      scrollProgress.releasePointerCapture(event.pointerId);
    }
  };

  scrollProgress.addEventListener('pointerup', stopProgressDragging);
  scrollProgress.addEventListener('pointercancel', stopProgressDragging);
  window.addEventListener('resize', refreshProgressRect);
}

/* ---------- Backdrop video playlist ---------- */

const videoStage = document.querySelector('.video-stage[data-playlist]');
const heroVideos = videoStage ? [...videoStage.querySelectorAll('.hero-video')] : [];
const playlist = videoStage ? JSON.parse(videoStage.dataset.playlist) : [];

if (heroVideos.length === 2 && playlist.length > 0) {
  let activeVideoIndex = 0;
  let activePlaylistIndex = 0;
  let queuedPlaylistIndex = 1 % playlist.length;
  let isTransitioningHero = false;

  const setVideoSource = (video, source) => {
    if (!video || !source || video.dataset.src === source) return;
    video.src = source;
    video.dataset.src = source;
    video.load();
  };

  const safePlay = (video) => {
    const playPromise = video?.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  };

  const queueNextHeroVideo = () => {
    setVideoSource(heroVideos[1 - activeVideoIndex], playlist[queuedPlaylistIndex]);
  };

  const transitionHeroVideo = () => {
    if (isTransitioningHero) return;
    isTransitioningHero = true;

    const currentVideo = heroVideos[activeVideoIndex];
    const nextVideo = heroVideos[1 - activeVideoIndex];

    nextVideo.currentTime = 0;
    safePlay(nextVideo);
    nextVideo.classList.add('is-active');
    currentVideo.classList.remove('is-active');

    window.setTimeout(() => {
      currentVideo.pause();
      activeVideoIndex = 1 - activeVideoIndex;
      activePlaylistIndex = queuedPlaylistIndex;
      queuedPlaylistIndex = (activePlaylistIndex + 1) % playlist.length;
      queueNextHeroVideo();
      isTransitioningHero = false;
    }, 280);
  };

  heroVideos.forEach((video) => {
    video.addEventListener('timeupdate', () => {
      if (video !== heroVideos[activeVideoIndex]) return;
      if (video.duration - video.currentTime <= 0.18) {
        transitionHeroVideo();
      }
    });

    ['ended', 'error'].forEach((type) => {
      video.addEventListener(type, () => {
        if (video === heroVideos[activeVideoIndex]) transitionHeroVideo();
      });
    });
  });

  setVideoSource(heroVideos[0], playlist[0]);
  queueNextHeroVideo();
  safePlay(heroVideos[0]);
}

/* ---------- Work rotator (home page) ---------- */

document.querySelectorAll('[data-rotator]').forEach((rotator) => {
  const slides = [...rotator.querySelectorAll('.work-slide')];
  const tabs = [...rotator.querySelectorAll('.work-tab')];
  const bar = rotator.querySelector('.work-rotator-bar-fill');
  if (slides.length < 2) return;

  const INTERVAL = 6000;
  const autoplay = Boolean(bar) && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0;

  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === current);
      slide.inert = i !== current;
    });
    tabs.forEach((tab, i) => {
      tab.classList.toggle('is-active', i === current);
      tab.setAttribute('aria-selected', String(i === current));
    });

    if (autoplay) {
      // This work's share of the bar, e.g. the 2nd of 4 works runs from 25% to 50%.
      bar.style.setProperty('--bar-from', String(current / slides.length));
      bar.style.setProperty('--bar-to', String((current + 1) / slides.length));
      // The flush in between makes the animation begin again for the new step.
      bar.classList.remove('is-running');
      void bar.offsetWidth;
      bar.classList.add('is-running');
    }
  };

  // The bar is the timer: when it has filled, move on to the next work.
  bar?.addEventListener('animationend', () => show(current + 1));

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => show(i));
  });

  // Hold the current work (and freeze the bar) while someone is pointing at it or tabbing through it.
  const pause = () => rotator.classList.add('is-paused');
  const resume = () => rotator.classList.remove('is-paused');
  rotator.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') pause();
  });
  rotator.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse') resume();
  });
  rotator.addEventListener('focusin', pause);
  rotator.addEventListener('focusout', resume);

  rotator.style.setProperty('--rotator-interval', `${INTERVAL}ms`);
  show(0);
});

/* ---------- Topic modal (Dalton Tokyo page) ---------- */

const pointChips = [...document.querySelectorAll('.point-chip')];
const topicModal = document.querySelector('#topic-modal');

if (topicModal && pointChips.length) {
  const topicModalFrame = topicModal.querySelector('.topic-modal-frame');
  const topicModalTitle = topicModal.querySelector('#topic-modal-title');
  const topicModalDescription = topicModal.querySelector('#topic-modal-description');
  const topicModalImage = topicModal.querySelector('#topic-modal-image');
  const closeButton = topicModal.querySelector('.topic-modal-close');
  let lastTrigger = null;

  const openTopicModal = (chip) => {
    topicModalTitle.textContent = chip.dataset.title;
    topicModalDescription.textContent = chip.dataset.description;
    topicModalImage.style.backgroundImage = `url("${chip.dataset.image}")`;

    // Grow the modal out of the chip that was clicked.
    const rect = chip.getBoundingClientRect();
    const fromX = rect.left + rect.width / 2 - window.innerWidth / 2;
    const fromY = rect.top + rect.height / 2 - window.innerHeight / 2;
    const fromScale = clamp(rect.width / window.innerWidth, 0.18, 0.42);
    topicModalFrame.style.setProperty('--modal-from-x', `${fromX.toFixed(1)}px`);
    topicModalFrame.style.setProperty('--modal-from-y', `${fromY.toFixed(1)}px`);
    topicModalFrame.style.setProperty('--modal-from-scale', fromScale.toFixed(3));

    lastTrigger = chip;
    topicModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => {
      topicModal.classList.add('is-open');
      closeButton?.focus();
    });
    pointChips.forEach((other) => other.classList.toggle('is-active', other === chip));
  };

  const closeTopicModal = () => {
    if (!topicModal.classList.contains('is-open')) return;
    topicModal.classList.remove('is-open');
    topicModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    pointChips.forEach((chip) => chip.classList.remove('is-active'));
    lastTrigger?.focus();
  };

  pointChips.forEach((chip) => {
    chip.addEventListener('click', () => openTopicModal(chip));
  });

  topicModal.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.modalClose === 'true') {
      closeTopicModal();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeTopicModal();
  });
}

/* ---------- Gallery lightbox ---------- */

const lightbox = document.querySelector('#lightbox');
const galleryItems = [...document.querySelectorAll('.gallery-item')];

if (lightbox && galleryItems.length) {
  const lightboxImage = lightbox.querySelector('img');
  let lastGalleryItem = null;

  const closeLightbox = () => {
    if (!lightbox.classList.contains('is-open')) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    lastGalleryItem?.focus();
  };

  galleryItems.forEach((item) => {
    item.addEventListener('click', () => {
      lastGalleryItem = item;
      lightboxImage.src = item.dataset.full;
      lightboxImage.alt = item.querySelector('img')?.alt ?? '';
      lightbox.setAttribute('aria-hidden', 'false');
      lightbox.classList.add('is-open');
    });
  });

  lightbox.addEventListener('click', closeLightbox);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeLightbox();
  });
}
