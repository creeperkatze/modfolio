import express from 'express';
import dotenv from 'dotenv';
import logger from "./utils/logger.js";
import path from 'path';
import { fileURLToPath } from 'url';
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config({ quiet: true });

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(dirname, '..', 'public')));

app.use('/', userRoutes, projectRoutes, organizationRoutes);

app.use(errorHandler);

app.listen(port, () =>
{
    logger.info(`Listening on port ${port}`);
});