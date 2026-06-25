# Image generation prompts — CompareGOATs player renders (for boss)

Сгенерить в ChatGPT (image gen), прогнать через **remove.bg** → прозрачный PNG,
сохранить с ТОЧНЫМИ именами (дизайн уже зашит на них):

```
public/players/messi-render.png      ← Месси (прозрачный cut-out)
public/players/ronaldo-render.png    ← Роналду (прозрачный cut-out)
```

---

## МЕССИ (стоит слева, смотрит ВПРАВО к центру)

> ⚠️ Старый промпт генератор ДУШИЛ (Аргентина+№10+левша = палит реального человека).
> Этот деперсонализирован — должен пройти. Описываем ВИД формы, без «легенда/левша/нац.сборная».

```
Cinematic full-body hero render of an athletic male football player wearing a sky-blue and white vertical striped jersey with black shorts and the number 10. Confident champion stance, body turned 3/4 to the RIGHT as if facing a rival across an arena. Dramatic overhead stadium spotlight, soft rim light on the silhouette, cool cinematic color grade. Full body head-to-boots, sharp focus, photorealistic, ultra-detailed, 8k. Plain flat grey studio background for easy cut-out. No text, no sponsor logos, no watermark. Portrait 2:3.
```

**Если ВСЁ РАВНО ругается** — стилизованный вариант (его генераторы почти всегда пропускают; но тогда лучше и Роналду перегенерить в этом же стиле, чтоб не мисматч):

```
Stylized sports-poster illustration of a fictional football player character in a sky-blue and white vertical striped jersey, number 10, dynamic heroic pose turned 3/4 to the RIGHT, dramatic cinematic lighting, full body, isolated on a flat grey background. No text, no logos, no watermark. Portrait 2:3.
```

## РОНАЛДУ (стоит справа, смотрит ВЛЕВО к центру)

```
Cinematic full-body hero render of a legendary athletic football forward in the Portugal national team home kit — deep red shirt with green trim, jersey number 7. Powerful explosive champion stance, body turned 3/4 to the LEFT as if facing a rival across an arena. Dramatic overhead stadium spotlight, soft rim light on the silhouette, warm cinematic color grade. Full body head-to-boots, sharp focus, photorealistic, ultra-detailed, 8k. Plain flat grey studio background for easy cut-out. No text, no sponsor logos, no watermark. Portrait 2:3.
```

**Хитрости:**
- Лица: ChatGPT не нарисует ИХ точные лица (избегает реальных знаменитостей). Узнаваемость держится на форме + номере (10/7) + позе. Хочешь рожи 1-в-1 — нужны реальные фото в высоком разрешении, вырезанные.
- Серый фон → remove.bg → прозрачный PNG.
- Генери ОБЕ одним стилем/светом/масштабом, иначе рядом будут разной «температуры».
- Высокий портрет (2:3 / 3:4) — фигуры в полный рост.

---

## (Опц.) Фон с размытыми флагами — если захочешь картинкой вместо CSS

```
Ultra-wide dark sports-arena background, abstract and moody. Left side glows with heavily blurred sky-blue and white light bands evoking the Argentine flag with a faint golden sun. Right side glows with heavily blurred deep green and red light evoking the Portuguese flag. The two color fields meet in the center and dissolve into deep near-black. Soft bokeh, cinematic, high contrast, subtle film grain. No literal flags, no text, no people. 16:9.
```

> Флаг-фон дизайнер и так делает на CSS (управляемее + резкий текст поверх). Картинку генери только для сравнения вариантов.
