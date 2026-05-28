/** VTurb smartplayer global (delay / React sync). @see https://help.vturb.com/en-us/article/using-vturb-with-react-5d4i4j/ */
export interface VturbSmartPlayerVideo {
	currentTime: number;
}

export interface VturbSmartPlayerInstance {
	video: VturbSmartPlayerVideo;
	smartAutoPlay?: boolean;
	on: (event: string, handler: () => void) => void;
	off?: (event: string, handler: () => void) => void;
}

export interface VturbSmartPlayerGlobal {
	instances: VturbSmartPlayerInstance[];
}

declare global {
	interface Window {
		smartplayer?: VturbSmartPlayerGlobal;
	}
}

export {};
