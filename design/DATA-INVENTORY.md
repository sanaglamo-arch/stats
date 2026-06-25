# ПОЛНЫЙ ИНВЕНТАРЬ ДАННЫХ — что у нас ЕСТЬ (для UX-моделирования Фазы 11)

> От босса: структурщик (Агент A) должен продумать, КАК и ГДЕ разместить ВСЕ эти данные.
> Вот исчерпывающий список. Модели по нему — НИЧЕГО не упускать. Источник: `src/data/dataset.json`.

## Масштаб
- **222 строки** = player × season × competition.
- **2 игрока:** messi, ronaldo.
- **24 сезона:** 2002/03 … 2025/26.

## Метрики в каждой строке (18 стат + мета) — ВСЕ должны быть доступны
**Игровое время:** matches, starts, minutes, ageDuringSeason
**Атака:** goals, assists, penaltyGoals, freekickGoals, hatTricks
**Качество удара:** shots, shotsOnTarget, xg (xG), xa (xA)
**Дисциплина:** yellowCards, redCards
**Достижения:** trophies, individualAwards
**Мета:** source, verified (показывать значок «выверено», не как метрику)

→ Производные, которые НАДО считать и показывать (из имеющихся, не выдумывая):
goals/90, assists/90, goals+assists (G+A), G+A/90, minutes/goal, конверсия (goals/shots),
shotsOnTarget%, xG−goals (over/under-perf), penalty% от goals, доля стартов (starts/matches).

## 6 типов соревнований (competitionType) — оси табов
champions_league · club_world_cup · domestic_cup · league · national_team · super_cup

## 34 соревнования (competitionName) — гранулярный разрез
AFC Champions League · AFC Champions League Elite · Arab Club Champions Cup · Argentina ·
CONCACAF Champions Cup · Copa del Rey · Coppa Italia · Coupe de France · Domestic Cup (mixed) ·
Domestic Super Cup (mixed) · FA Community Shield · FA Cup · FIFA Club World Cup ·
Football League Cup · King's Cup · La Liga · Leagues Cup · Ligue 1 · MLS Cup Playoffs ·
Major League Soccer · Portugal · Premier League · Primeira Liga · Saudi Pro League ·
Saudi Pro League / Premier League · Saudi Super Cup · Serie A · Supercopa de España ·
Supercoppa Italiana · Taça de Portugal · Trophée des Champions · U.S. Open Cup ·
UEFA Champions League · UEFA Super Cup

## 10 клубов/сборных (club)
Messi: Barcelona · Paris Saint-Germain · Inter Miami · Argentina
Ronaldo: Sporting CP · Manchester United · Real Madrid · Juventus · Al Nassr · Portugal

## Разрезы, которые надо смоделировать (все комбинации)
- по СЕЗОНАМ (24), по ТИПУ турнира (6), по КОНКРЕТНОМУ турниру (34), по КЛУБУ (10)
- карьерные ТОТАЛЫ и тоталы внутри каждого разреза
- HEAD-TO-HEAD: Месси vs Роналду по любой метрике × любому разрезу, с дельтой и «кто ведёт»
- возрастная ось (ageDuringSeason) — голы/результативность по возрасту, наложение кривых

## Задача (от босса, порядок)
1. **Агент A (структура/UX):** смоделировать ГДЕ и КАК разместить ВСЁ это — макет/IA так,
   чтобы ни одна метрика и ни один разрез не потерялись, но и не было свалки (табы/фильтры/
   раскрытия/sticky). Выдать менеджеру на ревью.
2. **Агент B (дизайн):** ОЧЕНЬ крутой дизайн + СОЧНЫЕ анимации, чтоб от них кайф:
   count-up чисел, растущие бары, плавные переходы табов, scroll-reveal секций, hover-микроинтеракции,
   анимированные дельты/кривые. Премиум-ощущение. Через скилл ui-ux-pro-max.
