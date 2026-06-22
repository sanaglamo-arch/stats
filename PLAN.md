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
- [ ] P3-1 Страница: выбор двух игроков (хардкод Месси/Роналду) + селекторы 4 срезов
- [ ] P3-2 Живой предпросмотр карточки по выбранным параметрам
- [ ] P3-3 Кнопки «Скачать PNG» + «Поделиться» (Web Share API)
- [ ] P3-4 Переключатель языка RU/EN
- [ ] P3-5 Playwright-smoke страницы

## Фаза 4 — Полировка (Design / Motion + `ui-ux-pro-max`)
- [ ] P4-1 Анимации UI (Framer Motion), скелетоны, адаптив, prefers-reduced-motion
- [ ] P4-2 Финальный визуал карточки до «вау» (ревью через `ui-ux-pro-max`)

## Фаза 5 — Приёмка (Tester + Reviewer)
- [ ] P5-1 Playwright E2E happy-path (выбрал срез → карточка → скачал)
- [ ] P5-2 `/code-review` по диффу, фиксы
- [ ] P5-3 `BUILD_REPORT.md` (что собрано, как запустить, **превью карточки**, before-launch TODO: сверка данных + лицензия фото) + СТОП

## Журнал прогресса (агенты дописывают снизу)
<!-- 2026-XX-XX PX-Y done — заметка, commit -->
- 2026-06-21 ШАГ 0 — тулчейн node20 + pnpm9.15 (corepack-wrapper вместо сломанного self-exec shim); надёжный git-push с токеном через trap-scrub; реконсайл с непустым remote; docs запушены.
- 2026-06-21 Фаза 0 (P0-1..P0-5) — Next15/React19/TS-strict/Tailwind v4, dark-neon токены (Orbitron+Inter, glass), i18n RU/EN, ESLint/Prettier/Vitest/Playwright. Гейты: typecheck ✓ lint ✓ test 4/4 ✓ build ✓. ВАЖНО: билд гнать с отключённым sandbox (иначе SIGKILL/exit144). Каркас собран дирижёром из-за временного 529 на спавне субагентов; гейты прогнаны прозрачно.
- 2026-06-21 Фаза 1 (P1-1..P1-8) — ingestion-pipeline за `DataSource`: схема PlayerSeasonComp, адаптеры Wikidata/Understat/FBref (реальный парс + фолбэк на seed), резалки 4 срезов + производные + compare(). Датасет 112 строк (Месси 55, Роналду 57, 6 типов турниров), все verified:false, DATA_REPORT.md. Делегировано Data Engineer; отдельные Tester (гейты PASS) и Reviewer (APPROVE-WITH-NITS); фиксы по ревью (Understat league-keying баг, удалён dead code, общий enrich-хелпер, compare по ключам). Гейты: typecheck ✓ lint ✓ test 41/41 ✓ build ✓.
- 2026-06-21 Фаза 2 (P2-1..P2-4) — карточка по SPEC §4 (Orbitron+tabular, дивергентные бары, mechanical verdict, вотермарк), 2:3 1080×1620; PNG-рендер через Playwright (`/api/card`, fallback на системный Chrome); слот фото + 2 SVG-силуэта. Делегировано Card Engineer (ui-ux-pro-max); Tester PASS (54 теста, превью 1080×1620 реальные), Reviewer APPROVE-WITH-NITS; убрано мёртвое поле accentBrightVar. Дирижёр глазами одобрил превью (owner checkpoint). ⚠️ Данные seed: счёт перекошен (напр. Ballon d'Or Месси показывает 4 вместо 8) — на сверку владельцу (verified:false). Гейты: typecheck ✓ lint ✓ test 54/54 ✓ build ✓.
