# CLAUDE.md — MIDAS AX Design System Intro Site

이 프로젝트에서 Claude 가 따라야 할 컨벤션과 컨텍스트.

> 일반적인 디자인 시스템 사이트 워크플로우는 `~/.claude/skills/design-system-site/SKILL.md` 참조.
> 이 파일은 **이 프로젝트만의 구체값/컴포넌트** 를 기록.

---

## 프로젝트 개요

- **이름**: MIDAS AX Design System
- **목적**: AX (Agent eXperience) 인터페이스를 위한 디자인 시스템 소개 사이트
- **기술**: Pure HTML / CSS / JS (빌드 도구 없음)
- **배포**: GitHub Pages — https://pood4875-sungjin.github.io/MIDAS-AX-Design-System/
- **Repo**: https://github.com/pood4875-sungjin/MIDAS-AX-Design-System

## 페이지 구조

```
index.html                  Hero + Pattern 3-up + FAQ (메인)
get-started/                Get a start (Overview only)
foundation/                 Color Scheme / Dimension / Text / Effect
components/                 Actions / Inputs / Chat / Surface / Feedback (12개 컴포넌트)
pattern/                    Agentic UI / Embedded UI / Automation UI
system/                     디자인 시스템 자체 문서 (메타)
  ├── foundation.html       토큰 시각화 (Color L/D 듀얼칩, Type, Effect)
  ├── layout.html           GNB · SNB · TOC · Footer · Page Grid
  ├── components.html       Pill/Text/Link Button · Cards · Thumbnails · FAQ · Badges
  └── audit.html            토큰 coverage 표
system.html                 시스템 overview (3 카드 갤러리)
sandbox/                    시스템 유연성 검증
  ├── index.html            6시안 비교 갤러리 (System A/B/C + Free D/E/F)
  ├── a/b/c.html            시스템 안 변형 (Modern Minimal / Asymmetric / Inverse Accent)
  └── d/e/f.html            자유 변형 (AI Wavy / Scroll Playground / Pixel Kitsch)
```

## CSS 아키텍처

```
css/
├── reset.css         CSS reset
├── tokens.css        모든 토큰 (single source) — light/dark 둘 다 정의
├── base.css          body + .t-h1, .t-h3, .t-body-sm, .t-label, .t-caption
├── layout.css        .gnb, .snb, .toc, .footer, .page-grid (--no-toc, --full)
├── components.css    .btn-pill (lg/md/sm), .btn-text, .p-card, .faq, .hero, .card-grid
├── system.css        system 페이지 전용 (.sys-color, .sys-block, .sys-code 등)
├── sandbox.css       sandbox 공용 (.sb-cta, .sb-pricing-grid, .sb-demo, .sb-switcher)
├── sandbox-b.css     Asymmetric 변형 전용
├── sandbox-c.css     Inverse Accent 전용
├── sandbox-d.css     AI Wavy Dark 전용
├── sandbox-e.css     Scroll Playground 전용
└── sandbox-f.css     Pixel Kitsch 전용
```

## 핵심 토큰 (요약 — 전체는 `css/tokens.css`)

### Color — Light → Dark 매핑

| 토큰 | Light | Dark |
|---|---|---|
| `--color-label-strong` | `#171719` | `#F7F7F8` |
| `--color-label-neutral` | `#2E2F33E0` (88%) | `#C2C4C8` |
| `--color-label-alternative` | `#37383C9C` (61%) | `#F7F7F89C` |
| `--color-label-assistive` | `#37383C47` (28%) | `#F7F7F847` |
| `--color-background` | `#FFFFFF` | `#121212` |
| `--color-surface-elevated` | `#FFFFFF` | `#1B1C1E` |
| `--color-surface-subtle` | `#F7F7F8` | `#F7F7F808` (3%) |
| `--color-fill-normal` | `#70737C14` (8%) | `#F7F7F814` (8%) |
| `--color-fill-hover` | `#1717190A` (4%) | `#F7F7F80F` (6%) |
| `--color-fill-pressed` | `#17171914` (8%) | `#F7F7F81F` (12%) |
| `--color-inverse-background` | `#1B1C1E` | `#F7F7F8` ← **뒤집힘!** |
| `--color-inverse-label` | `#F7F7F8` | `#1B1C1E` |
| `--color-line-solid` | `#EAEBEC` | `#70737C38` (22%) |
| `--color-line-subtle` | `#70737C29` (16%) | `#70737C29` |
| `--color-status-positive` | `#00BF40` | (동일) |
| `--color-status-negative` | `#FF4242` | (동일) |

⚠️ **inverse 토큰은 모드 따라 뒤집힘**. "항상 다크 강조" 가 필요한 섹션(예: `.sb-cta`, `.sb-price--featured`) 은 **고정 hex** 사용.

### Typography (모두 unitless line-height + % 주석)

| 유틸 | font-size | line-height | weight | letter-spacing |
|---|---|---|---|---|
| `.t-h1` | 28px | 1.33 (133%) | 600 | -0.5px |
| `.t-h3` | 22px | 1.08 (108%) | 600 | -0.427px |
| `.t-body-sm` | 15px | 1.47 (147%) | 500 | 0.144px |
| `.t-label` | 14px | 1.43 (143%) | 500 | 0.2px |
| `.t-caption` | 11px | 1.27 (127%) | 600 | 0.5px |

