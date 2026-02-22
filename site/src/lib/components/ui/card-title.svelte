<script lang="ts">
	import { cn } from '$lib/utils';

	let className = '';
	export { className as class };
</script>

<h3 class={cn('text-xl font-semibold text-foreground', className)}>
	<slot />
</h3>
