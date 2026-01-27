# <a href="https://modfolio.creeperkatze.de"><img src=".github/assets/logo.png" alt="Logo" width="400"></a>

Generate fast, beautiful and consistent embeddable cards and badges for Modrinth, CurseForge, Hangar and Spigot content.

[![Better Stack Badge](https://uptime.betterstack.com/status-badges/v1/monitor/2d89t.svg)](https://status.creeperkatze.de)
![GitHub Issues](https://img.shields.io/github/issues/creeperkatze/modfolio?labelColor=0d143c)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/creeperkatze/modfolio?labelColor=0d143c)
![GitHub Repo stars](https://img.shields.io/github/stars/creeperkatze/modfolio?style=flat&labelColor=0d143c)

## Quick Start

Use the **[Website](https://modfolio.creeperkatze.de)** to visually configure and preview your embeds.

Examples:

[![Mod Menu](https://modfolio.creeperkatze.de/modrinth/project/modmenu)](https://modrinth.com/project/modmenu)
[![Sodium](https://modfolio.creeperkatze.de/curseforge/project/394468)](https://www.curseforge.com/minecraft/mc-mods/sodium)
[![NoticeAPI](https://modfolio.creeperkatze.de/hangar/project/NoticeAPI)](https://hangar.papermc.io/NoticeAPI/NoticeAPI)
[![Vault](https://modfolio.creeperkatze.de/spigot/resource/77333)](https://www.spigotmc.org/resources/vault.77333/)

## Endpoints

Base URL: `https://modfolio.creeperkatze.de`

Pattern: `/<platform>/<entity-type>/<identifier>?<option>=<value>`

### Cards

Rich cards showing stats, versions, projects, and activity sparklines.

#### Modrinth

| Card Type | Path | Example |
|-----------|------|---------|
| Project | `/modrinth/project/<slug>` | [![Mod Menu](https://modfolio.creeperkatze.de/modrinth/project/modmenu)](https://modrinth.com/project/modmenu) |
| User | `/modrinth/user/<username>` | [![Prospector](https://modfolio.creeperkatze.de/modrinth/user/prospector)](https://modrinth.com/user/prospector) |
| Organization | `/modrinth/organization/<slug>` | [![CaffeineMC](https://modfolio.creeperkatze.de/modrinth/organization/caffeinemc)](https://modrinth.com/organization/caffeinemc) |
| Collection | `/modrinth/collection/<id>` | [![Featured - Vol. 38](https://modfolio.creeperkatze.de/modrinth/collection/VEgGDFFE)](https://modrinth.com/collection/VEgGDFFE) |

#### CurseForge

| Card Type | Path | Example |
|-----------|------|---------|
| Project | `/curseforge/project/<id>` | [![Sodium](https://modfolio.creeperkatze.de/curseforge/project/394468)](https://www.curseforge.com/minecraft/mc-mods/sodium) |
| Lookup | `/curseforge/lookup/<slug>` | Resolves slug to project ID |

#### Hangar

| Card Type | Path | Example |
|-----------|------|---------|
| Project | `/hangar/project/<slug>` | [![NoticeAPI](https://modfolio.creeperkatze.de/hangar/project/NoticeAPI)](https://hangar.papermc.io/NoticeAPI/NoticeAPI) |
| User | `/hangar/user/<username>` | [![Kevin](https://modfolio.creeperkatze.de/hangar/user/KevinPT)](https://hangar.papermc.io/KevinPT) |

#### Spigot

| Card Type | Path | Example |
|-----------|------|---------|
| Resource | `/spigot/resource/<id>` | [![Vault](https://modfolio.creeperkatze.de/spigot/resource/77333)](https://www.spigotmc.org/resources/vault.77333/) |
| Author | `/spigot/author/<id>` | Author stats card |

#### Card Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `color` | Accent color (hex) | Platform default |
| `backgroundColor` | Background color (hex) | `transparent` |
| `showProjects` | Show top projects section | `true` |
| `showVersions` | Show versions section | `true` |
| `maxProjects` | Max projects to display (1-10) | `5` |
| `maxVersions` | Max versions to display (1-10) | `5` |
| `relativeTime` | Show relative time for dates | `true` |
| `showSparklines` | Display activity sparklines | `true` |

**Platform defaults:** Modrinth `#1bd96a` | CurseForge `#F16436` | Hangar `#3371ED` | Spigot `#E8A838`

### Badges

Pattern: `/<platform>/<entity-type>/<identifier>/<metric>?<option>=<value>`

Compact badges showing a single metric.

#### Modrinth

| Badge | Path | Example |
|-------|------|---------|
| Downloads | `/modrinth/<type>/<id>/downloads` | ![Downloads](https://modfolio.creeperkatze.de/modrinth/project/modmenu/downloads) |
| Followers | `/modrinth/<type>/<id>/followers` | ![Followers](https://modfolio.creeperkatze.de/modrinth/project/modmenu/followers) |
| Versions | `/modrinth/<type>/<id>/versions` | ![Versions](https://modfolio.creeperkatze.de/modrinth/project/modmenu/versions) |
| Projects | `/modrinth/user|organization/<id>/projects` | ![Projects](https://modfolio.creeperkatze.de/modrinth/user/prospector/projects) |

#### CurseForge

| Badge | Path | Example |
|-------|------|---------|
| Downloads | `/curseforge/project/<id>/downloads` | ![Downloads](https://modfolio.creeperkatze.de/curseforge/project/394468/downloads) |
| Rank | `/curseforge/project/<id>/rank` | ![Rank](https://modfolio.creeperkatze.de/curseforge/project/394468/rank) |
| Files | `/curseforge/project/<id>/versions` | ![Files](https://modfolio.creeperkatze.de/curseforge/project/394468/versions) |

#### Hangar

| Badge | Path | Example |
|-------|------|---------|
| Downloads | `/hangar/<type>/<id>/downloads` | ![Downloads](https://modfolio.creeperkatze.de/hangar/project/NoticeAPI/downloads) |
| Stars | `/hangar/<type>/<id>/stars` | ![Stars](https://modfolio.creeperkatze.de/hangar/project/NoticeAPI/stars) |
| Versions | `/hangar/<type>/<id>/versions` | ![Versions](https://modfolio.creeperkatze.de/hangar/project/NoticeAPI/versions) |
| Views | `/hangar/project/<id>/views` | ![Views](https://modfolio.creeperkatze.de/hangar/project/NoticeAPI/views) |
| Projects | `/hangar/user/<id>/projects` | ![Projects](https://modfolio.creeperkatze.de/hangar/user/KevinPT/projects) |

#### Spigot

| Badge | Path | Example |
|-------|------|---------|
| Downloads | `/spigot/<type>/<id>/downloads` | ![Downloads](https://modfolio.creeperkatze.de/spigot/resource/77333/downloads) |
| Likes | `/spigot/<type>/<id>/likes` | ![Likes](https://modfolio.creeperkatze.de/spigot/resource/77333/likes) |
| Rating | `/spigot/<type>/<id>/rating` | ![Rating](https://modfolio.creeperkatze.de/spigot/resource/77333/rating) |
| Versions | `/spigot/<type>/<id>/versions` | ![Versions](https://modfolio.creeperkatze.de/spigot/resource/77333/versions) |
| Resources | `/spigot/author/<id>/resources` | ![Resources](https://modfolio.creeperkatze.de/spigot/author/1/resources) |

#### Badge Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `color` | Accent color (hex) | Platform default |
| `backgroundColor` | Background color (hex) | `transparent` |
| `format` | Output format (`svg` / `png`) | `svg` |

**Platform defaults:** Modrinth `#1bd96a` | CurseForge `#F16436` | Hangar `#3371ED` | Spigot `#E8A838`

## Development

### Prequisites

- Node.js
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/creeperkatze/modfolio.git
cd modfolio

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Environment Variables

Copy the `.env.example` file and rename it to `.env`.

## Contributing

Contributions are always welcome!

Please ensure you run `pnpm lint` before opening a pull request.

## License

AGPL-3.0
