<script lang="ts">
	import { cn } from '$lib/utils';

	let className = '';
	export { className as class };
</script>

<span
	class={cn(
		'inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground',
		className
	)}
>
	<slot />
</span>
