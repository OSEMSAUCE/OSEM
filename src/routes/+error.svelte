<script lang="ts">
	import Button from '$lib/subwoof/components/ui/button/button.svelte';
	import { page } from '$app/stores';

	// Default error messages
	const defaultMessages = {
		notFound: {
			title: 'Page not found',
			message: 'The page you are looking for does not exist or has been moved.',
			button: 'Go to Homepage'
		},
		error: {
			title: 'Something went wrong',
			message: 'An unexpected error occurred. Please try again later.',
			button: 'Go to Homepage'
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
		<Button href="/" class="px-6 py-3 text-lg">
			{message.button}
		</Button>
	</div>
</div>
