// Writes made-up contribution data, to try the graph on your computer before
// the GitHub Action has produced the real file.
//
//   node tools/sample-contributions.mjs contributions.json [YYYY-MM-DD]
//
// The file is marked "sample": true. The page only shows such a file on
// localhost, so even if it were published by mistake, nobody would see it as
// real activity. Do not commit it: the Action writes the real one.

import { writeFile } from "node:fs/promises";

const [output = "contributions.json", end = new Date().toISOString().slice(0, 10)] = process.argv.slice(2);

// A small seeded random generator: the same sample every time.
let seed = 20261120;
const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

const day = 864e5;
const last = Date.parse(end + "T00:00:00Z");
const first = last - (52 * 7 + new Date(last).getUTCDay()) * day;   // starts on a Sunday, like GitHub
const days = [];
for (let t = first; t <= last; t += day) {
  const weekday = new Date(t).getUTCDay();
  const recent = (t - first) / (last - first);                      // busier lately
  const active = random() < 0.25 + 0.45 * recent - (weekday === 0 || weekday === 6 ? 0.12 : 0);
  const count = active ? 1 + Math.floor(random() ** 2.2 * 14) : 0;
  const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 9 ? 3 : 4;
  days.push({ date: new Date(t).toISOString().slice(0, 10), count, level });
}
const total = days.reduce((n, d) => n + d.count, 0);

const lines = days.map((d) => `    {"date": "${d.date}", "count": ${d.count}, "level": ${d.level}}`);
await writeFile(output, `{
  "sample": true,
  "login": "yannworks",
  "fetchedAt": "${new Date().toISOString()}",
  "total": ${total},
  "days": [
${lines.join(",\n")}
  ]
}
`);
console.log(`Wrote ${output}: ${days.length} sample days, ${total} contributions (marked as sample).`);
