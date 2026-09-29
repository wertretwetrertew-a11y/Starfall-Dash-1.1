# Starfall Dash — архитектура после безопасной реструктуризации

## Рабочая ветка

Реструктуризация выполняется только в refactor/preparation-2026-09-29.
Резервная точка: backup/pre-restructure-2026-09-29.
main не используется как рабочая ветка.

## Runtime

src/core — глобальное состояние.
src/data — игровые данные и баланс.
src/systems — сохранения и Core/progression.
src/utils — общие утилиты.
src/rendering — Canvas compatibility и menu motion.
src/gameplay — игровой цикл, спавн, Roguelike-механики, reset, drops, level и update.
src/roguelike — engine и planets.
src/ui — профиль, меню, классы, Core, настройки, HUD, магазин, кейсы и управление.

## Безопасность

Полные исходники крупных монолитов сохранены в legacy/:
- gameplay-pre-refactor.js
- meta-ui-pre-refactor.js
- roguelike-v3-pre-refactor.js
- rogue-planets-pre-refactor.js
- menu-motion-pre-refactor.js

Игровое поведение, баланс, Survival, способности, UI-дизайн и сохранения намеренно не менялись.

## Перед merge

Нужно проверить запуск в браузере, Survival, Roguelike, босса, смерть/restart, профиль, магазин, кейсы, сохранения и Vercel.
До этой проверки ветку не следует считать готовой для merge в main.