(() => {
  // --- Steps horizontal scroll indicator (Frame 11) ---
  const stepsGrid = document.querySelector(".steps-grid");
  const stepsScroll = document.querySelector(".steps-scroll");

  const updateStepsScroll = () => {
    if (!stepsGrid || !stepsScroll) return;

    const track = stepsScroll.clientWidth;
    if (!track) return;

    const scrollWidth = stepsGrid.scrollWidth;
    const clientWidth = stepsGrid.clientWidth;

    if (scrollWidth <= clientWidth + 1) {
      stepsScroll.style.setProperty("--steps-scroll-x", "0px");
      stepsScroll.style.setProperty("--steps-thumb", `${track}px`);
      return;
    }

    const thumb = Math.max(48, Math.round((clientWidth / scrollWidth) * track));
    const maxX = Math.max(0, track - thumb);
    const maxScroll = Math.max(1, scrollWidth - clientWidth);
    const x = Math.round((stepsGrid.scrollLeft / maxScroll) * maxX);

    stepsScroll.style.setProperty("--steps-thumb", `${thumb}px`);
    stepsScroll.style.setProperty("--steps-scroll-x", `${x}px`);
  };

  if (stepsGrid && stepsScroll) {
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        updateStepsScroll();
      });
    };

    stepsGrid.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Initial
    updateStepsScroll();

    // Make the indicator a working scrollbar (click/drag)
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

    const setStepsScrollFromClientX = (clientX) => {
      const trackRect = stepsScroll.getBoundingClientRect();
      const track = trackRect.width;
      if (!track) return;

      const scrollWidth = stepsGrid.scrollWidth;
      const clientWidth = stepsGrid.clientWidth;
      const maxScroll = Math.max(0, scrollWidth - clientWidth);
      if (!maxScroll) return;

      const x = clamp(clientX - trackRect.left, 0, track);
      const ratio = x / track;
      stepsGrid.scrollLeft = ratio * maxScroll;
    };

    let isDraggingSteps = false;

    stepsScroll.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      isDraggingSteps = true;
      stepsScroll.setPointerCapture?.(e.pointerId);
      setStepsScrollFromClientX(e.clientX);
    });

    stepsScroll.addEventListener("pointermove", (e) => {
      if (!isDraggingSteps) return;
      setStepsScrollFromClientX(e.clientX);
    });

    const stopStepsDrag = () => {
      isDraggingSteps = false;
    };

    stepsScroll.addEventListener("pointerup", stopStepsDrag);
    stepsScroll.addEventListener("pointercancel", stopStepsDrag);
  }

  const section = document.querySelector(".reviews-section");
  if (!section) return;

  const carousel = section.querySelector(".reviews-carousel");
  const cardsWrap = section.querySelector(".reviews-cards");
  const cards = Array.from(section.querySelectorAll(".review-card"));
  const prevBtn = section.querySelector(".reviews-nav--prev");
  const nextBtn = section.querySelector(".reviews-nav--next");
  const scroll = section.querySelector(".reviews-scroll");

  if (!carousel || !cardsWrap || cards.length === 0 || !prevBtn || !nextBtn) {
    return;
  }

  // Remove any static tilt class from markup; JS will manage state.
  for (const card of cards) {
    card.classList.remove("review-card--tilt");
  }

  let activeIndex = 0;
  let isAnimating = false;

  const mod = (n, m) => ((n % m) + m) % m;

  const updateProgress = (indexOverride) => {
    if (!scroll) return;
    const index =
      typeof indexOverride === "number" ? indexOverride : activeIndex;

    const total = Math.max(1, cards.length);
    const normalized = total <= 1 ? 1 : (index + 1) / total;
    const pct = Math.max(0, Math.min(1, normalized)) * 100;
    scroll.style.setProperty("--reviews-progress", `${pct}%`);
  };

  const clearAnimClasses = (card) => {
    card.classList.remove(
      "is-entering-next",
      "is-entering-prev",
      "is-exiting-to-back",
    );
  };

  const applyVisibility = (activeIdx, backIdx) => {
    for (let i = 0; i < cards.length; i += 1) {
      const card = cards[i];
      const isVisible = i === activeIdx || i === backIdx;
      card.setAttribute("aria-hidden", String(!isVisible));
      card.tabIndex = isVisible ? 0 : -1;
    }
  };

  const setStateInstant = (nextIndex) => {
    activeIndex = mod(nextIndex, cards.length);
    const backIndex = mod(activeIndex + 1, cards.length);

    for (let i = 0; i < cards.length; i += 1) {
      const card = cards[i];
      clearAnimClasses(card);
      card.classList.toggle("is-active", i === activeIndex);
      card.classList.toggle("is-back", i === backIndex);
    }

    applyVisibility(activeIndex, backIndex);
    updateProgress();
  };

  const transitionTo = (nextIndex, dir) => {
    if (isAnimating) return;

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion || cards.length < 2) {
      setStateInstant(nextIndex);
      return;
    }

    isAnimating = true;

    const fromIndex = activeIndex;
    const toIndex = mod(nextIndex, cards.length);
    const currentActive = cards[fromIndex];
    const entering = cards[toIndex];

    // Hide everything except the two cards participating.
    for (let i = 0; i < cards.length; i += 1) {
      const card = cards[i];
      clearAnimClasses(card);
      card.classList.remove("is-active", "is-back");
    }

    // Start states
    currentActive.classList.add("is-active", "is-exiting-to-back");
    entering.classList.add(
      "is-active",
      dir === "next" ? "is-entering-next" : "is-entering-prev",
    );

    applyVisibility(fromIndex, toIndex);
    updateProgress(toIndex);

    const finish = () => {
      if (!isAnimating) return;
      isAnimating = false;

      clearAnimClasses(currentActive);
      clearAnimClasses(entering);

      activeIndex = toIndex;
      const backIndex = mod(activeIndex + 1, cards.length);

      for (let i = 0; i < cards.length; i += 1) {
        const card = cards[i];
        card.classList.toggle("is-active", i === activeIndex);
        card.classList.toggle("is-back", i === backIndex);
      }

      applyVisibility(activeIndex, backIndex);
      updateProgress();
    };

    const onEnd = (e) => {
      if (e.target !== entering) return;
      entering.removeEventListener("animationend", onEnd);
      finish();
    };

    entering.addEventListener("animationend", onEnd);
    window.setTimeout(() => {
      entering.removeEventListener("animationend", onEnd);
      finish();
    }, 650);
  };

  const goPrev = () => transitionTo(activeIndex - 1, "prev");
  const goNext = () => transitionTo(activeIndex + 1, "next");

  prevBtn.addEventListener("click", goPrev);
  nextBtn.addEventListener("click", goNext);

  carousel.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    }
  });

  // Trackpad / mouse wheel support (scroll to navigate)
  let wheelAccum = 0;
  let wheelCooldown = 0;

  const onWheel = (e) => {
    // If user is trying to scroll vertically the page, don't hijack.
    const absX = Math.abs(e.deltaX);
    const absY = Math.abs(e.deltaY);
    const horizontalIntent = absX > absY || e.shiftKey;
    if (!horizontalIntent) return;

    // Prevent horizontal page scroll and treat as slider intent.
    e.preventDefault();

    if (wheelCooldown) return;

    const delta = absX > absY ? e.deltaX : e.deltaY;
    wheelAccum += delta;

    const threshold = 44;
    if (wheelAccum > threshold) {
      wheelAccum = 0;
      goNext();
      wheelCooldown = window.setTimeout(() => {
        wheelCooldown = 0;
      }, 240);
    }
    if (wheelAccum < -threshold) {
      wheelAccum = 0;
      goPrev();
      wheelCooldown = window.setTimeout(() => {
        wheelCooldown = 0;
      }, 240);
    }
  };

  // Must be non-passive to call preventDefault
  carousel.addEventListener("wheel", onWheel, { passive: false });

  // Swipe support (touch + mouse drag) on the whole carousel
  let pointerDown = false;
  let startX = 0;
  let startY = 0;

  const isFromNav = (target) => {
    const el = target instanceof Element ? target : null;
    return Boolean(el?.closest?.(".reviews-nav"));
  };

  const onPointerDown = (e) => {
    // Only left click for mouse
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (isFromNav(e.target)) return;

    pointerDown = true;
    startX = e.clientX;
    startY = e.clientY;
    carousel.setPointerCapture?.(e.pointerId);
  };

  const onPointerUp = (e) => {
    if (!pointerDown) return;
    pointerDown = false;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // Ignore mostly-vertical gestures
    if (Math.abs(dy) > Math.abs(dx)) return;

    const threshold = 44;
    if (dx > threshold) goPrev();
    if (dx < -threshold) goNext();
  };

  carousel.addEventListener("pointerdown", onPointerDown);
  carousel.addEventListener("pointerup", onPointerUp);
  carousel.addEventListener("pointercancel", () => {
    pointerDown = false;
  });

  // Touch fallback (iOS Safari can be flaky with pointer events)
  let touchStartX = 0;
  let touchStartY = 0;

  carousel.addEventListener(
    "touchstart",
    (e) => {
      if (isFromNav(e.target)) return;
      const t = e.touches?.[0];
      if (!t) return;
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    },
    { passive: true },
  );

  // Make the progress bar a working scrollbar (click/drag)
  if (scroll) {
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

    const indexFromClientX = (clientX) => {
      const rect = scroll.getBoundingClientRect();
      const w = rect.width;
      if (!w) return activeIndex;

      const x = clamp(clientX - rect.left, 0, w);
      const ratio = x / w;
      const maxIndex = Math.max(0, cards.length - 1);
      return Math.round(ratio * maxIndex);
    };

    let isDragging = false;
    let didDrag = false;
    let dragStartX = 0;

    scroll.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      isDragging = true;
      didDrag = false;
      dragStartX = e.clientX;
      scroll.setPointerCapture?.(e.pointerId);
      setStateInstant(indexFromClientX(e.clientX));
    });

    scroll.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      if (Math.abs(e.clientX - dragStartX) > 6) didDrag = true;
      setStateInstant(indexFromClientX(e.clientX));
    });

    const stop = () => {
      isDragging = false;
    };
    scroll.addEventListener("pointerup", stop);
    scroll.addEventListener("pointercancel", stop);

    scroll.addEventListener("click", (e) => {
      // Click (without drag): animate to nearest index
      if (didDrag) {
        didDrag = false;
        return;
      }
      const next = indexFromClientX(e.clientX);
      if (next === activeIndex) return;
      transitionTo(next, next > activeIndex ? "next" : "prev");
    });
  }

  carousel.addEventListener(
    "touchend",
    (e) => {
      const t = e.changedTouches?.[0];
      if (!t) return;

      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;

      if (Math.abs(dy) > Math.abs(dx)) return;

      const threshold = 44;
      if (dx > threshold) goPrev();
      if (dx < -threshold) goNext();
    },
    { passive: true },
  );

  // Initialize
  setStateInstant(0);

  window.addEventListener("resize", () => {
    updateProgress();
  });
})();
