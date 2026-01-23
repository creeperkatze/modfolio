import express from "express";
import dotenv from "dotenv";
import logger from "./utils/logger.js";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import organizationRoutes from "./routes/organizationRoutes.js";
import collectionRoutes from "./routes/collectionRoutes.js";
import metaRoutes from "./routes/metaRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { checkCrawlerMiddleware } from "./middleware/checkCrawler.js";

const execPromise = promisify(exec);

dotenv.config({ quiet: true });

// Setup fontconfig for custom fonts (Linux/Vercel only)
if (process.platform === "linux") {
    const configFilePath = path.resolve(process.cwd(), "fonts.conf");
    process.env.FONTCONFIG_FILE = configFilePath;

    // Run fc-cache to refresh font cache with custom fonts
    execPromise("fc-cache -fv")
        .then(({ stdout }) => logger.info(`Font cache updated: ${stdout}`))
        .catch((err) => logger.warn(`Font cache update failed: ${err.message}`));
}

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(process.cwd(), "public")));

app.use(checkCrawlerMiddleware);

app.use("/", userRoutes, projectRoutes, organizationRoutes, collectionRoutes, metaRoutes);

app.use((req, res) =>
{
    res.status(404).json({
        error: "Not Found",
    });
});

app.use(errorHandler);

app.listen(port, () =>
{
    logger.info(`Listening on port ${port}`);
});