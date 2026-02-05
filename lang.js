(() => {
  const initLangDropdown = () => {
    const btn = document.querySelector(".lang");
    if (!btn) return;

    // Safety: avoid unintended form submission if markup changes later.
    btn.setAttribute("type", "button");

    const textEl = btn.querySelector(".lang-text");
    const chev = btn.querySelector(".chev");

    const STORAGE_KEY = "miatel_lang";
    const options = [
      { value: "ru", label: "RU" },
      { value: "uk", label: "UK" },
      { value: "en", label: "EN" },
    ];

    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const setHtmlLang = (value) => {
      // HTML is currently lang="uk" in markup; keep it in sync.
      const map = { ru: "ru", uk: "uk", en: "en" };
      const next = map[value];
      if (next) document.documentElement.lang = next;
    };

    const normalizeValue = (value) =>
      options.some((o) => o.value === value) ? value : "ru";

    const getStored = () => {
      try {
        return normalizeValue(localStorage.getItem(STORAGE_KEY) || "");
      } catch {
        return "ru";
      }
    };

    const setStored = (value) => {
      try {
        localStorage.setItem(STORAGE_KEY, value);
      } catch {
        // no-op
      }
    };

    const applyValue = (value) => {
      const v = normalizeValue(value);
      if (textEl) textEl.textContent = options.find((o) => o.value === v).label;
      setHtmlLang(v);
      setStored(v);
    };

    const menu = document.createElement("div");
    const menuId = "lang-menu";
    menu.id = menuId;
    menu.setAttribute("role", "listbox");
    menu.setAttribute("aria-label", "Language");
    menu.tabIndex = -1;

    // Inline styles (so we don't touch styles.css)
    Object.assign(menu.style, {
      position: "fixed",
      zIndex: "9999",
      minWidth: "120px",
      padding: "6px",
      borderRadius: "12px",
      border: "1px solid rgba(242,242,242,0.12)",
      background: "rgba(47,47,47,0.96)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      display: "none",
    });

    const optionButtons = options.map((opt) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "lang-option";
      b.textContent = opt.label;
      b.dataset.langValue = opt.value;
      b.setAttribute("role", "option");
      b.setAttribute("aria-selected", "false");

      Object.assign(b.style, {
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        padding: "10px 12px",
        borderRadius: "10px",
        border: "0",
        background: "transparent",
        color: "#F2F2F2",
        font: "inherit",
        cursor: "pointer",
      });

      b.addEventListener("mouseenter", () => {
        b.style.background = "rgba(242,242,242,0.08)";
      });
      b.addEventListener("mouseleave", () => {
        b.style.background = "transparent";
      });

      b.addEventListener("click", () => {
        applyValue(opt.value);
        close();
      });

      return b;
    });

    optionButtons.forEach((b) => menu.appendChild(b));
    document.body.appendChild(menu);

    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-controls", menuId);
    btn.setAttribute("aria-expanded", "false");

    const setChevron = (open) => {
      if (!chev) return;
      chev.style.transition = prefersReducedMotion
        ? ""
        : "transform 180ms ease";
      chev.style.transform = open ? "rotate(180deg)" : "rotate(0deg)";
    };

    const positionMenu = () => {
      const rect = btn.getBoundingClientRect();
      const padding = 8;

      // Default: open under button, aligned right
      const top = rect.bottom + padding;
      let left = rect.right - menu.offsetWidth;

      // Clamp inside viewport
      left = Math.max(
        8,
        Math.min(left, window.innerWidth - menu.offsetWidth - 8),
      );

      menu.style.top = `${Math.round(top)}px`;
      menu.style.left = `${Math.round(left)}px`;
    };

    const setSelectedUI = (value) => {
      const v = normalizeValue(value);
      for (const b of optionButtons) {
        const selected = b.dataset.langValue === v;
        b.setAttribute("aria-selected", String(selected));
        b.style.background = selected
          ? "rgba(242,242,242,0.10)"
          : "transparent";
      }
    };

    let isOpen = false;

    const open = () => {
      if (isOpen) return;
      isOpen = true;
      btn.setAttribute("aria-expanded", "true");
      menu.style.display = "block";
      setChevron(true);
      positionMenu();

      const current = getStored();
      setSelectedUI(current);

      const active = optionButtons.find((b) => b.dataset.langValue === current);
      (active || optionButtons[0])?.focus?.();
    };

    const close = () => {
      if (!isOpen) return;
      isOpen = false;
      btn.setAttribute("aria-expanded", "false");
      menu.style.display = "none";
      setChevron(false);
      btn.focus?.();
    };

    const toggle = () => {
      if (isOpen) close();
      else open();
    };

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      toggle();
    });

    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        open();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    });

    document.addEventListener("click", (e) => {
      if (!isOpen) return;
      const t = e.target;
      if (t instanceof Node && (btn.contains(t) || menu.contains(t))) return;
      close();
    });

    window.addEventListener(
      "resize",
      () => {
        if (isOpen) positionMenu();
      },
      { passive: true },
    );

    window.addEventListener(
      "scroll",
      () => {
        if (isOpen) positionMenu();
      },
      { passive: true },
    );

    menu.addEventListener("keydown", (e) => {
      if (!isOpen) return;
      const currentIndex = optionButtons.findIndex(
        (b) => b === document.activeElement,
      );

      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next =
          optionButtons[Math.min(optionButtons.length - 1, currentIndex + 1)];
        next?.focus?.();
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = optionButtons[Math.max(0, currentIndex - 1)];
        prev?.focus?.();
      }

      if (e.key === "Home") {
        e.preventDefault();
        optionButtons[0]?.focus?.();
      }

      if (e.key === "End") {
        e.preventDefault();
        optionButtons[optionButtons.length - 1]?.focus?.();
      }
    });

    // Init
    applyValue(getStored());
    setChevron(false);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLangDropdown);
  } else {
    initLangDropdown();
  }
})();
