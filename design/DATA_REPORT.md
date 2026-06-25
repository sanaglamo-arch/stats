# DATA_REPORT — Фаза 11 (честный инвентарь `src/data/dataset.json`)

Назначение: зафиксировать, ЧТО реально есть в датасете и ГДЕ пробелы. Правило фазы —
**ничего не выдумывать**: на экран выводим только эти поля; нехватку показываем как
`н/д` и фиксируем здесь, а не подставляем числа.

Сгенерировано из dataset (`generatedAt` 2026-06-23). Цифры — фактический подсчёт по 222 строкам.

## Объём
- **222 строки** season × competition. Messi — 109, Ronaldo — 113.
- **24 сезона**: 2002/03 → 2025/26.
- **10 клубов/сборных**: Barcelona 70, Real Madrid 33, Manchester United 28, Portugal 22,
  Argentina 20, Al Nassr 15, Inter Miami 12, Juventus 12, Paris Saint-Germain 7, Sporting CP 3.
- **6 типов турниров** (`competitionType`): domestic_cup 49, league 48, champions_league 44,
  national_team 42, super_cup 31, club_world_cup 8.
- **~20 турниров** (`competitionName`): La Liga, Premier League, Serie A, Ligue 1, Saudi Pro
  League, MLS, UEFA Champions League, Copa del Rey, FA Cup, Coppa Italia, Supercopa de España,
  UEFA Super Cup, FIFA Club World Cup, CONCACAF Champions Cup, King's Cup, Argentina, Portugal и др.

## Метрики на строку (что показываем)
Полные: `matches, starts, minutes, goals, penaltyGoals, freekickGoals, assists, shots,
shotsOnTarget, yellowCards, redCards, hatTricks`, плюс массивы `trophies[]`, `individualAwards[]`,
и провенанс `verified`, `source`.

## Пробелы (флагать в UI как «н/д», НЕ фабриковать)
- **xG / xA — только 24 из 222 строк** (198 пустые `null`). Понятны лишь для сезонов ~2014+.
  → В таблицах показывать `н/д`; не агрегировать как 0.
- **Сборные (national_team, 42 строки) — часть `verified:false`**: карьерные тоталы сборных
  кросс-проверены, но разбивка по сезонам распределена (иллюстративная). → Помечать бэйджем
  «распределено» / приглушать, не выдавать за точный факт.
- **Жёлтые/красные карточки — 0 во всех 222 строках** (поле есть, но не заполнено seed-ом).
  → В таблицах показывать `н/д`, НЕ `0` (иначе соврём, что игроки не получали карточек).
- **`starts > matches` у Роналду** (Σ starts 1383 > Σ matches 1311) → производная `startShare` = **105%**.
  Источник неконсистентен (нельзя выйти в старте больше раз, чем сыграно матчей). Считаем честно из
  полей (`starts/matches`), показываем как есть с пометкой — НЕ клампим до 100% и НЕ выдумываем. Флаг
  качества данных для будущей сверки пайплайна.
- **xG-перформанс считается по modern-слайсу** (`modernGoals − xg`, где `modernGoals` = голы только в
  сезонах с известным xG, 2014+). НЕ `всекарьерные голы − modern xG` (иначе фантомные +640).
- **Источники живых адаптеров недоступны** (зафиксировано в `dataset.reports`): Wikidata
  деградировала до seed; Understat (xG/xA) недостижим; FBref/Transfermarkt — анти-бот 403.
  Базовые данные — seed `mvr` (messivsronaldo.app, кросс-проверка с Wikipedia/WebSearch).

## Вывод для UX
Данных МНОГО и они структурно богаты (14 числовых метрик × 6 типов турниров × до 24 сезонов).
Задача подачи — не «меньше», а «всё, но навигируемо»: таблицы season-by-season, табы по типам
турниров, фильтры (игрок/клуб/лига/сезон/метрика), career-тоталы, head-to-head. Разреженные
поля (xG/xA, сборные) — деградировать честно.

_Обновлять по мере добавления честных полей через адаптеры (Фаза 8 не ломать)._
