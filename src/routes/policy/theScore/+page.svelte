<div class="container mx-auto py-12 max-w-4xl">
	<h1 class="text-3xl font-bold mb-2">The Score</h1>
	<p class="text-muted-foreground mb-8">
		How OSEM measures transparency in tree planting
	</p>

	<section class="mb-12">
		<h2 class="text-2xl font-semibold mb-4">Why We Score</h2>
		<div class="prose dark:prose-invert max-w-none space-y-4">
			<p>
				Organizations claim millions of trees planted every year, but
				how much of that is actually verifiable? OSEM's scoring system
				quantifies how much data an organization has actually disclosed
				about their planting projects — down to the individual site
				level.
			</p>
			<p>
				The score isn't a judgment of quality. It's a measure of
				<strong>transparency</strong>: how much can be independently
				verified from the data they've made available?
			</p>
		</div>
	</section>

	<section class="mb-12">
		<h2 class="text-2xl font-semibold mb-4">How Project Scores Work</h2>
		<div class="prose dark:prose-invert max-w-none space-y-4">
			<p>
				Each project is scored by examining how many data attributes are
				populated across its records — projects, land parcels,
				plantings, polygons, crops, stakeholders, and sources.
			</p>
			<p>
				Not all attributes are equal. High-value fields like <strong
					>polygon boundaries</strong
				>,
				<strong>GPS coordinates</strong>,
				<strong>species identification</strong>, and
				<strong>planting dates</strong> carry significantly more weight. A
				polygon with adequate tree density (≥200 trees/ha) is worth 20 points;
				sparse polygons score less.
			</p>
			<p>
				The project score is <strong
					>points scored ÷ points available</strong
				>, expressed as a percentage. Bonus points from stakeholder and
				organization data can push scores above 100%.
			</p>
		</div>

		<div
			class="mt-8 bg-muted/50 rounded-lg p-6 font-mono text-sm leading-relaxed overflow-x-auto"
		>
			<pre class="whitespace-pre">ProjectTable ──┐
LandTable ─────┤
PlantingTable ─┤                                     Score table
PolyTable ─────┤── count populated attrs ──►  ┌──────────────────┐
CropTable ─────┤   × score matrix weights     │ score (%)        │
SourceTable ───┘                              │ pointsScored     │
                                              │ pointsAvailable  │
                                              └──────────────────┘</pre>
		</div>

		<div class="mt-8">
			<h3 class="text-lg font-semibold mb-3">Score Matrix</h3>
			<p class="text-muted-foreground text-sm mb-4">
				Every populated attribute scores 1 point by default. The
				following carry extra weight:
			</p>
			<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
				<div class="flex justify-between bg-muted/50 rounded px-3 py-2">
					<span>Polygon boundary</span><span class="font-bold"
						>20 pts</span
					>
				</div>
				<div class="flex justify-between bg-muted/50 rounded px-3 py-2">
					<span>Geometry data</span><span class="font-bold"
						>20 pts</span
					>
				</div>
				<div class="flex justify-between bg-muted/50 rounded px-3 py-2">
					<span>GPS latitude</span><span class="font-bold">5 pts</span
					>
				</div>
				<div class="flex justify-between bg-muted/50 rounded px-3 py-2">
					<span>GPS longitude</span><span class="font-bold"
						>5 pts</span
					>
				</div>
				<div class="flex justify-between bg-muted/50 rounded px-3 py-2">
					<span>Crop name</span><span class="font-bold">5 pts</span>
				</div>
				<div class="flex justify-between bg-muted/50 rounded px-3 py-2">
					<span>Species ID</span><span class="font-bold">5 pts</span>
				</div>
				<div class="flex justify-between bg-muted/50 rounded px-3 py-2">
					<span>Planting date</span><span class="font-bold"
						>5 pts</span
					>
				</div>
				<div class="flex justify-between bg-muted/50 rounded px-3 py-2">
					<span>Trees planted</span><span class="font-bold"
						>3 pts</span
					>
				</div>
				<div class="flex justify-between bg-muted/50 rounded px-3 py-2">
					<span>Stakeholder type</span><span class="font-bold"
						>2 pts</span
					>
				</div>
				<div class="flex justify-between bg-muted/50 rounded px-3 py-2">
					<span>Organization</span><span class="font-bold">2 pts</span
					>
				</div>
				<div class="flex justify-between bg-muted/50 rounded px-3 py-2">
					<span>Price per unit</span><span class="font-bold"
						>2 pts</span
					>
				</div>
				<div class="flex justify-between bg-muted/50 rounded px-3 py-2">
					<span>All other fields</span><span class="font-bold"
						>1 pt</span
					>
				</div>
			</div>
			<p class="text-muted-foreground text-xs mt-3">
				Polygon density matters: ≥200 trees/ha = 20 pts, ≥10 trees/ha =
				2 pts, &lt;10 = 0 pts.
			</p>
		</div>
	</section>

	<section class="mb-12">
		<h2 class="text-2xl font-semibold mb-4">
			How Organization Scores Work
		</h2>
		<div class="prose dark:prose-invert max-w-none space-y-4">
			<p>
				Organization scores aggregate their project scores, then factor
				in
				<strong>claim verification</strong>. If an organization claims 1
				million trees planted but only 50,000 are accounted for in
				disclosed project data, their claim percentage is ~5%.
			</p>
			<p>
				The final organization score combines the average project
				quality with the proportion of claims that are actually backed
				by data. Organizations are also segmented by their most common
				stakeholder type for peer comparison.
			</p>
		</div>
	</section>

	<section class="mb-12">
		<h2 class="text-2xl font-semibold mb-4">Open Source</h2>
		<div class="prose dark:prose-invert max-w-none space-y-4">
			<p>
				The entire scoring methodology is open source. You can inspect
				the logic, challenge it, or contribute improvements.
			</p>
			<p>
				<a
					href="https://github.com/OSEMSAUCE/OSEM"
					target="_blank"
					rel="noopener noreferrer"
					class="underline hover:text-primary font-semibold"
				>
					View on GitHub →
				</a>
			</p>
		</div>
	</section>
</div>
