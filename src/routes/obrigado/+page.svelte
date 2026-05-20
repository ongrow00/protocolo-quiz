<script lang="ts">
	import { goto } from '$app/navigation';
	import Logo from '$lib/components/ui/Logo.svelte';
	import Button from '$lib/components/ui/Button.svelte';
</script>

<div class="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-bg">
	<div class="w-full max-w-md flex flex-col items-center gap-8 text-center">
		<Logo />

		<div class="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center">
			<svg class="w-10 h-10 text-heading" viewBox="0 0 24 24" fill="none">
				<path
					d="M5 13l4 4L19 7"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</div>

		<div class="space-y-3">
			<h1 class="text-3xl font-extrabold text-heading">Enviado com sucesso!</h1>
			<p class="text-lg text-body leading-relaxed">
				Seu resultado completo e plano personalizado estão a caminho para o seu e-mail.
				<br /><br />
				Verifique sua caixa de entrada nos próximos minutos.
			</p>
		</div>

		<Button variant="secondary" size="lg" onclick={() => goto('/')} class="w-full">
			Voltar ao início
		</Button>
	</div>
</div>
