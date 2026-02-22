<script lang="ts">
	import { cn } from '$lib/utils';

	let className = '';
	export { className as class };
</script>

<div class={cn('rounded-2xl border border-border bg-white/70 shadow-sm backdrop-blur', className)}>
	<slot />
</div>
