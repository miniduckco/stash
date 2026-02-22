<script lang="ts">
	export let data: { title: string; html: string };
</script>

<svelte:head>
	<title>{data.title} | Stash Docs</title>
</svelte:head>

<article
	class="prose max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-secondary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none prose-pre:border prose-pre:border-border prose-pre:bg-white/70"
>
	{@html data.html}
</article>
