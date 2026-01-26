import packageJson from "../../package.json" with { type: "json" };
const VERSION = packageJson.version;

/**
 * Get the default user agent from environment or package info.
 * The USER_AGENT env var can contain {version} as a placeholder for the package version.
 */
function getDefaultUserAgent() {
    const envUserAgent = process.env.USER_AGENT;
    if (envUserAgent) {
        return envUserAgent.replace("{version}", VERSION);
    }
    // Minimal fallback without email
    return `modfolio/${VERSION}`;
}

/**
 * Base class for API clients with shared fetch logic and error handling.
 * Platform-specific clients extend this class to inherit common functionality.
 */
export class BasePlatformClient {
    /**
     * @param {string} platformName - Display name of the platform (for error messages)
     * @param {Object} config - Client configuration
     * @param {string} config.baseUrl - Base URL for the API
     * @param {string} [config.apiKey] - Optional API key
     * @param {string} [config.userAgent] - Custom user agent string (defaults to env or minimal)
     */
    constructor(platformName, config = {}) {
        this.platformName = platformName;
        this.baseUrl = config.baseUrl;
        this.apiKey = config.apiKey;
        this.userAgent = config.userAgent || getDefaultUserAgent();
    }

    /**
     * Check if the client is properly configured with required credentials.
     * Override in subclasses for platform-specific configuration checks.
     *
     * @returns {boolean}
     */
    isConfigured() {
        return true; // Base implementation - no API key required by default
    }

    /**
     * Get headers for API requests.
     * Override in subclasses to add platform-specific headers (e.g., API keys).
     *
     * @returns {Object}
     */
    getHeaders() {
        return {
            "User-Agent": this.userAgent
        };
    }

    /**
     * Fetch data from the API with standardized error handling.
     * For user-caused errors (404), returns null instead of throwing.
     *
     * @param {string} endpoint - API endpoint (will be appended to baseUrl if not a full URL)
     * @param {Object} [options] - Additional fetch options
     * @returns {Promise<any>} Parsed JSON response, or null for 404s
     * @throws {Error} With descriptive error message on failure (except 404s)
     */
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
            // For 404s, return null instead of throwing - this is a user-caused error
            if (response.status === 404) {
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
