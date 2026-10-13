const revealElements = document.querySelectorAll('.reveal');
const trackedSections = [...document.querySelectorAll('.tracked-section')];
const scrollMapItems = [...document.querySelectorAll('.scroll-map-item')];
const pointChips = [...document.querySelectorAll('.point-chip')];
const heroVideos = [
  document.querySelector('#hero-video-a'),
  document.querySelector('#hero-video-b'),
].filter(Boolean);
const topicModal = document.querySelector('#topic-modal');
const topicModalFrame = document.querySelector('.topic-modal-frame');
const topicModalTitle = document.querySelector('#topic-modal-title');
const topicModalDescription = document.querySelector('#topic-modal-description');
const topicModalImage = document.querySelector('#topic-modal-image');
const scrollProgress = document.querySelector('.scroll-progress');
const exploreSection = document.querySelector('#explore');
const root = document.documentElement;

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

revealElements.forEach((element) => {
  revealObserver.observe(element);
});

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const HERO_VIDEO_PLAYLIST = [
  'assets/Website1.mp4',
  'assets/Website2.mp4',
  'assets/Website3.mp4',
  'assets/Website4.mp4',
];

// Replace these with your actual image paths for the popup right-side images.
const POPUP_IMAGES = {
  campus: 'assets/Dalton01.png',
  simulative: 'assets/Dalton04.png',
  alumni: 'assets/Dalton05.png',
};

const unlockContentMap = {
  campus: {
    title: '自由な校舎の歩き回り',
    description:
      'いつでも、どこでも、ネット環境さえ整っていれば後者の見学が可能に。様々な事情で対面の学校説明会に行けない時は、マインクラフトから見学をすることで実際と同じような雰囲気を味わえます。',
    image: POPUP_IMAGES.campus,
  },
  simulative: {
    title: 'シミュレーションに適した環境',
    description:
      '非常に正確な校舎の再現により、生徒・先生が感じる問題を再現し検証ができるような環境が実現。AIを用いた人道の工夫や安全性の向上のための仮説検証も期待ができます。',
    image: POPUP_IMAGES.simulative,
  },
  alumni: {
    title: "卒業生の記憶",
    description:
      '卒業生が学校で過ごした思い出も、ブロックで再現。学校での楽しい思い出がある場所、友達とよく交流していた場所、気に入っていたスポットなど、卒業生が大切にしている場所をマインクラフト上で再現することで、学校の魅力の担保を実現しました。',
    image: POPUP_IMAGES.alumni,
  },
};

const setUnlockContent = (key, triggerElement = null) => {
  const content = unlockContentMap[key];
  if (!content || !topicModal || !topicModalTitle || !topicModalDescription || !topicModalImage) return;

  topicModalTitle.textContent = content.title;
  topicModalDescription.textContent = content.description;
  topicModalImage.style.backgroundImage = `url("${content.image}")`;

  if (topicModalFrame && triggerElement instanceof HTMLElement) {
    const triggerRect = triggerElement.getBoundingClientRect();
    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    const triggerCenterY = triggerRect.top + triggerRect.height / 2;
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    const fromX = triggerCenterX - viewportCenterX;
    const fromY = triggerCenterY - viewportCenterY;
    const fromScale = clamp(triggerRect.width / window.innerWidth, 0.18, 0.42);
    topicModalFrame.style.setProperty('--modal-from-x', `${fromX.toFixed(1)}px`);
    topicModalFrame.style.setProperty('--modal-from-y', `${fromY.toFixed(1)}px`);
    topicModalFrame.style.setProperty('--modal-from-scale', `${fromScale.toFixed(3)}`);
  } else if (topicModalFrame) {
    topicModalFrame.style.setProperty('--modal-from-x', '0px');
    topicModalFrame.style.setProperty('--modal-from-y', '20px');
    topicModalFrame.style.setProperty('--modal-from-scale', '0.92');
  }

  topicModal.classList.remove('is-open');
  topicModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => {
    topicModal.classList.add('is-open');
  });

  pointChips.forEach((chip) => {
    chip.classList.toggle('is-active', chip.dataset.key === key);
  });
};

const closeTopicModal = () => {
  if (!topicModal) return;
  topicModal.classList.remove('is-open');
  topicModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  pointChips.forEach((chip) => chip.classList.remove('is-active'));
};

