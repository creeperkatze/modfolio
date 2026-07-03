import type { PlatformId, TargetType } from '../platforms'

export interface EmbedMeta {
	name?: string
	url?: string
}

export async function fetchEmbedMeta(
	platform: PlatformId,
	type: TargetType,
	id: string,
): Promise<EmbedMeta | null> {
	const path =
		platform === 'curseforge' || platform === 'modrinth'
			? `/${platform}/meta/${type}/${encodeURIComponent(id)}`
			: `/${platform}/meta/${encodeURIComponent(id)}?type=${type}`
	try {
		const res = await fetch(path)
		if (!res.ok) return null
		return (await res.json()) as EmbedMeta
	} catch {
		return null
	}
}
