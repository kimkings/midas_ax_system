# MIDAS AX Design System — Foundation

> 디자인 시스템의 최소 단위 명세. 페이지 구현은 이 문서를 단일 출처(SoT)로 삼는다.
> 항목은 필요할 때마다 추가/수정한다.

---

## 1. Layout

| 항목 | 값 | 설명 |
|---|---|---|
| `container-max` | **1400px** | 페이지 콘텐츠 최대 폭 |
| `padding-inline` | **20px** | 컨테이너 좌우 여백 |
| `snb-width` | **170px** | SNB(좌측 서브 네비) 폭 (Figma 실측) |
| `toc-width` | **140px** | TOC(우측 앵커) 폭 — 옵션 |
| `gnb-height` | **72px** | 상단 글로벌 네비 높이 (Figma 실측) |
| `footer-height` | **80px** | 하단 푸터 높이 |
| `section-gap` | **60px** | 섹션 간 수직 간격 |

- 데스크탑 전용. 모바일 레이아웃은 만들지 않음.
- 1400 이하 화면은 좌우 패딩(20)으로 자연스럽게 줄어들기만 한다.

---

## 2. Typography

- **Font Family**: `Pretendard Variable` (CDN 로드)
- Figma 노드별 `forceCode` 응답으로 추출한 실제 값.

| Token | Size / Line | Weight | Letter-spacing | 용도 |
|---|---|---|---|---|
| `display` | 72 / 1.1 (≈79) | 600 SemiBold | -1.58 | Hero 타이틀 |
| `h1` | 36 / 48 | 700 Bold | -0.97 | Detail 페이지 타이틀 (Bold variant) |
| `h2` | 36 / 1.18 (≈43) | 600 SemiBold | -1.09 | 섹션 타이틀 (Pattern / FAQ 등) |
| `h3` | 24 / 26 | 600 SemiBold | -0.04 | 카드/항목 타이틀 |
| `body-lg` | 20 / 1.6 (≈32) | 500 Medium | 0.14 | Hero 리드, intro |
| `body` | 17 / 1.5 (≈26) | 400 Regular | 0.14 | 기본 본문, 카드 설명 |
| `body-sm` | 15 / 22 | 500 Medium | 0.14 | 보조 본문 |
| `label` | 14 / 20 | 500 Medium | 0.20 | GNB nav, 작은 라벨 |
| `caption` | 11 / 14 | 600 SemiBold | 0.34 | UPPERCASE 라벨 |

- 페이지 기본 body는 `body` 토큰(17 / 1.5 / 400)을 그대로 상속한다.
- `h1`과 `h2`는 사이즈는 같고 weight만 다르다. 메인 섹션 타이틀은 항상 `h2`(SemiBold)를 쓴다.

---

## 3. Color (Semantic)

브랜드/팔레트 컬러는 별도로 두지 않는다. **시맨틱 토큰만** 정의한다.
유일한 컬러 포인트는 메인 Hero의 그라데이션 이미지(PNG export로 처리).

### Text

| Token | Value | 용도 |
|---|---|---|
| `label-strong` | `#171719` | 핵심 타이틀, 본문 (Figma material-dimmer / Woodsmoke) |
| `label-neutral` | `rgba(46, 47, 51, 0.88)` | 본문 |
| `label-alternative` | `rgba(55, 56, 60, 0.61)` | 보조 텍스트 |
| `label-assistive` | `rgba(55, 56, 60, 0.28)` | 캡션, 비활성 |

### Surface

| Token | Value | 용도 |
|---|---|---|
| `background` | `#FFFFFF` | 페이지 배경 |
| `fill-normal` | `rgba(112, 115, 124, 0.08)` | 카드/이미지 영역 틴트 |
| `inverse-background` | `#1B1C1E` | 다크 칩/토스트 |
| `inverse-label` | `#F7F7F8` | 다크 위 텍스트 |

### Line

| Token | Value | 용도 |
|---|---|---|
| `line-solid` | `#EAEBEC` | 구분선, 카드 경계 |

### Status

| Token | Value | 용도 |
|---|---|---|
| `status-positive` | `#00BF40` | Do 표시, 성공 상태 |
| `status-negative` | `#FF4242` | Don't 표시, 오류 상태 |

→ 총 **시맨틱 토큰 11개**. 이외는 만들지 않는다.

---

## 4. Spacing

8의 배수 + 의미적 단위.

| Token | Value |
|---|---|
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 24px |
| `space-6` | 40px |
| `space-8` | 60px |

---

## 5. Radius

| Token | Value | 용도 |
|---|---|---|
| `radius-sm` | 8px | 칩, 작은 버튼 |
| `radius-md` | 12px | 카드 |
| `radius-lg` | 24px | 큰 미디어 블록 (Pattern card media) |

---

## 6. GNB (Global Nav)

높이 **64px**, 좌/우 정렬 2열.

### 구조
- **Left**: 로고(✦ 아이콘 + "MIDAS AX System", Bold 18 / -0.2)
- **Right**: `Get a start` · `Foundation` · `Components` · `Pattern` + 검색 아이콘
  - 항목 간 gap: 32px
  - 폰트: `body-sm` (14/20, 500)
  - 활성 상태: `label-strong`, 비활성: `label-alternative`

