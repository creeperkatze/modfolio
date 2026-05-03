import express from "express";
import { getSpigotMeta } from "../../controllers/spigotController.js";

const router = express.Router();

router.get("/spigot/meta/:id", getSpigotMeta);

export default router;
