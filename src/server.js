import express from "express";
import dotenv from "dotenv";
import logger from "./utils/logger.js";
import path from "path";
import modrinthRoutes from "./routes/modrinth/index.js";
import curseforgeRoutes from "./routes/curseforge/index.js";
import hangarRoutes from "./routes/hangar/index.js";
import spigotRoutes from "./routes/spigot/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { checkCrawlerMiddleware } from "./middleware/checkCrawler.js";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import packageJson from "../package.json" with { type: "json" };
dotenv.config({ quiet: true });

const app = express();
const port = process.env.PORT || 3000;

const swaggerDocument = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "swagger.json"), "utf8"));
swaggerDocument.info.version = packageJson.version;
const swaggerCss = fs.readFileSync(path.join(process.cwd(), "public", "swagger.css"), "utf8");

app.use(express.static(path.join(process.cwd(), "public")));

app.use(checkCrawlerMiddleware);

app.use(modrinthRoutes);
app.use(curseforgeRoutes);
app.use(hangarRoutes);
app.use(spigotRoutes);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: "Modfolio API Docs",
    customCss: swaggerCss
}));

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