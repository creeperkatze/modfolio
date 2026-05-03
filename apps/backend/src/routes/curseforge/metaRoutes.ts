import express from "express";
import { getCurseforgeMeta } from "../../controllers/curseforgeController.js";

const router = express.Router();

router.get("/curseforge/meta/:type/:id", getCurseforgeMeta);

export default router;
