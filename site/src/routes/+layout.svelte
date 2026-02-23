<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button.svelte';

	const navLinks = [
		{ label: 'Home', href: '/', external: false },
		{ label: 'Docs', href: '/docs', external: false },
		{ label: 'Changelog', href: '/changelog', external: false },
		{ label: 'Examples', href: 'https://github.com/miniduckco/stash/tree/main/examples', external: true },
		{ label: 'API', href: '/docs/reference/api', external: false }
	];

	const isActive = (href: string) => (href === '/' ? $page.url.pathname === '/' : $page.url.pathname.startsWith(href));

	let { children } = $props();
</script>

	<svelte:head>
	<link rel="icon" href="/favicon.png" />
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
				<a
					class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-transparent text-foreground transition hover:bg-accent"
					href="https://github.com/miniduckco/stash"
					rel="noreferrer"
					target="_blank"
					aria-label="GitHub"
					title="GitHub"
				>
					<svg
						viewBox="0 0 24 24"
						aria-hidden="true"
						class="h-5 w-5"
						fill="currentColor"
					>
						<path
							d="M12 2C6.477 2 2 6.588 2 12.253c0 4.537 2.865 8.386 6.839 9.745.5.095.683-.224.683-.5 0-.246-.009-.897-.013-1.762-2.782.626-3.369-1.372-3.369-1.372-.455-1.182-1.11-1.497-1.11-1.497-.907-.638.069-.625.069-.625 1.003.073 1.53 1.059 1.53 1.059.892 1.565 2.341 1.113 2.91.85.09-.664.35-1.113.636-1.369-2.22-.262-4.555-1.141-4.555-5.076 0-1.121.39-2.037 1.029-2.756-.103-.262-.446-1.316.098-2.744 0 0 .84-.276 2.75 1.053A9.364 9.364 0 0 1 12 6.844c.85.004 1.705.12 2.504.352 1.909-1.329 2.748-1.053 2.748-1.053.545 1.428.202 2.482.1 2.744.64.719 1.028 1.635 1.028 2.756 0 3.945-2.339 4.81-4.566 5.067.36.316.68.94.68 1.894 0 1.367-.013 2.468-.013 2.805 0 .278.18.6.688.498C19.138 20.636 22 16.79 22 12.253 22 6.588 17.523 2 12 2z"
						/>
					</svg>
				</a>
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
