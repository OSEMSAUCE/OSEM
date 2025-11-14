## CSS RULES & STYLE GUIDE

### CSS Sources
- `src/app.css` - ONLY place for custom CSS (global styles)
- `src/lib/components/map/mapStyles.css` - Mapbox library overrides ONLY
- `node_modules/mapbox-gl` - Mapbox library styles
- `node_modules/shadcn-svelte` - shadcn-svelte component library styles




## CSS & STYLING RULES (CRITICAL - READ FIRST)

### Exact Color Palette
**Use these exact values ONLY. No deviations. No rgba(). No hex in code.**

```css
/* BACKGROUNDS (dark → light) */
--background: 0 0% 4%;        /* #0A0A0A - Main background (NOT pitch black) */
--card: 0 0% 7%;              /* #121212 - Cards, elevated surfaces */
--popover: 0 0% 7%;           /* #121212 - Popovers match cards */
--secondary: 0 0% 12%;        /* #1E1E1E - Inputs, hover backgrounds */
--muted: 0 0% 12%;            /* #1E1E1E - Muted backgrounds */
--accent: 0 0% 12%;           /* #1E1E1E - Accent backgrounds */
--input: 0 0% 12%;            /* #1E1E1E - Input backgrounds */

/* BORDERS (dark → light) */
--border: 0 0% 16%;           /* #2A2A2A - Subtle borders */
--ring: 0 0% 25%;             /* #404040 - Focus rings, strong borders */

/* TEXT (dark → light) */
--muted-foreground: 0 0% 64%; /* #A3A3A3 - Secondary/muted text */
--foreground: 0 0% 98%;       /* #FAFAFA - Primary text */
--card-foreground: 0 0% 98%;  /* #FAFAFA - Card text */
--popover-foreground: 0 0% 98%; /* #FAFAFA - Popover text */
--primary: 0 0% 98%;          /* #FAFAFA - Primary color (text-based) */
--primary-foreground: 0 0% 4%; /* #0A0A0A - Text on primary */
--secondary-foreground: 0 0% 98%; /* #FAFAFA - Text on secondary */
--accent-foreground: 0 0% 98%; /* #FAFAFA - Text on accent */

/* SEMANTIC COLORS */
--destructive: 0 63% 31%;     /* Red for destructive actions */
--destructive-foreground: 0 0% 98%; /* Text on destructive */

/* ACCENTS (specific hex values) */
--warning: 45 100% 51%;       /* #FFC107 - Warning yellow */
--info: 39 100% 50%;          /* #FFA500 - Info orange */
--focus: 217 91% 60%;         /* #3B82F6 - Focus blue */
```

**Usage Rules:**
- ALWAYS use `hsl(var(--token))` - NEVER hex, rgb(), or rgba()
- For transparency: `hsl(var(--token) / 0.5)` where 0.5 = 50% opacity
- NO exceptions outside mapStyles.css (Mapbox has inline styles, needs !important)

### Component Library
- **ONLY use shadcn-svelte** (https://www.shadcn-svelte.com/) - NOT React shadcn
- Check package.json: `shadcn-svelte` is correct, `shadcn` is WRONG
- All UI components live in `src/lib/components/shadUi/` (from shadcn-svelte)
- ALWAYS use shadcn-svelte components instead of raw HTML elements:
  - Use `<Select>` instead of `<select>`
  - Use `<Button>` instead of `<button>` with custom styles
  - Use `<Card>` for containers instead of divs with background/border
  - See installed components: `ls src/lib/components/shadUi/`

### CSS File Structure
- **ALL global styles go in `src/app.css`** - this is the ONLY place for custom CSS
- Exception: 3rd-party library overrides go in `src/lib/components/map/mapStyles.css` (Mapbox only)
- **NEVER create inline `<style>` blocks in .svelte files**
- **NEVER create new CSS files**
- If you need component-specific styles, add them to app.css with descriptive class names

### Design Tokens - ENFORCEMENT
**Every color MUST use design tokens. No exceptions.**

✅ **CORRECT:**
```css
background: hsl(var(--card));
color: hsl(var(--foreground));
border: 1px solid hsl(var(--border));
box-shadow: 0 4px 12px hsl(var(--background) / 0.5);
```

❌ **WRONG (will be rejected):**
```css
background: rgba(255, 255, 255, 0.03);  /* NO rgba() */
color: #fff;                             /* NO hex */
border: 1px solid rgb(42, 42, 42);      /* NO rgb() */
color: white;                            /* NO color names */
```

### The `!important` Ban
- **ABSOLUTELY NO `!important`** - if needed, your selector is wrong
- Fix specificity with better selectors
- Exception: `mapStyles.css` ONLY (Mapbox has inline styles)

### CSS Auditing (MANDATORY)
**Before adding ANY CSS:**
1. `grep -r "class-name" src/` to check if class exists
2. If exists, reuse it - DO NOT create duplicate
3. If unused CSS found, DELETE immediately
4. Every commit must align CSS - no orphaned classes

### Styling New Components
When adding UI elements:
1. Check if shadcn-svelte has it: `npx shadcn-svelte@latest add [component]`
2. If no shadcn component exists, add styles to app.css using design tokens
3. Use Tailwind utility classes for layout (flex, grid, padding)
4. Use app.css classes for colors/theme

### Design System Standards
- **Reference:** Dashboard page ([src/routes/dashboard/+page.svelte](src/routes/dashboard/+page.svelte))
- **Theme:** Dark (#0A0A0A background, NOT pitch black #000)
- **Font:** Fira Mono (configured in app.css)
- **Spacing:** rem units only - 0.25rem, 0.5rem, 0.75rem, 1rem, 1.5rem, 2rem
- **Border radius:** 0.5rem (default), 0.75rem (cards)
- **Borders:** 1px solid hsl(var(--border)) - ALWAYS use --border token

### Neurotic Alignment Rules
**These rules prevent CSS rot. Follow religiously:**

1. **No inline styles** - Grep for `<style>` in .svelte files before every commit
2. **No orphaned CSS** - Delete unused classes immediately when refactoring
3. **No color hard-coding** - Grep for `rgba(`, `rgb(`, `#[0-9a-f]` before commit
4. **Audit on every change** - If touching CSS, audit all related classes
5. **One source of truth** - app.css is law, inline styles are bugs

### Enforcement Checklist
Before committing CSS changes:
- [ ] No `<style>` blocks in .svelte files
- [ ] No rgba(), rgb(), hex colors outside :root
- [ ] No !important outside mapStyles.css
- [ ] All classes actually used (grep confirm)
- [ ] Design tokens used for ALL colors
- [ ] Spacing uses rem units only