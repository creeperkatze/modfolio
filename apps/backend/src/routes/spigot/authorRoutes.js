import express from "express";
import * as cardController from "../../controllers/cardController.js";
import * as badgeController from "../../controllers/badgeController.js";

const router = express.Router();

// Card routes
router.get("/spigot/author/:id", cardController.getSpigotAuthor);

// Badge routes
router.get("/spigot/author/:id/downloads", badgeController.getSpigotAuthorDownloads);
router.get("/spigot/author/:id/resources", badgeController.getSpigotAuthorResources);
router.get("/spigot/author/:id/rating", badgeController.getSpigotAuthorRating);

export default router;
