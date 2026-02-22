<script lang="ts">
	import { cva, type VariantProps } from 'class-variance-authority';
	import { cn } from '$lib/utils';

	const buttonVariants = cva(
		'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
		{
			variants: {
				variant: {
					default: 'bg-accent text-accent-foreground shadow-sm hover:brightness-105 hover:shadow-md',
					secondary: 'bg-secondary text-secondary-foreground hover:brightness-110',
					outline: 'border border-border bg-transparent text-foreground hover:bg-accent',
					ghost: 'bg-transparent text-foreground hover:bg-accent'
				},
				size: {
					default: 'h-10',
					sm: 'h-9 px-4 text-xs',
					lg: 'h-11 px-6 text-base'
				}
			},
			defaultVariants: {
				variant: 'default',
				size: 'default'
			}
		}
	);

	export let variant: VariantProps<typeof buttonVariants>['variant'] = 'default';
	export let size: VariantProps<typeof buttonVariants>['size'] = 'default';
	export let href: string | undefined;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	let className = '';
	export { className as class };
</script>

{#if href}
	<a class={cn(buttonVariants({ variant, size }), className)} href={href}>
		<slot />
	</a>
{:else}
	<button class={cn(buttonVariants({ variant, size }), className)} type={type}>
		<slot />
	</button>
{/if}
