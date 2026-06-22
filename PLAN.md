# PLAN — Task Ledger (FootyCompare MVP)

Каждая итерация дирижёра: читай `SPEC.md` → бери ПЕРВУЮ невыполненную `[ ]` сверху (с учётом фаз,
не начинай фазу, пока предыдущая не закрыта) → делегируй → Tester+Reviewer → коммит+пуш → отметь `[x]`.
Формат: `- [x] PXX-N ... — заметка (commit)`.

## Фаза 0 — Каркас (Architect)
- [x] P0-1 Скаффолд Next.js 15 + React 19 + TS strict + Tailwind v4, src/, алиас `@/`, pnpm — (P0 commit)
- [x] P0-2 Тулинг: ESLint+Prettier, Vitest, Playwright; скрипты typecheck/lint/test/build/e2e — (P0 commit)
- [x] P0-3 Дизайн-токены: тёмный-неон шаблон, CSS-переменные, шрифты (через `ui-ux-pro-max`) — Orbitron+Inter, glassmorphism+неон (P0 commit)
- [x] P0-4 i18n-каркас (RU+EN словари, переключатель) — типизированный словарь + провайдер + тоггл (P0 commit)
- [x] P0-5 CI-гейты локально зелёные на пустом каркасе — typecheck/lint/test(4)/build ✓ (P0 commit)

## Фаза 1 — Данные / ingestion-pipeline (Data Engineer)
- [x] P1-1 Схема `PlayerSeasonComp` (types.ts) + интерфейс `DataSource` — точно по SPEC §6 + verified/source (P1 commit)
- [x] P1-2 Парсер-адаптер Wikidata/Wikipedia + нормализация — реальный SPARQL-адаптер с фолбэком на seed (P1 commit)
- [x] P1-3 Парсер-адаптер Understat (xG/xA, 2014+) — embedded-JSON декодер, ключ по league-строке (P1 commit)
- [x] P1-4 Обогащение FBref/Transfermarkt (best-effort) + деградация на seed — HTML-парсер, фолбэк при 403 (P1 commit)
- [x] P1-5 Разовый ingestion → нормализация → JSON — `pnpm ingest` → src/data/dataset.json (112 строк) (P1 commit)
- [x] P1-6 Функции-резалки: 4 среза + производные (голы/90, конверсия, xg/90) — aggregate.ts, compare() по ключам (P1 commit)
- [x] P1-7 `verified:false` на всех записях + `DATA_REPORT.md` — все 112 строк, отчёт по источникам/сверке/фото (P1 commit)
- [x] P1-8 Юнит-тесты нормализации и агрегации (фикстуры, без сети) — 41 тест зелёный (P1 commit)

## Фаза 2 — Генератор карточки (Card/Design Engineer + `ui-ux-pro-max`)
- [x] P2-1 Компонент карточки по эталону SPEC §4, вертикаль 2:3 (1080×1620) — glass+неон, дивергентные бары, mechanical score, вотермарк (P2 commit)
- [x] P2-2 Слот фото игрока — replaceable src + 2 стилизованных SVG-силуэта (права = before-launch TODO в DATA_REPORT) (P2 commit)
- [x] P2-3 Рендер в PNG через Playwright screenshot + `/api/card` — fallback на системный Chrome; контракт query→PNG (P2 commit)
- [x] P2-4 Тесты рендера (view-model на срезах, browser-free) — 13 тестов карточки; реальные превью 1080×1620 в preview/ (P2 commit)

## Фаза 3 — Интерфейс (UI Engineer)
- [x] P3-1 Страница + селекторы 4 срезов по игроку (period/competition/penalties) + same-age, опции из данных (P3 commit)
- [x] P3-2 Живой предпросмотр (in-memory ComparisonCard, scale-to-fit, без /api/card) реактивен на селекторы (P3 commit)
- [x] P3-3 «Скачать PNG» (paramsFromSlice→/api/card→blob) + «Поделиться» (Web Share API: files→url→clipboard) (P3 commit)
- [x] P3-4 Переключатель языка RU/EN — UI + превью + URL карточки (P3 commit)
- [x] P3-5 Playwright-smoke — реально прогнан на системном Chrome (1 passed) (P3 commit)

## Фаза 4 — Полировка (Design / Motion + `ui-ux-pro-max`)
- [x] P4-1 Анимации UI (Framer Motion: stagger/fade/press), скелетон превью, адаптив, prefers-reduced-motion (всё под guard) (P4 commit)
- [x] P4-2 Финальный визуал карточки до «вау» (ревью ui-ux-pro-max: фото-glass, бары, halo-футер, вотермарк) — карточка статична (P4 commit)

## Фаза 5 — Приёмка (Tester + Reviewer)
- [x] P5-1 Playwright E2E happy-path (срез → превью обновилось → реальный PNG скачан, проверен по сигнатуре+размеру) (P5 commit)
- [x] P5-2 Финальное acceptance-ревью всего репо (correctness+security+cleanup) — APPROVE-WITH-NITS, 0 блокеров (P5 commit)
- [x] P5-3 `BUILD_REPORT.md` (что собрано, запуск, превью карточки, before-launch TODO: сверка данных + лицензия фото) + СТОП (P5 commit)

