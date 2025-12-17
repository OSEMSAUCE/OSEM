<script lang="ts">
	// ⚠️ READ-ONLY: This file imports from OSEM subwoof
	// 📝 To edit: /OSEM/src/lib/subwoof/routes/who/+page.svelte
	import WhoPage from '../../lib/subwoof/routes/who/+page.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<WhoPage {data} />
