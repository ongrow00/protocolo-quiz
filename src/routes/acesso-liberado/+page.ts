export function load({ url }: { url: URL }) {
	return {
		email: url.searchParams.get('email') ?? '',
		senha: url.searchParams.get('senha') ?? '',
		nome: url.searchParams.get('nome') ?? '',
		appUrl: url.searchParams.get('app') ?? ''
	};
}
