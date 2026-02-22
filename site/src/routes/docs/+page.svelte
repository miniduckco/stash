<script lang="ts">
	import Badge from '$lib/components/ui/badge.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
</script>

<svelte:head>
	<title>Docs | Stash</title>
</svelte:head>

<section class="relative overflow-hidden rounded-3xl border border-border bg-white/70 p-10 shadow-sm">
	<div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(196,150,122,0.28),_transparent_60%)]"></div>
	<div class="relative flex flex-col gap-6">
		<Badge>Documentation</Badge>
		<div class="max-w-2xl">
			<h1 class="text-4xl font-semibold text-foreground md:text-5xl">Everything you need to ship payments confidently.</h1>
			<p class="mt-4 text-lg text-muted-foreground">
				Browse tutorials, operational guides, and API details for a unified Ozow, Payfast, and Paystack
				integration.
			</p>
		</div>
		<div class="flex flex-wrap gap-3">
			<Button href="/docs/tutorials/quickstart" size="lg">Start the quickstart</Button>
			<Button href="/docs/reference/api" variant="outline" size="lg">Explore the API</Button>
		</div>
	</div>
</section>

<section class="mt-10 grid gap-8 md:grid-cols-2">
	<div class="rounded-2xl border border-border bg-white/70 p-6 shadow-sm">
		<p class="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Tutorials</p>
		<h2 class="mt-3 text-2xl font-semibold text-foreground">Start with guided walkthroughs.</h2>
		<p class="mt-2 text-sm text-muted-foreground">Install, create payments, and verify webhooks in minutes.</p>
		<div class="mt-4 space-y-2 text-sm">
			<a class="block text-secondary hover:underline" href="/docs/tutorials/quickstart">Quickstart</a>
		</div>
	</div>

	<div class="rounded-2xl border border-border bg-white/70 p-6 shadow-sm">
		<p class="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">How-to guides</p>
		<h2 class="mt-3 text-2xl font-semibold text-foreground">Operational guides for production.</h2>
		<p class="mt-2 text-sm text-muted-foreground">Handle webhooks, environments, and provider nuances.</p>
		<div class="mt-4 space-y-2 text-sm">
			<a class="block text-secondary hover:underline" href="/docs/how-to">How-to overview</a>
			<a class="block text-secondary hover:underline" href="/docs/how-to/webhooks">Webhook handling</a>
		</div>
	</div>

	<div class="rounded-2xl border border-border bg-white/70 p-6 shadow-sm">
		<p class="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Reference</p>
		<h2 class="mt-3 text-2xl font-semibold text-foreground">Exact API surface area.</h2>
		<p class="mt-2 text-sm text-muted-foreground">Types, adapters, and errors documented in one place.</p>
		<div class="mt-4 space-y-2 text-sm">
			<a class="block text-secondary hover:underline" href="/docs/reference/api">API reference</a>
		</div>
	</div>

	<div class="rounded-2xl border border-border bg-white/70 p-6 shadow-sm">
		<p class="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Explanation</p>
		<h2 class="mt-3 text-2xl font-semibold text-foreground">Understand the architecture.</h2>
		<p class="mt-2 text-sm text-muted-foreground">Learn how hashing and verification rules are wired.</p>
		<div class="mt-4 space-y-2 text-sm">
			<a class="block text-secondary hover:underline" href="/docs/explanation/architecture">Architecture</a>
		</div>
	</div>
</section>

<section class="mt-10 rounded-3xl border border-border bg-white/70 p-8 shadow-sm">
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h2 class="text-2xl font-semibold text-foreground">Skill quick reference</h2>
			<p class="mt-2 text-sm text-muted-foreground">A compact summary for operators and support teams.</p>
		</div>
		<Button href="/docs/skill" variant="outline">Open skill reference</Button>
	</div>
</section>
