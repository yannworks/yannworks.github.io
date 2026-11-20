// Fetches the GitHub contribution calendar of one account and saves it as JSON.
//
// The GitHub Action in .github/workflows/contributions.yml runs this once a day.
// It needs Node 18 or newer (for fetch) and a token in the GITHUB_TOKEN variable.
//
//   GITHUB_TOKEN=... node tools/fetch-contributions.mjs yannworks contributions.json
//
// The file is rewritten only when the calendar changed, so the Action only
// commits when there is something new.

import { readFile, writeFile } from "node:fs/promises";

const [login = "yannworks", output = "contributions.json"] = process.argv.slice(2);
const token = process.env.GITHUB_TOKEN;

function stop(message) {
  console.error("::error::" + message);
  process.exit(1);
}

if (!token) stop("No token: set GITHUB_TOKEN.");

// The same calendar as on the GitHub profile: about one year, in weeks starting on Sunday.
const QUERY = `
  query ($login: String!) {
    user(login: $login) {
      contributionsCollection {
        restrictedContributionsCount
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount contributionLevel } }
        }
      }
    }
  }`;

const response = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "yannworks-site-contributions",
  },
  body: JSON.stringify({ query: QUERY, variables: { login } }),
});
const body = await response.json().catch(() => null);

if (!response.ok || !body || body.errors || !body.data || !body.data.user) {
  const detail = body && body.errors ? body.errors.map((e) => e.message).join("; ") : `HTTP ${response.status}`;
  stop(`Could not read the contribution calendar of ${login}: ${detail}. ` +
    "If the workflow token is not allowed to read it, add a fine-grained token as the repository secret CONTRIBUTIONS_TOKEN (see the README).");
}

const collection = body.data.user.contributionsCollection;
const calendar = collection.contributionCalendar;
const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
const days = calendar.weeks
  .flatMap((week) => week.contributionDays)
  .map((d) => ({ date: d.date, count: d.contributionCount, level: LEVELS[d.contributionLevel] ?? 0 }));

if (days.length < 300) stop(`Only ${days.length} days in the calendar: something is wrong, nothing saved.`);

// What the run found (shown in the Actions log).
const sum = days.reduce((n, d) => n + d.count, 0);
const busiest = days.reduce((a, d) => (d.count > a.count ? d : a), days[0]);
console.log(`${login}: ${calendar.totalContributions} contributions from ${days[0].date} to ${days[days.length - 1].date}`);
console.log(`days: ${days.length}, with contributions: ${days.filter((d) => d.count).length}, sum of days: ${sum}`);
console.log(`busiest day: ${busiest.date} (${busiest.count}), private contributions counted: ${collection.restrictedContributionsCount}`);

// Keep the old file (and its date) if nothing changed.
let previous = null;
try { previous = JSON.parse(await readFile(output, "utf8")); } catch { /* no file yet */ }
if (previous && previous.total === calendar.totalContributions && JSON.stringify(previous.days) === JSON.stringify(days)) {
  console.log("No change since the last run.");
  process.exit(0);
}

// One day per line, so each daily commit shows a readable change.
const lines = days.map((d) => `    {"date": "${d.date}", "count": ${d.count}, "level": ${d.level}}`);
const json = `{
  "login": "${login}",
  "fetchedAt": "${new Date().toISOString()}",
  "total": ${calendar.totalContributions},
  "days": [
${lines.join(",\n")}
  ]
}
`;
await writeFile(output, json);
console.log(`Saved ${output}.`);
