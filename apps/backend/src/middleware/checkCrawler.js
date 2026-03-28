// Crawlers that require PNG images (social media preview bots)
const IMAGE_CRAWLERS = [
    "Discordbot",
    "Twitterbot",
    "facebookexternalhit",
    "Slackbot",
    "TelegramBot",
    "WhatsApp",
    "LinkedInBot",
    "SkypeUriPreview"
];

// All known crawlers/bots for logging purposes
const ALL_CRAWLERS = [
    ...IMAGE_CRAWLERS,
    "github-camo",
    "Dropbox",
    "FacebookBot",
    "GoogleBot",
    "BingBot"
];

export const checkCrawlerMiddleware = (req, res, next) => {
    const userAgent = req.headers["user-agent"] || "";

    // Check if the request is from an image crawler (social media bots)
    req.isImageCrawler = IMAGE_CRAWLERS.some(crawler =>
        userAgent.includes(crawler)
    );

    // Identify which specific bot it is (for logging)
    req.crawlerType = ALL_CRAWLERS.find(crawler =>
        userAgent.includes(crawler)
    ) || null;

    next();
};