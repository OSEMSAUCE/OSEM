import type { ComponentType, SvelteComponent } from 'svelte';

export type BentoCardProps = {
	name: string;
	background: ComponentType<SvelteComponent>;
	icon: string;
	description: string;
	href: string;
	cta?: string;
	color: string;
	class?: string;
};
