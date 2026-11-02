use crate::format::{escape_xml, js_num};
use crate::platform::Platform;

pub struct BadgeStyle<'a> {
    pub color: Option<&'a str>,
    pub background_color: Option<&'a str>,
    pub value_color: Option<&'a str>,
    pub show_icon: bool,
    pub show_border: bool,
}

impl Default for BadgeStyle<'_> {
    fn default() -> Self {
        BadgeStyle {
            color: None,
            background_color: None,
            value_color: None,
            show_icon: true,
            show_border: true,
        }
    }
}

// Janky af
fn estimate_text_width(text: &str, font_size: f64) -> f64 {
    let mut width = 0.0;
    for c in text.chars() {
        if "iljtIrf1 ".contains(c) {
            width += font_size * 0.3;
        } else if "mwWM0".contains(c) {
            width += font_size * 0.75;
        } else {
            width += font_size * 0.55;
        }
    }
    width.ceil()
}

fn is_hex_color(value: &str) -> bool {
    value.len() == 7 && value.starts_with('#') && value[1..].chars().all(|c| c.is_ascii_hexdigit())
}

pub fn generate_badge(label: &str, value: &str, platform: Platform, style: &BadgeStyle) -> String {
    let badge_color = escape_xml(style.color.unwrap_or(platform.default_color()));
    let icon_width: f64 = if style.show_icon { 30.0 } else { 0.0 };
    let padding_x = 10.0;
    let label_width = estimate_text_width(label, 14.0) + padding_x * 2.0;
    let value_width = estimate_text_width(value, 16.0) + padding_x * 2.0;
    let total_width = icon_width + label_width + value_width;
    let height = 30.0;

    let bg_color = style
        .background_color
        .filter(|bg| is_hex_color(bg))
        .unwrap_or("transparent");
    let label_text_color = "#8b949e";
    let value_text_color = style
        .value_color
        .map(str::to_string)
        .unwrap_or_else(|| badge_color.clone());
    let border_color = "#E4E2E2";

    let border_attr = if style.show_border {
        format!(r#"stroke="{border_color}""#)
    } else {
        String::new()
    };
    let icon_divider = if style.show_border && style.show_icon {
        format!(
            r#"<line x1="{x}" y1="1" x2="{x}" y2="{y2}" stroke="{border_color}" stroke-width="1" vector-effect="non-scaling-stroke"/>"#,
            x = js_num(icon_width),
            y2 = js_num(height - 1.0)
        )
    } else {
        String::new()
    };
    let label_divider = if style.show_border {
        format!(
            r#"<line x1="{x}" y1="1" x2="{x}" y2="{y2}" stroke="{border_color}" stroke-width="1" vector-effect="non-scaling-stroke"/>"#,
            x = js_num(icon_width + label_width),
            y2 = js_num(height - 1.0)
        )
    } else {
        String::new()
    };
    let icon_html = if style.show_icon {
        format!(
            r#"<!-- Platform Icon -->
  <svg x="{}" y="{}" width="18" height="18" viewBox="{}">
    {}
  </svg>"#,
            js_num((icon_width - 18.0) / 2.0),
            js_num((height - 18.0) / 2.0),
            platform.icon_view_box(),
            platform.icon(&badge_color)
        )
    } else {
        String::new()
    };

    format!(
        r##"
<svg width="{w}" height="{h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="badge_clip">
      <rect width="{w}" height="{h}" rx="4.5"/>
    </clipPath>
  </defs>
  <g clip-path="url(#badge_clip)">
    <rect {border_attr} fill="{bg_color}" rx="4.5" x="0.5" y="0.5" width="{w1}" height="{h1}" vector-effect="non-scaling-stroke"/>
    {icon_divider}
    {label_divider}
  </g>
  {icon_html}
  <g font-family="Inter, sans-serif" font-size="14" font-weight="500">
    <text x="{label_x}" y="20" text-anchor="middle" fill="{label_text_color}">{label}</text>
    <text x="{value_x}" y="21" text-anchor="middle" font-size="16" font-weight="700" letter-spacing="-1" fill="{value_text_color}">{value}</text>
  </g>
</svg>"##,
        w = js_num(total_width),
        h = js_num(height),
        w1 = js_num(total_width - 1.0),
        h1 = js_num(height - 1.0),
        label_x = js_num(icon_width + label_width / 2.0),
        value_x = js_num(icon_width + label_width + value_width / 2.0),
        label = escape_xml(label),
        value = escape_xml(value),
    )
    .trim()
    .to_string()
}
