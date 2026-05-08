# DSU-V4 — Development Rules

This file defines the code standards and specific behaviors for the DSU-V4 project.

## 1. Bot Interface & Design

- **Systematic Use of Embeds**: All bot responses for end-users must imperatively use Embeds.
  - Use the utility `src/utils/embeds.js` to ensure consistency in colors and style.
  - Plain text messages are reserved for critical errors or simple ephemeral flags if necessary, but Embed remains the priority.
- **Distinct Commands**: Prefer individual and explicit Slash commands rather than overusing sub-commands. Each major feature should be easily identifiable in the Discord command menu.

---

## 2. Change Management

- **Minor Changes**: Commit and push immediately light fixes, simple refactoring, or documentation updates.
- **Major Changes**: Request confirmation before any significant structural or architectural modification.

---

## 3. Maintenance

- **Changelog**: Update `CHANGELOG.md` at each commit (Date, Type, Description).
- **Error Analysis**: Always investigate the root cause of a bug before proposing a fix.
- **Global Validation**: Systematically check if the code works correctly (via linter, tests, or launch scripts) before considering a task finished. Also verify side effects and logs.
- **Consistency**: Scrupulously follow existing patterns (Services, Models, Utils).

---

## 4. Architecture and Contextualization (IMPORTANT)

- **Initial Reading**: At the beginning of each session, you **MUST IMPERATIVELY** read the `archi.md` file located at the project root. It contains the entire bot architecture and explanations of the role of each key file.
- **Update**: If you perform an architectural modification, you **MUST** update the `archi.md` file to reflect the new architecture.

---

## 5. Recent Commit History (English)

- `feat: complete web dashboard overhaul` — Full redesign (Manus AI style), bento grids, and new ticket system.
- `feat: expand Automod system` — Added anti-link, anti-invite, and anti-role protections.
- `refactor: merge and rename forbidden word lists` — Unified word filters.
- `docs: add development rules in GEMINI.md` — Initial project standards.
- `feat: remove Gemini and add ping command` — Cleanup and latency utility.
- `docs: complete README overhaul with features` — Presentation of bot capabilities.
- `fix(css): add flex layout for checkbox groups` — UI alignment fix.
- `refactor(css): simplify sidebar design and remove effects` — CSS cleanup.
- `fix(css): increase settings layout gap to prevent text overlap` — Layout optimization.
- `fix(css): adjust settings layout to align content and shift sidebar` — Navigation fix.
- `feat: merge web-feature with expanded dashboard and fix settings view error` — Dashboard integration.
- `feat: sidebar icon navigation with frost blur animation` — Modern UI addition.
- `feat: add web dashboard with settings UI and security improvements` — Core web features.