const updateVideoDarkness = () => {
  const scrollY = window.scrollY || window.pageYOffset;
  const fallbackDistance = Math.max((document.documentElement.scrollHeight - window.innerHeight) * 0.55, 1);
  const targetY = exploreSection
    ? Math.max(exploreSection.getBoundingClientRect().top + scrollY, 1)
    : fallbackDistance;
  const darkness = clamp(scrollY / targetY, 0, 1);
  root.style.setProperty('--scroll-darkness', darkness.toFixed(3));
};

const updatePageProgress = () => {
  const scrollY = window.scrollY || window.pageYOffset;
  const maxScrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = clamp(scrollY / maxScrollable, 0, 1);
  root.style.setProperty('--page-progress', progress.toFixed(3));
};

const updateScrollHighlights = () => {
  if (!trackedSections.length) return;

  const viewportHeight = window.innerHeight;
  const progresses = trackedSections.map((section) => {
    const rect = section.getBoundingClientRect();
    const start = viewportHeight * 0.82;
    const end = viewportHeight * 0.22;
    const distance = rect.height + (start - end);
    const progress = clamp((start - rect.top) / distance, 0, 1);
    section.style.setProperty('--title-progress', progress.toFixed(3));
    return progress;
  });

  const activationLine = viewportHeight * 0.45;
  let activeIndex = -1;
  trackedSections.forEach((section, index) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= activationLine) {
      activeIndex = index;
    }
  });

  scrollMapItems.forEach((item, index) => {
    const progress = progresses[index] ?? 0;
    item.style.setProperty('--item-progress', progress.toFixed(3));
    item.classList.toggle('is-active', index === activeIndex);
  });
};

const updateOnScroll = () => {
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

const scrollToProgress = (progress) => {
  const maxScrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const targetY = progress * maxScrollable;
  window.scrollTo({ top: targetY, behavior: 'auto' });
  root.style.setProperty('--page-progress', clamp(progress, 0, 1).toFixed(3));
};

if (heroVideos.length === 2) {
  let activeVideoIndex = 0;
  let activePlaylistIndex = 0;
  let queuedPlaylistIndex = 1 % HERO_VIDEO_PLAYLIST.length;
  let isTransitioningHero = false;

  const setVideoSource = (video, source) => {
    if (!video || !source || video.dataset.src === source) return;
    const sourceElement = video.querySelector('source');
    if (sourceElement) {
      sourceElement.src = source;
    } else {
      video.src = source;
    }
    video.dataset.src = source;
    video.load();
  };

  const safePlay = (video) => {
    if (!video) return;
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  };

  const queueNextHeroVideo = () => {
    const idleVideo = heroVideos[1 - activeVideoIndex];
    const nextSource = HERO_VIDEO_PLAYLIST[queuedPlaylistIndex];
    setVideoSource(idleVideo, nextSource);
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
      queuedPlaylistIndex = (activePlaylistIndex + 1) % HERO_VIDEO_PLAYLIST.length;
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

    video.addEventListener('ended', () => {
      if (video === heroVideos[activeVideoIndex]) {
        transitionHeroVideo();
      }
    });

    video.addEventListener('error', () => {
      if (video === heroVideos[activeVideoIndex]) {
        transitionHeroVideo();
      }
    });
  });

  setVideoSource(heroVideos[0], HERO_VIDEO_PLAYLIST[0]);
  setVideoSource(heroVideos[1], HERO_VIDEO_PLAYLIST[1]);
  queueNextHeroVideo();
  safePlay(heroVideos[0]);
}

updateScrollHighlights();
updateVideoDarkness();
updatePageProgress();
window.addEventListener('scroll', scheduleUiUpdate, { passive: true });
window.addEventListener('resize', updateOnScroll);

pointChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    setUnlockContent(chip.dataset.key, chip);
  });
});

scrollMapItems.forEach((item) => {
  item.addEventListener('click', () => {
    scrollMapItems.forEach((other) => other.classList.remove('is-active'));
    item.classList.add('is-active');
  });
});

topicModal?.addEventListener('click', (event) => {
  if (!(event.target instanceof HTMLElement)) return;
  if (event.target.dataset.modalClose === 'true') {
    closeTopicModal();
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeTopicModal();
  }
});

if (scrollProgress) {
  let isProgressDragging = false;
  let progressRect = null;

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
