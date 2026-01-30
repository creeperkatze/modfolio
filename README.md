# <a href="https://modfolio.creeperkatze.de"><img src=".github/assets/logo.png" alt="Logo" width="400"></a>

Generate fast, beautiful and consistent embeddable cards and badges for Modrinth, CurseForge, Hangar and Spigot content.

[![Better Stack Badge](https://uptime.betterstack.com/status-badges/v1/monitor/2d89t.svg)](https://status.creeperkatze.de)
![GitHub Issues](https://img.shields.io/github/issues/creeperkatze/modfolio?labelColor=0d143c)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/creeperkatze/modfolio?labelColor=0d143c)
![GitHub Repo stars](https://img.shields.io/github/stars/creeperkatze/modfolio?style=flat&labelColor=0d143c)

## Quick Start

Use the **[Website](https://modfolio.creeperkatze.de)** to visually configure and preview your embeds.
The api docs can be found at **[here](https://modfolio.creeperkatze.de/docs)**.

Examples:

[![Mod Menu](https://modfolio.creeperkatze.de/modrinth/project/modmenu)](https://modrinth.com/project/modmenu)
[![GeckoLib](https://modfolio.creeperkatze.de/curseforge/project/388172)](https://www.curseforge.com/minecraft/mc-mods/geckolib)
[![SimpleVoiceChat](https://modfolio.creeperkatze.de/hangar/project/SimpleVoiceChat)](https://hangar.papermc.io/henkelmax/SimpleVoiceChat)
[![LuckPerms](https://modfolio.creeperkatze.de/spigot/resource/28140)](https://spigotmc.org/resources/28140/)

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
| Project | `/curseforge/project/<id>` | [![GeckoLib](https://modfolio.creeperkatze.de/curseforge/project/388172)](https://www.curseforge.com/minecraft/mc-mods/geckolib) |

#### Hangar

| Card Type | Path | Example |
|-----------|------|---------|
| Project | `/hangar/project/<slug>` | [![SimpleVoiceChat](https://modfolio.creeperkatze.de/hangar/project/SimpleVoiceChat)](https://hangar.papermc.io/henkelmax/SimpleVoiceChat) |
| User | `/hangar/user/<username>` | [![henkelmax](https://modfolio.creeperkatze.de/hangar/user/henkelmax)](https://hangar.papermc.io/henkelmax) |

#### Spigot

| Card Type | Path | Example |
|-----------|------|---------|
| Resource | `/spigot/resource/<id>` | [![LuckPerms](https://modfolio.creeperkatze.de/spigot/resource/28140)](https://spigotmc.org/resources/28140/) |
| Author | `/spigot/author/<id>` | [![Luck](https://modfolio.creeperkatze.de/spigot/author/100356)](https://www.spigotmc.org/members/luck.100356/) |

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
| Downloads | `/modrinth/<type>/<id>/downloads` | [![Mod Menu](https://modfolio.creeperkatze.de/modrinth/project/modmenu/downloads)](https://modrinth.com/project/modmenu) |
| Followers | `/modrinth/<type>/<id>/followers` | [![Mod Menu](https://modfolio.creeperkatze.de/modrinth/project/modmenu/followers)](https://modrinth.com/project/modmenu) |
| Versions | `/modrinth/<type>/<id>/versions` | [![Mod Menu](https://modfolio.creeperkatze.de/modrinth/project/modmenu/versions)](https://modrinth.com/project/modmenu) |
| Projects | `/modrinth/<type>/<id>/projects` | [![Prospector](https://modfolio.creeperkatze.de/modrinth/user/prospector/projects)](https://modrinth.com/user/prospector) |

#### CurseForge

| Badge | Path | Example |
|-------|------|---------|
| Downloads | `/curseforge/project/<id>/downloads` | [![GeckoLib](https://modfolio.creeperkatze.de/curseforge/project/388172/downloads)](https://www.curseforge.com/minecraft/mc-mods/geckolib) |
| Rank | `/curseforge/project/<id>/rank` | [![GeckoLib](https://modfolio.creeperkatze.de/curseforge/project/388172/rank)](https://www.curseforge.com/minecraft/mc-mods/geckolib) |
| Files | `/curseforge/project/<id>/versions` | [![GeckoLib](https://modfolio.creeperkatze.de/curseforge/project/388172/versions)](https://www.curseforge.com/minecraft/mc-mods/geckolib) |

#### Hangar

| Badge | Path | Example |
|-------|------|---------|
| Downloads | `/hangar/<type>/<id>/downloads` | [![SimpleVoiceChat](https://modfolio.creeperkatze.de/hangar/project/SimpleVoiceChat/downloads)](https://hangar.papermc.io/henkelmax/SimpleVoiceChat) |
| Stars | `/hangar/project/<id>/stars` | [![henkelmax](https://modfolio.creeperkatze.de/hangar/user/henkelmax/stars)](https://hangar.papermc.io/henkelmax) |
| Versions | `/hangar/project/<id>/versions` | [![SimpleVoiceChat](https://modfolio.creeperkatze.de/hangar/project/SimpleVoiceChat/versions)](https://hangar.papermc.io/henkelmax/SimpleVoiceChat) |
| Views | `/hangar/project/<id>/views` | [![SimpleVoiceChat](https://modfolio.creeperkatze.de/hangar/project/SimpleVoiceChat/views)](https://hangar.papermc.io/henkelmax/SimpleVoiceChat) |
| Projects | `/hangar/user/<id>/projects` | [![henkelmax](https://modfolio.creeperkatze.de/hangar/user/henkelmax/downloads)](https://hangar.papermc.io/henkelmax) |

#### Spigot

| Badge | Path | Example |
|-------|------|---------|
| Downloads | `/spigot/<type>/<id>/downloads` | [![LuckPerms](https://modfolio.creeperkatze.de/spigot/resource/28140/downloads)](https://spigotmc.org/resources/28140/) |
| Likes | `/spigot/<type>/<id>/likes` | [![LuckPerms](https://modfolio.creeperkatze.de/spigot/resource/28140/likes)](https://spigotmc.org/resources/28140/) |
| Rating | `/spigot/<type>/<id>/rating` | [![LuckPerms](https://modfolio.creeperkatze.de/spigot/resource/28140/rating)](https://spigotmc.org/resources/28140/) |
| Versions | `/spigot/project/<id>/versions` | [![LuckPerms](https://modfolio.creeperkatze.de/spigot/resource/28140/versions)](https://spigotmc.org/resources/28140/) |
| Resources | `/spigot/author/<id>/resources` | [![Luck](https://modfolio.creeperkatze.de/spigot/author/100356/resources)](https://www.spigotmc.org/members/Luck.100356/) |

#### Badge Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `color` | Accent color (hex) | Platform default |
| `backgroundColor` | Background color (hex) | `transparent` |
| `format` | Output format (`svg` / `png`) | `svg` |

#### Platform Defaults

| Platform | Accent color (hex) |
|----------|--------------------|
| Modrinth | `#1bd96a` |
| CurseForge |`#F16436` |
| Hangar | `#3371ED` |
| Spigot | `#E8A838`|

## Development

### Prequisites

- Node.js
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/creeperkatze/modrinth-embeds.git
cd modrinth-embeds

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
