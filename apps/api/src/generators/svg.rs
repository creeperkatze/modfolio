use crate::format::{
    escape_xml, format_distance_to_now, format_number, format_short_date, generate_sparkline, js_num, now_ms,
    parse_date_ms, truncate_text, wrap_text,
};
use crate::icons::icon;
use crate::model::{ProjectItem, VersionItem};
use crate::platform::{loader_color, project_type_icon};

pub struct Colors {
    pub bg_color: String,
    pub text_color: &'static str,
    pub accent_color: String,
    pub border_color: &'static str,
}

fn is_hex_color(value: &str) -> bool {
    value.len() == 7 && value.starts_with('#') && value[1..].chars().all(|c| c.is_ascii_hexdigit())
}

/// The accent colour is escaped but not validated.
pub fn theme_colors(accent_color: &str, background_color: Option<&str>) -> Colors {
    Colors {
        bg_color: background_color
            .filter(|bg| is_hex_color(bg))
            .unwrap_or("transparent")
            .to_string(),
        text_color: "#c9d1d9",
        accent_color: escape_xml(accent_color),
        border_color: "#E4E2E2",
    }
}

pub fn calculate_bottom_delay(item_count: usize) -> f64 {
    let first_item_delay = 0.1 + 0.1;
    first_item_delay + item_count as f64 * 0.08 + 0.1
}

const LEGACY_DOMAIN_WARNING_HEIGHT: i64 = 24;

