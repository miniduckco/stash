<script lang="ts">
	import { cn } from '$lib/utils';

	let className = '';
	export { className as class };
</script>

<div class={cn('px-6 py-5', className)}>
	<slot />
</div>
