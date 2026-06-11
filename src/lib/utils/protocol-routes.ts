/** Rotas do protocolo alimentar (bloqueadas quando has_protocolo = false). */
export function isProtocolRoute(pathname: string): boolean {
	return (
		pathname === '/inicio' ||
		pathname.startsWith('/inicio/') ||
		pathname === '/lista' ||
		pathname === '/progresso' ||
		pathname === '/ativacao' ||
		pathname.startsWith('/plano/')
	);
}
