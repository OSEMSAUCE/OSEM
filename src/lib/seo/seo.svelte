<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';

	type Props = {
		pageName?: string;
		description?: string;
	};

	const appName = 'OSEM';
	const appUrl = 'https://osemsauce.org';
	const defaultDescription = 'Open-Source Environmental Mapping';

	let { pageName, description }: Props = $props();
</script>

<MetaTags
	title={appName + (pageName ? ' | ' + pageName : '')}
	description={description || defaultDescription}
	canonical={appUrl + (pageName ? '/' + pageName : '')}
	openGraph={{
		type: 'website',
		url: appUrl,
		title: pageName || appName,
		description: description || defaultDescription,
		siteName: appName
	}}
/>
