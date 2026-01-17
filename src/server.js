import express from 'express';
import dotenv from 'dotenv';
import logger from "./utils/logger.js";
import cardRoutes from './routes/cardRoutes.js';
import badgeRoutes from './routes/badgeRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config({ quiet: true });

const app = express();
const port = process.env.PORT || 3000;

app.use('/card', cardRoutes);
app.use('/badge', badgeRoutes);

app.get('/', (req, res) =>
{
    res.redirect(301, 'https://github.com/creeperkatze/modrinth-readme-stats');
});

app.use(errorHandler);

app.listen(port, () =>
{
    logger.info(`Listening on port ${port}`);
});