import { escapeHtml } from "../utils/formatters.js";

export const discordEmbedMiddleware = (req, res, next) =>
{
    const userAgent = req.headers["user-agent"] || "";

    // Check if the request is from Discord's crawler
    if (userAgent.includes("Discordbot"))
    {
        req.isDiscordBot = true;
    }

    next();
};

export const generateDiscordEmbedHTML = (title, imageUrl) =>
{
    return `<!DOCTYPE html>
<html>
<head>
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:image:type" content="image/svg+xml" />
    <meta property="og:image:width" content="450" />
    <meta property="og:image:height" content="400" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
</head>
<body>
    <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" />
</body>
</html>`;
};
