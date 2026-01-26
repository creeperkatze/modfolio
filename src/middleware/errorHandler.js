import { generateBadge } from "../generators/badge.js";
import { generateAttribution, generateInfo } from "../generators/svgComponents.js";
import { generatePng } from "../utils/generateImage.js";
import { ICONS } from "../constants/icons.js";

export function generateErrorCard(message, detailText = "", isCurseforge = false, isHangar = false)
{
    const bgColor = "transparent";
    const errorTextColor = "#f38ba8";
    const detailTextColor = "#a6adc8";
    const accentColor = isCurseforge ? "#F16436" : isHangar ? "#3371ED" : "#1bd96a";
    const borderColor = "#E4E2E2";

    // Truncate detail text if too long
    const maxDetailLength = 60;
    const truncatedDetail = detailText.length > maxDetailLength
        ? detailText.substring(0, maxDetailLength) + "..."
        : detailText;

    // Get the correct icon based on platform
    let icon;
    let viewBox;
    if (isCurseforge) {
        icon = ICONS.curseforge(accentColor);
        viewBox = "0 0 32 32";
    } else if (isHangar) {
        icon = ICONS.hangar(accentColor);
        viewBox = "0 0 100 100";
    } else {
        icon = ICONS.modrinth(accentColor);
        viewBox = "0 0 512 514";
    }

    const logo = `<svg x="15" y="15" width="24" height="24" viewBox="${viewBox}">${icon}</svg>`;

    return `
<svg width="450" height="120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="error_rectangle">
      <rect width="450" height="120" rx="4.5"/>
    </clipPath>
  </defs>
  <g clip-path="url(#error_rectangle)">
    <rect stroke="${borderColor}" fill="${bgColor}" rx="4.5" x="0.5" y="0.5" width="449" height="119" vector-effect="non-scaling-stroke"/>

    <!-- Logo -->
    ${logo}

    <!-- Error Text -->
    <text x="225" y="${detailText ? "55" : "65"}" text-anchor="middle" font-family="Inter, sans-serif" font-size="16" font-weight="600" fill="${errorTextColor}">
      ${message}
    </text>
    ${detailText ? `<text x="225" y="75" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="${detailTextColor}">
      ${truncatedDetail}
    </text>` : ""}

    ${generateInfo(120, { textColor: detailTextColor })}
    ${generateAttribution(120, { textColor: detailTextColor })}
  </g>
</svg>`.trim();
}

// Map status codes to user-friendly messages
function getStatusMessage(statusCode)
{
    const statusMessages = {
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        429: "Rate Limit Exceeded",
        500: "Internal Server Error",
        502: "API Unavailable",
        503: "Service Unavailable",
        504: "Gateway Timeout"
    };
    return statusMessages[statusCode] || `Error ${statusCode}`;
}

export async function errorHandler(err, req, res)
{
    const format = req.query.format;
    const isCurseforge = req.path.includes("/curseforge/");
    const isHangar = req.path.includes("/hangar/");

    let statusCode = 500;
    let message = "Internal Server Error";
    let detailText = "";

    if (err.message.includes("not found"))
    {
        statusCode = 404;
        const isHangar = req.path.includes("/hangar/");
        if (isCurseforge) {
            message = "Mod not found";
        } else if (isHangar) {
            // Determine if this is a project or user request
            const isProjectRequest = req.path.includes("/project/");
            const isUserRequest = req.path.includes("/user/");
            message = isProjectRequest ? "Project not found" :
                isUserRequest ? "User not found" :
                    "Project not found";
        } else {
            // Determine if this is a project, user, organization, or collection request
            const isProjectRequest = req.path.includes("/project/");
            const isOrganizationRequest = req.path.includes("/organization/");
            const isCollectionRequest = req.path.includes("/collection/");
            message = isProjectRequest ? "Project not found" :
                isOrganizationRequest ? "Organization not found" :
                    isCollectionRequest ? "Collection not found" :
                        "User not found";
        }
    } else if (err.message.includes("CurseForge API"))
    {
        // Extract status code and error text from error message (format: "CurseForge API error: STATUS: TEXT")
        const errorMatch = err.message.match(/CurseForge API error: (\d+):?\s*(.*)/);
        const apiStatusCode = errorMatch ? parseInt(errorMatch[1]) : 502;
        const apiErrorText = errorMatch && errorMatch[2] ? errorMatch[2].trim() : "";

        statusCode = apiStatusCode;
        message = getStatusMessage(apiStatusCode);
        detailText = apiErrorText;
    } else if (err.message.includes("Modrinth API"))
    {
        // Extract status code and error text from error message (format: "Modrinth API error: STATUS: TEXT")
        const errorMatch = err.message.match(/Modrinth API error: (\d+):?\s*(.*)/);
        const apiStatusCode = errorMatch ? parseInt(errorMatch[1]) : 502;
        const apiErrorText = errorMatch && errorMatch[2] ? errorMatch[2].trim() : "";

        statusCode = apiStatusCode;
        message = getStatusMessage(apiStatusCode);
        detailText = apiErrorText;
    } else if (err.message.includes("Rate limit"))
    {
        statusCode = 429;
        message = "Rate limit exceeded";
    }

    // Check if this is a badge request
    const isBadge = req.path.includes("/badge");

    // Check if image format is requested or if it's an image crawler
    const useImage = req.isImageCrawler || format === "image";

    if (isBadge)
    {
        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.status(statusCode).send(generateBadge("error", message, "#f38ba8"));
    } else if (useImage)
    {
        const svg = generateErrorCard(message, detailText, isCurseforge, isHangar);
        const { buffer: pngBuffer } = await generatePng(svg);

        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

        // Use Code 200 for image crawlers since they dont like error codes
        if (req.isImageCrawler)
        {
            res.status(200).send(pngBuffer);
        }
        else
        {
            res.status(statusCode).send(pngBuffer);
        }
    } else
    {
        // Return SVG
        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("X-Error-Status", statusCode.toString());

        // Use Code 200 for image crawlers since they dont like error codes
        if (req.isImageCrawler)
        {
            res.status(200).send(generateErrorCard(message, detailText, isCurseforge, isHangar));
        }
        else
        {
            res.status(statusCode).send(generateErrorCard(message, detailText, isCurseforge, isHangar));
        }
    }
}
