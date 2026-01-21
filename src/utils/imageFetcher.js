import logger from "./logger.js";
import { pLimit, requestDeduplicator } from "./asyncUtils.js";
import sharp from "sharp";

const USER_AGENT = process.env.USER_AGENT;
const MAX_CONCURRENT_REQUESTS = parseInt(process.env.MAX_CONCURRENT_REQUESTS || "10", 10);

export async function fetchImageAsBase64(url)
{
    if (!url) return null;

    // Use request deduplication to prevent fetching the same image multiple times
    return requestDeduplicator.dedupe(`image:${url}`, async () => {
        try
        {
            const response = await fetch(url, {
                headers: { "User-Agent": USER_AGENT }
            });
            if (!response.ok) return null;

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = response.headers.get("content-type") || "image/png";

            // Convert to PNG if needed for Resvg compatibility
            // Resvg doesn't support WebP embedded in SVG
            let pngBuffer = buffer;
            if (contentType.includes("webp") || contentType.includes("svg")) {
                pngBuffer = await sharp(buffer).png().toBuffer();
            }

            const base64 = pngBuffer.toString("base64");
            return `data:image/png;base64,${base64}`;
        } catch (error)
        {
            logger.warn(`Failed to fetch image ${url}: ${error.message}`);
            return null;
        }
    });
}

export async function fetchImagesForProjects(projects)
{
    // Use concurrency limiting to prevent overwhelming the API
    const tasks = projects
        .filter(project => project.icon_url)
        .map(project => async () => {
            project.icon_url_base64 = await fetchImageAsBase64(project.icon_url);
        });

    await pLimit(tasks, MAX_CONCURRENT_REQUESTS);
}

export async function fetchVersionDatesForProjects(projects, getVersionsFunc)
{
    const allVersionDates = [];

    // Use concurrency limiting for version fetches
    const tasks = projects.map(project => async () => {
        try {
            const cacheKey = `versions:${project.id || project.slug}`;
            const versions = await requestDeduplicator.dedupe(cacheKey, () =>
                getVersionsFunc(project.id || project.slug)
            );
            const versionDates = versions.map(v => v.date_published);
            allVersionDates.push(...versionDates);
            project.versionDates = versionDates;
        } catch {
            project.versionDates = [];
        }
    });

    await pLimit(tasks, MAX_CONCURRENT_REQUESTS);

    return allVersionDates;
}
