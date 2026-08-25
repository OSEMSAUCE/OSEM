<script lang="ts">
import { cn } from "./cn";

/**
 * Prop-driven search bar primitive: an input, a dropdown toggle and a submit,
 * with no knowledge of what is being searched or what happens on submit. The
 * consuming route owns `onsearch` and the placeholder/label copy.
 *
 * The bar from `Search_page_Search_Bar.svg`, rendered as live SVG with
 * the real controls dropped in through `<foreignObject>` instead of being
 * rebuilt in HTML/CSS. That keeps the hand-drawn geometry — the skewed dark
 * panel, the off-square gold border, the slanted submit panel — pixel-exact,
 * and lets the input, the dropdown hit-target and the submit hit-target scale
 * with the artwork instead of being re-tuned at every breakpoint.
 *
 * All foreignObject boxes are in the SVG's own user units (viewBox is
 * 284.70643 x 49.229731), measured off the source paths after their
 * `matrix(1.051742,0,0,1.051742,-377.28326,-728.02404)` group transform:
 *   dark input panel   x 2.4 → 207.7,  y 2.7 → 47.1
 *   gold divider line  x 39  → 35.8,   y 5.1 → 44.6
 *   submit panel       x 205.4 → 282.1, y 2.1 → 44.4
 * Font sizes inside a foreignObject are user units too, so `font-size: 15`
 * below is ~30% of the bar's height at every rendered size.
 */

let {
	value = $bindable(""),
	dropdownOpen = $bindable(false),
	placeholder = "Search…",
	ariaLabel = "Search",
	id = "home-search",
	class: className = "",
	onsearch,
	onactivate,
}: {
	value?: string;
	dropdownOpen?: boolean;
	placeholder?: string;
	ariaLabel?: string;
	id?: string;
	class?: string;
	onsearch?: (query: string) => void;
	/**
	 * First intent to search — the input gaining focus or the list being
	 * opened. Lets the route lazy-load the dropdown rows only when they're
	 * actually wanted, instead of on every page visit.
	 */
	onactivate?: () => void;
} = $props();

function handleSubmit(event: SubmitEvent) {
	event.preventDefault();
	onsearch?.(value);
}
</script>

<!-- `id` + `form=` wire the foreignObject controls to this form explicitly
     rather than leaning on DOM ancestry across the SVG boundary. -->
<!-- `onpointerenter` warms the dropdown data on hover — the fetch is usually
     already in flight by the time the bar is focused/clicked, so the list feels
     instant without loading for visitors who never approach it. Touch devices
     don't hover, but there `onfocus`/the caret still trigger it on tap. -->
<form
	{id}
	class={cn("search-bar", className)}
	role="search"
	onsubmit={handleSubmit}
	onpointerenter={() => onactivate?.()}
>
	<svg
		class="search-bar-svg"
		viewBox="0 0 284.70643 49.229731"
		xmlns="http://www.w3.org/2000/svg"
	>
		<g
			transform="matrix(1.051742,0,0,1.051742,-377.28326,-728.02404)"
			aria-hidden="true"
		>
			<!-- dark query panel -->
			<path
				d="m 366.00274,695.09496 188.98809,-0.30013 1.25992,39.6875 -195.28769,2.51984 z"
				fill="#000000"
				stroke="currentColor"
				stroke-width="3.96875"
			/>
			<!-- navy submit panel -->
			<path
				class="submit-panel"
				d="m 553.99891,694.80111 62.77816,-0.62848 10.14092,39.90808 -71.7001,0.314 z"
				fill="#171d31"
				stroke="currentColor"
				stroke-width="3.89914"
			/>
			<!-- conifer glyph -->
			<path
				class="glyph glyph-conifer"
				d="m 601.15926,701.13475 -6.74173,10.91518 5.13655,-2.88931 -6.74173,8.50742 5.13656,-3.21035 -6.09966,8.34691 8.02586,-4.81552 -0.64206,8.98898 h 3.53138 v -7.70485 l 5.77863,3.21035 -3.85242,-8.3469 4.81552,1.92621 -5.77863,-6.74173 5.4576,1.60517 z"
				fill="#ffffff"
			/>
			<!-- magnifier glyph -->
			<path
				class="glyph glyph-magnifier"
				d="m 581.88475,700.49754 c -2.72423,-0.0819 -5.33111,1.26812 -7.06397,4.09602 -4.14618,6.76624 1.40955,10.67195 0.8297,11.45174 l -6.97062,9.46013 2.48951,2.82151 7.46852,-10.29003 c 0,0 6.3265,3.10153 10.29004,-1.65961 3.77015,-4.52883 2.55525,-9.95714 -0.8299,-13.11135 -1.90466,-1.77471 -4.09442,-2.70472 -6.21328,-2.76841 z m 0.6535,3.76422 a 6.3897379,5.476919 0 0 1 6.38968,5.47691 6.3897379,5.476919 0 0 1 -6.38968,5.47692 6.3897379,5.476919 0 0 1 -6.38986,-5.47692 6.3897379,5.476919 0 0 1 6.38986,-5.47691 z"
				fill="#ffffff"
			/>
			<!-- dropdown caret -->
			<path
				class="glyph caret"
				class:caret-open={dropdownOpen}
				d="m 374.23363,707.44914 7.0626,19.92288 4.57452,-19.92288 z"
				fill="#ffffff"
			/>
			<!-- gold rule between the caret and the query field -->
			<path
				d="m 395.88813,697.06297 -3.23154,37.52044"
				fill="none"
				stroke="currentColor"
				stroke-width="2.93183"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</g>

		<!-- Dropdown hit-target, sitting over the caret. -->
		<foreignObject x="6" y="5" width="34" height="39">
			<button
				xmlns="http://www.w3.org/1999/xhtml"
				type="button"
				class="hit hit-list"
				form={id}
				aria-expanded={dropdownOpen}
				aria-label="Search by list"
				onclick={() => {
					dropdownOpen = !dropdownOpen;
					if (dropdownOpen) onactivate?.();
				}}
			></button>
		</foreignObject>

		<!-- The live text field, inset to clear the gold rule on the left and the
		     submit panel on the right. -->
		<foreignObject x="44" y="8" width="157" height="32">
			<div xmlns="http://www.w3.org/1999/xhtml" class="input-shell">
				<input
					type="search"
					form={id}
					class="search-input"
					{placeholder}
					aria-label={ariaLabel}
					onfocus={() => onactivate?.()}
					oninput={(e) => {
						// Reveal matches as the user types, even if they never
						// clicked the caret — otherwise typing filters an
						// invisible list. Read from the DOM (not `value`) so it
						// doesn't depend on bind ordering. Emptying the field
						// leaves it open, showing the browse list, same as the
						// caret.
						if (e.currentTarget.value.trim().length > 0) {
							dropdownOpen = true;
						}
					}}
					bind:value
				/>
			</div>
		</foreignObject>

		<!-- Submit hit-target over the navy panel. -->
		<foreignObject x="207" y="4" width="68" height="38">
			<button
				xmlns="http://www.w3.org/1999/xhtml"
				type="submit"
				form={id}
				class="hit hit-search"
				aria-label={ariaLabel}
			></button>
		</foreignObject>
	</svg>
