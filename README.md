# MIDAS AX Design System

AX (Agent eXperience) 인터페이스를 짓기 위한 디자인 시스템 소개 사이트.

Pure HTML / CSS / JS — 빌드 도구 없이 바로 동작.

## 페이지 구조

```
index.html                  메인 (Hero + Pattern 3-up + FAQ)
├── get-started/            Get a start (Overview only)
├── foundation/             Foundation (Color Scheme / Dimension / Text / Effect)
├── components/             Components (Actions / Inputs / Chat / Surface / Feedback)
├── pattern/                Pattern (Agentic UI / Embedded UI / Automation UI)
└── system/                 디자인 시스템 자체 문서
    ├── foundation.html
    ├── layout.html
    ├── components.html
    └── audit.html
```

## CSS 구조

```
css/
├── reset.css       CSS reset
├── tokens.css      디자인 토큰 (color / spacing / radius / typography / motion)
├── base.css        body 기본 + typography utility class
├── layout.css      GNB · SNB · TOC · Footer · Page Grid
├── components.css  Card · Button · Form · Demo helpers
└── system.css      System reference 페이지 전용
```

## 기능

- 🌗 **라이트 · 다크 모드** 자동 적응 (모든 토큰)
- 🔍 **검색** — FlexSearch + 사전 빌드된 인덱스 (`assets/search-index.json`)
- 📱 **반응형** — viewport ≥ 1400 기준
- ♿ **접근성** — `aria-current`, `prefers-reduced-motion` 등 존중

## 로컬에서 보기

빌드 도구 없이 그냥 `index.html` 을 브라우저로 열면 됩니다. 다만 `fetch` 를 쓰는 검색 기능은 `file://` 에선 동작 안 하므로:

```bash
# Python 3
python3 -m http.server 8080

# Node
npx serve .
```

그 다음 `http://localhost:8080` 접속.

## 검색 인덱스 재생성

페이지 본문이 변경되면 검색 인덱스를 다시 생성:

```bash
node scripts/build-search-index.js
```

## 시스템 문서

이 사이트 자체를 짓기 위해 사용한 디자인 시스템 — `/system.html` 참조.
