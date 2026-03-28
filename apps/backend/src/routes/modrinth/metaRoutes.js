import express from "express";
import { getModrinthMeta } from "../../controllers/modrinthController.js";

const router = express.Router();

router.get("/modrinth/meta/:type/:id", getModrinthMeta);

export default router;
