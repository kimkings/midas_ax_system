// ============================================
// 새로고침 시 항상 최상단에서 시작
// ============================================
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

// ============================================
// Hero 타이틀 — 글자(char) 단위 fade-in stagger
//   - <br> 줄바꿈은 보존
//   - 각 단어는 white-space:nowrap 컨테이너로 묶어 단어 중간 줄바꿈 방지
//   - 각 글자를 <span class="char" style="--char-i:N"> 로 감쌈
//   - CSS animation 이 --char-i 기반으로 천천히 은은하게 등장
// ============================================
(() => {
  const escapeChar = (c) => c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c;

  document.querySelectorAll(".hero__title").forEach((title) => {
    const html = title.innerHTML;
    if (/class="char"/.test(html)) return;  // 중복 방지

    // <br> 위치 보존을 위해 마커 치환 후 textContent 추출
    const withMarker = html.replace(/<br\s*\/?>/gi, "§§BR§§");
    const tmp = document.createElement("div");
    tmp.innerHTML = withMarker;
    const text = tmp.textContent;

    let i = 0;
    const newHtml = text.split("§§BR§§").map((segment) => {
      // 공백/단어로 분리 — 단어는 nowrap 으로 묶어 줄바꿈 방지
      return segment.split(/(\s+)/).map((part) => {
        if (/^\s+$/.test(part) || part === "") return part;
        const chars = Array.from(part)
          .map((ch) => `<span class="char" style="--char-i:${i++}">${escapeChar(ch)}</span>`)
          .join("");
        return `<span class="word">${chars}</span>`;
      }).join("");
    }).join("<br>");

    title.innerHTML = newHtml;
  });
})();

// ============================================
// 문장 단위 자동 줄바꿈
//   - .split-sentences 안의 모든 p 의 마침표/?/! 뒤 공백을 <br> 로 치환
//   - 한글: "...니다. " / "...요. " / "까? " 모두 지원
//   - 이미 <br> 이 있는 경우는 건드리지 않음
// ============================================
(() => {
  // 문장 종결: . ! ? 。 (전각 마침표 포함) + 공백
  const SENTENCE_END = /([.!?。])(\s+|&nbsp;)/g;
  document.querySelectorAll(".split-sentences").forEach((container) => {
    container.querySelectorAll("p").forEach((p) => {
      const html = p.innerHTML.trim();
      // 이미 <br> 가 포함돼 있으면 스킵 (수동 처리된 경우)
      if (/<br\s*\/?>/i.test(html)) return;
      p.innerHTML = html.replace(SENTENCE_END, "$1<br>");
    });
  });
})();

// ============================================
// GNB 활성화 — 현재 URL에 맞춰 aria-current 부여
// ============================================
(() => {
  const path = location.pathname;
  document.querySelectorAll(".gnb__nav a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (!href) return;
    if (path === href || (href !== "/" && path.startsWith(href.replace(/\/$/, "")))) {
      a.setAttribute("aria-current", "page");
    }
  });
})();

// ============================================
// FAQ 토글 — 클릭 시 .is-open 토글 (CSS grid-rows로 부드러운 슬라이드)
// ============================================
(() => {
  document.querySelectorAll(".faq__summary").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq__item");
      if (!item) return;
      const isOpen = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(isOpen));
    });
  });
})();

// ============================================
// TOC 클릭 — smooth scroll (JS로 직접 처리, CSS scroll-behavior 의존 X)
// ============================================
(() => {
  document.querySelectorAll(".toc__item").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("#")) return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      const offset = 72 + 32;  // GNB height + 여유
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
      history.replaceState(null, "", href);
    });
  });
})();

