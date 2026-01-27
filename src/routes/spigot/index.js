import express from "express";
import * as spigotController from "../../controllers/spigotController.js";
import * as cardController from "../../controllers/cardController.js";
import * as badgeController from "../../controllers/badgeController.js";

const router = express.Router();

// Meta route
router.get("/spigot/meta/:id", spigotController.getSpigotMeta);

// Card routes
router.get("/spigot/resource/:id", cardController.getSpigotResource);
router.get("/spigot/author/:id", cardController.getSpigotAuthor);

// Badge routes - Resource
router.get("/spigot/resource/:id/downloads", badgeController.getSpigotResourceDownloads);
router.get("/spigot/resource/:id/likes", badgeController.getSpigotResourceLikes);
router.get("/spigot/resource/:id/rating", badgeController.getSpigotResourceRating);
router.get("/spigot/resource/:id/versions", badgeController.getSpigotResourceVersions);

// Badge routes - Author
router.get("/spigot/author/:id/downloads", badgeController.getSpigotAuthorDownloads);
router.get("/spigot/author/:id/resources", badgeController.getSpigotAuthorResources);
router.get("/spigot/author/:id/rating", badgeController.getSpigotAuthorRating);

export default router;
