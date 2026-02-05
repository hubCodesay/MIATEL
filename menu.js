(() => {
  const initMenu = () => {
    const toggleBtn = document.querySelector(".icon-btn");
    if (!toggleBtn) return;

    toggleBtn.setAttribute("type", "button");
    toggleBtn.setAttribute("aria-haspopup", "dialog");

    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const links = [
      { href: "#hero", label: "Главная" },
      { href: "#about", label: "О нас" },
      { href: "#advantages", label: "Преимущества" },
      { href: "#steps", label: "Как подключить" },
      { href: "#reviews", label: "Отзывы" },
      { href: "#faq", label: "FAQ" },
      { href: "#contact", label: "Контакты" },
    ];

    const prevOverflowHtml = { value: "" };
    const prevOverflowBody = { value: "" };

    const lockScroll = () => {
      prevOverflowHtml.value = document.documentElement.style.overflow;
      prevOverflowBody.value = document.body.style.overflow;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    };

    const unlockScroll = () => {
      document.documentElement.style.overflow = prevOverflowHtml.value;
      document.body.style.overflow = prevOverflowBody.value;
    };

    const overlay = document.createElement("div");
    overlay.id = "site-menu-overlay";

    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      zIndex: "10000",
      display: "none",
      background: "rgba(0,0,0,0.45)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
    });

    const panel = document.createElement("aside");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "Menu");
    panel.tabIndex = -1;

    Object.assign(panel.style, {
      position: "absolute",
      top: "0",
      right: "0",
      height: "100%",
      width: "min(92vw, 380px)",
      padding: "20px 18px",
      background: "rgba(47,47,47,0.98)",
      borderLeft: "1px solid rgba(242,242,242,0.10)",
      boxShadow: "-20px 0 60px rgba(0,0,0,0.35)",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      transform: "translateX(20px)",
      opacity: "0",
    });

    const header = document.createElement("div");
    Object.assign(header.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
    });

    const title = document.createElement("div");
    title.textContent = "Меню";
    Object.assign(title.style, {
      color: "#F2F2F2",
      fontWeight: "700",
      fontSize: "18px",
      letterSpacing: "-0.5px",
    });

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close menu");
    closeBtn.textContent = "✕";
    Object.assign(closeBtn.style, {
      width: "40px",
      height: "40px",
      borderRadius: "14px",
      border: "1px solid rgba(242,242,242,0.12)",
      background: "transparent",
      color: "#F2F2F2",
      cursor: "pointer",
      fontSize: "18px",
      lineHeight: "1",
    });

    closeBtn.addEventListener("mouseenter", () => {
      closeBtn.style.background = "rgba(242,242,242,0.08)";
    });
    closeBtn.addEventListener("mouseleave", () => {
      closeBtn.style.background = "transparent";
    });

    header.appendChild(title);
    header.appendChild(closeBtn);

    const nav = document.createElement("nav");
    nav.setAttribute("aria-label", "Site navigation");
    Object.assign(nav.style, {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    });

    const makeLink = ({ href, label }) => {
      const a = document.createElement("a");
      a.href = href;
      a.textContent = label;

      Object.assign(a.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 12px",
        borderRadius: "14px",
        border: "1px solid rgba(242,242,242,0.10)",
        color: "#F2F2F2",
        textDecoration: "none",
        fontWeight: "700",
        letterSpacing: "-0.3px",
      });

      a.addEventListener("mouseenter", () => {
        a.style.background = "rgba(242,242,242,0.08)";
      });
      a.addEventListener("mouseleave", () => {
        a.style.background = "transparent";
      });

      a.addEventListener("click", () => {
        // Let scroll.js handle smooth anchor; we just close menu.
        close();
      });

      return a;
    };

    links.forEach((l) => nav.appendChild(makeLink(l)));

    const actions = document.createElement("div");
    Object.assign(actions.style, {
      marginTop: "auto",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    });

    const contactBtn = document.createElement("a");
    contactBtn.href = "#contact";
    contactBtn.textContent = "Связаться";
    Object.assign(contactBtn.style, {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      height: "48px",
      borderRadius: "16px",
      background: "#2053ac",
      color: "#F2F2F2",
      textDecoration: "none",
      fontWeight: "700",
    });
    contactBtn.addEventListener("click", () => close());

    actions.appendChild(contactBtn);

    panel.appendChild(header);
    panel.appendChild(nav);
    panel.appendChild(actions);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    let openState = false;
    let lastFocus = null;

    const animateOpen = () => {
      if (prefersReducedMotion) {
        panel.style.transform = "translateX(0)";
        panel.style.opacity = "1";
        return;
      }
      panel.animate(
        [
          { transform: "translateX(20px)", opacity: 0 },
          { transform: "translateX(0)", opacity: 1 },
        ],
        { duration: 220, easing: "ease-out", fill: "forwards" },
      );
    };

    const animateClose = () => {
      if (prefersReducedMotion) {
        panel.style.transform = "translateX(20px)";
        panel.style.opacity = "0";
        return;
      }
      panel.animate(
        [
          { transform: "translateX(0)", opacity: 1 },
          { transform: "translateX(20px)", opacity: 0 },
        ],
        { duration: 160, easing: "ease-in", fill: "forwards" },
      );
    };

    const open = () => {
      if (openState) return;
      openState = true;
      lastFocus = document.activeElement;
      toggleBtn.setAttribute("aria-expanded", "true");
      overlay.style.display = "block";
      lockScroll();
      animateOpen();
      panel.focus();
    };

    const close = () => {
      if (!openState) return;
      openState = false;
      toggleBtn.setAttribute("aria-expanded", "false");
      animateClose();
      unlockScroll();
      window.setTimeout(() => {
        if (!openState) overlay.style.display = "none";
      }, prefersReducedMotion ? 0 : 170);
      if (lastFocus && typeof lastFocus.focus === "function") {
        lastFocus.focus();
      } else {
        toggleBtn.focus();
      }
    };

    const toggle = () => {
      if (openState) close();
      else open();
    };

    toggleBtn.setAttribute("aria-expanded", "false");

    toggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggle();
    });

    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      close();
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    document.addEventListener("keydown", (e) => {
      if (!openState) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }

      // Basic focus trap
      if (e.key === "Tab") {
        const focusables = panel.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        const list = Array.from(focusables).filter(
          (el) => el instanceof HTMLElement && el.offsetParent !== null,
        );
        if (!list.length) return;

        const first = list[0];
        const last = list[list.length - 1];
        const active = document.activeElement;

        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMenu);
  } else {
    initMenu();
  }
})();
