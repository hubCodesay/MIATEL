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
    const backIndex = mod(activeIndex - 1, cards.length);

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
      const backIndex = fromIndex;

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

  // Swipe support (touch + mouse drag)
  let pointerDown = false;
  let startX = 0;
  let startY = 0;

  const onPointerDown = (e) => {
    // Only left click for mouse
    if (e.pointerType === "mouse" && e.button !== 0) return;

    pointerDown = true;
    startX = e.clientX;
    startY = e.clientY;
    cardsWrap.setPointerCapture?.(e.pointerId);
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

  cardsWrap.addEventListener("pointerdown", onPointerDown);
  cardsWrap.addEventListener("pointerup", onPointerUp);
  cardsWrap.addEventListener("pointercancel", () => {
    pointerDown = false;
  });

  // Touch fallback (iOS Safari can be flaky with pointer events)
  let touchStartX = 0;
  let touchStartY = 0;

  cardsWrap.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    },
    { passive: true },
  );

  cardsWrap.addEventListener(
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
