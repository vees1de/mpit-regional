# Match-3 WebGL Mini-Game

Compact “три-в-ряд” для вертикальной ленты (контракт start/stop/onSwipe + `gameConfig`).

## Контракт
- `gameConfig`: `{ id: "match3", name: "Match-3", handlesSwipe: true, swipeDirections: ["left","right","up","down"] }`
- `start(container: HTMLElement)`: создаёт canvas и HUD, запускает рендер.
- `stop(container: HTMLElement)`: снимает слушатели, удаляет canvas/HUD.
- `onSwipe(direction: "left"|"right"|"up"|"down")`: свайп выбранной фишки.
- `getScore(): number`: текущий счёт.

## Игровая логика (v1)
- Поле 8×8, 5 типов фишек.
- Генерация без стартовых матчей.
- Свайп → swap → если нет матча → откат.
- Матчи 3/4/5+ дают 10/20/50 очков. Комбо-множитель: `1 + chain * 0.1`.
- Бесконечный цикл: clear → fall → fill → повторять, пока есть матчи.

## Интеграция в ленту
```ts
import { start, stop, onSwipe, gameConfig } from "/games/match3/index.js";
start(containerEl);
// swipe router: если gameConfig.handlesSwipe === true, делегировать onSwipe(direction)
stop(containerEl);
```

## Управление
- Свайпы: up/down/left/right. Точка начала свайпа берётся из `touchstart` по canvas.
- Вертикальные свайпы ленты блокируются, т.к. `handlesSwipe = true`.

## Файлы
- `index.js` — точка входа
- `game.js` — start/stop/onSwipe/getScore
- `config.js` — параметры и `gameConfig`
- `engine/` — core/logic/render/input/utils
- Seed: `start(container, { settings: { seed: 123 } })` для детерминированного поля.
