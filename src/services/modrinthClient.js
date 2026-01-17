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
        logger.warn('User not found');
      }
      logger.warn(`Modrinth API error: ${response.status}`);
    }

    return response.json();
  }

  async getUser(username) {
    return this.fetch(`${MODRINTH_API}/user/${username}`);
  }

  async getUserProjects(username) {
    return this.fetch(`${MODRINTH_API}/user/${username}/projects`);
  }

  async getUserStats(username) {
    const [user, projects] = await Promise.all([
      this.getUser(username),
      this.getUserProjects(username)
    ]);

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

    return {
      user,
      projects,
      stats: {
        totalDownloads,
        totalFollowers,
        projectCount,
        mostPopular,
        topProjects
      }
    };
  }
}

export default new ModrinthClient();
