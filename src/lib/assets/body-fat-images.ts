/**
 * Imagens de referência corporal: 6 níveis por gênero (H = homem, M = mulher).
 * Ordem: 11-12%, 13-15%, 16-19%, 20-24%, 25-30%, 31-40%.
 */
// Homem (H) — 6 imagens
import H_11_12 from '$lib/assets/body-fat/H_11-12-new.png';
import H_13_15 from '$lib/assets/body-fat/H_13-15-new.png';
import H_16_19 from '$lib/assets/body-fat/H_16-19-new.png';
import H_20_24 from '$lib/assets/body-fat/H_20-24-new.png';
import H_25_30 from '$lib/assets/body-fat/H_25-30-new.png';
import H_31_40 from '$lib/assets/body-fat/H_31-40-new.png';
// Mulher (M) — 6 imagens
import M_11_12 from '$lib/assets/body-fat/M_11_12-19100d97-5e9a-437c-8655-10616b6fd0c0.png';
import M_13_15 from '$lib/assets/body-fat/M_13-15-0ac5754c-33c1-4620-97c9-39253e38c2c3.png';
import M_16_19 from '$lib/assets/body-fat/M_16-19-fc784d07-ea8e-4909-9077-ec2e572b30ff.png';
import M_20_24 from '$lib/assets/body-fat/M_20-24-99a64217-ecd8-446f-80a3-b25f8ee71688.png';
import M_25_30 from '$lib/assets/body-fat/M_25-30-0d773992-cac9-431e-9f59-e001dfe6d7b4.png';
import M_31_40 from '$lib/assets/body-fat/M_31-40-3e9ed073-432e-4cf2-93ca-52bb38bd2606.png';

/** Chaves H_1..H_6 e M_1..M_6 (estágio 0 = _1, estágio 5 = _6). */
export const BODY_FAT_IMAGES: Record<string, string> = {
	H_1: H_11_12,
	H_2: H_13_15,
	H_3: H_16_19,
	H_4: H_20_24,
	H_5: H_25_30,
	H_6: H_31_40,
	M_1: M_11_12,
	M_2: M_13_15,
	M_3: M_16_19,
	M_4: M_20_24,
	M_5: M_25_30,
	M_6: M_31_40
};
