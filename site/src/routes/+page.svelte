<script lang="ts">
	import Badge from '$lib/components/ui/badge.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import { onDestroy } from 'svelte';

	const quickstartShellSnippet = `npm install @miniduckco/stash`;
	const quickstartCodeSnippet = `import { createStash } from "@miniduckco/stash";\n\nconst stash = createStash({\n  provider: "ozow",\n  credentials: {\n    siteCode: process.env.OZOW_SITE_CODE,\n    apiKey: process.env.OZOW_API_KEY,\n    privateKey: process.env.OZOW_PRIVATE_KEY\n  },\n  testMode: true\n});\n\nconst payment = await stash.payments.create({\n  amount: "249.99",\n  currency: "ZAR",\n  reference: "ORDER-12345",\n  customer: {\n    firstName: "Lebo",\n    lastName: "Nkosi",\n    phone: "0821234567"\n  },\n  urls: {\n    returnUrl: "https://shop.example.com/payments/return",\n    cancelUrl: "https://shop.example.com/payments/cancel",\n    notifyUrl: "https://shop.example.com/payments/webhook",\n    errorUrl: "https://shop.example.com/payments/error"\n  }\n});\n\nconsole.log(payment.redirectUrl);`;
	const quickstartSnippet = `${quickstartShellSnippet}\n\n${quickstartCodeSnippet}`;

	let copied = false;
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	const copyQuickstart = async () => {
		const text = quickstartSnippet;
		const legacyCopy = () => {
			const textarea = document.createElement("textarea");
			textarea.value = text;
			textarea.setAttribute("readonly", "true");
			textarea.style.position = "absolute";
			textarea.style.left = "-9999px";
			document.body.appendChild(textarea);
			textarea.select();
			const success = document.execCommand("copy");
			document.body.removeChild(textarea);
			return success;
		};

		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(text);
			} else if (!legacyCopy()) {
				throw new Error("Clipboard unavailable");
			}

			copied = true;
			clearTimeout(copyTimer);
			copyTimer = setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (error) {
			const selection = window.getSelection();
			selection?.removeAllRanges();
			const codeBlock = document.querySelector('[data-quickstart-code]');
			if (codeBlock) {
				const range = document.createRange();
				range.selectNodeContents(codeBlock);
				selection?.addRange(range);
			}
		}
	};

	onDestroy(() => {
		clearTimeout(copyTimer);
	});
</script>

<svelte:head>
	<title>Stash | Unified payments for South Africa</title>
</svelte:head>

<section class="relative overflow-hidden bg-background">
	<div class="absolute inset-0 bg-noise opacity-60"></div>
	<div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(196,150,122,0.35),_transparent_55%)]"></div>
	<div class="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20">
		<div class="max-w-3xl">
			<h1 class="text-4xl font-semibold leading-tight text-foreground md:text-6xl">
				Integrate once. Switch whenever you want.
			</h1>
			<p class="mt-5 text-lg text-muted-foreground">
				A unified SDK that keeps South African payment providers consistent from create to webhook.
			</p>
		</div>
		<div class="flex flex-wrap gap-3">
			<Button href="/docs/tutorials/quickstart" size="lg">Start the quickstart</Button>
			<Button href="/docs" variant="outline" size="lg">Browse documentation</Button>
		</div>
		<div class="flex flex-wrap items-center gap-3 text-sm font-semibold text-secondary">
			<span>Ozow</span>
			<span class="text-border">·</span>
			<span>Payfast</span>
			<span class="text-border">·</span>
			<span>Paystack</span>
		</div>
	</div>
</section>

