import express from "express";
import dotenv from "dotenv";
import logger from "./utils/logger.js";
import path from "path";
import modrinthRoutes from "./routes/modrinth/index.js";
import curseforgeRoutes from "./routes/curseforge/index.js";
import hangarRoutes from "./routes/hangar/index.js";
import metaRoutes from "./routes/metaRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { checkCrawlerMiddleware } from "./middleware/checkCrawler.js";

dotenv.config({ quiet: true });

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(process.cwd(), "public")));

app.use(checkCrawlerMiddleware);

// Mount platform routes
app.use(modrinthRoutes);
app.use(curseforgeRoutes);
app.use(hangarRoutes);
app.use(metaRoutes);

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