(() => {
  const initFaq = () => {
    const faqRoot = document.querySelector(".faq-section");
    if (!faqRoot) return;

    const triggers = Array.from(faqRoot.querySelectorAll(".faq-trigger"));
    if (!triggers.length) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const getPanel = (trigger) => {
      const panelId = trigger.getAttribute("aria-controls");
      if (!panelId) return null;
      return document.getElementById(panelId);
    };

    const animateOpen = (panel) => {
      panel.hidden = false;
      panel.style.willChange = "height, opacity, transform";
      panel.style.height = "0px";
      panel.style.opacity = "0";
      panel.style.transform = "translateY(-4px)";

      // Force layout
      panel.getBoundingClientRect();

      const targetHeight = panel.scrollHeight;
      panel.style.height = `${targetHeight}px`;
      panel.style.opacity = "1";
      panel.style.transform = "translateY(0)";

      const onEnd = (event) => {
        if (event.propertyName !== "height") return;
        panel.style.height = "auto";
        panel.style.willChange = "";
        panel.removeEventListener("transitionend", onEnd);
      };

      panel.addEventListener("transitionend", onEnd);
    };

    const animateClose = (panel) => {
      panel.style.willChange = "height, opacity, transform";

      // From current height (auto) -> px, then to 0
      const startHeight = panel.scrollHeight;
      panel.style.height = `${startHeight}px`;
      panel.style.opacity = "1";
      panel.style.transform = "translateY(0)";

      // Force layout
      panel.getBoundingClientRect();

      panel.style.height = "0px";
      panel.style.opacity = "0";
      panel.style.transform = "translateY(-4px)";

      const onEnd = (event) => {
        if (event.propertyName !== "height") return;
        panel.hidden = true;
        panel.style.height = "";
        panel.style.opacity = "";
        panel.style.transform = "";
        panel.style.willChange = "";
        panel.removeEventListener("transitionend", onEnd);
      };

      panel.addEventListener("transitionend", onEnd);
    };

    const setExpanded = (
      trigger,
      expanded,
      { animate } = { animate: true },
    ) => {
      trigger.setAttribute("aria-expanded", String(expanded));
      const panel = getPanel(trigger);
      if (!panel) return;

      if (!animate || prefersReducedMotion) {
        panel.hidden = !expanded;
        panel.style.height = "";
        panel.style.opacity = "";
        panel.style.transform = "";
        panel.style.willChange = "";
        return;
      }

      if (expanded) {
        animateOpen(panel);
      } else {
        if (panel.hidden) return;
        animateClose(panel);
      }
    };

    // Normalize initial state
    triggers.forEach((trigger) => {
      const expanded = trigger.getAttribute("aria-expanded") === "true";
      setExpanded(trigger, expanded, { animate: false });
    });

    const closeOthers = (activeTrigger) => {
      triggers.forEach((trigger) => {
        if (trigger !== activeTrigger) setExpanded(trigger, false);
      });
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const expanded = trigger.getAttribute("aria-expanded") === "true";
        if (!expanded) closeOthers(trigger);
        setExpanded(trigger, !expanded);
      });

      trigger.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          trigger.click();
        }
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFaq);
  } else {
    initFaq();
  }
})();
