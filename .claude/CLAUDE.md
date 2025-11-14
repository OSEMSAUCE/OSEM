# RULES FOR CLAUDE CODE

## Chats
- In all interactions and commit messages, be extremly concise and sacrifice grammar for the sake of concision

## Plans
- Please clean up old plans and old code as you go, once I approve new code and plans.

## General
- I want things to be dynamic and there's a real problem with AI hard coding values or hallucinating short term fixes to solve the problem. I designed things in an extremely deliberate way so that I can see failure. When you patch them over by hard coding values, little fixes as we go, it wastes a lot of time of me going back and trying to figure out what's broken.
- Avoid hard-coding values or applying quick patches. The codebase is designed to expose failures so they can be addressed systematically. Band-aids hide problems and create work downstream when I have to debug what's actually broken.

## CSS & STYLING RULES (CRITICAL - READ FIRST)

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

### Design Tokens
- **ALWAYS use CSS variables from app.css**, NEVER hard-code colors/spacing
- Colors: `hsl(var(--foreground))`, `hsl(var(--background))`, `hsl(var(--primary))`, `hsl(var(--muted))`, etc.
- See full list in `src/app.css` :root block
- For alpha: `hsl(var(--border) / 0.1)`
- **NEVER use**: hex colors (#000), rgb(), raw color names (black, white)

### The `!important` Ban
- **ABSOLUTELY NO `!important` IN ANY CSS** - if you need it, your selector is wrong
- Fix specificity with better selectors, not !important
- Exception: 3rd-party library overrides in mapStyles.css (Mapbox has inline styles)

### Styling New Components
When adding UI elements:
1. Check if shadcn-svelte has it: `npx shadcn-svelte@latest add [component]`
2. If no shadcn component exists, add styles to app.css using design tokens
3. Use Tailwind utility classes for layout (flex, grid, padding)
4. Use app.css classes for colors/theme

### Current Design System
- Dashboard page styling is the reference - match that visual style
- Dark theme with subtle borders and backgrounds
- Font: Fira Mono (already configured)
- Spacing: use rem units (0.5rem, 1rem, 2rem)
- Border radius: 0.5rem standard