// ============================================
// TOC scroll-spy — scroll 이벤트로 현재 영역 판정
// (IntersectionObserver가 일부 환경에서 동작 안 해서 scroll 기반으로 처리)
// ============================================
(() => {
  const tocItems = document.querySelectorAll(".toc__item");
  if (!tocItems.length) return;

  const itemMap = new Map();
  tocItems.forEach((item) => {
    const href = item.getAttribute("href") || "";
    if (href.startsWith("#")) itemMap.set(href.slice(1), item);
  });

  const sections = Array.from(itemMap.keys())
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!sections.length) return;

  const setActive = (id) => {
    tocItems.forEach((it) => it.removeAttribute("aria-current"));
    const a = itemMap.get(id);
    if (a) a.setAttribute("aria-current", "true");
  };

  // 화면 상단에서 200px 아래(=GNB+여유)를 기준선으로 판정
  const updateSpy = () => {
    const threshold = 200;
    let activeId = sections[0].id;
    for (const sec of sections) {
      if (sec.getBoundingClientRect().top <= threshold) {
        activeId = sec.id;
      }
    }
    setActive(activeId);
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateSpy();
      ticking = false;
    });
  };

  updateSpy();  // 초기 1회
  window.addEventListener("scroll", onScroll, { passive: true });
})();

// ============================================
// SNB 인페이지 앵커 — smooth scroll + scroll-spy (Overview 페이지)
//   - SNB 항목 href 가 "#..." 인 경우에만 활성화
//   - 다른 페이지(SNB가 .html 링크)는 영향 없음
// ============================================
(() => {
  const snbAnchors = Array.from(document.querySelectorAll('.snb__item[href^="#"]'));
  if (!snbAnchors.length) return;

  // smooth scroll
  snbAnchors.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href") || "";
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      const offset = 72 + 32;  // GNB height + 여유
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
      history.replaceState(null, "", href);
    });
  });

  // scroll-spy
  const itemMap = new Map();
  snbAnchors.forEach((item) => {
    itemMap.set(item.getAttribute("href").slice(1), item);
  });
  const sections = Array.from(itemMap.keys())
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!sections.length) return;

  const setActive = (id) => {
    snbAnchors.forEach((it) => it.removeAttribute("aria-current"));
    const a = itemMap.get(id);
    if (a) a.setAttribute("aria-current", "page");
  };

  const updateSpy = () => {
    const threshold = 200;
    let activeId = sections[0].id;
    for (const sec of sections) {
      if (sec.getBoundingClientRect().top <= threshold) activeId = sec.id;
    }
    setActive(activeId);
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { updateSpy(); ticking = false; });
  };
  updateSpy();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

// ============================================
// Reveal-on-scroll — [data-reveal] 요소에 .is-revealed 토글
// - 한 번 보이면 더 이상 관찰하지 않음 (animate once)
// - rootMargin으로 살짝 늦게 트리거 → 화면 안쪽에서 등장
// ============================================
(() => {
  const targets = document.querySelectorAll("[data-reveal]");
  if (!targets.length) return;

  // prefers-reduced-motion이면 즉시 보이게
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    targets.forEach((el) => el.classList.add("is-revealed"));
    return;
  }

  const io = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  targets.forEach((el) => io.observe(el));

  // Fallback — 페이지 로드 후 viewport 안의 요소는 즉시 reveal
  // (IntersectionObserver가 일부 환경에서 안 떠도 화면이 비어 보이지 않게)
  window.addEventListener("load", () => {
    setTimeout(() => {
      targets.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add("is-revealed");
        }
      });
    }, 100);
  });
})();

// ============================================
// Lightbox — 콘텐츠 이미지 클릭 시 원본 해상도로 크게 보기
// ============================================
(() => {
  const SEL = ".spec-hero img, .spec-image img, .ov-grid img";
  const ov = document.createElement("div");
  ov.className = "lightbox";
  ov.setAttribute("aria-hidden", "true");
  ov.innerHTML =
    '<button class="lightbox__close" type="button" aria-label="닫기">&times;</button>' +
    '<img class="lightbox__img" alt="" />';
  document.body.appendChild(ov);
  const lbImg = ov.querySelector(".lightbox__img");

  const open = (src, alt) => {
    lbImg.src = src;
    lbImg.alt = alt || "";
    ov.classList.add("is-open");
    ov.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    ov.classList.remove("is-open");
    ov.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lbImg.removeAttribute("src");
  };

  document.addEventListener("click", (e) => {
    const img = e.target.closest(SEL);
    if (img) {
      open(img.currentSrc || img.src, img.alt);
      return;
    }
    if (e.target === ov || e.target.closest(".lightbox__close")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && ov.classList.contains("is-open")) close();
  });
})();