### 통합 스타일 (모든 페이지 공통, Figma 66:11978)
- **배경**: `rgba(255, 255, 255, 0.88)` (88% 흰)
- **backdrop-filter**: `blur(16px)` (frosted glass)
- **보더 없음**
- 항상 `position: sticky; top: 0`
- 메인 페이지의 Hero 그라데이션이 GNB 뒤로 살짝 비치는 효과는 88% 투명도로 자연스럽게 표현됨

---

## 7. Footer

높이 **80px**, 상단 `1px solid line-solid`.

- **Left**: `© 2026 MIDAS, Inc.` (`body-sm`, `label-alternative`)
- **Right**: 페이지 인디케이터 (상세 페이지에서만 노출, 예: `쪽 1/2`)

---

## 8. SNB (Sub Navigation Bar — 오버뷰/상세 공유)

- **Width**: 200px
- **Position**: GNB 바로 아래에서 `position: sticky`
- **Padding-top**: 40px

### 구조
```
Overview            →   (section title, h3 크기, 우측 화살표)
─────────────────────────  (12px gap)
Actions             (caption, UPPERCASE, label-assistive)
─────────────────────────
Agentic UI          (body-sm)
Embedded UI         (body-sm)  ← active 상태
Automation UI       (body-sm)
```

### Item 상태
- **Default**: 배경 투명, 텍스트 `label-alternative`
- **Active**: 배경 `fill-normal`, 텍스트 `label-strong`, 우측 `→` 아이콘
- **Hover**: 배경 `fill-normal` (active와 동일한 배경, 텍스트는 alternative 유지)

---

## 9. TOC (On-page Anchor — 상세 페이지 옵션)

본문 길이가 길거나 명확한 섹션 구분이 있는 상세 페이지에만 부착한다.
짧은 상세는 생략해도 된다(페이지마다 결정).

- **Width**: 140px
- **Position**: GNB 바로 아래에서 `position: sticky`
- **Padding-top**: 40px (SNB와 동일선상)
- **Alignment**: 컨테이너 우측 (1400 그리드의 오른쪽 가장자리)

### 구조

```
INFO                       (caption, UPPERCASE, label-assistive)
─────
Anatomy                    (body-sm)
Usage                      (body-sm)  ← active
How to use                 (body-sm)
```

### Item 상태

- **Default**: 텍스트 `label-alternative`, 좌측 보더 없음
- **Active**: 텍스트 `label-strong`, weight 600 (현재 뷰포트의 섹션)
- **Hover**: 텍스트 `label-neutral`

### 동작

- 클릭 시 해당 섹션으로 부드러운 스크롤 (`scroll-behavior: smooth`)
- 스크롤 위치에 따라 활성 항목 자동 갱신 (IntersectionObserver — 다음 라운드에 구현)

### 레이아웃 규칙

| SNB | TOC | 본문 폭 산식 |
|---|---|---|
| ✓ | ✓ | `1400 - 200 - 140 - (gap × 2)` |
| ✓ | ✗ | `1400 - 200 - gap` |
| ✗ | ✓ | `1400 - 140 - gap` |
| ✗ | ✗ | `1400` (메인) |

→ TOC 유무에 따라 본문 영역이 자동으로 늘어나도록 grid/flex 설계.

---

## 10. Components (필요 시 추가)

이번 라운드에서 필요한 최소 컴포넌트만:

| Component | 용도 | 등장 페이지 |
|---|---|---|
| `Button (Primary)` | 메인 CTA ("피그마 링크 바로가기" 등) | Main, Detail |
| `Card (Pattern)` | 이미지 + 타이틀 + 설명 | Main, Overview |
| `Accordion (FAQ)` | 펼침/접힘 Q&A | Main |
| `SNB Item` | SNB 네비 항목 | Overview, Detail |
| `TOC Item` | 우측 앵커 항목 | Detail (옵션) |
| `Media Block` | 큰 프리뷰 영역 (둥근 사각형 + 내부 콘텐츠) | Detail |
| `Do / Don't Block` | 권장/비권장 예시 영역 (status 컬러 사용) | Detail (가이드 페이지) |

각 컴포넌트의 정확한 사이즈/스타일은 페이지 작업 시 Figma에서 직접 추출해 추가한다.

---

## 11. Pages

| URL | 역할 | GNB | SNB | TOC | 레이아웃 비고 |
|---|---|---|---|---|---|
| `/index.html` | Gate (메인) | transparent | ✗ | ✗ | Hero + Pattern 카드 + FAQ |
| `/pattern/index.html` | Pattern Overview | solid | ✓ | ✗ | 3-up Gallery 그리드 |
| `/pattern/embedded-ui.html` | Pattern Detail | solid | ✓ | ✓ | 섹션 본문 + Media Block 스택 |
| `/foundation/index.html` | Foundation Overview | solid | ✓ | ✗ | placeholder |
| `/components/index.html` | Components Overview | solid | ✓ | ✗ | placeholder |

→ TOC는 **상세 페이지마다 개별 결정**. 본문이 짧으면 생략한다.

---

## 12. Asset 처리 원칙

- **Hero 그라데이션**: Figma에서 PNG로 export → `assets/images/hero-gradient.png`. 추후 교체 가능.
- **Pattern 카드 이미지**: 각 상세 페이지 작업 시 Figma에서 PNG/SVG 추출.
- 아이콘은 인라인 SVG 우선.

---

_Last updated: 2026-05-28_
