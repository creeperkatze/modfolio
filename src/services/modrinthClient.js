import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config({ quiet: true });

const MODRINTH_API = process.env.MODRINTH_URL;
const USER_AGENT = process.env.USER_AGENT;

export class ModrinthClient {
  async fetch(url) {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('User not found');
      } else {
        logger.warn(`API error ${response.status}: ${url}`);
        throw new Error(`Modrinth API error: ${response.status}`);
      }
    }

    return response.json();
  }

  async getUser(username) {
    return this.fetch(`${MODRINTH_API}/user/${username}`);
  }

  async getUserProjects(username) {
    return this.fetch(`${MODRINTH_API}/user/${username}/projects`);
  }

  async fetchImageAsBase64(url) {
    if (!url) return null;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT
        }
      });
      if (!response.ok) return null;

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const contentType = response.headers.get('content-type') || 'image/png';
      return `data:${contentType};base64,${base64}`;
    } catch (error) {
      logger.warn(`Failed to fetch image ${url}: ${error.message}`);
      return null;
    }
  }

  async getUserStats(username) {
    const [user, projects] = await Promise.all([
      this.getUser(username),
      this.getUserProjects(username)
    ]);

    // Fetch project icons as base64
    await Promise.all(
      projects.map(async (project) => {
        if (project.icon_url) {
          project.icon_url_base64 = await this.fetchImageAsBase64(project.icon_url);
        }
      })
    );

    // Calculate aggregate statistics
    const totalDownloads = projects.reduce((sum, project) => sum + (project.downloads || 0), 0);
    const totalFollowers = projects.reduce((sum, project) => sum + (project.followers || 0), 0);
    const projectCount = projects.length;

    // Find most popular project
    const mostPopular = projects.reduce((max, project) =>
      (project.downloads || 0) > (max.downloads || 0) ? project : max
    , projects[0] || null);

    // Sort projects by downloads for top projects
    const topProjects = [...projects]
      .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
      .slice(0, 5);

    // Calculate new metrics
    const avgDownloads = projectCount > 0 ? Math.floor(totalDownloads / projectCount) : 0;
    const engagementRatio = totalDownloads > 0 ? (totalFollowers / totalDownloads * 1000).toFixed(1) : 0;

    // Project type breakdown
    const projectTypes = projects.reduce((acc, project) => {
      const type = project.project_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Game versions (get most common versions)
    const gameVersions = {};
    projects.forEach(project => {
      if (project.game_versions && Array.isArray(project.game_versions)) {
        project.game_versions.forEach(version => {
          gameVersions[version] = (gameVersions[version] || 0) + 1;
        });
      }
    });
    const topGameVersions = Object.entries(gameVersions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([version]) => version);

    // Loaders breakdown
    const loaders = {};
    projects.forEach(project => {
      if (project.loaders && Array.isArray(project.loaders)) {
        project.loaders.forEach(loader => {
          loaders[loader] = (loaders[loader] || 0) + 1;
        });
      }
    });

    // Categories (most common)
    const categories = {};
    projects.forEach(project => {
      if (project.categories && Array.isArray(project.categories)) {
        project.categories.forEach(category => {
          categories[category] = (categories[category] || 0) + 1;
        });
      }
    });
    const topCategories = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);

    // Recent activity
    const recentProject = projects
      .filter(p => p.published)
      .sort((a, b) => new Date(b.published) - new Date(a.published))[0];

    return {
      user,
      projects,
      stats: {
        totalDownloads,
        totalFollowers,
        projectCount,
        mostPopular,
        topProjects,
        avgDownloads,
        engagementRatio,
        projectTypes,
        topGameVersions,
        loaders,
        topCategories,
        recentProject
      }
    };
  }
}

export default new ModrinthClient();
