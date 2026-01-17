import modrinthClient from '../src/services/modrinthClient.js';
import cache from '../src/utils/cache.js';
import { generateBadge, formatNumber } from '../src/utils/svgGenerator.js';

export const getDownloads = async (req, res, next) => {
  try {
    const { username } = req.params;
    const color = req.query.color || '#1d8b1d';

    // Check cache first
    const cacheKey = `badge:downloads:${username}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=600');
      return res.send(cached);
    }

    // Fetch data from Modrinth
    const data = await modrinthClient.getUserStats(username);

    // Generate badge
    const svg = generateBadge('downloads', formatNumber(data.stats.totalDownloads), color);

    // Cache the result
    cache.set(cacheKey, svg);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.send(svg);
  } catch (err) {
    next(err);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const { username } = req.params;
    const color = req.query.color || '#89b4fa';

    const cacheKey = `badge:projects:${username}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=600');
      return res.send(cached);
    }

    const data = await modrinthClient.getUserStats(username);
    const svg = generateBadge('projects', data.stats.projectCount.toString(), color);

    cache.set(cacheKey, svg);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.send(svg);
  } catch (err) {
    next(err);
  }
};

export const getFollowers = async (req, res, next) => {
  try {
    const { username } = req.params;
    const color = req.query.color || '#89b4fa';

    const cacheKey = `badge:followers:${username}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=600');
      return res.send(cached);
    }

    const data = await modrinthClient.getUserStats(username);
    const svg = generateBadge('followers', formatNumber(data.stats.totalFollowers), color);

    cache.set(cacheKey, svg);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.send(svg);
  } catch (err) {
    next(err);
  }
};
