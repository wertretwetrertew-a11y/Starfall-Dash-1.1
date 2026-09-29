STARFALL DASH — DEVELOPER BALANCE TOOLS

Run from repository root:
node tools/balance-editor.mjs

The editor binds to 127.0.0.1 only and prints a one-time access token in the terminal.

SAVE: writes config/roguelike-balance.json and regenerates js/balance-config.js.
SAVE + GIT COMMIT: also creates a Git commit containing the balance changes.

Editable Roguelike values:
- Spawn pressure and spawn intervals.
- Maximum/minimum enemies per stage.
- Stage speed and HP multipliers.
- Stage objective targets.
- Enemy HP, speed and size.
- Boss HP, size and rewards.

The production game does not expose the editor or a browser API for changing balance.
The editor is a developer-side local tool. Since Starfall Dash is a client-side web game, technically advanced players can inspect downloaded JavaScript and modify their own local copy. They cannot use the shipped game to change the official repository/configuration.
