import modrinthClient from '../src/services/modrinthClient.js';
import cache from '../src/utils/cache.js';
import { generateUserSummaryCard, generateTopProjectsCard } from '../src/utils/svgGenerator.js';

export const getSummary = async (req, res, next) => {
  try {
    const { username } = req.params;
    const theme = req.query.theme || 'dark';

    // Check cache first
    const cacheKey = `summary:${username}:${theme}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=600'); // 10 minutes
      return res.send(cached);
    }

    // Fetch data from Modrinth
    const data = await modrinthClient.getUserStats(username);

    // Generate SVG
    const svg = generateUserSummaryCard(data, theme);

    // Cache the result
    cache.set(cacheKey, svg);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=600'); // 10 minutes
    res.send(svg);
  } catch (err) {
    next(err);
  }
};

export const getTopProjects = async (req, res, next) => {
  try {
    const { username } = req.params;
    const theme = req.query.theme || 'dark';

    // Check cache first
    const cacheKey = `top-projects:${username}:${theme}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=600');
      return res.send(cached);
    }

    // Fetch data from Modrinth
    const data = await modrinthClient.getUserStats(username);

    // Generate SVG
    const svg = generateTopProjectsCard(data, theme);

    // Cache the result
    cache.set(cacheKey, svg);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.send(svg);
  } catch (err) {
    next(err);
  }
};
