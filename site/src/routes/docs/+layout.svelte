<script lang="ts">
	import { page } from '$app/stores';
	import { docsNav } from '$lib/docs/nav';

	const isActive = (href: string) => $page.url.pathname === href;
</script>

<div class="bg-background">
	<div class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 lg:flex-row lg:gap-12">
		<aside class="hidden w-full max-w-[260px] flex-col gap-6 lg:flex">
			<p class="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Documentation</p>
			<nav class="flex flex-col gap-6">
				{#each docsNav as section}
					<div class="flex flex-col gap-2">
						<p class="text-sm font-semibold text-foreground">{section.title}</p>
						{#each section.items as item}
							<a
								class={
									isActive(item.href)
										? 'rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-foreground'
										: 'rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground'
								}
								href={item.href}
							>
								{item.title}
							</a>
						{/each}
					</div>
				{/each}
			</nav>
		</aside>

		<div class="flex-1">
			<div class="mb-6 lg:hidden">
				<details class="rounded-2xl border border-border bg-white/70 p-4 shadow-sm">
					<summary class="cursor-pointer text-sm font-semibold text-foreground">Docs navigation</summary>
					<div class="mt-4 flex flex-col gap-4">
						{#each docsNav as section}
							<div class="flex flex-col gap-2">
								<p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
									{section.title}
								</p>
								{#each section.items as item}
									<a
										class={
											isActive(item.href)
												? 'rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-foreground'
												: 'rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground'
										}
										href={item.href}
									>
										{item.title}
									</a>
								{/each}
							</div>
						{/each}
					</div>
				</details>
			</div>

			<slot />
		</div>
	</div>
</div>
