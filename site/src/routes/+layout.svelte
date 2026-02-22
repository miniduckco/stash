<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import favicon from '$lib/assets/favicon.svg';
	import Button from '$lib/components/ui/button.svelte';

	const navLinks = [
		{ label: 'Home', href: '/', external: false },
		{ label: 'Docs', href: '/docs', external: false },
		{ label: 'Examples', href: 'https://github.com/miniduckco/stash/tree/main/examples', external: true },
		{ label: 'API', href: '/docs/reference/api', external: false }
	];

	const isActive = (href: string) => (href === '/' ? $page.url.pathname === '/' : $page.url.pathname.startsWith(href));

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-background text-foreground">
	<header class="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
		<div class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
			<a class="text-lg font-semibold uppercase tracking-[0.28em] text-foreground" href="/">Stash</a>
			<nav class="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
				{#each navLinks as link}
					<a
						class={isActive(link.href) ? 'text-foreground' : 'hover:text-foreground'}
						href={link.href}
						rel={link.external ? 'noreferrer' : undefined}
						target={link.external ? '_blank' : undefined}
					>
						{link.label}
					</a>
				{/each}
			</nav>
			<div class="hidden items-center gap-3 md:flex">
				<Button variant="outline" href="/docs/reference/api">API Reference</Button>
				<Button variant="secondary" href="/docs/tutorials/quickstart">Get Started</Button>
			</div>
			<details class="group relative md:hidden">
				<summary class="cursor-pointer list-none text-sm font-semibold text-foreground">Menu</summary>
				<div class="absolute right-0 top-8 w-48 rounded-xl border border-border bg-background p-3 shadow-lg">
					<nav class="flex flex-col gap-2 text-sm">
						{#each navLinks as link}
							<a
								class="rounded-lg px-3 py-2 hover:bg-accent"
								href={link.href}
								rel={link.external ? 'noreferrer' : undefined}
								target={link.external ? '_blank' : undefined}
							>
								{link.label}
							</a>
						{/each}
						<a class="rounded-lg px-3 py-2 hover:bg-accent" href="/docs/tutorials/quickstart">
							Get Started
						</a>
					</nav>
				</div>
			</details>
		</div>
	</header>

	<main class="bg-background">
		{@render children()}
	</main>

	<footer class="border-t border-border bg-background">
		<div class="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
			<p>Stash unifies Ozow, Payfast, and Paystack for South African payments.</p>
			<p>Docs stay in the repo for GitHub-first browsing.</p>
		</div>
	</footer>
</div>
