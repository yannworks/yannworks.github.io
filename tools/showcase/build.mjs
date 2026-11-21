// Builds the showcase: three real components from Experiments, bundled with
// React into two files the page loads when the visitor gets near the section.
//
//   cd tools/showcase
//   npm ci                       (once: React and esbuild, pinned in package-lock.json)
//   node build.mjs               (the commit already in vendor/SOURCE.json)
//   node build.mjs latest        (the newest commit on Experiments' main branch)
//   node build.mjs <commit>      (a given commit)
//   node build.mjs --from ../../../experiments <commit>
//                                (a commit of a local clone, before it is pushed;
//                                 push it before publishing the site)
//
// 1. Downloads each component's .tsx and .css from GitHub at that exact commit
//    into vendor/, unchanged, and notes the commit in vendor/SOURCE.json.
// 2. Bundles entry.tsx (this site's own code: which components, with which
//    content) into ../../showcase/showcase.js and showcase.css.
// Commit the vendor/ folder and the two built files together.

import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const HERE = dirname(fileURLToPath(import.meta.url));
const VENDOR = join(HERE, "vendor");
const OUT = join(HERE, "..", "..", "showcase");
const REPO = "yannworks/experiments";

// The components, and the files to take from each one's folder.
const COMPONENTS = {
  "shoji-bento": ["ShojiBento.tsx", "ShojiBento.css"],
  "gem-clip": ["GemClip.tsx", "GemClip.css"],
  "snooze-button": ["SnoozeButton.tsx", "SnoozeButton.css"],
};

async function get(url, as = "text") {
  const response = await fetch(url, { headers: { "user-agent": "showcase-build" } });
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  return as === "json" ? response.json() : response.text();
}

async function currentSource() {
  try {
    return JSON.parse(await readFile(join(VENDOR, "SOURCE.json"), "utf8"));
  } catch {
    return null;
  }
}

const sha256 = (text) => createHash("sha256").update(text).digest("hex");

// Reads the same files from a local clone of Experiments instead of GitHub.
function localSource(dir, wanted) {
  const git = (...args) => execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", maxBuffer: 1 << 26 });
  const sha = git("rev-parse", `${wanted === "latest" ? "HEAD" : wanted}^{commit}`).trim();
  return {
    sha,
    date: git("show", "-s", "--format=%cI", sha).trim(),
    raw: async (path) => git("show", `${sha}:${path}`),
    paths: async () => git("ls-tree", "-r", "--name-only", sha).split("\n"),
  };
}

async function githubSource(wanted) {
  // Resolve "latest" or a short hash to the full commit.
  const commit = await get(`https://api.github.com/repos/${REPO}/commits/${wanted === "latest" ? "main" : wanted}`, "json");
  const sha = commit.sha;
  return {
    sha,
    date: commit.commit.committer.date,
    raw: (path) => get(`https://raw.githubusercontent.com/${REPO}/${sha}/${path}`),
    paths: async () => (await get(`https://api.github.com/repos/${REPO}/git/trees/${sha}?recursive=1`, "json")).tree.map((t) => t.path),
  };
}

async function vendor(wanted, from) {
  const { sha, date, raw, paths } = from ? localSource(from, wanted) : await githubSource(wanted);

  const files = {};
  for (const [slug, names] of Object.entries(COMPONENTS)) {
    await mkdir(join(VENDOR, slug), { recursive: true });
    for (const name of names) {
      const text = await raw(`experiments/${slug}/${name}`);
      await writeFile(join(VENDOR, slug, name), text);
      files[`${slug}/${name}`] = sha256(text);
    }
  }
  await writeFile(join(VENDOR, "LICENSE"), await raw("LICENSE"));

  // How many experiments the lab holds at that commit (one folder each, with a README).
  const experiments = (await paths()).filter((p) => /^experiments\/[^/]+\/README\.md$/.test(p)).length;

  const source = {
    repo: `https://github.com/${REPO}`,
    commit: sha,
    committed: date,
    vendored: new Date().toISOString().slice(0, 10),
    experiments,
    files,
  };
  await writeFile(join(VENDOR, "SOURCE.json"), JSON.stringify(source, null, 2) + "\n");
  return source;
}

async function checkVendor(source) {
  // The copies must still be exactly what was downloaded: changes belong in Experiments.
  for (const [path, hash] of Object.entries(source.files)) {
    const text = await readFile(join(VENDOR, path), "utf8");
    if (sha256(text) !== hash) throw new Error(`vendor/${path} differs from Experiments ${source.commit.slice(0, 7)}. Change the component in Experiments, then rebuild.`);
  }
}

const args = process.argv.slice(2);
const fromAt = args.indexOf("--from");
const from = fromAt >= 0 ? args.splice(fromAt, 2)[1] : null;
const arg = args[0];
let source = await currentSource();
if (arg || from || !source) source = await vendor(arg || "latest", from);
else await checkVendor(source);

await mkdir(OUT, { recursive: true });
await build({
  entryPoints: { showcase: join(HERE, "entry.tsx") },
  outdir: OUT,
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2020", "safari15"],
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  legalComments: "eof",
  banner: {
    js: `/* yannworks showcase: Shoji Bento, Gem Clip, Snooze Button from ${source.repo} at ${source.commit.slice(0, 7)} (MIT), with React 19.3.1 (MIT). Built by tools/showcase/build.mjs. */`,
    css: `/* Shoji Bento, Gem Clip, Snooze Button from ${source.repo} at ${source.commit.slice(0, 7)} (MIT). Built by tools/showcase/build.mjs. */`,
  },
  logLevel: "warning",
});

for (const name of ["showcase.js", "showcase.css"]) {
  const body = await readFile(join(OUT, name));
  console.log(`${name.padEnd(13)} ${(body.length / 1024).toFixed(1)} KB, ${(gzipSync(body).length / 1024).toFixed(1)} KB gzipped`);
}
console.log(`Experiments ${source.commit.slice(0, 7)} (${source.committed.slice(0, 10)}), ${source.experiments} experiments`);
