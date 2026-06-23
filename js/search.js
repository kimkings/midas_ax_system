/* ============================================================
 * search.js — GNB 인라인 검색
 *   - 처음 검색 트리거 시 search-index.json + FlexSearch 지연 로드
 *   - 입력 → 결과 패널 (그룹별 묶음)
 *   - Cmd/Ctrl+K 단축키, ESC 닫기, 결과 위/아래 화살표 키
 *   - file:// 환경 호환 (상대경로 사용)
 * ============================================================ */
(function () {
  "use strict";

  /* ---------- 상태 ---------- */
  let state = {
    loaded: false,
    loading: false,
    docs: [],           // 원본 항목 (id로 인덱싱)
    index: null,        // FlexSearch.Document 인스턴스
    activeIdx: -1,      // 현재 키보드 포커스된 결과 인덱스
    results: [],        // 현재 표시 중인 결과 doc 배열
  };

  /* ---------- DOM refs ---------- */
  const wrap = document.querySelector(".gnb__search-wrap");
  if (!wrap) return;  // 이 페이지에 검색 UI 없음

  const trigger = wrap.querySelector(".gnb__search");
  const input = wrap.querySelector(".gnb__search-input");
  const panel = wrap.querySelector(".gnb__search-panel");
  const resultsEl = wrap.querySelector(".gnb__search-results");

  /* ---------- 현재 페이지 경로(상대) 파악 → 결과 URL 보정 ---------- */
  // search-index.json의 URL은 프로젝트 루트 기준이라
  // 현재 페이지가 하위 폴더면 "../" prefix가 필요함.
  const depth = (() => {
    const p = location.pathname;
    // file:// 또는 / 서빙 둘 다 대응
    const idx = p.indexOf("/design-system-intro/");
    let rel;
    if (idx !== -1) rel = p.slice(idx + "/design-system-intro/".length);
    else rel = p.replace(/^\//, "");
    // 마지막이 / 면 index.html
    if (!rel || rel.endsWith("/")) rel += "index.html";
    const parts = rel.split("/");
    return Math.max(0, parts.length - 1);  // 폴더 깊이
  })();
  const prefix = "../".repeat(depth);

  /* ---------- 인덱스 로드 ---------- */
  async function ensureLoaded() {
    if (state.loaded || state.loading) return;
    state.loading = true;
    try {
      // FlexSearch 라이브러리 로드 대기
      await waitForFlex();
      const res = await fetch(prefix + "assets/search-index.json", { cache: "no-cache" });
      const data = await res.json();
      state.docs = data.docs;

      // FlexSearch.Document 구성
      state.index = new FlexSearch.Document({
        document: {
          id: "id",
          index: [
            { field: "title",   tokenize: "forward" },
            { field: "section", tokenize: "forward" },
            { field: "page",    tokenize: "forward" },
            { field: "text",    tokenize: "forward" },
          ],
        },
      });
      for (const d of state.docs) state.index.add(d);

      state.loaded = true;
    } catch (e) {
      console.error("[search] index load failed:", e);
    } finally {
      state.loading = false;
    }
  }

  function waitForFlex() {
    return new Promise((resolve) => {
      if (window.FlexSearch) return resolve();
      const t = setInterval(() => {
        if (window.FlexSearch) { clearInterval(t); resolve(); }
      }, 30);
    });
  }

  /* ---------- 검색 수행 ---------- */
  function runQuery(q) {
    if (!state.loaded || !q.trim()) {
      state.results = [];
      render(q);
      return;
    }
    // 각 필드에서 검색 후 union
    const fieldResults = state.index.search(q, { limit: 20, enrich: false });
    const ids = new Set();
    for (const fr of fieldResults) for (const id of fr.result) ids.add(id);

    // 필드 매칭 가중치: title > section > page > text
    const weight = { title: 4, section: 3, page: 2, text: 1 };
    const scoreMap = new Map();
    for (const fr of fieldResults) {
      const w = weight[fr.field] || 1;
      for (const id of fr.result) {
        scoreMap.set(id, (scoreMap.get(id) || 0) + w);
      }
    }
    const sorted = [...ids].sort((a, b) => (scoreMap.get(b) || 0) - (scoreMap.get(a) || 0));
    state.results = sorted.slice(0, 12).map((id) => state.docs[id]).filter(Boolean);
    state.activeIdx = state.results.length ? 0 : -1;
    render(q);
  }

  /* ---------- 결과 렌더 ---------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function highlight(text, q) {
    if (!q.trim()) return escapeHtml(text);
    const safe = escapeHtml(text);
    const tokens = q.trim().split(/\s+/).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const re = new RegExp("(" + tokens.join("|") + ")", "gi");
    return safe.replace(re, "<mark>$1</mark>");
  }

  function render(q) {
    if (!q.trim()) {
      resultsEl.innerHTML = "";
      resultsEl.setAttribute("data-state", "empty");
      return;
    }
    if (state.results.length === 0) {
      resultsEl.innerHTML = `<div class="gnb__search-empty">"${escapeHtml(q)}" 에 대한 결과가 없어요</div>`;
      resultsEl.setAttribute("data-state", "no-results");
      return;
    }

    // 그룹별 묶기
    const groups = {};
    for (const d of state.results) {
      const g = d.group || "Docs";
      (groups[g] = groups[g] || []).push(d);
    }

    // 정렬 순서 고정
    const order = ["Home", "Overview", "Foundation", "Components", "Pattern", "Docs"];
    const html = order
      .filter((g) => groups[g])
      .map((g) => {
        const items = groups[g].map((d) => {
          const idx = state.results.indexOf(d);
          const breadcrumb = d.section
            ? `${escapeHtml(d.page)} <span class="gnb__search-sep">›</span> ${escapeHtml(d.section)}`
            : escapeHtml(d.page);
          return `
            <a class="gnb__search-result" href="${prefix}${escapeHtml(d.url)}"
               role="option" data-idx="${idx}"
               aria-selected="${idx === state.activeIdx}">
              <span class="gnb__search-result-breadcrumb">${breadcrumb}</span>
              <span class="gnb__search-result-title">${highlight(d.title, q)}</span>
              ${d.text ? `<span class="gnb__search-result-snippet">${highlight(d.text.slice(0, 120), q)}</span>` : ""}
            </a>`;
        }).join("");
        return `
          <div class="gnb__search-group">
            <div class="gnb__search-group-label">${escapeHtml(g)}</div>
            ${items}
          </div>`;
      })
      .join("");

    resultsEl.innerHTML = html;
    resultsEl.setAttribute("data-state", "results");
  }

  function updateActive() {
    const items = resultsEl.querySelectorAll(".gnb__search-result");
    items.forEach((el, i) => {
      const isActive = i === state.activeIdx;
      el.setAttribute("aria-selected", isActive);
      if (isActive) el.scrollIntoView({ block: "nearest" });
    });
  }

  /* ---------- 열기/닫기 ---------- */
  function open() {
    wrap.setAttribute("data-state", "open");
    trigger.setAttribute("aria-expanded", "true");
    ensureLoaded().then(() => {
      // 입력값이 이미 있으면 검색 실행
      if (input.value) runQuery(input.value);
    });
    // 약간의 지연 후 포커스 (transition 시작 후)
    requestAnimationFrame(() => input.focus());
  }

  function close() {
    wrap.setAttribute("data-state", "closed");
    trigger.setAttribute("aria-expanded", "false");
    input.blur();
  }

  function toggle() {
    wrap.getAttribute("data-state") === "open" ? close() : open();
  }

  /* ---------- 이벤트 바인딩 ---------- */
  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  });

  input.addEventListener("input", (e) => {
    const q = e.target.value;
    runQuery(q);
  });

  // 키보드 내비
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (input.value) { input.value = ""; runQuery(""); }
      else close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (state.results.length) {
        state.activeIdx = (state.activeIdx + 1) % state.results.length;
        updateActive();
      }
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (state.results.length) {
        state.activeIdx = (state.activeIdx - 1 + state.results.length) % state.results.length;
        updateActive();
      }
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const el = resultsEl.querySelector(`.gnb__search-result[data-idx="${state.activeIdx}"]`);
      if (el) el.click();
    }
  });

  // 결과 마우스오버 시 active 업데이트
  resultsEl.addEventListener("mousemove", (e) => {
    const item = e.target.closest(".gnb__search-result");
    if (!item) return;
    const idx = parseInt(item.dataset.idx, 10);
    if (idx !== state.activeIdx) {
      state.activeIdx = idx;
      updateActive();
    }
  });

  // 바깥 클릭 시 닫기
  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) close();
  });

  // 전역 단축키: Cmd/Ctrl + K
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      open();
    }
  });
})();
