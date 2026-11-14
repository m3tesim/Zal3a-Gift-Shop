# Coding conventions

## Naming

- Never use single-letter or abbreviated names for variables, parameters, or callback arguments. Every name must describe what it holds.
  - Bad: `items.map((p) => p.id)`, `const r = await fetch(...)`, `catch (e)`, `(a, b) => a.price - b.price`
  - Good: `plants.map((plant) => plant.id)`, `const response = await fetch(...)`, `catch (error)`, `(firstPot, secondPot) => firstPot.price - secondPot.price`
- This applies to loop indices too: prefer `index` / `variantIndex` over `i`, `j`.
- Booleans read as questions: `isLoading`, `hasStock`, `canCheckout`.
