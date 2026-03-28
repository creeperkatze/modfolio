import express from "express";
import * as cardController from "../../controllers/cardController.js";
import * as badgeController from "../../controllers/badgeController.js";

const router = express.Router();

// Card routes
router.get("/modrinth/server/:slug", cardController.getServer);

// Badge routes
router.get("/modrinth/server/:slug/followers", badgeController.getServerFollowers);
router.get("/modrinth/server/:slug/players", badgeController.getServerPlayers);

export default router;
