import { generateBadge } from "../generators/badge.js";
import { generateAttribution, generateInfo } from "../generators/svgComponents.js";
import { generatePng } from "../utils/generateImage.js";

function generateErrorCard(message, detailText = "")
{
    const bgColor = "transparent";
    const errorTextColor = "#f38ba8";
    const detailTextColor = "#a6adc8";
    const accentColor = "#1bd96a";
    const borderColor = "#E4E2E2";

    // Truncate detail text if too long
    const maxDetailLength = 60;
    const truncatedDetail = detailText.length > maxDetailLength
        ? detailText.substring(0, maxDetailLength) + "..."
        : detailText;

    return `
<svg width="450" height="120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="error_rectangle">
      <rect width="450" height="120" rx="4.5"/>
    </clipPath>
  </defs>
  <g clip-path="url(#error_rectangle)">
    <rect stroke="${borderColor}" fill="${bgColor}" rx="4.5" x="0.5" y="0.5" width="449" height="119" vector-effect="non-scaling-stroke"/>

    <!-- Modrinth Icon -->
    <svg x="15" y="15" width="24" height="24" viewBox="0 0 512 514">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M503.16 323.56C514.55 281.47 515.32 235.91 503.2 190.76C466.57 54.2299 326.04 -26.8001 189.33 9.77991C83.8101 38.0199 11.3899 128.07 0.689941 230.47H43.99C54.29 147.33 113.74 74.7298 199.75 51.7098C306.05 23.2598 415.13 80.6699 453.17 181.38L411.03 192.65C391.64 145.8 352.57 111.45 306.3 96.8198L298.56 140.66C335.09 154.13 364.72 184.5 375.56 224.91C391.36 283.8 361.94 344.14 308.56 369.17L320.09 412.16C390.25 383.21 432.4 310.3 422.43 235.14L464.41 223.91C468.91 252.62 467.35 281.16 460.55 308.07L503.16 323.56Z" fill="${accentColor}"/>
      <path d="M321.99 504.22C185.27 540.8 44.7501 459.77 8.11011 323.24C3.84011 307.31 1.17 291.33 0 275.46H43.27C44.36 287.37 46.4699 299.35 49.6799 311.29C53.0399 323.8 57.45 335.75 62.79 347.07L101.38 323.92C98.1299 316.42 95.39 308.6 93.21 300.47C69.17 210.87 122.41 118.77 212.13 94.7601C229.13 90.2101 246.23 88.4401 262.93 89.1501L255.19 133C244.73 133.05 234.11 134.42 223.53 137.25C157.31 154.98 118.01 222.95 135.75 289.09C136.85 293.16 138.13 297.13 139.59 300.99L188.94 271.38L174.07 231.95L220.67 184.08L279.57 171.39L296.62 192.38L269.47 219.88L245.79 227.33L228.87 244.72L237.16 267.79C237.16 267.79 253.95 285.63 253.98 285.64L277.7 279.33L294.58 260.79L331.44 249.12L342.42 273.82L304.39 320.45L240.66 340.63L212.08 308.81L162.26 338.7C187.8 367.78 226.2 383.93 266.01 380.56L277.54 423.55C218.13 431.41 160.1 406.82 124.05 361.64L85.6399 384.68C136.25 451.17 223.84 484.11 309.61 461.16C371.35 444.64 419.4 402.56 445.42 349.38L488.06 364.88C457.17 431.16 398.22 483.82 321.99 504.22Z" fill="${accentColor}"/>
    </svg>

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

export async function errorHandler(err, req, res, next)
{
    const theme = req.query.theme || "dark";
    const format = req.query.format;

    let statusCode = 500;
    let message = "Internal Server Error";
    let detailText = "";

    if (err.message.includes("not found"))
    {
        statusCode = 404;
        // Determine if this is a project, user, organization, or collection request
        const isProjectRequest = req.path.includes("/project/");
        const isOrganizationRequest = req.path.includes("/organization/");
        const isCollectionRequest = req.path.includes("/collection/");
        message = isProjectRequest ? "Project not found" :
            isOrganizationRequest ? "Organization not found" :
                isCollectionRequest ? "Collection not found" :
                    "User not found";
    } else if (err.message.includes("Modrinth API"))
    {
        // Extract status code and error text from error message (format: "Modrinth API error: STATUS|TEXT")
        const errorMatch = err.message.match(/Modrinth API error: (\d+)\|?(.*)/);
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

    // Check if PNG format is requested or if it's a Discord bot
    const useImage = req.isCrawler || format === "png";

    if (isBadge)
    {
        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.status(statusCode).send(generateBadge("error", message, "#f38ba8"));
    } else if (useImage)
    {
        const svg = generateErrorCard(message, detailText);
        const pngBuffer = await generatePng(svg);

        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

        // Use Code 200 for crawlers since they dont like error codes
        if (req.isCrawler)
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
        res.status(200).send(generateErrorCard(message, detailText));
    }
}
