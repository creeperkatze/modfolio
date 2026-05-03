import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [vue(), tailwindcss()],
	server: {
		proxy: {
			'/modrinth': 'http://localhost:3000',
			'/curseforge': 'http://localhost:3000',
			'/hangar': 'http://localhost:3000',
			'/spigot': 'http://localhost:3000',
			'/docs': 'http://localhost:3000',
		},
	},
	build: {
		outDir: 'dist',
		emptyOutDir: true,
	},
})
