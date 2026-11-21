// This site's own code for the showcase: which components, with which content.
// The components themselves are in vendor/, copied unchanged from Experiments
// by build.mjs. Sizes and colours are adjusted in style.css, through the
// CSS variables each component documents.

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { ShojiBento, type ShojiItem } from "./vendor/shoji-bento/ShojiBento";
import { GemClip } from "./vendor/gem-clip/GemClip";
import { SnoozeButton } from "./vendor/snooze-button/SnoozeButton";
import source from "./vendor/SOURCE.json";

// The same three facts as the Shoji Bento preview on the Experiments home page.
const facts: ShojiItem[] = [
  {
    id: "experiments",
    label: "Experiments",
    value: String(source.experiments),
    detail: "One folder each: the component, its CSS, a demo and a few notes.",
    solid: true,
  },
  { id: "files", label: "Files", value: "2", detail: "One .tsx and one .css, side by side in your project." },
  { id: "packages", label: "Dependencies", value: "0", detail: "Each component needs React and nothing else." },
];

/** Pretends to do something when pressed: busy for a moment, then done, then back to sleep. */
function TryButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return (
    <SnoozeButton
      size="lg"
      status={status}
      loadingLabel="Working"
      successLabel="Done"
      onClick={() => {
        timers.current.forEach(clearTimeout);
        setStatus("loading");
        timers.current = [
          window.setTimeout(() => setStatus("success"), 1400),
          window.setTimeout(() => setStatus("idle"), 2800),
        ];
      }}
    >
      Press me
    </SnoozeButton>
  );
}

const DEMOS: Record<string, () => ReactNode> = {
  "shoji-bento": () => <ShojiBento size="sm" items={facts} role="group" aria-label="Shoji Bento: three facts about my lab" />,
  "gem-clip": () => (
    // Shown with break points after the slashes, so narrow screens never cut a word in two.
    // What lands on the clipboard is `value`, in one piece.
    <GemClip value="git clone https://github.com/yannworks/experiments.git" label="the command that downloads my lab">
      git clone https://github.com/<wbr />yannworks/<wbr />experiments.git
    </GemClip>
  ),
  "snooze-button": () => <TryButton />,
};

/** If a component throws, its stage is hidden and the link below it stays. */
class Guard extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function mount(section: HTMLElement) {
  section.querySelectorAll<HTMLElement>("[data-demo]").forEach((stage) => {
    const demo = DEMOS[stage.dataset.demo || ""];
    if (!demo) return;
    const fail = () => stage.closest(".showcase__item")?.classList.add("is-failed");
    const root = createRoot(stage);
    // Drawn right away, so the components are in the page when mount() returns
    // (js/showcase.js then marks the section "is-live").
    flushSync(() => root.render(<Guard onError={fail}>{demo()}</Guard>));
  });
}

(window as unknown as { showcase: object }).showcase = { mount, commit: source.commit };
