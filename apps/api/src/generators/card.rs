use super::svg::{
    StatCell, activity_sparkline, attribution, calculate_bottom_delay, divider, header, info, profile_image,
    project_list, rect_image, stats_grid, summary, svg_wrapper, theme_colors, version_list,
};
use crate::format::{escape_xml, format_number, truncate_text};
use crate::model::{CardData, Stat};
use crate::platform::{Platform, curseforge_class_icon, project_type_icon};

#[derive(Clone, Debug)]
pub struct CardOptions {
    pub show_projects: bool,
    pub show_versions: bool,
    pub max_projects: usize,
    pub max_versions: usize,
    pub relative_time: bool,
    pub show_sparklines: bool,
    pub show_download_bars: bool,
    pub show_summary: bool,
    pub show_border: bool,
    pub animations: bool,
    pub color: Option<String>,
    pub background_color: Option<String>,
    pub project_type: Option<String>,
    pub legacy_domain: bool,
    pub from_cache: bool,
}

const STAT_X: [i64; 3] = [15, 155, 270];

fn card_height(item_count: usize, summary_offset: i64) -> i64 {
    if item_count > 0 {
        150 + item_count as i64 * 50 + summary_offset
    } else if summary_offset > 0 {
        130 + summary_offset
    } else {
        130
    }
}

pub fn generate_card(data: &CardData, platform: Platform, entity_type: &str, options: &CardOptions) -> String {
    match entity_type {
        "project" | "server" | "resource" => project_card(data, platform, entity_type, options),
        "user" | "author" => profile_card(data, platform, ProfileKind::User, options),
        "organization" => profile_card(data, platform, ProfileKind::Organization, options),
        _ => profile_card(data, platform, ProfileKind::Collection, options),
    }
}

fn project_card(data: &CardData, platform: Platform, entity_type: &str, options: &CardOptions) -> String {
    let accent = options.color.as_deref().unwrap_or(platform.default_color());
    let colors = theme_colors(accent, options.background_color.as_deref());
    let animations = options.animations;

    let latest_versions = if options.show_versions {
        &data.versions[..data.versions.len().min(options.max_versions)]
    } else {
        &[]
    };

    let summary = summary(data.summary.as_deref(), &colors, animations);
    let summary_offset = if options.show_summary && summary.height > 0 {
        summary.height
    } else {
        0
    };
    let height = card_height(latest_versions.len(), summary_offset);

    let version_dates: Vec<String> = data
        .versions
        .iter()
        .map(|v| v.date.clone().unwrap_or_default())
        .collect();

    let stats: Vec<StatCell> = platform
        .stat_configs(entity_type)
        .iter()
        .filter(|config| config.field != "rank" || data.stats.num("rank").is_none_or(|rank| rank <= 10000.0))
        .enumerate()
        .map(|(index, config)| {
            let value = match (config.field, data.stats.get(config.field)) {
                ("rank", Some(Stat::Num(rank))) => format!("#{}", format_number(*rank)),
                (_, Some(stat)) => stat.display(),
                (_, None) => "N/A".into(),
            };
            StatCell {
                x: STAT_X[index],
                label: config.label,
                value,
            }
        })
        .collect();

    let type_icon = match platform {
        Platform::Modrinth => project_type_icon(data.project_type.as_deref()),
        Platform::CurseForge => data.class_id.filter(|id| *id != 0).map_or("box", curseforge_class_icon),
        _ => "box",
    };

    let title = data.name.as_deref().unwrap_or("Unknown");
    let bottom_delay = calculate_bottom_delay(latest_versions.len());

    let parts = [
        if options.show_sparklines {
            activity_sparkline(&version_dates, &colors, animations)
        } else {
            String::new()
        },
        header(
            type_icon,
            title,
            &colors,
            &platform.icon(&colors.accent_color),
            platform.icon_view_box(),
        ),
        rect_image(data.image.as_deref(), 365, 25, 70, 14, animations),
        stats_grid(&stats, &colors, animations),
        divider(&colors, animations),
        if options.show_summary {
            summary.svg
        } else {
            String::new()
        },
        version_list(
            latest_versions,
            &colors,
            options.relative_time,
            platform.latest_versions_label(),
            animations,
            summary_offset,
        ),
        info(height, colors.text_color, options.from_cache, animations, bottom_delay),
        attribution(height, colors.text_color, animations, bottom_delay),
    ];
    let content = format!("\n{}\n", parts.join("\n"));

    svg_wrapper(
        450,
        height,
        &colors,
        &content,
        options.show_border,
        animations,
        options.legacy_domain,
    )
}

