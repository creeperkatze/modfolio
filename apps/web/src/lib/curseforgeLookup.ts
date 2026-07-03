async function lookup(path: string): Promise<string | null> {
	try {
		const res = await fetch(path)
		if (!res.ok) return null
		const data = await res.json()
		return data?.id ? String(data.id) : null
	} catch {
		return null
	}
}

export function lookupCurseForgeProjectId(slug: string): Promise<string | null> {
	return lookup(`/curseforge/lookup/${encodeURIComponent(slug)}`)
}

export function lookupCurseForgeUserId(id: string): Promise<string | null> {
	return lookup(`/curseforge/lookup/user/${encodeURIComponent(id)}`)
}
