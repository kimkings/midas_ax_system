#!/usr/bin/env node
/**
 * build-search-index.js
 * ---------------------------------------------
 * 모든 .html 파일을 스캔해서 검색 인덱스 JSON 생성.
 *
 * 의존성 0 (Node 18+ 빌트인만 사용).
 * 산출물: assets/search-index.json
 *
 * 인덱싱 단위:
 *   - 페이지 H1 (anchor 없음)
 *   - 각 H2/H3 (id 있는 경우 → 앵커 링크)
 *   각 항목별로 그 다음 텍스트 블록(P, LI 등)을 본문으로 결합.
 *
 * 사용:
 *   node scripts/build-search-index.js
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "assets", "search-index.json");

const EXCLUDE_DIRS = new Set(["node_modules", "scripts", ".git", "assets", "css", "js"]);

/* ===== 폴더 → 섹션 그룹 매핑 ===== */
const GROUP_MAP = {
  "": "Home",
  "get-started": "Overview",
  "foundation": "Foundation",
  "components": "Components",
  "pattern": "Pattern",
};

/* ===== HTML 파일 모두 찾기 ===== */
function collectHtml(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtml(full, acc);
    else if (entry.isFile() && entry.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

/* ===== 단순 HTML 파서 ===== */
// <tag ...>...</tag> 매칭 (중첩 무시, 표준 docs 페이지엔 충분)
function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function getAttr(tag, attr) {
  const m = tag.match(new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, "i"));
  return m ? m[1] : "";
}

/* ===== 한 페이지에서 섹션 추출 =====
 * 반환: [{ level: 1|2|3, id: "...", title: "...", body: "..." }, ...]
 *
 * body 추출 규칙:
 *   - 다음 동급/상위 heading 직전까지의 텍스트
 *   - 너무 길면 240자로 자름
 */
function extractSections(html) {
  // <main> 안쪽만 (헤더/푸터 제외)
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const body = mainMatch ? mainMatch[1] : html;

  // 모든 heading 위치 수집
  const headingRe = /<(h[1-3])([^>]*)>([\s\S]*?)<\/\1>/gi;
  const headings = [];
  let m;
  while ((m = headingRe.exec(body)) !== null) {
    const level = parseInt(m[1][1], 10);
    const attrs = m[2];
    const inner = stripTags(m[3]);
    if (!inner) continue;
    headings.push({
      level,
      id: getAttr(attrs, "id") || "",
      title: inner,
      start: m.index,
      end: m.index + m[0].length,
    });
  }

  // section의 id도 활용 (heading이 id 없으면 부모 section[id] 사용)
  // 간단히 처리: heading 직전의 가장 가까운 <section id="..."> 찾기
  const sectionIdAt = (pos) => {
    const slice = body.slice(0, pos);
    const matches = [...slice.matchAll(/<section[^>]*\bid\s*=\s*["']([^"']+)["']/gi)];
    return matches.length ? matches[matches.length - 1][1] : "";
  };

  const sections = [];
  for (let i = 0; i < headings.length; i++) {
    const cur = headings[i];
    const next = headings[i + 1];
    const sliceStart = cur.end;
    const sliceEnd = next ? next.start : body.length;
    const text = stripTags(body.slice(sliceStart, sliceEnd));
    sections.push({
      level: cur.level,
      id: cur.id || sectionIdAt(cur.start),
      title: cur.title,
      body: text.slice(0, 240),
    });
  }
  return sections;
}

function extractTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  return m ? stripTags(m[1]).split("—")[0].trim() : "";
}

/* ===== 파일 → 인덱스 항목들 ===== */
function buildEntries(filePath, idCounter) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  const html = fs.readFileSync(filePath, "utf8");
  const pageTitle = extractTitle(html);
  const folder = rel.split("/")[0].endsWith(".html") ? "" : rel.split("/")[0];
  const group = GROUP_MAP[folder] ?? "Docs";

  const sections = extractSections(html);
  const entries = [];

  for (const s of sections) {
    const isPageTitle = s.level === 1;
    entries.push({
      id: idCounter.value++,
      url: rel + (s.id && !isPageTitle ? `#${s.id}` : ""),
      group,
      page: pageTitle || s.title,
      title: s.title,
      section: isPageTitle ? "" : s.title,
      text: s.body,
    });
  }

  // 페이지 자체에 H1만 있고 나머지 본문이 없으면 lead 텍스트도 fallback으로 추가
  if (entries.length === 1) {
    const leadMatch = html.match(/<div[^>]*page-content__lead[^>]*>([\s\S]*?)<\/div>/i);
    if (leadMatch) entries[0].text = stripTags(leadMatch[1]).slice(0, 240);
  }

  return entries;
}

/* ===== 실행 ===== */
function main() {
  const files = collectHtml(ROOT).sort();
  const idCounter = { value: 0 };
  const docs = [];

  for (const f of files) {
    try {
      docs.push(...buildEntries(f, idCounter));
    } catch (e) {
      console.warn(`[skip] ${f}: ${e.message}`);
    }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    count: docs.length,
    docs,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), "utf8");

  console.log(`✓ ${docs.length} entries from ${files.length} files`);
  console.log(`  → ${path.relative(ROOT, OUT)}`);
}

main();
