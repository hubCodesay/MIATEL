(() => {
  const initSmoothScroll = () => {
    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

    const isScrollable = (el) => {
      if (!(el instanceof Element)) return false;
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      const overflowX = style.overflowX;
      const canScrollY =
        (overflowY === "auto" || overflowY === "scroll") &&
        el.scrollHeight > el.clientHeight + 1;
      const canScrollX =
        (overflowX === "auto" || overflowX === "scroll") &&
        el.scrollWidth > el.clientWidth + 1;
      return canScrollY || canScrollX;
    };

    const hasScrollableAncestor = (startEl) => {
      let el = startEl instanceof Element ? startEl : null;
      while (el && el !== document.documentElement) {
        if (isScrollable(el)) return true;
        el = el.parentElement;
      }
      return false;
    };

    const playTapAnim = (el) => {
      if (!el || prefersReducedMotion) return;
      try {
        el.animate(
          [
            { transform: "translateY(0) scale(1)" },
            { transform: "translateY(0) scale(0.98)" },
            { transform: "translateY(0) scale(1)" },
          ],
          { duration: 180, easing: "ease-out" },
        );
      } catch {
        // no-op
      }
    };

    const playHoverAnim = (el) => {
      if (!el || prefersReducedMotion) return;
      try {
        el.animate(
          [
            { transform: "translateY(0)" },
            { transform: "translateY(-2px)" },
            { transform: "translateY(0)" },
          ],
          { duration: 260, easing: "ease-out" },
        );
      } catch {
        // no-op
      }
    };

    const enhanceHoverForButtons = () => {
      const els = Array.from(
        document.querySelectorAll(
          [
            "button",
            ".footer-contact-btn",
            ".footer-top-btn",
            ".footer-social-btn",
          ].join(","),
        ),
      );

      for (const el of els) {
        if (!(el instanceof HTMLElement)) continue;
        if (el.dataset.hoverEnhanced === "1") continue;
        el.dataset.hoverEnhanced = "1";

        const prevFilter = el.style.filter;
        const prevTransition = el.style.transition;

        el.style.transition =
          prevTransition && prevTransition.trim()
            ? `${prevTransition}, filter 160ms ease, opacity 160ms ease`
            : "filter 160ms ease, opacity 160ms ease";

        el.addEventListener("mouseenter", () => {
          if (prefersReducedMotion) return;
          el.style.filter = prevFilter ? `${prevFilter} brightness(1.08)` : "brightness(1.08)";
          playHoverAnim(el);
        });

        el.addEventListener("mouseleave", () => {
          el.style.filter = prevFilter;
        });

        el.addEventListener("pointerdown", () => playTapAnim(el));
      }
    };

    const setupHeroScroll = () => {
      const heroScrollBtn = document.querySelector(".hero-scroll");
      const heroTarget =
        document.querySelector(".about-section") ||
        document.querySelector("main section:nth-of-type(2)");

      if (heroScrollBtn && heroTarget) {
        heroScrollBtn.addEventListener("click", (event) => {
          event.preventDefault();
          playTapAnim(heroScrollBtn);
          heroTarget.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    };

    const setupAnchors = () => {
      document.addEventListener("click", (event) => {
        const target = event.target;
        const anchor =
          target instanceof Element ? target.closest('a[href^="#"]') : null;
        if (!anchor) return;

        const href = anchor.getAttribute("href");
        if (!href || href === "#") return;

        const id = href.slice(1);
        if (!id) return;

        const el = document.getElementById(id);
        if (!el) return;

        event.preventDefault();
        playTapAnim(anchor);
        el.scrollIntoView({ behavior: "smooth", block: "start" });

        try {
          history.pushState(null, "", href);
        } catch {
          // no-op
        }
      });
    };

    const setupTopButton = () => {
      const topBtn = document.querySelector(".footer-top-btn");
      const topTarget = document.getElementById("top");
      if (!topBtn || !topTarget) return;

      topBtn.addEventListener("click", (event) => {
        event.preventDefault();
        playTapAnim(topBtn);
        topTarget.scrollIntoView({ behavior: "smooth", block: "start" });
        try {
          history.pushState(null, "", "#top");
        } catch {
          // no-op
        }
      });
    };

    const setupSmoothWheel = () => {
      if (prefersReducedMotion) return;

      const isDesktop = window.matchMedia?.("(pointer: fine)").matches;
      if (!isDesktop) return;

      let targetY = window.scrollY;
      let currentY = window.scrollY;
      let raf = 0;

      const maxScrollY = () =>
        Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

      const tick = () => {
        raf = 0;
        const diff = targetY - currentY;
        if (Math.abs(diff) < 0.5) {
          currentY = targetY;
          window.scrollTo(0, currentY);
          return;
        }

        currentY += diff * 0.14;
        window.scrollTo(0, currentY);
        raf = window.requestAnimationFrame(tick);
      };

      window.addEventListener(
        "wheel",
        (e) => {
          if (!(e.target instanceof Element)) return;
          if (e.ctrlKey) return;

          // Don’t hijack wheels intended for horizontal gestures or nested scrollers.
          const absX = Math.abs(e.deltaX);
          const absY = Math.abs(e.deltaY);
          if (absX > absY) return;
          if (e.target.closest(".steps-grid, .reviews-carousel")) return;
          if (hasScrollableAncestor(e.target)) return;

          // Only apply smoothing for “wheel-like” deltas (avoid breaking trackpad feel).
          const wheelLike = e.deltaMode === 1 || absY >= 50;
          if (!wheelLike) return;

          e.preventDefault();

          const delta = clamp(e.deltaY, -200, 200);
          targetY = clamp(targetY + delta, 0, maxScrollY());

          if (!raf) raf = window.requestAnimationFrame(tick);
        },
        { passive: false },
      );

      window.addEventListener(
        "resize",
        () => {
          targetY = clamp(targetY, 0, maxScrollY());
          currentY = clamp(currentY, 0, maxScrollY());
        },
        { passive: true },
      );
    };

    const setupScrollReveal = () => {
      if (prefersReducedMotion) return;

      const sectionSelector =
        "section#hero, section#about, section#advantages, section#steps, section#contact, section#reviews, section#offer, section#audience, section#faq, section#cta";

      const revealSelector = [
        // Titles / copy / action groups
        ".hero-content > *",
        ".about-content > *",
        ".advantages-title > *",
        ".steps-title > *",
        ".contact-panel__left > *",
        ".reviews-title > *",
        ".audience-title > *",
        ".faq-title > *",
        ".bottom-hero-content > *",
        ".bottom-hero2-content > *",

        // Cards / lists
        ".adv-card",
        ".step-card",
        ".review-card",
        ".faq-item",
        ".contact-panel__form > *",
      ].join(",");

      const sections = Array.from(document.querySelectorAll(sectionSelector));
      const allTargets = new Set();

      for (const section of sections) {
        const targets = Array.from(section.querySelectorAll(revealSelector));
        for (const t of targets) {
          if (!(t instanceof HTMLElement)) continue;

          // Skip elements that are inside hidden FAQ panels.
          if (t.closest(".faq-panel")?.hasAttribute?.("hidden")) continue;

          // Avoid animating SVG/IMG directly; parent blocks already animate.
          const tag = t.tagName.toLowerCase();
          if (tag === "svg" || tag === "img" || tag === "source" || tag === "picture") continue;

          allTargets.add(t);
        }
      }

      const isBelowFold = (el) => {
        const r = el.getBoundingClientRect();
        return r.top > window.innerHeight * 1.05;
      };

      for (const el of allTargets) {
        if (el.dataset.revealPrepared === "1") continue;
        el.dataset.revealPrepared = "1";

        // Hide only if it starts below the fold to prevent visible flicker.
        if (isBelowFold(el)) {
          el.style.opacity = "0";
          el.style.transform = "translateY(10px) scale(0.99)";
        }
      }

      const sectionOrder = new Map();
      const nextIndexForSection = (section) => {
        const current = sectionOrder.get(section) ?? 0;
        sectionOrder.set(section, current + 1);
        return current;
      };

      const reveal = (el) => {
        if (!(el instanceof HTMLElement)) return;
        if (el.dataset.revealed === "1") return;
        el.dataset.revealed = "1";

        const section = el.closest("section");
        const idx = section ? nextIndexForSection(section) : 0;
        const delay = Math.min(650, idx * 80);

        el.style.willChange = "opacity, transform";

        try {
          el.animate(
            [
              { opacity: 0, transform: "translateY(10px) scale(0.99)" },
              { opacity: 1, transform: "translateY(0) scale(1)" },
            ],
            {
              duration: 720,
              easing: "cubic-bezier(0.16, 1, 0.3, 1)",
              delay,
              fill: "forwards",
            },
          );
        } catch {
          el.style.opacity = "1";
          el.style.transform = "translateY(0) scale(1)";
        }

        window.setTimeout(() => {
          el.style.willChange = "";
        }, delay + 700);
      };

      // Use IO when available
      const io =
        "IntersectionObserver" in window
          ? new IntersectionObserver(
              (entries) => {
                for (const entry of entries) {
                  if (!entry.isIntersecting) continue;
                  reveal(entry.target);
                  io.unobserve(entry.target);
                }
              },
              { root: null, threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
            )
          : null;

      for (const el of allTargets) {
        if (io) {
          io.observe(el);
        } else {
          // Fallback: just show everything.
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }
      }

      // If FAQ opens items later, reveal newly visible answers.
      document.addEventListener("click", (e) => {
        const t = e.target instanceof Element ? e.target : null;
        const trigger = t?.closest?.(".faq-trigger");
        if (!trigger) return;
        window.setTimeout(() => {
          const panelId = trigger.getAttribute("aria-controls");
          const panel = panelId ? document.getElementById(panelId) : null;
          if (!panel) return;
          const items = Array.from(panel.querySelectorAll("*"));
          for (const item of items) {
            if (item instanceof HTMLElement) reveal(item);
          }
        }, 0);
      });
    };

    enhanceHoverForButtons();
    setupHeroScroll();
    setupAnchors();
    setupTopButton();
    setupSmoothWheel();
    setupScrollReveal();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSmoothScroll);
  } else {
    initSmoothScroll();
  }
})();