Hero title 별도: Poppins 72px / 1.15 / 500 / -4px

### Spacing / Radius / Motion

```
--space-2/3/4/5/6/8: 8 / 12 / 16 / 24 / 40 / 60
--radius-sm/md/lg:   8 / 12 / 24
--duration-fast/normal/slow: 120 / 240 / 400ms
--easing-standard:   cubic-bezier(0.33, 1, 0.68, 1)   /* ease-out */
--easing-emphasized: cubic-bezier(0.22, 1, 0.36, 1)   /* 강조 등장 */
```

### Layout 변수

```
--container-max:  1400px
--padding-inline: 0 (≥1400) / 40px (<1400)
--snb-width:      180px
--toc-width:      160px
--gnb-height:     72px
--section-gap:    60px
```

## 컴포넌트 인벤토리

### Buttons (3 sizes)
- `.btn-pill` (LG, 16/24, 16px) — Hero CTA
- `.btn-pill--md` (14/22, 13px) — gallery card CTA, body actions
- `.btn-pill--sm` (10/18, 12px) — GNB 피그마 바로가기 등
- `.btn-text` — GNB nav style, 보조 텍스트 버튼

### Card / Container
- `.card-grid` — 3-up 카드 그리드
- `.p-card` — pattern 카드 (media + body 구조)
- `.gallery-card` — system 페이지 갤러리 카드 (cta 호버 인터랙션)

### FAQ
- `.faq__item`, `.faq__summary`, `.faq__q`, `.faq__icon`, `.faq__answer-wrap`
- 인라인 SVG (+ 아이콘) + currentColor 사용, 펼치면 45도 회전

### Hero
- `.hero`, `.hero__content`, `.hero__title`, `.hero__lead`, `.hero__cta`
- 글자(char)별 wave 애니메이션 (`.hero__title .char` + `--char-i`)

### Layout 컴포넌트
- `.gnb` (height 72, blur 16, bg 88%), variants: `--solid`, `--transparent`
- `.snb` (width 180, sticky top +56) + `.snb__inner` (스크롤바 inset 처리)
- `.toc` (width 160, smooth scroll + scroll-spy)
- `.footer` (margin-top 200, badge)

### 페이지 그라데이션
- `.page-gradient--top` (Figma 50:27838) — 우상단 블루 광원
- `.page-gradient--bottom` (Figma 111:4832) — 좌하단 광원
- 다크모드: opacity 0.1, screen blend

## 검증된 함정들 (이 프로젝트 진행 중 발견)

1. **inverse-bg 다크모드 뒤집힘** — Pricing Featured / CTA Banner 는 고정 `#1B1C1E` 사용
2. **Grid auto-flow 깨짐** — Pricing 의 conditional badge → `grid-template-areas` + 절대위치 badge
3. **SNB 스크롤바 위치** — `.snb__inner` 로 width calc + margin-inline + padding-right 처리
4. **Hero CTA 다중 버튼** — `text-align: center` 만으론 안 됨, `display: flex; justify-content: center` 필요
5. **section 간격** — `.section + .section { padding-top: 160px }` (margin 아님 — collapse 방지)
6. **상대경로 사용** — file:// 환경에서도 작동하도록 모든 경로 상대경로
7. **검색 인덱스** — 페이지 본문 수정 시 `node scripts/build-search-index.js` 재생성

## 자주 쓰는 명령어

```bash
# 로컬 서버
python3 -m http.server 8080
# → http://localhost:8080

# 검색 인덱스 재생성
node scripts/build-search-index.js

# Git push (Keychain 인증 저장됨)
git add . && git commit -m "..." && git push
```

## 배포 워크플로우

1. 변경사항 작업
2. 로컬 확인 (`python3 -m http.server 8080`)
3. 검색 콘텐츠 바뀌었으면: `node scripts/build-search-index.js`
4. `git add . && git commit -m "..." && git push`
5. 1~2분 뒤 GitHub Pages 자동 반영

## Sandbox 작업 시 참고

- A/B/C (System 그룹): 토큰/컴포넌트 100% 시스템 내부, **레이아웃·UX 차원** 으로 변화
- D/E/F (Free 그룹): 사용자 명시 가이드 필요, **시각언어 완전 자유**
  - D: "어두운 AI 꿀렁임" — SVG-like blob morph + 블루/퍼플 글로우
  - E: "스크롤 인터랙션 카드형" — Parallax + Pin&Stack + Sticky Cross-fade + Horizontal
  - F: "키치 + 픽셀형" — Press Start 2P + Y2K 컬러 + 픽셀 그림자 + 스티커

## 작업 스타일 (이 사용자 선호)

- 한국어 응답, 기술 용어는 영문 유지
- 코드 변경 후 간단한 변경 요약 필수
- 작업 끝낼 때 "확인하시고 추가 보정 필요한 부분 있으면 알려주세요" 형식
- 큰 작업 전에는 AskUserQuestion 으로 옵션 제시 (3-4개 + 추천 표시)
- 변경 사항 묶어서 git push 까지 자동 진행 OK
