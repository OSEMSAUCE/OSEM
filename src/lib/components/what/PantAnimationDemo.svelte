<script lang="ts">
	import { onMount } from "svelte";

	const frames = [
		"/animation/pant/cadmium_export_001.png",
		"/animation/pant/cadmium_export_002.png",
		"/animation/pant/cadmium_export_003.png",
		"/animation/pant/cadmium_export_004.png",
		"/animation/pant/cadmium_export_005.png",
		"/animation/pant/cadmium_export_006.png",
		"/animation/pant/cadmium_export_007.png",
		"/animation/pant/cadmium_export_008.png",
		"/animation/pant/cadmium_export_009.png",
		"/animation/pant/cadmium_export_010.png",
	];

	const frameDurationMs = 1000 / 24;
	const loopDurationMs = frames.length * frameDurationMs;

	let frameIndex = 0;

	onMount(() => {
		const preload = frames.map((src) => {
			const image = new Image();
			image.src = src;
			return image;
		});

		const intervalId = window.setInterval(() => {
			frameIndex = (frameIndex + 1) % frames.length;
		}, frameDurationMs);

		return () => {
			window.clearInterval(intervalId);
			preload.length = 0;
		};
	});
</script>

<div class="mx-auto mb-8 flex w-full max-w-lg flex-col items-center gap-3 rounded-xl border border-border bg-card/50 p-4">
	<img
		src={frames[frameIndex]}
		alt="Pant animation demo"
		class="block h-auto w-full rounded-md"
	/>
	<div class="text-center text-xs text-muted-foreground">
		{frames.length} frames at 24 fps · {Math.round(loopDurationMs)}ms loop
	</div>
</div>