fn legacy_domain_warning(width: i64, height: i64, animations: bool) -> String {
    format!(
        r##"
  <!-- Legacy domain warning -->
  <g{class}>
    <rect x="0" y="0" width="{width}" height="{height}" fill="#7a2323"/>
    <g transform="translate(10, {icon_y}) scale({scale})">
      {icon}
    </g>
    <text x="32" y="{text_y}" font-family="Inter, sans-serif" font-size="10" font-weight="600" fill="#fff">
      This domain is deprecated, please migrate to modfolio.creeperkatze.dev
    </text>
  </g>"##,
        class = if animations { r#" class="fade-in-delayed""# } else { "" },
        icon_y = js_num((height - 14) as f64 / 2.0),
        scale = js_num(14.0 / 24.0),
        icon = icon("triangle-alert", "#fff").unwrap_or_default(),
        text_y = js_num(height as f64 / 2.0 + 4.0),
    )
}

const STYLE_BLOCK: &str = r#"
  <style>
    @keyframes fadeInAnimation {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideInAnimation {
      from { transform: translateX(-10px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideInFromRightAnimation {
      from { transform: translateX(10px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideInFromTopAnimation {
      from { transform: translateY(-10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes growWidthAnimation {
      from { width: 0; }
      to { width: var(--target-width); }
    }
    @keyframes sparklineDrawAnimation {
      from { stroke-dashoffset: 1000; }
      to { stroke-dashoffset: 0; }
    }
    @keyframes scaleInX {
      from { transform: scaleX(0); }
      to { transform: scaleX(1); }
    }
    .sparkline-path {
      stroke-dasharray: 1000;
      animation: sparklineDrawAnimation 1s ease-out forwards;
    }
    .section-header {
      opacity: 0;
      animation: fadeInAnimation 0.6s ease-out forwards;
    }
    .fade-in-delayed {
      opacity: 0;
      animation: fadeInAnimation 0.5s ease-out forwards;
    }
    .list-item {
      opacity: 0;
      animation: slideInAnimation 0.4s ease-out forwards;
    }
    .divider {
      animation: fadeInAnimation 0.8s ease-out forwards;
    }
    .download-bar {
      animation: growWidthAnimation 0.6s ease-out forwards;
    }
    .stat-value {
      opacity: 0;
      animation: slideInFromTopAnimation 0.25s ease-out forwards;
    }
    .stat-label {
      opacity: 0;
      animation: slideInFromTopAnimation 0.2s ease-out forwards;
    }
    .profile-image {
      opacity: 0;
      animation: slideInFromRightAnimation 0.4s ease-out forwards;
    }
  </style>"#;

pub fn svg_wrapper(
    width: i64,
    height: i64,
    colors: &Colors,
    content: &str,
    show_border: bool,
    animations: bool,
    legacy_domain_warning_enabled: bool,
) -> String {
    let warning_height = if legacy_domain_warning_enabled {
        LEGACY_DOMAIN_WARNING_HEIGHT
    } else {
        0
    };
    let total_height = height + warning_height;

    let background_rect = format!(
        "    <rect fill=\"{}\" rx=\"4.5\" width=\"{width}\" height=\"{total_height}\"/>\n",
        colors.bg_color
    );
    let border_stroke = if show_border {
        format!(
            "    <rect stroke=\"{}\" fill=\"none\" rx=\"4.5\" x=\"0.5\" y=\"0.5\" width=\"{}\" height=\"{}\" vector-effect=\"non-scaling-stroke\"/>\n",
            colors.border_color,
            width - 1,
            total_height - 1
        )
    } else {
        String::new()
    };
    let warning_banner = if legacy_domain_warning_enabled {
        legacy_domain_warning(width, warning_height, animations)
    } else {
        String::new()
    };
    let shifted_content = if warning_height > 0 {
        format!("<g transform=\"translate(0, {warning_height})\">{content}</g>")
    } else {
        content.to_string()
    };
    let style_block = if animations { STYLE_BLOCK } else { "" };

    format!(
        r#"
<svg width="{width}" height="{total_height}" xmlns="http://www.w3.org/2000/svg">
{style_block}
  <defs>
    <clipPath id="outer_rectangle_summary">
      <rect width="{width}" height="{total_height}" rx="4.5"/>
    </clipPath>
  </defs>
  <g clip-path="url(#outer_rectangle_summary)">
{background_rect}{warning_banner}{shifted_content}{border_stroke}
  </g>
</svg>"#
    )
    .trim()
    .to_string()
}

fn sparkline_paths(path: &str, fill_path: &str, accent: &str) -> String {
    format!(
        r#"
    <path
      d="{path}"
      fill="none"
      stroke="{accent}"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.4"
    />
    <path
      d="{fill_path}"
      fill="{accent}"
      opacity="0.1"
    />"#
    )
}

pub fn activity_sparkline(version_dates: &[String], colors: &Colors, animations: bool) -> String {
    let sparkline = generate_sparkline(version_dates, 420.0, 56.25);
    let paths = sparkline_paths(&sparkline.path, &sparkline.fill_path, &colors.accent_color);

    if !animations {
        return format!(
            "\n  <!-- Activity Sparkline (background) -->\n  <g transform=\"translate(15, 0)\">{paths}\n  </g>"
        );
    }

    format!(
        r#"
  <!-- Activity Sparkline (background) -->
  <defs>
    <clipPath id="main-sparkline-clip">
      <rect x="0" y="-500" width="420" height="1000" style="transform-origin: left center; animation: scaleInX 1s ease-out forwards"/>
    </clipPath>
  </defs>
  <g transform="translate(15, 0)" clip-path="url(#main-sparkline-clip)">{paths}
  </g>"#
    )
}

pub fn header(icon_name: &str, title: &str, colors: &Colors, platform_icon: &str, view_box: &str) -> String {
    format!(
        r#"
  <!-- Platform Icon -->
  <svg x="15" y="15" width="24" height="24" viewBox="{view_box}">
    {platform_icon}
  </svg>

  <!-- Chevron -->
  <svg x="41" y="15" width="16" height="24" viewBox="0 0 24 24">
    {chevron}
  </svg>

  <!-- Entity Icon -->
  <svg x="58" y="15" width="24" height="24" viewBox="0 0 24 24">
    {entity_icon}
  </svg>

  <!-- Title -->
  <text x="87" y="35" font-family="Inter, sans-serif" font-size="20" font-weight="bold" fill="{text}">
    {title}
  </text>"#,
        chevron = icon("chevronRight", colors.text_color).unwrap_or_default(),
        entity_icon = icon(icon_name, colors.text_color).unwrap_or_default(),
        text = colors.text_color,
        title = escape_xml(&truncate_text(title, 22)),
    )
}

fn profile_image_class(animations: bool) -> &'static str {
    if animations { r#" class="profile-image""# } else { "" }
}

pub fn profile_image(image: Option<&str>, center_x: i64, center_y: i64, radius: i64, animations: bool) -> String {
    let Some(image) = image else {
        return String::new();
    };
    format!(
        r#"
  <defs>
    <clipPath id="profile-clip">
      <circle cx="{center_x}" cy="{center_y}" r="{radius}"/>
    </clipPath>
  </defs>
  <g{class}>
    <image x="{x}" y="{y}" width="{size}" height="{size}" href="{href}" clip-path="url(#profile-clip)"/>
  </g>"#,
        class = profile_image_class(animations),
        x = center_x - radius,
        y = center_y - radius,
        size = radius * 2,
        href = escape_xml(image),
    )
}

pub fn rect_image(image: Option<&str>, x: i64, y: i64, size: i64, border_radius: i64, animations: bool) -> String {
    let Some(image) = image else {
        return String::new();
    };
    format!(
        r#"
  <defs>
    <clipPath id="project-image-clip">
      <rect x="{x}" y="{y}" width="{size}" height="{size}" rx="{border_radius}"/>
    </clipPath>
  </defs>
  <g{class}>
    <image x="{x}" y="{y}" width="{size}" height="{size}" href="{href}" clip-path="url(#project-image-clip)"/>
  </g>"#,
        class = profile_image_class(animations),
        href = escape_xml(image),
    )
}

pub struct StatCell {
    pub x: i64,
    pub label: &'static str,
    pub value: String,
}

pub fn stats_grid(stats: &[StatCell], colors: &Colors, animations: bool) -> String {
    stats
        .iter()
        .enumerate()
        .map(|(index, cell)| {
            let value_delay = 0.0 + index as f64 * 0.1;
            let label_delay = 0.1 + index as f64 * 0.1;
            let (value_anim, label_anim) = if animations {
                (
                    format!(
                        r#" class="stat-value" style="animation-delay: {}s""#,
                        js_num(value_delay)
                    ),
                    format!(
                        r#" class="stat-label" style="animation-delay: {}s""#,
                        js_num(label_delay)
                    ),
                )
            } else {
                (String::new(), String::new())
            };
            format!(
                r#"
  <g transform="translate({x}, 70)">
    <text font-family="Inter, sans-serif" font-size="26" font-weight="bold" fill="{accent}"{value_anim}>
      {value}
    </text>
    <text y="20" font-family="Inter, sans-serif" font-size="12" fill="{text}"{label_anim}>
      {label}
    </text>
  </g>"#,
                x = cell.x,
                accent = colors.accent_color,
                value = cell.value,
                text = colors.text_color,
                label = cell.label,
            )
        })
        .collect()
}

fn loader_icons(loaders: &[String], x_start: i64, y: i64) -> String {
    loaders
        .iter()
        .enumerate()
        .filter_map(|(index, loader)| {
            let name = loader.to_lowercase();
            let svg = icon(&name, loader_color(&name))?;
            Some(format!(
                "\n    <svg x=\"{}\" y=\"{}\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\">\n      {svg}\n    </svg>",
                x_start + index as i64 * 18,
                y + 2
            ))
        })
        .collect()
}

struct ListOptions {
    show_sparklines: bool,
    show_download_bars: bool,
    animations: bool,
}

fn project_list_item(
    project: &ProjectItem,
    index: usize,
    total_downloads: f64,
    colors: &Colors,
    opts: &ListOptions,
    base_delay: f64,
    y_offset: i64,
) -> String {
    let y = 160 + index as i64 * 50 + y_offset;
    let project_name = escape_xml(&truncate_text(&project.title, 18));
    let downloads = format_number(project.downloads);
    let followers = format_number(project.followers);
    let bar_width = (project.downloads / total_downloads) * 420.0;

    let sparkline_width = 420.0 * 0.6;
    let sparkline_height = 40.0 * 0.75;
    let sparkline = generate_sparkline(&project.version_dates, sparkline_width, sparkline_height);
    let sparkline_x_offset = 15.0 + 420.0 * 0.2;

    let type_icon = icon(project_type_icon(Some(&project.project_type)), colors.text_color).unwrap_or_default();
    let loader_icons_html = loader_icons(&project.loaders, 54, y);
    let animation_delay = base_delay + index as f64 * 0.08;
    let delay = js_num(animation_delay);
    let accent = &colors.accent_color;
    let border = colors.border_color;
    let text = colors.text_color;

    let group_attrs = if opts.animations {
        format!(r#" class="list-item" style="animation-delay: {delay}s""#)
    } else {
        String::new()
    };

    let sparkline_html = if opts.show_sparklines {
        let clip_anim = if opts.animations {
            format!(r#" style="transform-origin: left center; animation: scaleInX 1s ease-out {delay}s forwards""#)
        } else {
            String::new()
        };
        format!(
            r#"    <!-- Project version activity sparkline (centered) -->
    <defs>
      <clipPath id="sparkline-clip-{index}">
        <rect x="0" y="-500" width="{sw}" height="1000"{clip_anim}/>
      </clipPath>
    </defs>
    <g transform="translate({sx}, {sy})" clip-path="url(#sparkline-clip-{index})">
      <path
        d="{path}"
        fill="none"
        stroke="{accent}"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.4"
      />
      <path
        d="{fill_path}"
        fill="{accent}"
        opacity="0.1"
      />
    </g>"#,
            sw = js_num(sparkline_width),
            sx = js_num(sparkline_x_offset),
            sy = y - 88,
            path = sparkline.path,
            fill_path = sparkline.fill_path,
        )
    } else {
        String::new()
    };

    let bar_html = if opts.show_download_bars {
        let bar_anim = if opts.animations {
            format!(
                r#" class="download-bar" style="--target-width: {}px; animation-delay: {}s""#,
                js_num(bar_width),
                js_num(animation_delay + 0.1)
            )
        } else {
            String::new()
        };
        format!(
            r#"    <!-- Relative downloads bar -->
    <rect x="15.5" y="{}" width="{}" height="3" fill="{accent}" clip-path="url(#project-clip-{index})"{bar_anim}/>"#,
            js_num(y as f64 - 18.5),
            js_num(bar_width - 0.5),
        )
    } else {
        String::new()
    };

    let image_html = match project.icon.as_deref().filter(|i| !i.is_empty()) {
        Some(href) => format!(
            r#"<image x="20" y="{}" width="28" height="28" href="{}" clip-path="url(#project-icon-clip-{index})"/>"#,
            y - 12,
            escape_xml(href)
        ),
        None => format!(
            r#"<svg x="20" y="{iy}" width="28" height="28" viewBox="0 0 24 24">
      {box_icon}
    </svg><rect x="20" y="{iy}" width="28" height="28" fill="none" stroke="{border}" stroke-width="1" rx="4"/>"#,
            iy = y - 12,
            box_icon = icon("box", border).unwrap_or_default(),
        ),
    };

    format!(
        r#"
  <!-- Project {number} -->
  <g{group_attrs}>
    <defs>
      <clipPath id="project-clip-{index}">
        <rect x="15" y="{top}" width="420" height="40" rx="6"/>
      </clipPath>
      <clipPath id="project-icon-clip-{index}">
        <rect x="20" y="{icon_y}" width="28" height="28" rx="4"/>
      </clipPath>
    </defs>
    <rect x="15" y="{top}" width="420" height="40" fill="none" stroke="{border}" stroke-width="1" rx="6" vector-effect="non-scaling-stroke"/>

{sparkline_html}

{bar_html}

    <!-- Project image -->
    {image_html}

    <text x="54" y="{name_y}" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="{text}">
      {project_name}
    </text>

    <!-- Loaders -->
    {loader_icons_html}

    <!-- Downloads -->
    <text x="380" y="{y}" font-family="Inter, sans-serif" font-size="11" fill="{text}" text-anchor="end">
      {downloads}
    </text>
    <svg x="385" y="{icon_y}" width="14" height="14" viewBox="0 0 24 24">
      {download_icon}
    </svg>

    <!-- Follows -->
    <text x="380" y="{follow_y}" font-family="Inter, sans-serif" font-size="11" fill="{text}" text-anchor="end">
      {followers}
    </text>
    <svg x="385" y="{heart_y}" width="14" height="14" viewBox="0 0 24 24">
      {heart_icon}
    </svg>

    <!-- Project type icon (far right, same size as image) -->
    <svg x="405" y="{type_y}" width="24" height="24" viewBox="0 0 24 24">
      {type_icon}
    </svg>
  </g>"#,
        number = index + 1,
        top = y - 18,
        icon_y = y - 12,
        name_y = y - 2,
        follow_y = y + 18,
        heart_y = y + 6,
        type_y = y - 10,
        download_icon = icon("download", text).unwrap_or_default(),
        heart_icon = icon("heart", text).unwrap_or_default(),
    )
}

pub fn divider(colors: &Colors, animations: bool) -> String {
    format!(
        "\n  <!-- Divider -->\n  <line x1=\"15\" y1=\"110\" x2=\"435\" y2=\"110\" stroke=\"{}\" stroke-width=\"1\" vector-effect=\"non-scaling-stroke\"{}/>",
        colors.border_color,
        if animations { r#" class="divider""# } else { "" }
    )
}

pub struct Summary {
    pub svg: String,
    pub height: i64,
}

pub fn summary(text: Option<&str>, colors: &Colors, animations: bool) -> Summary {
    let Some(text) = text.filter(|t| !t.is_empty()) else {
        return Summary {
            svg: String::new(),
            height: 0,
        };
    };

    let lines = wrap_text(&escape_xml(&truncate_text(text, 220)), 60);
    let line_height = 16;
    let top_padding = 8;
    let bottom_padding = 10;
    let height = top_padding + lines.len() as i64 * line_height + bottom_padding;

    let text_elements = lines
        .iter()
        .enumerate()
        .map(|(i, line)| {
            let y = 110 + top_padding + (i as i64 + 1) * line_height;
            format!(
                r#"    <text x="15" y="{y}" font-family="Inter, sans-serif" font-size="12" fill="{}" opacity="0.8">{line}</text>"#,
                colors.text_color
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    let anim = if animations {
        r#" class="fade-in-delayed" style="animation-delay: 0.1s""#
    } else {
        ""
    };
    Summary {
        svg: format!("\n  <!-- Summary -->\n  <g{anim}>\n{text_elements}\n  </g>"),
        height,
    }
}

pub fn project_list(
    projects: &[ProjectItem],
    section_title: &str,
    colors: &Colors,
    show_sparklines: bool,
    show_download_bars: bool,
    animations: bool,
    y_offset: i64,
) -> String {
    if projects.is_empty() {
        return String::new();
    }

    let total_downloads: f64 = projects.iter().map(|p| p.downloads).sum();
    let section_delay = 0.1;
    let first_project_delay = section_delay + 0.1;
    let opts = ListOptions {
        show_sparklines,
        show_download_bars,
        animations,
    };

    let projects_html: String = projects
        .iter()
        .enumerate()
        .map(|(index, project)| {
            project_list_item(
                project,
                index,
                total_downloads,
                colors,
                &opts,
                first_project_delay,
                y_offset,
            )
        })
        .collect();

    let header_anim = if animations {
        format!(
            r#" class="section-header" style="animation-delay: {}s""#,
            js_num(section_delay)
        )
    } else {
        String::new()
    };

    format!(
        r#"
  <!-- Projects Header -->
  <text x="15" y="{}" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="{}"{header_anim}>
    {section_title}
  </text>

  {projects_html}"#,
        130 + y_offset,
        colors.text_color
    )
}

fn version_list_item(
    version: &VersionItem,
    index: usize,
    colors: &Colors,
    relative_time: bool,
    animations: bool,
    y_offset: i64,
) -> String {
    let y = 160 + index as i64 * 50 + y_offset;
    let version_number = escape_xml(&truncate_text(&version.version_number, 18));

    let now = now_ms();
    let published = version.date.as_deref().and_then(parse_date_ms).unwrap_or(now);
    let date_str = if relative_time {
        format_distance_to_now(published, now)
    } else {
        format_short_date(published)
    };

    let loader_icons_html = loader_icons(&version.loaders, 20, y);

    let game_versions = &version.game_versions;
    let mut game_versions_text = game_versions.iter().take(3).cloned().collect::<Vec<_>>().join(", ");
    if game_versions.len() > 3 {
        game_versions_text.push_str("...");
    }
    let game_versions_x = 20 + version.loaders.len() as i64 * 18 + 2;
    let version_downloads = format_number(version.downloads);
    let animation_delay = 0.3 + index as f64 * 0.08;
    let text = colors.text_color;
    let border = colors.border_color;

    let group_attrs = if animations {
        format!(
            r#" class="list-item" style="animation-delay: {}s""#,
            js_num(animation_delay)
        )
    } else {
        String::new()
    };

    format!(
        r#"
  <!-- Version {number} -->
  <g{group_attrs}>
    <defs>
      <clipPath id="version-clip-{index}">
        <rect x="15" y="{top}" width="420" height="40" rx="6"/>
      </clipPath>
    </defs>
    <rect x="15" y="{top}" width="420" height="40" fill="none" stroke="{border}" stroke-width="1" rx="6" vector-effect="non-scaling-stroke"/>

    <text x="20" y="{name_y}" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="{text}">
      {version_number}
    </text>

    <!-- Loaders (beneath version name) -->
    {loader_icons_html}

    <!-- Game versions (next to loaders at bottom) -->
    <text x="{game_versions_x}" y="{gv_y}" font-family="Inter, sans-serif" font-size="12" fill="{text}">
      {game_versions_text}
    </text>

    <!-- Date -->
    <text x="410" y="{y}" font-family="Inter, sans-serif" font-size="11" fill="{text}" text-anchor="end">
      {date_str}
    </text>
    <g transform="translate(415, {cal_y}) scale({scale})">
      {calendar_icon}
    </g>

    <!-- Downloads (below date) -->
    <text x="410" y="{dl_y}" font-family="Inter, sans-serif" font-size="11" fill="{text}" text-anchor="end">
      {version_downloads}
    </text>
    <g transform="translate(415, {dl_icon_y}) scale({scale})">
      {download_icon}
    </g>
  </g>"#,
        number = index + 1,
        top = y - 18,
        name_y = y - 2,
        gv_y = y + 15,
        game_versions_text = escape_xml(&game_versions_text),
        cal_y = y - 12,
        scale = js_num(14.0 / 24.0),
        calendar_icon = icon("calendar", text).unwrap_or_default(),
        dl_y = y + 18,
        dl_icon_y = y + 6,
        download_icon = icon("download", text).unwrap_or_default(),
    )
}

pub fn version_list(
    versions: &[VersionItem],
    colors: &Colors,
    relative_time: bool,
    header_text: &str,
    animations: bool,
    y_offset: i64,
) -> String {
    if versions.is_empty() {
        return String::new();
    }

    let versions_html: String = versions
        .iter()
        .enumerate()
        .map(|(index, version)| version_list_item(version, index, colors, relative_time, animations, y_offset))
        .collect();

    let header_anim = if animations {
        r#" class="section-header" style="animation-delay: 0.2s""#
    } else {
        ""
    };

    format!(
        r#"
  <!-- Versions Header -->
  <text x="15" y="{}" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="{}"{header_anim}>
    {}
  </text>

  {versions_html}"#,
        130 + y_offset,
        colors.text_color,
        escape_xml(header_text)
    )
}

fn delayed_fade(animations: bool, delay: f64) -> String {
    if animations {
        format!(
            r#" class="fade-in-delayed" style="animation-delay: {}s""#,
            js_num(delay)
        )
    } else {
        String::new()
    }
}

pub fn attribution(height: i64, text_color: &str, animations: bool, delay: f64) -> String {
    format!(
        r#"
  <!-- Bottom right attribution -->
  <text x="435" y="{}" font-family="Inter, sans-serif" font-size="10" fill="{text_color}" text-anchor="end"{}>
    modfolio.creeperkatze.dev
  </text>"#,
        height - 5,
        delayed_fade(animations, delay)
    )
}

pub fn info(height: i64, text_color: &str, from_cache: bool, animations: bool, delay: f64) -> String {
    let fade = delayed_fade(animations, delay);
    let cache_html = if from_cache {
        format!(
            r#"
  <!-- Cache icon -->
  <g opacity="0.6"{fade}>
    <svg x="15" y="{}" width="12" height="12" viewBox="0 0 24 24">
      {}
    </svg>
  </g>"#,
            height - 15,
            icon("database-zap", text_color).unwrap_or_default()
        )
    } else {
        String::new()
    };

    format!(
        r#"
  <!-- Bottom left version -->
  <text x="{}" y="{}"
        font-family="Inter, sans-serif"
        font-size="10"
        fill="{text_color}"
        text-anchor="start"{fade}>
    v{}
  </text>
{cache_html}"#,
        if from_cache { 30 } else { 15 },
        height - 5,
        crate::VERSION
    )
}