<section class="mx-auto w-full max-w-6xl px-6 py-16">
	<div class="flex flex-col gap-8">
		<div class="flex flex-col gap-4">
			<h2 class="text-3xl font-semibold text-foreground md:text-4xl">Coverage that scales with your roadmap.</h2>
			<p class="text-lg text-muted-foreground">
				Roadmap visibility stays obvious while the API surface stays compact.
			</p>
		</div>
		<div class="grid gap-6 md:grid-cols-3">
			<div class="rounded-2xl border border-border bg-white/70 p-6 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Unified API</p>
				<h3 class="mt-3 text-xl font-semibold text-foreground">One surface, three providers.</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					Use <code class="rounded bg-muted px-1">createStash()</code> to switch providers without rewriting flows.
				</p>
			</div>
			<div class="rounded-2xl border border-border bg-white/70 p-6 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Security</p>
				<h3 class="mt-3 text-xl font-semibold text-foreground">Provider-accurate verification.</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					Signatures, hashes, and verification rules are handled per provider.
				</p>
			</div>
			<div class="rounded-2xl border border-border bg-white/70 p-6 shadow-sm">
				<p class="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Docs</p>
				<h3 class="mt-3 text-xl font-semibold text-foreground">GitHub-first, web-ready.</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					Docs are kept with the code, making changes easy to track and review.
				</p>
			</div>
		</div>
		<Card class="bg-white/80">
			<CardHeader>
				<CardTitle>Quickstart overview</CardTitle>
				<CardDescription>Launch in four focused steps.</CardDescription>
			</CardHeader>
			<CardContent>
				<ol class="space-y-4 text-sm text-muted-foreground">
					<li class="flex items-start gap-3">
						<span class="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-foreground">
							1
						</span>
						<p class="leading-relaxed">
							Install <code class="rounded bg-muted px-1">@miniduckco/stash</code> and set your provider env vars.
						</p>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-foreground">
							2
						</span>
						<p class="leading-relaxed">
							Create payments through <code class="rounded bg-muted px-1">createStash()</code> for any provider.
						</p>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-foreground">
							3
						</span>
						<p class="leading-relaxed">Verify signatures and parse webhooks safely.</p>
					</li>
					<li class="flex items-start gap-3">
						<span class="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-foreground">
							4
						</span>
						<p class="leading-relaxed">Deploy with confidence using verified provider rules.</p>
					</li>
				</ol>
				<div class="mt-6">
					<Button href="/docs/tutorials/quickstart" variant="secondary">Read the quickstart</Button>
				</div>
				<div class="mt-6 rounded-2xl border border-border bg-background/80 p-4">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<p class="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Quickstart snippet</p>
						<Button variant="outline" size="sm" on:click={copyQuickstart}>
							{copied ? 'Copied' : 'Copy'}
						</Button>
					</div>
					<div class="mt-3 space-y-3" data-quickstart-code>
						<pre class="overflow-auto rounded-xl border border-border bg-black/90 p-3 text-xs font-mono text-emerald-100">
<code>$ {quickstartShellSnippet}</code>
						</pre>
						<pre class="max-h-64 overflow-auto rounded-xl border border-border bg-black/90 p-3 text-xs font-mono text-emerald-100">
<code>{quickstartCodeSnippet}</code>
						</pre>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>
</section>

<section class="mx-auto w-full max-w-6xl px-6 pb-20">
	<div class="grid gap-6 md:grid-cols-2">
		<Card class="bg-white/80">
			<CardHeader>
				<CardTitle>Need the API?</CardTitle>
				<CardDescription>Jump straight to the types and reference material.</CardDescription>
			</CardHeader>
			<CardContent>
				<ul class="space-y-2 text-sm text-muted-foreground">
					<li>Typed SDK surface for payments</li>
					<li>Provider adapters and guardrails</li>
					<li>Reference-ready examples</li>
				</ul>
				<div class="mt-4">
					<Button href="/docs/reference/api" variant="secondary">Open API docs</Button>
				</div>
			</CardContent>
		</Card>
		<Card class="bg-white/80">
			<CardHeader>
				<CardTitle>Changelog</CardTitle>
				<CardDescription>Track releases, fixes, and provider updates.</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">
					Stay current with new capabilities and breaking changes as the SDK evolves.
				</p>
				<div class="mt-4">
					<Button href="https://github.com/miniduckco/stash/blob/main/CHANGELOG.md" variant="outline">
						View changelog
					</Button>
				</div>
			</CardContent>
		</Card>
	</div>
</section>
