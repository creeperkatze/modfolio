import packageJson from "../../package.json" with { type: "json" };
const VERSION = packageJson.version;

function getDefaultUserAgent() {
    const envUserAgent = process.env.USER_AGENT;
    if (envUserAgent) {
        return envUserAgent.replace("{version}", VERSION);
    }
    // Minimal fallback
    return `modfolio/${VERSION}`;
}

export class BasePlatformClient {
    constructor(platformName, config = {}) {
        this.platformName = platformName;
        this.baseUrl = config.baseUrl;
        this.apiKey = config.apiKey;
        this.userAgent = config.userAgent || getDefaultUserAgent();
    }

    isConfigured() {
        return true; // Base implementation - no API key required by default
    }

    getHeaders() {
        return {
            "User-Agent": this.userAgent
        };
    }

    async fetch(endpoint, options = {}) {
        // Handle full URLs vs relative endpoints
        const url = endpoint.startsWith("http") ? endpoint : `${this.baseUrl}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers
            }
        });

        if (!response.ok) {
            // For 404s and other 4xx client errors, return null instead of throwing
            if (response.status >= 400 && response.status < 500) {
                return null;
            }

            const errorBody = await response.text().catch(() => "");
            let errorText = errorBody;

            try {
                const json = JSON.parse(errorBody);
                errorText = json.error || json.message || json.description || errorBody;
            } catch {
                // Use raw error text if JSON parsing fails
            }

            throw new Error(`${this.platformName} API error: ${response.status}: ${errorText}`);
        }

        return response.json();
    }
}