## Журнал прогресса (агенты дописывают снизу)
<!-- 2026-XX-XX PX-Y done — заметка, commit -->
- 2026-06-21 ШАГ 0 — тулчейн node20 + pnpm9.15 (corepack-wrapper вместо сломанного self-exec shim); надёжный git-push с токеном через trap-scrub; реконсайл с непустым remote; docs запушены.
- 2026-06-21 Фаза 0 (P0-1..P0-5) — Next15/React19/TS-strict/Tailwind v4, dark-neon токены (Orbitron+Inter, glass), i18n RU/EN, ESLint/Prettier/Vitest/Playwright. Гейты: typecheck ✓ lint ✓ test 4/4 ✓ build ✓. ВАЖНО: билд гнать с отключённым sandbox (иначе SIGKILL/exit144). Каркас собран дирижёром из-за временного 529 на спавне субагентов; гейты прогнаны прозрачно.
- 2026-06-21 Фаза 1 (P1-1..P1-8) — ingestion-pipeline за `DataSource`: схема PlayerSeasonComp, адаптеры Wikidata/Understat/FBref (реальный парс + фолбэк на seed), резалки 4 срезов + производные + compare(). Датасет 112 строк (Месси 55, Роналду 57, 6 типов турниров), все verified:false, DATA_REPORT.md. Делегировано Data Engineer; отдельные Tester (гейты PASS) и Reviewer (APPROVE-WITH-NITS); фиксы по ревью (Understat league-keying баг, удалён dead code, общий enrich-хелпер, compare по ключам). Гейты: typecheck ✓ lint ✓ test 41/41 ✓ build ✓.
- 2026-06-21 Фаза 2 (P2-1..P2-4) — карточка по SPEC §4 (Orbitron+tabular, дивергентные бары, mechanical verdict, вотермарк), 2:3 1080×1620; PNG-рендер через Playwright (`/api/card`, fallback на системный Chrome); слот фото + 2 SVG-силуэта. Делегировано Card Engineer (ui-ux-pro-max); Tester PASS (54 теста, превью 1080×1620 реальные), Reviewer APPROVE-WITH-NITS; убрано мёртвое поле accentBrightVar. Дирижёр глазами одобрил превью (owner checkpoint). ⚠️ Данные seed: счёт перекошен (напр. Ballon d'Or Месси показывает 4 вместо 8) — на сверку владельцу (verified:false). Гейты: typecheck ✓ lint ✓ test 54/54 ✓ build ✓.
- 2026-06-21 Фаза 3 (P3-1..P3-5) — Studio: per-player селекторы 4 срезов + same-age, реактивный scale-to-fit предпросмотр (in-memory), Download PNG (blob через /api/card) + Share (Web Share API с фолбэками), RU/EN. Делегировано UI Engineer (ui-ux-pro-max); Tester PASS (54 теста + e2e 1 passed на системном Chrome, скриншоты desktop/mobile), Reviewer APPROVE-WITH-NITS (нитки → в Фазу 4). Дирижёр одобрил UI глазами (desktop 2-кол, mobile ведёт карточкой). Гейты: typecheck ✓ lint ✓ test 54/54 ✓ build ✓ e2e ✓.
- 2026-06-21 Фаза 4 (P4-1,P4-2) — UI-моушн (stagger/fade/press, всё под useReducedMotion), скелетон+кроссфейд превью, адаптив; карточка поднята до «вау» через ui-ux-pro-max (фото-glass, инсет-бары + diamond-нода, halo-футер) — статична, без моушна (PNG детерминирован). Phase-3 нитки внесены (aria-live busy, modeOf инлайн). Делегировано Design/Motion; Tester PASS (4 гейта+e2e, card/render motion-free подтверждён), Reviewer APPROVE-WITH-NITS → убран dead PressScale. Дирижёр одобрил финальный визуал. Гейты: typecheck ✓ lint ✓ test 54/54 ✓ build ✓ e2e ✓.
- 2026-06-21 Фаза 5 (P5-1..P5-3) — happy-path E2E (срез→превью→реальный PNG скачан, проверка PNG-сигнатуры+размера); финальное acceptance-ревью всего репо: 0 блокеров, подтверждены preview⇄PNG консистентность, mechanical verdict, безопасность /api/card (нет SSRF), data honesty, нет any; BUILD_REPORT.md написан. Гейты финал: typecheck ✓ lint ✓ test 54/54 ✓ build ✓ e2e 2/2 ✓. BUILD COMPLETE.
- 2026-06-22 Before-launch DATA ACCURACY pass — (а) Data Engineer перекалибровал seed под документированную реальность: карьерные тоталы (голы 840/901, ассисты 380/245, матчи 1084/1271, минуты 88k/100k, трофеи 44/35), Ballon d'Or Месси 4→8 (по сезонам), Роналду 5; все verified:false; датасет 187 строк; DATA_REPORT обновлён. (б) Дирижёр нашёл и починил БАГ агрегации: трофеи и Ballon d'Or считались по уникальным ИМЕНАМ (uniq) → Месси показывал 1 ЗМ и трофеи=типы. Введены trophyCount (distinct season+name = выиграно) и ballonDor (distinct сезоны) → карточка теперь Трофеи 44:35, ЗМ 8:5, итог career 6:4 Месси. Отдельные Tester (data-audit PASS) и Tester (fix-verify PASS, card-path 8/5 + 44/35, превью перегенерены). Гейты: typecheck ✓ lint ✓ test 55/55 ✓ build ✓ e2e 2/2 ✓.
