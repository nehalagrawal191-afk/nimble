(() => {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const fill = document.querySelector(".progress-fill-global");
  const counter = document.querySelector(".slide-counter-global");
  let index = 0;

  function show(next) {
    index = Math.max(0, Math.min(slides.length - 1, next));
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === index);
    });
    const pct = ((index + 1) / slides.length) * 100;
    document.querySelectorAll("[data-progress]").forEach((el) => {
      el.style.width = `${pct}%`;
    });
    document.querySelectorAll("[data-slide-num]").forEach((el) => {
      el.textContent = `${String(index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    });
    history.replaceState(null, "", `#${index + 1}`);
  }

  function next() { show(index + 1); }
  function prev() { show(index - 1); }

  document.getElementById("nextBtn")?.addEventListener("click", next);
  document.getElementById("prevBtn")?.addEventListener("click", prev);

  window.addEventListener("keydown", (e) => {
    if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) {
      e.preventDefault();
      next();
    } else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) {
      e.preventDefault();
      prev();
    } else if (e.key === "Home") {
      e.preventDefault();
      show(0);
    } else if (e.key === "End") {
      e.preventDefault();
      show(slides.length - 1);
    } else if (e.key.toLowerCase() === "f") {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    }
  });

  let touchX = null;
  window.addEventListener("touchstart", (e) => {
    touchX = e.changedTouches[0].screenX;
  }, { passive: true });
  window.addEventListener("touchend", (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].screenX - touchX;
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
    touchX = null;
  }, { passive: true });

  const fromHash = Number(location.hash.replace("#", ""));
  show(Number.isFinite(fromHash) && fromHash > 0 ? fromHash - 1 : 0);
})();
