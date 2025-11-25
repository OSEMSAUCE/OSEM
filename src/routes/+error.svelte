<script lang="ts">
	import Button from '$lib/subwoof/components/ui/button/button.svelte';
	import { page } from '$app/stores'; // Updated import
	import { config } from '$lib/selfkit.config';

	// Default error messages
	const defaultMessages = {
		notFound: {
			title: 'Page not found',
			message: 'The page you are looking for does not exist or has been moved.',
			button: 'Go to Homepage',
			supportText: 'If you believe this is a mistake, please contact support.'
		},
		error: {
			title: 'Something went wrong',
			message: 'An unexpected error occurred. Please try again later.',
			button: 'Go to Homepage',
			supportText: 'If the problem persists, please contact support.'
		}
	};

	// Get the appropriate message based on error code
	$: message = $page.status === 404 ? defaultMessages.notFound : defaultMessages.error;
</script>

<div class="min-h-screen flex items-center justify-center p-4">
	<div class="text-center max-w-md">
		<h1 class="text-6xl font-bold text-gray-900 dark:text-white mb-4">
			{$page.status || 'Error'}
		</h1>
		<h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
			{message.title}
		</h2>
		<p class="text-gray-600 dark:text-gray-400 mb-6">
			{message.message}
		</p>
		<div class="space-y-4 mb-8">
			<p class="text-gray-500 dark:text-gray-400">
				{message.supportText}
			</p>
			{#if config?.emailSupport}
				<p class="text-gray-500 dark:text-gray-400">
					Email:
					<a
						href={`mailto:${config.emailSupport}`}
						class="text-blue-600 dark:text-blue-400 hover:underline"
					>
						{config.emailSupport}
					</a>
				</p>
			{/if}
		</div>
		<Button href="/" class="px-6 py-3 text-lg">
			{message.button}
		</Button>
	</div>
</div>
