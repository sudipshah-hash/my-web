(function () {
  "use strict";

  // --- Configuration ---
  const CONFIG = {
    cursorSpeed: 0.15, // Smooth follow (lerp speed)
    idleDelay: 800,
    revealBreakpoints: {
      helloFadeEnd: 0.10,
      exitStart: 0.80,
      exitEnd: 0.95
    }
  };

  // --- State ---
  let state = {
    mouseX: 0,
    mouseY: 0,
    currentX: 0,
    currentY: 0,
    lastMove: Date.now(),
    isIdle: false,
    scrollY: window.scrollY,
    viewportHeight: window.innerHeight,
    isRevealed: false,
    disableSmoke: false
  };

  // --- Elements ---
  const cursorDot = document.getElementById("cursor-dot");
  const heroTitle = document.querySelector(".hero-title");
  const handLeft = document.getElementById("hand-left");
  const handRight = document.getElementById("hand-right");
  const profileContent = document.getElementById("profile-content");
  const revealName = document.getElementById("reveal-name");
  const revealBio = document.getElementById("reveal-bio");
  const revealSection = document.getElementById("work");
  const timelineLine = document.getElementById("timeline-line");
  const identityTerminal = document.getElementById("identity-terminal");

  // --- Helper Functions ---
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
  const mapRange = (val, inMin, inMax, outMin, outMax) => {
    const p = clamp((val - inMin) / (inMax - inMin), 0, 1);
    return outMin + p * (outMax - outMin);
  };

  // --- Custom Cursor Logic ---
  function initCursor() {
    const clickableElements = "a, button, input, textarea, .nav-item, .nav-brand";
    const containerSelectors = ".profile-frame, .cert-card, .gallery-box";

    document.addEventListener("mousemove", (e) => {
      state.mouseX = e.clientX;
      state.mouseY = e.clientY;
      state.lastMove = Date.now();
      
      if (state.isIdle) {
        state.isIdle = false;
        cursorDot.classList.remove("idle");
      }
    });

    // Hover logic for cursor effects
    document.addEventListener("mouseover", (e) => {
      const target = e.target;
      if (target.closest(clickableElements)) {
        cursorDot.classList.add("hover");
      }
    });

    document.addEventListener("mouseout", (e) => {
      const target = e.target;
      if (target.closest(clickableElements)) {
        cursorDot.classList.remove("hover");
      }
    });

    // Precise hover detection for containers (Full Area)
    document.querySelectorAll(containerSelectors).forEach(el => {
      el.addEventListener("mouseenter", () => {
        cursorDot.style.opacity = "0";
        state.disableSmoke = true;
      });
      el.addEventListener("mouseleave", () => {
        cursorDot.style.opacity = "1";
        state.disableSmoke = false;
      });
    });

    function createSmoke(x, y) {
      if (state.disableSmoke) return;
      
      const particle = document.createElement("div");
      particle.className = "smoke-particle";
      particle.style.left = x + "px";
      particle.style.top = y + "px";
      document.body.appendChild(particle);

      // Meteor style: Scaled-down fade out
      setTimeout(() => {
        particle.style.opacity = "0";
        particle.style.transform = "scale(0.5)";
      }, 50);

      setTimeout(() => {
        particle.remove();
      }, 200);
    }

    function animateCursor() {
      // Lerp for natural smooth movement (NO acceleration feel)
      state.currentX += (state.mouseX - state.currentX) * CONFIG.cursorSpeed;
      state.currentY += (state.mouseY - state.currentY) * CONFIG.cursorSpeed;

      cursorDot.style.transform = `translate(${state.currentX}px, ${state.currentY}px)`;

      // Smoke creation tied to movement
      if (Math.abs(state.mouseX - state.currentX) > 2 || Math.abs(state.mouseY - state.currentY) > 2) {
        createSmoke(state.currentX, state.currentY);
      }

      if (Date.now() - state.lastMove > CONFIG.idleDelay && !state.isIdle) {
        state.isIdle = true;
        cursorDot.classList.add("idle");
      }
      
      requestAnimationFrame(animateCursor);
    }
    animateCursor();
  }

  // --- Cinematic Reveal Sequence ---
  async function runRevealSequence() {
    if (state.isRevealed) return;
    state.isRevealed = true;

    const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
    const duration = 1200;

    await new Promise(r => setTimeout(r, 300));

    // Impact Moment (Triggered after hands move in via scroll)
    document.body.classList.add("screen-shake");
    setTimeout(() => document.body.classList.remove("screen-shake"), 400);

    // Profile Content Reveal
    profileContent.animate([
      { opacity: 0, transform: "scale(0.9)" },
      { opacity: 1, transform: "scale(1)" }
    ], { duration: 1000, easing: ease, fill: "forwards" });

    await new Promise(r => setTimeout(r, 400));

    revealName.animate([
      { opacity: 0, transform: "translateY(30px)" },
      { opacity: 1, transform: "translateY(0)" }
    ], { duration: 800, easing: ease, fill: "forwards" });

    await new Promise(r => setTimeout(r, 200));

    revealBio.animate([
      { opacity: 0, transform: "translateY(30px)" },
      { opacity: 1, transform: "translateY(0)" }
    ], { duration: 800, easing: ease, fill: "forwards" });
  }

  // --- Scroll Logic ---
  function updateScrollScene() {
    const heroProgress = clamp(window.scrollY / (state.viewportHeight * 0.5), 0, 1);
    if (heroTitle) heroTitle.style.opacity = 1 - heroProgress;

    // Hand Animation (Appear + Disappear)
    const trigger = revealSection.offsetTop;
    const scrollY = window.scrollY;

    if (scrollY > trigger - 300 && scrollY < trigger + 300) {
      // ENTER (come inward)
      handLeft.style.transform = "translate(calc(-100% - 2px), -50%)";
      handRight.style.transform = "translate(calc(100% + 2px), -50%)";
      handLeft.style.opacity = "1";
      handRight.style.opacity = "1";
    } else {
      // EXIT (go outward same path)
      handLeft.style.transform = "translate(calc(-160% - 2px), -50%)";
      handRight.style.transform = "translate(calc(160% + 2px), -50%)";
      handLeft.style.opacity = "0";
      handRight.style.opacity = "0";
    }

    const resumeSection = document.getElementById("resume");
    const resumeRect = resumeSection.getBoundingClientRect();
    const resumeProgress = mapRange(state.viewportHeight - resumeRect.top, 0, resumeRect.height, 0, 1);
    if (timelineLine) timelineLine.style.height = `${resumeProgress * 100}%`;
  }

  // --- Section Observers ---
  function initObservers() {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.intersectionRatio >= 0.6) {
          runRevealSequence();
        }
      });
    }, { threshold: 0.6 });

    if (revealSection) revealObserver.observe(revealSection);

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          // Form elements handled via CSS !important to avoid JS hiding conflicts
          const staggers = entry.target.querySelectorAll("[data-stagger], [data-skill], .timeline-item");
          staggers.forEach((el, index) => {
            setTimeout(() => {
              el.classList.add("active");
              if (el.dataset.skill) {
                const fill = el.querySelector(".skill-fill");
                fill.style.width = el.dataset.skill + "%";
              }
            }, index * 150);
          });

          if (entry.target.classList.contains("identity-section")) {
            startTerminalTyping();
          }
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll("section").forEach(sec => sectionObserver.observe(sec));
  }

  function startTerminalTyping() {
    const lines = identityTerminal.querySelectorAll(".terminal-line");
    lines.forEach((line, index) => {
      setTimeout(() => line.classList.add("active"), index * 800);
    });
  }

  function initLightbox() {
    const lb = document.getElementById("lightbox");
    const lbImg = lb.querySelector("img");
    const close = lb.querySelector(".lightbox-close");

    document.querySelectorAll(".cert-card, .gallery-box").forEach(item => {
      item.addEventListener("click", () => {
        lbImg.src = item.querySelector("img").src;
        lb.classList.add("active");
        document.body.style.overflow = "hidden";
      });
    });

    close.addEventListener("click", () => {
      lb.classList.remove("active");
      document.body.style.overflow = "";
    });

    lb.addEventListener("click", (e) => { if (e.target === lb) close.click(); });
  }

  function init() {
    window.addEventListener("load", () => {
      document.body.classList.remove("loading");
      initCursor();
      initObservers();
      initLightbox();
      window.addEventListener("scroll", updateScrollScene);
      updateScrollScene();
    });
  }

  init();

})();