</form>

<style>
	.search-bar {
		display: block;
		width: 100%;
	}

	/* The gold every stroke in the artwork inherits. The paths declare
	   `stroke="currentColor"` rather than a hex, so the whole bar recolours from
	   this ONE line — and the hover rules below can shift it without the SVG
	   knowing. See app.css for why the .org gold is warmer than Get Cache's. */
	.search-bar-svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
		color: var(--color-gold-bar);
	}

	/* ---- Hover: the piece lifts and tilts ----
	   Everything on this page is drawn as a torn sticker lying at an angle, so
	   the hover that suits it is picking one up: a small scale, a slight skew
	   off-axis, and a brighter gold. A wash of background colour (what this used
	   to be, at 14% alpha) is the one thing that DOESN'T read on artwork this
	   busy — it was invisible against the painted panels.

	   The scale is deliberately small. These are big targets on a 480px card;
	   past ~1.08 the bar visibly collides with the tabs above it. */
	.glyph {
		transform-box: fill-box;
		transform-origin: center;
		transition:
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
			fill 0.18s ease;
	}

	/* The hit targets are TRANSPARENT buttons sitting over the artwork, so
	   scaling the button itself would move nothing you can see. `:has()` lets the
	   hover on the button drive the glyph underneath it instead — the visible
	   thing transforms, the invisible thing stays where the pointer expects it. */
	.search-bar-svg:has(.hit-search:hover) .glyph-magnifier,
	.search-bar-svg:has(.hit-search:focus-visible) .glyph-magnifier,
	.search-bar-svg:has(.hit-search:hover) .glyph-conifer,
	.search-bar-svg:has(.hit-search:focus-visible) .glyph-conifer {
		transform: scale(1.16) rotate(-4deg);
		fill: var(--color-gold-shard);
	}

	.search-bar-svg:has(.hit-list:hover) .caret,
	.search-bar-svg:has(.hit-list:focus-visible) .caret {
		transform: scale(1.28) rotate(6deg);
		fill: var(--color-gold-shard);
	}

	/* The submit panel itself brightens under the glyphs, so the whole slanted
	   block reads as active rather than just the little tree. */
	.search-bar-svg:has(.hit-search:hover) .submit-panel {
		fill: #23304f;
		transition: fill 0.18s ease;
	}

	/* The caret animates on TWO independent axes: `rotate` carries the
	   open/closed 180° flip, `transform` carries the hover lift from .glyph.
	   Keeping them as separate properties (rather than folding the flip into a
	   transform) is what lets both run at once — a hover mid-flip composes
	   instead of one snapping over the other. The transition must therefore name
	   all three, since this rule would otherwise override .glyph's. */
	.caret {
		transform-box: fill-box;
		transform-origin: center;
		transition:
			rotate 0.2s ease,
			transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
			fill 0.18s ease;
	}

	.caret-open {
		rotate: 180deg;
	}

	/* ---- foreignObject contents: every length here is an SVG user unit ---- */
	.input-shell {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
	}

	.search-input {
		width: 100%;
		height: 100%;
		min-width: 0;
		background: transparent;
		border: none;
		outline: none;
		padding: 0;
		margin: 0;
		color: #fff;
		font-family: inherit;
		font-size: 15px;
		line-height: 1.1;
		caret-color: var(--color-gold-bar);
		-webkit-appearance: none;
		appearance: none;
	}

	.search-input::placeholder {
		color: #8d93a6;
	}

	/* Safari draws its own clear button inside type="search"; it lands outside
	   the panel geometry at these scales. */
	.search-input::-webkit-search-decoration,
	.search-input::-webkit-search-cancel-button {
		-webkit-appearance: none;
		appearance: none;
	}

	.hit {
		width: 100%;
		height: 100%;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: 3px;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	/* The wash stays FAINT on purpose — the visible hover is the glyph growing
	   and tilting above, not this. At 14% it was doing the whole job and doing it
	   invisibly; now it is just a soft ground under a transform you can actually
	   see, and going heavier would fight the artwork it sits on. */
	.hit:hover {
		background: rgb(245 161 25 / 0.2);
	}

	.hit:focus-visible,
	.search-input:focus-visible {
		outline: 2px solid var(--color-gold-bar);
		outline-offset: 1px;
	}
</style>
