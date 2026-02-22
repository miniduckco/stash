<script lang="ts">
	import { cn } from '$lib/utils';

	let className = '';
	export { className as class };
</script>

<div class={cn('flex flex-col gap-2 border-b border-border px-6 py-5', className)}>
	<slot />
</div>
