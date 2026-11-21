// Loads the showcase (three React components from Experiments) only when the
// visitor gets near it, so the page opens exactly as fast as without it.
//
// The components and React are bundled in showcase/showcase.js and
// showcase.css by tools/showcase/build.mjs. This file only fetches them and
// calls showcase.mount(). The names, lines and links are plain HTML and stay
// whatever happens; if loading fails, the empty stages are hidden.

const SHOWCASE = {
  SCRIPT: "showcase/showcase.js",
  STYLES: "showcase/showcase.css",
  // Start loading as soon as the section's top edge comes on screen. It sits just
  // under the first screen on phones and desktops alike (881 px down on a
  // 390 x 844 phone), so any margin here would load it for visitors who never scroll.
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

  // Just after the page loads, the GitHub graph is not drawn yet (it waits for
  // its data), so the page is shorter and this section can be on screen for a
  // moment. Loading starts only once the section has stayed in view a little.
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
