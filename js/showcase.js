// Loads the showcase (three React components from Experiments) once the page
// has loaded and the section is on screen, so it never competes with the
// page's own files. The section sits right under the intro, so for most
// visitors that is a quarter of a second after the page has loaded.
//
// The components and React are bundled in showcase/showcase.js and
// showcase.css by tools/showcase/build.mjs. This file only fetches them and
// calls showcase.mount(). The names, lines and links are plain HTML and stay
// whatever happens; if loading fails, the empty stages are hidden.

const SHOWCASE = {
  SCRIPT: "showcase/showcase.js",
  STYLES: "showcase/showcase.css",
  // Start loading as soon as the section's top edge comes on screen. It is on
  // the first screen on phones and desktops alike (about 480 px down on a
  // 390 x 844 phone, 380 px at 1440 x 900).
  AHEAD: "0px",
  SETTLE_MS: 250,             // the section must stay on screen this long (see watch())
  TIMEOUT_MS: 15000,          // a load that never ends counts as failed
};

(function () {
  const section = document.querySelector(".showcase");
  if (!section) return;

  function fetchFile(tag, attrs) {
    return new Promise((resolve, reject) => {
      const el = document.createElement(tag);
      Object.assign(el, attrs);
      el.onload = resolve;
      el.onerror = reject;
      document.head.append(el);
    });
  }

  function load() {
    const timeout = new Promise((_, reject) => setTimeout(reject, SHOWCASE.TIMEOUT_MS));
    // Styles first in the race, so a component never shows unstyled.
    const files = Promise.all([
      fetchFile("link", { rel: "stylesheet", href: SHOWCASE.STYLES }),
      fetchFile("script", { src: SHOWCASE.SCRIPT, async: true }),
    ]);
    Promise.race([files, timeout])
      .then(() => {
        window.showcase.mount(section);
        section.classList.add("is-live");
      })
      .catch(() => section.classList.add("is-failed"));
  }

  // Loading starts only once the section has stayed in view a little, so a
  // visitor who lands lower on the page and scrolls past it does not pay for it.
  function watch() {
    if (!("IntersectionObserver" in window)) return load();
    let timer = 0;
    const seen = new IntersectionObserver((entries) => {
      clearTimeout(timer);
      if (!entries[entries.length - 1].isIntersecting) return;
      timer = setTimeout(() => {
        seen.disconnect();
        load();
      }, SHOWCASE.SETTLE_MS);
    }, { rootMargin: SHOWCASE.AHEAD });
    seen.observe(section);
  }

  // Never compete with the page's own files: wait until they have all arrived.
  if (document.readyState === "complete") watch();
  else addEventListener("load", watch, { once: true });
})();
