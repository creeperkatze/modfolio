import dotenv from 'dotenv'

// Loaded once here so config is ready before any importer reads it, even at construction time.
dotenv.config({ quiet: true })

export const USER_AGENT = process.env.USER_AGENT
export const MAX_CONCURRENT_REQUESTS = parseInt(process.env.MAX_CONCURRENT_REQUESTS || '10', 10)
export const CURSEFORGE_API_KEY = process.env.CURSEFORGE_API_KEY
export const PORT = Number(process.env.PORT) || 3000
export const NODE_ENV = process.env.NODE_ENV
export const FRONTEND_DEV_URL = process.env.FRONTEND_DEV_URL || 'http://localhost:5173'

export const API_CACHE_TTL = 3600 // 1 hour