#[derive(Clone, Copy)]
enum ProfileKind {
    User,
    Organization,
    Collection,
}

fn profile_card(data: &CardData, platform: Platform, kind: ProfileKind, options: &CardOptions) -> String {
    let accent = options.color.as_deref().unwrap_or(platform.default_color());
    let colors = theme_colors(accent, options.background_color.as_deref());
    let animations = options.animations;

    let top_projects = if options.show_projects {
        &data.projects[..data.projects.len().min(options.max_projects)]
    } else {
        &[]
    };

    let summary = summary(data.summary.as_deref(), &colors, animations);
    let summary_offset = if options.show_summary && summary.height > 0 {
        summary.height
    } else {
        0
    };
    let height = card_height(top_projects.len(), summary_offset);

    let (stat_entity, icon_name, fallback_title) = match kind {
        ProfileKind::User => ("user", "user", "Unknown User"),
        ProfileKind::Organization => ("organization", "building", "Unknown Organization"),
        ProfileKind::Collection => ("collection", "collection", "Unknown Collection"),
    };

    let stats: Vec<StatCell> = platform
        .stat_configs(stat_entity)
        .iter()
        .enumerate()
        .map(|(index, config)| StatCell {
            x: STAT_X[index],
            label: config.label,
            value: data.stats.get(config.field).map_or_else(|| "N/A".into(), Stat::display),
        })
        .collect();

    let title = data.name.as_deref().unwrap_or(fallback_title);
    let bottom_delay = calculate_bottom_delay(top_projects.len());

    let parts = [
        if options.show_sparklines {
            activity_sparkline(&data.all_version_dates, &colors, animations)
        } else {
            String::new()
        },
        header(
            icon_name,
            title,
            &colors,
            &platform.icon(&colors.accent_color),
            platform.icon_view_box(),
        ),
        profile_image(data.image.as_deref(), 400, 60, 35, animations),
        stats_grid(&stats, &colors, animations),
        divider(&colors, animations),
        if options.show_summary {
            summary.svg
        } else {
            String::new()
        },
        project_list(
            top_projects,
            platform.top_projects_label(),
            &colors,
            options.show_sparklines,
            options.show_download_bars,
            animations,
            summary_offset,
        ),
        info(height, colors.text_color, options.from_cache, animations, bottom_delay),
        attribution(height, colors.text_color, animations, bottom_delay),
    ];
    let content = format!("\n{}\n", parts.join("\n"));

    svg_wrapper(
        450,
        height,
        &colors,
        &content,
        options.show_border,
        animations,
        options.legacy_domain,
    )
}

pub fn generate_error_card(message: &str, detail: &str, platform: Platform) -> String {
    let error_text_color = "#f38ba8";
    let detail_text_color = "#a6adc8";
    let accent = match platform {
        Platform::Spigot => "#E8A838",
        Platform::CurseForge => "#F16436",
        Platform::Hangar => "#3371ED",
        Platform::Modrinth => "#1bd96a",
    };
    let logo = format!(
        r#"<svg x="15" y="15" width="24" height="24" viewBox="{}">{}</svg>"#,
        platform.icon_view_box(),
        platform.icon(accent)
    );
    let detail_html = if detail.is_empty() {
        String::new()
    } else {
        format!(
            r#"<text x="225" y="75" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="{detail_text_color}">
      {}
    </text>"#,
            escape_xml(&truncate_text(detail, 60))
        )
    };

    format!(
        r#"
<svg width="450" height="120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="error_rectangle">
      <rect width="450" height="120" rx="4.5"/>
    </clipPath>
  </defs>
  <g clip-path="url(#error_rectangle)">
    <rect stroke="{border}" fill="transparent" rx="4.5" x="0.5" y="0.5" width="449" height="119" vector-effect="non-scaling-stroke"/>

    <!-- Logo -->
    {logo}

    <!-- Error Text -->
    <text x="225" y="{text_y}" text-anchor="middle" font-family="Inter, sans-serif" font-size="16" font-weight="600" fill="{error_text_color}">
      {message}
    </text>
    {detail_html}

    {info}
    {attribution}
  </g>
</svg>"#,
        border = "#E4E2E2",
        text_y = if detail.is_empty() { "65" } else { "55" },
        message = escape_xml(message),
        info = info(120, detail_text_color, false, true, 0.0),
        attribution = attribution(120, detail_text_color, true, 0.0),
    )
    .trim()
    .to_string()
}
