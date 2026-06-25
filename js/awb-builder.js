/* ============================================================
 * awb-builder.js — Agent/Workflow Builder 라이브 데모 (4 타입)
 *   Form  : 설정 폼 작성 → '만들기' → 우측 테스트 대화 활성화
 *   Step  : 점격자 캔버스 세로 스텝 카드 + 우측 설정 패널 (드래그 정렬)
 *   Modal : 모달 안 스텝 카드 → 카드 클릭 시 세부 설정 서브모달
 *   Node  : 자유 캔버스 노드 + SVG 연결선 (드래그 이동·연결)
 * ============================================================ */
(function () {
  const demo = document.getElementById("awbDemo");
  if (!demo || !demo.hasAttribute("data-awb-builder")) return;

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const TYPES = [
    { icon: "awb-globe", color: "#20c997" },
    { icon: "awb-building", color: "#ff6b2b" },
    { icon: "awb-cube", color: "#2ca4fb" },
    { icon: "awb-heart", color: "#7c5cff" },
    { icon: "awb-bolt", color: "#f25fae" },
  ];
  const MODEL_OPTIONS = ["Claude Sonnet 4.5", "Claude Opus 4.8", "Claude Haiku 4.5", "GPT-4o"];
  const COND_LABEL = { prev: "이전 단계 완료 시", cond: "조건 충족 시", manual: "수동 실행" };
  const NODE_TYPE = {
    trigger: { label: "트리거", icon: "awb-bolt", color: "#ff6b2b" },
    cond: { label: "조건", icon: "awb-cube", color: "#2ca4fb" },
    action: { label: "액션", icon: "awb-globe", color: "#20c997" },
    tool: { label: "도구", icon: "awb-building", color: "#7c5cff" },
  };
  const TOOL_COLOR = { search: "#2ca4fb", file: "#20c997", api: "#ff6b2b" };

  /* 작동하는 모델 드롭다운 — .eae-select[data-model] 전체에 적용 */
  function closeAllMenus() {
    demo.querySelectorAll(".eae-menu").forEach((m) => { m.hidden = true; });
    demo.querySelectorAll(".eae-select[data-model]").forEach((b) => b.setAttribute("aria-expanded", "false"));
  }
  (function initModelDropdowns() {
    demo.querySelectorAll(".eae-select[data-model]").forEach((btn) => {
      const wrap = btn.closest(".eae-select-wrap") || btn.parentNode;
      const valEl = btn.querySelector(".eae-select__val");
      const menu = document.createElement("div");
      menu.className = "eae-menu"; menu.hidden = true;
      MODEL_OPTIONS.forEach((m) => {
        const it = document.createElement("button");
        it.type = "button";
        it.className = "eae-menu__item" + (valEl && valEl.textContent === m ? " is-sel" : "");
        it.textContent = m;
        it.addEventListener("click", (e) => {
          e.stopPropagation();
          if (valEl) valEl.textContent = m;
          menu.querySelectorAll(".eae-menu__item").forEach((x) => x.classList.toggle("is-sel", x === it));
          closeAllMenus();
        });
        menu.appendChild(it);
      });
      wrap.appendChild(menu);
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const willOpen = menu.hidden;
        closeAllMenus();
        if (willOpen) { menu.hidden = false; btn.setAttribute("aria-expanded", "true"); }
      });
    });
    document.addEventListener("click", closeAllMenus);
  })();

  /* ========================================================
   * 1) 씬(타입) 전환
   * ====================================================== */
  const seg = $("awbSeg");
  const SCENES = ["form", "step", "modal", "node"];
  let switching = false;
  let switchTimer = 0;
  if (seg) {
    seg.addEventListener("click", (e) => {
      const btn = e.target.closest(".daw-seg__btn");
      if (!btn) return;
      const next = btn.dataset.scene;
      if (!SCENES.includes(next) || demo.classList.contains("awb-demo--" + next) || switching) return;
      window.clearTimeout(switchTimer);
      const activate = () => {
        SCENES.forEach((s) => demo.classList.remove("awb-demo--" + s));
        demo.classList.add("awb-demo--" + next);
        seg.querySelectorAll(".daw-seg__btn").forEach((b) => b.classList.toggle("is-active", b === btn));
      };
      if (reduceMotion) { activate(); return; }
      switching = true;
      demo.classList.add("awb-demo--scene-out");
      switchTimer = window.setTimeout(() => {
        activate();
        demo.classList.remove("awb-demo--scene-out");
        demo.classList.add("awb-demo--scene-in");
        requestAnimationFrame(() => {
          demo.classList.remove("awb-demo--scene-in");
          switchTimer = window.setTimeout(() => { switching = false; }, 460);
        });
      }, 420);
    });
  }

  /* ========================================================
   * 2) Form Builder — 만들기 → 테스트 대화
   * ====================================================== */
  (function formScene() {
    const name = $("awbFName");
    const desc = $("awbFDesc");
    const inst = $("awbFInst");
    const reset = $("awbFReset");
    const create = $("awbFCreate");
    const empty = $("awbFEmpty");
    const title = $("awbFPreviewTitle");
    const chat = $("awbChat");
    const form = $("awbForm");
    const field = $("awbField");
    const send = $("awbSend");
    const upload = $("awbFUpload");
    const files = $("awbFFiles");
    if (!create || !chat) return;

    let created = false;
    let busy = false;
    let fileN = 0;
    const SAMPLE_FILES = ["영업_가이드.pdf", "제품_FAQ.docx", "온보딩_정책.md", "회의록_2026Q2.txt"];
    upload && upload.addEventListener("click", () => {
      const nm = SAMPLE_FILES[fileN % SAMPLE_FILES.length]; fileN++;
      const row = document.createElement("div");
      row.className = "awb-file";
      row.innerHTML = '<svg aria-hidden="true"><use href="#ic-attach"></use></svg><span class="awb-file__name"></span><button class="awb-file__rm" type="button" aria-label="삭제"><svg aria-hidden="true"><use href="#ic-close"></use></svg></button>';
      row.querySelector(".awb-file__name").textContent = nm;
      row.querySelector(".awb-file__rm").addEventListener("click", () => row.remove());
      files && files.appendChild(row);
    });

    const scrollDown = () => { chat.scrollTop = chat.scrollHeight; };
    const flash = (el) => {
      if (!el) return;
      el.classList.add("is-invalid");
      el.closest(".eae-field")?.classList.add("awb-shake");
      setTimeout(() => el.closest(".eae-field")?.classList.remove("awb-shake"), 420);
    };
    [name, inst].forEach((el) => el && el.addEventListener("input", () => el.classList.remove("is-invalid")));

    create.addEventListener("click", () => {
      const n = (name.value || "").trim();
      const i = (inst.value || "").trim();
      if (!n) { flash(name); name.focus(); return; }
      if (!i) { flash(inst); inst.focus(); return; }
      created = true;
      demo.classList.add("is-fcreated");
      title.textContent = n;
      field.disabled = false;
      field.placeholder = n + "에게 테스트 질문을 해보세요.";
      const d = (desc.value || "").trim();
      chat.innerHTML =
        '<div class="gca-msg gca-msg--assistant gca-msg--enter">' +
        '<span class="gca-status"><svg aria-hidden="true"><use href="#ic-check"></use></svg>준비 완료</span>' +
        '<p class="gca-msg__text">안녕하세요, <b>' + esc(n) + '</b> 입니다. ' +
        (d ? esc(d) + " " : "") +
        '아래에서 바로 테스트해 보세요.</p></div>';
      create.textContent = "수정 적용";
      scrollDown();
      field.focus();
    });

    reset && reset.addEventListener("click", () => {
      created = false;
      demo.classList.remove("is-fcreated");
      name.value = ""; desc.value = ""; inst.value = "";
      if (files) files.innerHTML = "";
      title.textContent = "미리보기";
      field.value = ""; field.disabled = true; send.disabled = true;
      field.placeholder = "먼저 에이전트를 만들어 주세요.";
      create.textContent = "만들기";
      chat.innerHTML =
        '<div class="awb-test-empty" id="awbFEmpty">' +
        '<span class="awb-test-empty__icon"><svg aria-hidden="true"><use href="#ic-sparkle"></use></svg></span>' +
        '<p class="awb-test-empty__title">아직 에이전트가 없어요</p>' +
        '<p class="awb-test-empty__sub">왼쪽에서 <b>이름</b>과 <b>지시사항</b>을 입력하고<br /><b>만들기</b>를 누르면 여기서 바로 테스트할 수 있어요.</p></div>';
    });

    field && field.addEventListener("input", () => {
      send.disabled = !created || field.value.trim().length === 0;
    });

    form && form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = field.value.trim();
      if (!created || !text || busy) return;
      busy = true;
      const u = document.createElement("div");
      u.className = "gca-msg gca-msg--user gca-msg--enter";
      u.innerHTML = '<div class="gca-bubble"></div>';
      u.querySelector(".gca-bubble").textContent = text;
      chat.appendChild(u);
      field.value = ""; send.disabled = true; scrollDown();

      const th = document.createElement("div");
      th.className = "gca-thinking gca-thinking--enter";
      th.innerHTML = '생각중<span class="gca-thinking__dots"><span></span><span></span><span></span></span>';
      chat.appendChild(th); scrollDown();

      const n = (name.value || "에이전트").trim();
      const i = (inst.value || "").trim();
      const replies = [
        "설정하신 지시사항" + (i ? " “" + i.slice(0, 24) + (i.length > 24 ? "…" : "") + "”" : "") + "을 기준으로 답변을 구성했어요. 설정을 바꾸면 응답도 달라집니다. (데모 응답)",
        "“" + n + "” 관점에서 정리해 드렸어요. 왼쪽 설정을 수정하고 ‘수정 적용’을 누르면 즉시 반영됩니다. (데모 응답)",
        "테스트 결과예요. 만족스러우면 실제 환경에서 게시할 수 있어요. (데모 응답)",
      ];
      const idx = (form.__idx = (form.__idx || 0)) % replies.length;
      form.__idx++;
      setTimeout(() => {
        th.remove();
        const a = document.createElement("div");
        a.className = "gca-msg gca-msg--assistant gca-msg--enter";
        a.innerHTML = '<span class="gca-status"><svg aria-hidden="true"><use href="#ic-check"></use></svg>완료</span>';
        const p = document.createElement("p");
        p.className = "gca-msg__text"; p.textContent = replies[idx];
        a.appendChild(p); chat.appendChild(a); busy = false; scrollDown();
      }, reduceMotion ? 200 : 850 + Math.random() * 500);
    });
  })();

  /* ========================================================
   * 공용: 스텝 카드 모델 + 렌더 + 드래그 정렬 (Step / Modal 공유)
   * ====================================================== */
  function makeStepData(presets) {
    return presets.map((p, n) => ({
      name: p.name,
      cond: p.cond,
      sub: COND_LABEL[p.cond],
      desc: p.desc || "",
      inst: p.inst || "",
      icon: TYPES[n % TYPES.length].icon,
      color: TYPES[n % TYPES.length].color,
    }));
  }
  const STEP_PRESETS = [
    { name: "트리거 — 요청 수신", cond: "manual", inst: "사용자 요청이 들어오면 흐름을 시작합니다." },
    { name: "조건 — 분류", cond: "prev", inst: "요청을 유형별로 분류합니다." },
    { name: "액션 — 처리", cond: "prev", inst: "분류 결과에 따라 작업을 처리합니다." },
  ];

  function stepCardHTML(step) {
    return (
      '<span class="awb-step__handle" data-handle aria-label="순서 변경"><svg aria-hidden="true"><use href="#ic-grip"></use></svg></span>' +
      '<span class="awb-step__icon"><svg aria-hidden="true"><use href="#ic-' + step.icon + '"></use></svg></span>' +
      '<span class="awb-step__meta"><span class="awb-step__label">' + esc(step.name) + '</span>' +
      '<span class="awb-step__sub">' + esc(step.sub) + '</span></span>'
    );
  }

  /* 카드 전체를 잡고 끌 수 있는 정렬 + 탭=선택.
   * 5px 이상 움직이면 드래그로 판정, 그 미만이면 onSelect 호출 */
  function makeSortable(list, opts) {
    const THRESH = 5;
    let st = null;
    list.addEventListener("pointerdown", (e) => {
      if (e.button != null && e.button !== 0) return;
      if (e.target.closest("button")) return; // 추가 버튼 등 무시
      const card = e.target.closest(".awb-step");
      if (!card) return;
      e.preventDefault();
      const rect = card.getBoundingClientRect();
      st = { card, startY: e.clientY, grabOffset: e.clientY - rect.top, dragging: false, pid: e.pointerId };
      try { card.setPointerCapture(e.pointerId); } catch (_) {}
    });
    list.addEventListener("pointermove", (e) => {
      if (!st) return;
      if (!st.dragging) {
        if (Math.abs(e.clientY - st.startY) < THRESH) return;
        st.dragging = true;
        st.card.classList.add("is-dragging");
        list.classList.add("is-reordering");
      }
      st.card.style.transform = "";
      const naturalTop = st.card.getBoundingClientRect().top;
      st.card.style.transform = "translateY(" + ((e.clientY - st.grabOffset) - naturalTop) + "px)";
      const others = [...list.querySelectorAll(".awb-step:not(.is-dragging)")];
      let ref = null;
      for (const sib of others) {
        const r = sib.getBoundingClientRect();
        if (e.clientY < r.top + r.height / 2) { ref = sib; break; }
      }
      const addBtn = list.querySelector(".awb-step-add");
      const anchor = ref || addBtn;
      if (anchor && st.card.nextSibling !== anchor) list.insertBefore(st.card, anchor);
    });
    function end() {
      if (!st) return;
      const card = st.card, dragged = st.dragging;
      try { card.releasePointerCapture(st.pid); } catch (_) {}
      card.style.transform = "";
      card.classList.remove("is-dragging");
      list.classList.remove("is-reordering");
      st = null;
      if (dragged) { opts.onReorder && opts.onReorder(); }
      else { opts.onSelect && opts.onSelect(card); }
    }
    list.addEventListener("pointerup", end);
    list.addEventListener("pointercancel", end);
  }

  function cardIndex(list, card) {
    return [...list.querySelectorAll(".awb-step")].indexOf(card);
  }
  function buildAddBtn(onAdd) {
    const add = document.createElement("button");
    add.type = "button";
    add.className = "awb-step-add";
    add.setAttribute("aria-label", "단계 추가");
    add.innerHTML = '<svg aria-hidden="true"><use href="#ic-add"></use></svg>';
    add.addEventListener("click", onAdd);
    return add;
  }

  /* 카드 삭제 — 높이를 접으며 부드럽게 사라진 뒤 콜백 */
  function collapseRemove(list, el, after) {
    if (reduceMotion || !el) { after(); return; }
    list.classList.add("is-animating");
    const h = el.offsetHeight;
    el.style.height = h + "px";
    el.style.overflow = "hidden";
    el.getBoundingClientRect(); // reflow
    el.classList.add("awb-step--leave");
    el.style.height = "0px";
    el.style.marginBottom = "-26px";
    let done = false;
    const fin = () => {
      if (done) return; done = true;
      el.removeEventListener("transitionend", onEnd);
      list.classList.remove("is-animating");
      after();
    };
    const onEnd = (e) => { if (e.propertyName === "height") fin(); };
    el.addEventListener("transitionend", onEnd);
    setTimeout(fin, 360);
  }

  /* ========================================================
   * 3) Step Builder — 세로 카드 + 설정 패널 + 드래그 정렬
   * ====================================================== */
  (function stepScene() {
    const list = $("awbStepList");
    const title = $("awbStepTitle");
    const fName = $("awbStepName");
    const fDesc = $("awbStepDesc");
    const fInst = $("awbStepInst");
    const del = $("awbStepDelete");
    const save = $("awbStepSave");
    const cond = $("awbStepCond");
    if (!list) return;

    let steps = makeStepData(STEP_PRESETS);
    let selected = 0;
    let addCount = 0;

    function render() {
      list.innerHTML = "";
      steps.forEach((step, i) => {
        const el = document.createElement("div");
        el.className = "awb-step" + (i === selected ? " is-sel" : "");
        el.style.setProperty("--nc", step.color);
        el.__step = step;
        el.innerHTML = stepCardHTML(step);
        list.appendChild(el);
      });
      list.appendChild(buildAddBtn(addStep));
      syncPanel();
    }
    function syncPanel() {
      const step = steps[selected];
      if (!step) { title.textContent = "단계 설정"; return; }
      title.textContent = step.name + " 설정";
      fName.value = step.name; fDesc.value = step.desc; fInst.value = step.inst;
      if (cond) cond.querySelectorAll("input").forEach((r) => { r.checked = r.value === step.cond; });
    }
    function selectIndex(i) {
      selected = i;
      [...list.querySelectorAll(".awb-step")].forEach((el, n) => el.classList.toggle("is-sel", n === i));
      syncPanel();
    }
    function addStep() {
      addCount++;
      const t = TYPES[steps.length % TYPES.length];
      steps.push({ name: "새 단계 " + addCount, cond: "prev", sub: COND_LABEL.prev, desc: "", inst: "", icon: t.icon, color: t.color });
      selected = steps.length - 1;
      render();
      const cards = list.querySelectorAll(".awb-step");
      const last = cards[cards.length - 1];
      if (last && !reduceMotion) last.classList.add("awb-step--enter");
      last && last.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    fName && fName.addEventListener("input", () => {
      const step = steps[selected]; if (!step) return;
      step.name = fName.value;
      const card = list.querySelectorAll(".awb-step")[selected];
      card && (card.querySelector(".awb-step__label").textContent = step.name || "이름 없음");
      title.textContent = (step.name || "단계") + " 설정";
    });
    fDesc && fDesc.addEventListener("input", () => { const s = steps[selected]; if (s) s.desc = fDesc.value; });
    fInst && fInst.addEventListener("input", () => { const s = steps[selected]; if (s) s.inst = fInst.value; });
    cond && cond.addEventListener("change", (e) => {
      const step = steps[selected]; if (!step || !e.target.value) return;
      step.cond = e.target.value;
      step.sub = COND_LABEL[step.cond];
      const card = list.querySelectorAll(".awb-step")[selected];
      card && (card.querySelector(".awb-step__sub").textContent = step.sub);
    });

    del && del.addEventListener("click", () => {
      if (steps.length <= 1) return;
      const card = list.querySelectorAll(".awb-step")[selected];
      const idx = selected;
      collapseRemove(list, card, () => {
        steps.splice(idx, 1);
        selected = Math.max(0, idx - 1);
        render();
      });
    });
    save && save.addEventListener("click", () => {
      const prev = save.textContent;
      save.textContent = "저장됨 ✓"; save.disabled = true;
      setTimeout(() => { save.textContent = prev; save.disabled = false; }, 1100);
    });

    makeSortable(list, {
      onSelect: (card) => { const i = cardIndex(list, card); if (i >= 0) selectIndex(i); },
      onReorder: () => {
        steps = [...list.querySelectorAll(".awb-step")].map((el) => el.__step);
        const sel = list.querySelector(".awb-step.is-sel");
        selected = sel ? cardIndex(list, sel) : 0;
        syncPanel();
      },
    });
    render();
  })();

  /* ========================================================
   * 4) Modal Builder — 모달 안 카드 + 스플릿 설정 패널 + 드래그 정렬
   * ====================================================== */
  (function modalScene() {
    const modal = $("awbModal");
    const list = $("awbModalList");
    const config = $("awbModalConfig");
    const mTitle = $("awbMTitle");
    const mClose = $("awbMClose");
    const fName = $("awbMName");
    const fDesc = $("awbMDesc");
    const fInst = $("awbMInst");
    const cond = $("awbMCond");
    if (!modal || !list || !config) return;

    let steps = makeStepData(STEP_PRESETS);
    let selected = -1;
    let addCount = 0;

    function render() {
      list.innerHTML = "";
      steps.forEach((step, i) => {
        const el = document.createElement("div");
        el.className = "awb-step" + (i === selected ? " is-sel" : "");
        el.style.setProperty("--nc", step.color);
        el.__step = step;
        el.innerHTML = stepCardHTML(step);
        list.appendChild(el);
      });
      list.appendChild(buildAddBtn(() => {
        addCount++;
        const t = TYPES[steps.length % TYPES.length];
        steps.push({ name: "새 단계 " + addCount, cond: "prev", sub: COND_LABEL.prev, desc: "", inst: "", icon: t.icon, color: t.color });
        render();
        openConfig(steps.length - 1);
        const cards = list.querySelectorAll(".awb-step");
        const last = cards[cards.length - 1];
        if (last && !reduceMotion) last.classList.add("awb-step--enter");
      }));
    }
    function openConfig(i) {
      selected = i;
      const step = steps[i]; if (!step) return;
      modal.classList.add("is-split");
      config.setAttribute("aria-hidden", "false");
      mTitle.textContent = step.name + " 설정";
      fName.value = step.name; fDesc.value = step.desc; fInst.value = step.inst;
      if (cond) cond.querySelectorAll("input").forEach((r) => { r.checked = r.value === step.cond; });
      [...list.querySelectorAll(".awb-step")].forEach((el, n) => el.classList.toggle("is-sel", n === i));
    }
    function closeConfig() {
      selected = -1;
      modal.classList.remove("is-split");
      config.setAttribute("aria-hidden", "true");
      [...list.querySelectorAll(".awb-step")].forEach((el) => el.classList.remove("is-sel"));
    }

    fName && fName.addEventListener("input", () => {
      const step = steps[selected]; if (!step) return;
      step.name = fName.value;
      const card = list.querySelectorAll(".awb-step")[selected];
      card && (card.querySelector(".awb-step__label").textContent = step.name || "이름 없음");
      mTitle.textContent = (step.name || "단계") + " 설정";
    });
    fDesc && fDesc.addEventListener("input", () => { const s = steps[selected]; if (s) s.desc = fDesc.value; });
    fInst && fInst.addEventListener("input", () => { const s = steps[selected]; if (s) s.inst = fInst.value; });
    cond && cond.addEventListener("change", (e) => {
      const step = steps[selected]; if (!step || !e.target.value) return;
      step.cond = e.target.value;
      step.sub = COND_LABEL[step.cond];
      const card = list.querySelectorAll(".awb-step")[selected];
      card && (card.querySelector(".awb-step__sub").textContent = step.sub);
    });
    mClose && mClose.addEventListener("click", closeConfig);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("is-split")) closeConfig(); });

    makeSortable(list, {
      onSelect: (card) => { const i = cardIndex(list, card); if (i >= 0) openConfig(i); },
      onReorder: () => {
        steps = [...list.querySelectorAll(".awb-step")].map((el) => el.__step);
        const sel = list.querySelector(".awb-step.is-sel");
        if (sel) selected = cardIndex(list, sel); else closeConfig();
      },
    });
    render();
  })();

  /* ========================================================
   * 5) Node Graph Builder — 자유 캔버스 노드 + 연결선
   * ====================================================== */
  (function nodeScene() {
    const canvas = $("awbNodeCanvas");
    const svg = $("awbNodeEdges");
    const layer = $("awbNodeLayer");
    const addBtn = $("awbNodeAdd");
    const title = $("awbNodeTitle");
    const fName = $("awbNodeName");
    const fDesc = $("awbNodeDesc");
    const fInst = $("awbNodeInst");
    const del = $("awbNodeDelete");
    const save = $("awbNodeSave");
    const typeGroup = $("awbNodeType");
    const toolsGroup = $("awbNodeTools");
    if (!canvas || !svg || !layer) return;

    let uid = 0;
    const mk = (name, x, y, type) => ({
      id: ++uid, name, x, y, type, tools: [], desc: "", inst: "",
      icon: NODE_TYPE[type].icon, color: NODE_TYPE[type].color,
    });
    let nodes = [mk("요청 수신", 70, 210, "trigger"), mk("분류", 250, 210, "cond"), mk("처리", 430, 210, "action")];
    let edges = [{ from: nodes[0].id, to: nodes[1].id }, { from: nodes[1].id, to: nodes[2].id }];
    let selected = nodes[0].id;

    const NODE_W = 96, BOX = 64, BOX_OFF = (NODE_W - BOX) / 2;
    const portOut = (nd) => ({ x: nd.x + BOX_OFF + BOX, y: nd.y + BOX / 2 });
    const portIn = (nd) => ({ x: nd.x + BOX_OFF, y: nd.y + BOX / 2 });
    const byId = (id) => nodes.find((n) => n.id === id);

    function edgePath(p1, p2) {
      const dx = Math.max(36, Math.abs(p2.x - p1.x) * 0.5);
      return "M " + p1.x + " " + p1.y + " C " + (p1.x + dx) + " " + p1.y + ", " + (p2.x - dx) + " " + p2.y + ", " + p2.x + " " + p2.y;
    }

    function drawEdges(temp) {
      let html = "";
      edges.forEach((e) => {
        const a = byId(e.from), b = byId(e.to);
        if (!a || !b) return;
        html += '<path class="awb-nedge" d="' + edgePath(portOut(a), portIn(b)) + '"></path>';
      });
      if (temp) html += '<path class="awb-nedge is-temp" d="' + edgePath(temp.from, temp.to) + '"></path>';
      svg.innerHTML = html;
    }

    function render() {
      layer.innerHTML = "";
      nodes.forEach((nd) => {
        const el = document.createElement("div");
        el.className = "awb-gnode" + (nd.id === selected ? " is-sel" : "");
        el.style.left = nd.x + "px";
        el.style.top = nd.y + "px";
        el.style.setProperty("--nc", nd.color);
        el.dataset.id = nd.id;
        const badges = (nd.tools && nd.tools.length)
          ? '<span class="awb-gnode__badges">' + nd.tools.map((t) => '<span class="awb-gnode__badge" style="background:' + TOOL_COLOR[t] + '"></span>').join("") + '</span>'
          : "";
        el.innerHTML =
          '<span class="awb-gnode__box">' +
          '<span class="awb-gnode__port awb-gnode__port--in" data-port="in"></span>' +
          '<svg aria-hidden="true"><use href="#ic-' + nd.icon + '"></use></svg>' +
          badges +
          '<span class="awb-gnode__port awb-gnode__port--out" data-port="out"><svg aria-hidden="true"><use href="#ic-add"></use></svg></span>' +
          '</span>' +
          '<span class="awb-gnode__label">' + esc(nd.name) + '</span>';
        layer.appendChild(el);
      });
      drawEdges();
      syncPanel();
    }

    function syncPanel() {
      const nd = byId(selected);
      if (!nd) { title.textContent = "노드 설정"; return; }
      title.textContent = nd.name + " 설정";
      fName.value = nd.name; fDesc.value = nd.desc; fInst.value = nd.inst;
      if (typeGroup) typeGroup.querySelectorAll("input").forEach((r) => { r.checked = r.value === nd.type; });
      if (toolsGroup) toolsGroup.querySelectorAll("input").forEach((c) => { c.checked = nd.tools.includes(c.value); });
    }
    function selectNode(id) {
      selected = id;
      [...layer.querySelectorAll(".awb-gnode")].forEach((el) => el.classList.toggle("is-sel", +el.dataset.id === id));
      syncPanel();
    }

    fName && fName.addEventListener("input", () => {
      const nd = byId(selected); if (!nd) return;
      nd.name = fName.value;
      const el = layer.querySelector('.awb-gnode[data-id="' + nd.id + '"] .awb-gnode__label');
      el && (el.textContent = nd.name || "이름 없음");
      title.textContent = (nd.name || "노드") + " 설정";
    });
    fDesc && fDesc.addEventListener("input", () => { const n = byId(selected); if (n) n.desc = fDesc.value; });
    fInst && fInst.addEventListener("input", () => { const n = byId(selected); if (n) n.inst = fInst.value; });
    typeGroup && typeGroup.addEventListener("change", (e) => {
      const nd = byId(selected); if (!nd || !e.target.value) return;
      nd.type = e.target.value;
      nd.icon = NODE_TYPE[nd.type].icon;
      nd.color = NODE_TYPE[nd.type].color;
      render();
    });
    toolsGroup && toolsGroup.addEventListener("change", (e) => {
      const nd = byId(selected); if (!nd) return;
      const v = e.target.value;
      if (e.target.checked) { if (!nd.tools.includes(v)) nd.tools.push(v); }
      else { nd.tools = nd.tools.filter((t) => t !== v); }
      render();
    });

    del && del.addEventListener("click", () => {
      if (nodes.length <= 1) return;
      const el = layer.querySelector('.awb-gnode[data-id="' + selected + '"]');
      const finish = () => {
        edges = edges.filter((e) => e.from !== selected && e.to !== selected);
        nodes = nodes.filter((n) => n.id !== selected);
        selected = nodes[0].id;
        render();
      };
      if (!el || reduceMotion) { finish(); return; }
      el.classList.add("awb-gnode--leave");
      setTimeout(finish, 240);
    });
    save && save.addEventListener("click", () => {
      const prev = save.textContent;
      save.textContent = "저장됨 ✓"; save.disabled = true;
      setTimeout(() => { save.textContent = prev; save.disabled = false; }, 1100);
    });

    addBtn && addBtn.addEventListener("click", () => {
      const n = nodes.length;
      const last = nodes[nodes.length - 1];
      const nd = mk("새 노드 " + n, (last ? last.x + 170 : 80) % 520, 110 + (n % 3) * 90, "action");
      nodes.push(nd);
      if (last) edges.push({ from: last.id, to: nd.id });
      selected = nd.id;
      render();
      const el = layer.querySelector('.awb-gnode[data-id="' + nd.id + '"]');
      if (el && !reduceMotion) el.classList.add("awb-gnode--enter");
    });

    // 포인터: 노드 이동 / 포트 연결
    let mode = null; // 'move' | 'connect'
    let move = null; // {nd, dx, dy}
    let conn = null; // {fromId, fromPt}
    const localPt = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    layer.addEventListener("pointerdown", (e) => {
      const el = e.target.closest(".awb-gnode");
      if (!el) return;
      const id = +el.dataset.id;
      const nd = byId(id);
      const port = e.target.closest("[data-port]");
      if (port && port.dataset.port === "out") {
        // 연결 시작
        e.preventDefault();
        mode = "connect";
        conn = { fromId: id, fromPt: portOut(nd) };
        try { layer.setPointerCapture(e.pointerId); } catch (_) {}
        return;
      }
      // 노드 이동
      e.preventDefault();
      selectNode(id);
      mode = "move";
      const p = localPt(e);
      move = { nd, dx: p.x - nd.x, dy: p.y - nd.y, moved: false };
      el.classList.add("is-dragging");
      try { layer.setPointerCapture(e.pointerId); } catch (_) {}
    });

    layer.addEventListener("pointermove", (e) => {
      if (mode === "move" && move) {
        const p = localPt(e);
        move.nd.x = Math.max(0, Math.min(p.x - move.dx, canvas.clientWidth - NODE_W));
        move.nd.y = Math.max(0, Math.min(p.y - move.dy, canvas.clientHeight - 96));
        move.moved = true;
        const el = layer.querySelector('.awb-gnode[data-id="' + move.nd.id + '"]');
        if (el) { el.style.left = move.nd.x + "px"; el.style.top = move.nd.y + "px"; }
        drawEdges();
      } else if (mode === "connect" && conn) {
        const p = localPt(e);
        // 대상 노드 하이라이트
        const overEl = document.elementFromPoint(e.clientX, e.clientY)?.closest?.(".awb-gnode");
        layer.querySelectorAll(".awb-gnode").forEach((el) => el.classList.remove("is-target"));
        if (overEl && +overEl.dataset.id !== conn.fromId) overEl.classList.add("is-target");
        drawEdges({ from: conn.fromPt, to: p });
      }
    });

    function endPointer(e) {
      if (mode === "connect" && conn) {
        const overEl = document.elementFromPoint(e.clientX, e.clientY)?.closest?.(".awb-gnode");
        if (overEl) {
          const toId = +overEl.dataset.id;
          const dup = edges.some((ed) => ed.from === conn.fromId && ed.to === toId);
          if (toId !== conn.fromId && !dup) edges.push({ from: conn.fromId, to: toId });
        }
        layer.querySelectorAll(".awb-gnode").forEach((el) => el.classList.remove("is-target"));
        render();
      }
      if (mode === "move" && move) {
        const el = layer.querySelector('.awb-gnode[data-id="' + move.nd.id + '"]');
        el && el.classList.remove("is-dragging");
      }
      mode = null; move = null; conn = null;
    }
    layer.addEventListener("pointerup", endPointer);
    layer.addEventListener("pointercancel", endPointer);

    render();
  })();

  /* ========================================================
   * 6) 크게 보기 라이트박스 (데모 + 컨트롤을 함께 이동)
   * ====================================================== */
  (function zoom() {
    const zoomBtn = $("awbZoom");
    const lightbox = $("awbLightbox");
    const stage = $("awbLightboxStage");
    if (!zoomBtn || !lightbox || !stage) return;
    const control = demo.parentNode ? demo.parentNode.querySelector(".daw-control") : null;
    const slot = document.createElement("div");
    slot.style.display = "none";
    let open = false;

    function openZoom() {
      if (open) return;
      open = true;
      demo.parentNode.insertBefore(slot, demo);
      stage.appendChild(demo);
      if (control) stage.appendChild(control);
      demo.classList.add("awb-demo--zoom");
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => lightbox.classList.add("is-open"));
    }
    function closeZoom() {
      if (!open) return;
      open = false;
      lightbox.classList.remove("is-open");
      document.body.style.overflow = "";
      setTimeout(() => {
        if (open) return;
        demo.classList.remove("awb-demo--zoom");
        if (slot.parentNode) slot.parentNode.insertBefore(demo, slot);
        if (control) demo.after(control);
        if (slot.parentNode) slot.parentNode.removeChild(slot);
        lightbox.hidden = true;
      }, 260);
    }
    zoomBtn.addEventListener("click", openZoom);
    lightbox.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeZoom(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open) closeZoom(); });
  })();
})();
