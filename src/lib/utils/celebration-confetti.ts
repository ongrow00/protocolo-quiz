import { browser } from '$app/environment';

const COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#E91E63', '#FFC107', '#9C27B0', '#00BCD4'];
const PARTICLE_COUNT = 90;

export type CelebrationConfettiOptions = {
	delayMs?: number;
};

export function fireCelebrationConfetti(options?: CelebrationConfettiOptions): void {
	if (!browser) return;

	const run = () => launchConfetti();

	const delayMs = options?.delayMs ?? 0;
	if (delayMs > 0) {
		setTimeout(run, delayMs);
	} else {
		requestAnimationFrame(run);
	}
}

function launchConfetti(): void {
	const container = document.createElement('div');
	container.style.cssText =
		'position:fixed;inset:0;pointer-events:none;z-index:10001;overflow:hidden;';
	document.body.appendChild(container);

	const fragments: HTMLElement[] = [];

	for (let i = 0; i < PARTICLE_COUNT; i++) {
		const el = document.createElement('div');
		const color = COLORS[i % COLORS.length];
		const size = 6 + Math.random() * 6;
		const isCircle = Math.random() > 0.5;

		el.style.cssText = [
			`position:absolute`,
			`width:${size}px`,
			`height:${isCircle ? size : size * 0.5}px`,
			`background:${color}`,
			`border-radius:${isCircle ? '50%' : '2px'}`,
			`left:${20 + Math.random() * 60}%`,
			`top:${55 + Math.random() * 20}%`,
			`opacity:1`
		].join(';');

		container.appendChild(el);
		fragments.push(el);
	}

	const DURATION = 1200;

	fragments.forEach((el, i) => {
		const angle = -90 + (Math.random() - 0.5) * 160;
		const rad = (angle * Math.PI) / 180;
		const dist = 200 + Math.random() * 300;
		const tx = Math.cos(rad) * dist;
		const ty = Math.sin(rad) * dist - Math.random() * 80;
		const rot = (Math.random() - 0.5) * 720;
		const delay = i * 4;

		el.animate(
			[
				{ transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
				{
					transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg)`,
					opacity: 0
				}
			],
			{
				duration: DURATION,
				delay,
				easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				fill: 'forwards'
			}
		);
	});

	setTimeout(() => container.remove(), DURATION + PARTICLE_COUNT * 4 + 100);
}
