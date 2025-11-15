## CSS RULES & STYLE GUIDE

### CSS Sources
- `src/app.css` - ONLY place for custom CSS (all global styles consolidated)
- `node_modules/bootstrap` - Bootstrap 5 framework
- `node_modules/mapbox-gl` - Mapbox library styles

### Design Philosophy
**Clean, minimal, high-contrast design:**
- Strong black (#121212) and white (#e0e0e0) contrast
- Purple (#8028de) used SPARINGLY for accents only (links, hover states, highlights)
- No gradients, no fancy effects - just clean, readable UI
- Grey borders on everything for visual separation

## CSS & STYLING RULES (CRITICAL - READ FIRST)

### Exact Color Palette
**Use these exact values ONLY. No deviations.**

```css
/* Color Palette - Minimal purple, strong black/white contrast */
--color-purple: #8028de;      /* ONLY for accents, links, hovers */
--color-light-grey: #343434;  /* Borders, secondary UI elements */
--color-grey: #212121;        /* Cards, elevated surfaces */
--color-black: #121212;       /* Main background, header */
--color-white: #e0e0e0;       /* Primary text */
```

**Purple Usage Rules:**
- ✅ Links
- ✅ Hover states
- ✅ Active nav items
- ✅ Focus rings
- ✅ Primary buttons (sparingly)
- ❌ Backgrounds
- ❌ Headers (use black)
- ❌ Text body
- ❌ Cards

**Black/White Usage:**
- Black: backgrounds, headers, containers
- White: all text, borders
- Grey: cards, subtle backgrounds, borders

### Framework & Libraries
- **Bootstrap 5** - Core UI framework
- **NO Tailwind** - removed completely
- **NO shadcn-svelte** - removed completely
- Use native Bootstrap classes: `.btn`, `.form-control`, `.card`, `.table`, etc.

### CSS File Structure
- **ALL CSS in `src/app.css`** - single source of truth
- Bootstrap imported at top
- Custom variables in `:root`
- Custom classes after Bootstrap
- **NEVER create inline `<style>` blocks in .svelte files**
- **NEVER create new CSS files** (except Mapbox overrides if needed)

### Bootstrap Usage
**Use Bootstrap classes for everything:**

```html
<!-- Forms -->
<select class="form-select">...</select>
<input type="text" class="form-control" />
<label class="form-label">...</label>

<!-- Buttons -->
<button class="btn btn-primary">Primary</button>
<button class="btn btn-outline-primary">Outline</button>

<!-- Layout -->
<div class="d-flex align-items-center gap-3">...</div>
<div class="container">...</div>

<!-- Tables -->
<table class="table table-striped table-hover">...</table>

<!-- Alerts -->
<div class="alert alert-warning">...</div>
```

### Design Tokens - Bootstrap Variables
**All colors use CSS variables defined in app.css:**

✅ **CORRECT:**
```css
background-color: var(--color-black);
color: var(--color-white);
border: 1px solid var(--color-light-grey);
```

❌ **WRONG:**
```css
background: #000;           /* NO raw hex */
color: white;               /* NO color names */
border: 1px solid #ccc;    /* NO random greys */
```

### The `!important` Ban
- **NO `!important`** - if needed, your selector is wrong
- Fix specificity with better selectors
- Exception: Mapbox overrides ONLY (third-party inline styles)

### CSS Auditing (MANDATORY)
**Before adding ANY CSS:**
1. Check if Bootstrap has it: https://getbootstrap.com/docs/5.3/
2. If Bootstrap class exists, use it
3. If custom needed, add to app.css with clear naming
4. Delete any unused CSS immediately

### Styling New Components
When adding UI elements:
1. **Use Bootstrap first** - check docs
2. If custom styling needed, add to app.css
3. Keep purple minimal - default to black/white
4. Add grey borders for visual clarity

### Design System Standards
- **Theme:** Dark (#121212 background)
- **Font:** Roboto Mono + system monospace fallbacks (SF Mono, Menlo, Consolas, Liberation Mono)
- **Spacing:** Bootstrap spacing scale (p-1, p-2, p-3, etc.)
- **Border radius:** Bootstrap defaults (rounded, rounded-lg)
- **Borders:** 1px solid var(--color-light-grey)
- **Purple accents:** Links, hover states, active elements ONLY

### Component Patterns

**Header:**
- Black background (--color-black)
- White text
- Purple active nav items
- Grey borders

**Cards:**
- Grey background (--color-grey)
- Light grey borders
- White text
- No purple unless interactive

**Forms:**
- Grey input backgrounds
- Light grey borders
- Purple focus states
- White text

**Tables:**
- Striped rows (grey)
- Purple hover (subtle)
- Light grey borders
- White text

### Neurotic Alignment Rules
**These rules prevent CSS rot. Follow religiously:**

1. **No inline styles** - Use Bootstrap classes or app.css
2. **No orphaned CSS** - Delete unused classes immediately
3. **No color hard-coding** - Use variables ONLY
4. **Minimal purple** - Default to black/white, add purple sparingly
5. **One source of truth** - app.css is law

### Enforcement Checklist
Before committing CSS changes:
- [ ] No `<style>` blocks in .svelte files
- [ ] No raw hex/rgb colors outside :root
- [ ] No !important outside Mapbox overrides
- [ ] Purple used ONLY for accents
- [ ] Black/white used for main contrast
- [ ] Bootstrap classes used where possible
- [ ] app.css is single CSS file
