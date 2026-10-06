use chrono::{DateTime, Datelike, NaiveDate, NaiveDateTime, TimeZone, Utc};

/// JS `String(n)`.
pub fn js_num(n: f64) -> String {
    if n.is_nan() {
        return "NaN".into();
    }
    if n.is_infinite() {
        return if n > 0.0 { "Infinity" } else { "-Infinity" }.into();
    }
    if n == 0.0 {
        return "0".into();
    }
    let abs = n.abs();
    if !(1e-6..1e21).contains(&abs) {
        let s = format!("{n:e}");
        let (mantissa, exp) = s.split_once('e').unwrap_or((&s, "0"));
        let sign = if exp.starts_with('-') { "" } else { "+" };
        return format!("{mantissa}e{sign}{exp}");
    }
    format!("{n}")
}

/// JS `toFixed`, which rounds halves up.
pub fn to_fixed(x: f64, digits: usize) -> String {
    if !x.is_finite() || x.abs() >= 1e21 {
        return js_num(x);
    }
    let expanded = format!("{:.*}", digits + 30, x.abs());
    let (int_part, frac) = expanded.split_once('.').unwrap_or((&expanded, ""));
    let mut kept: Vec<u8> = int_part.bytes().chain(frac.bytes().take(digits)).collect();
    if frac.as_bytes().get(digits).is_some_and(|d| *d >= b'5') {
        let mut i = kept.len();
        loop {
            if i == 0 {
                kept.insert(0, b'1');
                break;
            }
            i -= 1;
            if kept[i] == b'9' {
                kept[i] = b'0';
            } else {
                kept[i] += 1;
                break;
            }
        }
    }
    let split = kept.len() - digits;
    let mut out = String::new();
    if x < 0.0 {
        out.push('-');
    }
    out.push_str(std::str::from_utf8(&kept[..split]).unwrap_or("0"));
    if digits > 0 {
        out.push('.');
        out.push_str(std::str::from_utf8(&kept[split..]).unwrap_or(""));
    }
    out
}

pub fn format_number(num: f64) -> String {
    if num >= 1_000_000.0 {
        return to_fixed(num / 1_000_000.0, 1) + "M";
    }
    if num >= 1000.0 {
        return to_fixed(num / 1000.0, 1) + "K";
    }
    js_num(num)
}

pub fn escape_xml(unsafe_text: &str) -> String {
    let mut out = String::with_capacity(unsafe_text.len());
    for c in unsafe_text.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&apos;"),
            _ => out.push(c),
        }
    }
    out
}

/// JS `string.length`.
pub fn utf16_len(text: &str) -> usize {
    text.chars().map(char::len_utf16).sum()
}

fn utf16_prefix(text: &str, max: usize) -> String {
    let mut out = String::new();
    let mut len = 0;
    for c in text.chars() {
        let width = c.len_utf16();
        if len + width > max {
            if len < max {
                out.push('\u{FFFD}');
            }
            break;
        }
        out.push(c);
        len += width;
    }
    out
}

pub fn truncate_text(text: &str, max_length: usize) -> String {
    if utf16_len(text) > max_length {
        utf16_prefix(text, max_length) + "..."
    } else {
        text.to_string()
    }
}

/// JS regex `\s`.
fn is_js_whitespace(c: char) -> bool {
    matches!(
        c,
        '\t' | '\n' | '\u{0B}' | '\u{0C}' | '\r' | ' ' | '\u{A0}' | '\u{1680}' | '\u{2000}'
            ..='\u{200A}' | '\u{2028}' | '\u{2029}' | '\u{202F}' | '\u{205F}' | '\u{3000}' | '\u{FEFF}'
    )
}

/// JS `text.split(/\s+/)`.
fn split_whitespace_runs(text: &str) -> Vec<&str> {
    let mut parts = Vec::new();
    let mut start = 0;
    let mut in_ws = false;
    for (i, c) in text.char_indices() {
        if is_js_whitespace(c) {
            if !in_ws {
                parts.push(&text[start..i]);
                in_ws = true;
            }
        } else if in_ws {
            start = i;
            in_ws = false;
        }
    }
    parts.push(if in_ws { "" } else { &text[start..] });
    parts
}

pub fn wrap_text(text: &str, max_chars: usize) -> Vec<String> {
    let mut lines = Vec::new();
    let mut current = String::new();
    for word in split_whitespace_runs(text) {
        let test = if current.is_empty() {
            word.to_string()
        } else {
            format!("{current} {word}")
        };
        if utf16_len(&test) > max_chars && !current.is_empty() {
            lines.push(std::mem::replace(&mut current, word.to_string()));
        } else {
            current = test;
        }
    }
    if !current.is_empty() {
        lines.push(current);
    }
    lines
}

pub fn now_ms() -> i64 {
    Utc::now().timestamp_millis()
}

pub fn parse_date_ms(text: &str) -> Option<i64> {
    if let Ok(dt) = DateTime::parse_from_rfc3339(text) {
        return Some(dt.timestamp_millis());
    }
    for fmt in ["%Y-%m-%dT%H:%M:%S%.f", "%Y-%m-%dT%H:%M"] {
        if let Ok(dt) = NaiveDateTime::parse_from_str(text, fmt) {
            return Some(dt.and_utc().timestamp_millis());
        }
    }
    NaiveDate::parse_from_str(text, "%Y-%m-%d")
        .ok()
        .and_then(|d| d.and_hms_opt(0, 0, 0))
        .map(|dt| dt.and_utc().timestamp_millis())
}

pub fn iso_from_ms(ms: i64) -> Option<String> {
    Utc.timestamp_millis_opt(ms)
        .single()
        .map(|dt| dt.to_rfc3339_opts(chrono::SecondsFormat::Millis, true))
}

pub struct Sparkline {
    pub path: String,
    pub fill_path: String,
}

pub fn generate_sparkline(dates: &[String], width: f64, max_height: f64) -> Sparkline {
    if dates.is_empty() {
        return Sparkline {
            path: String::new(),
            fill_path: String::new(),
        };
    }

    let now = now_ms() as f64;
    let one_day_ms = 24.0 * 60.0 * 60.0 * 1000.0;
    let thirty_days_ago = now - 30.0 * 24.0 * 60.0 * 60.0 * 1000.0;
    let baseline_y = 108.5;

    let mut daily_counts = [0u32; 30];
    for timestamp in dates.iter().filter_map(|d| parse_date_ms(d)) {
        let timestamp = timestamp as f64;
        if timestamp >= thirty_days_ago {
            let day_index = ((timestamp - thirty_days_ago) / one_day_ms).floor();
            if (0.0..30.0).contains(&day_index) {
                daily_counts[day_index as usize] += 1;
            }
        }
    }

    let max_daily_count = f64::from(daily_counts.iter().copied().max().unwrap_or(0).max(1));
    let points: Vec<(f64, f64)> = daily_counts
        .iter()
        .enumerate()
        .map(|(index, &count)| {
            let x = (index as f64 + 1.0) * (width / 31.0);
            let normalized = f64::from(count) / max_daily_count;
            (x, baseline_y - normalized * max_height)
        })
        .collect();

    let mut path = format!(
        "M 0,{} L {},{}",
        js_num(baseline_y),
        js_num(points[0].0),
        js_num(points[0].1)
    );
    for i in 1..points.len() {
        let prev = points[i - 1];
        let curr = points[i];
        let next = points.get(i + 1).copied().unwrap_or(curr);
        let cp1x = prev.0 + (curr.0 - prev.0) * 0.5;
        let cp1y = prev.1;
        let cp2x = curr.0 - (next.0 - prev.0) * 0.16;
        let cp2y = curr.1;
        path.push_str(&format!(
            " C {},{} {},{} {},{}",
            js_num(cp1x),
            js_num(cp1y),
            js_num(cp2x),
            js_num(cp2y),
            js_num(curr.0),
            js_num(curr.1)
        ));
    }
    path.push_str(&format!(" L {},{}", js_num(width), js_num(baseline_y)));

    let fill_path = format!("{path} Z");
    Sparkline { path, fill_path }
}

/// JS `Math.round`.
fn js_round(x: f64) -> f64 {
    let floor = x.floor();
    if x - floor >= 0.5 { floor + 1.0 } else { floor }
}

const MONTHS: [&str; 12] = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

pub fn format_short_date(ms: i64) -> String {
    match Utc.timestamp_millis_opt(ms).single() {
        Some(dt) => format!("{} {}, {}", MONTHS[dt.month0() as usize], dt.day(), dt.year()),
        None => "Invalid Date".into(),
    }
}

#[derive(Clone, Copy)]
struct JsDate {
    year: i64,
    month0: i64,
    day: i64,
    time_of_day_ms: i64,
}

impl JsDate {
    fn from_ms(ms: i64) -> Self {
        let dt = Utc.timestamp_millis_opt(ms).single().unwrap_or_default();
        let midnight = dt
            .date_naive()
            .and_hms_opt(0, 0, 0)
            .unwrap_or_default()
            .and_utc()
            .timestamp_millis();
        JsDate {
            year: i64::from(dt.year()),
            month0: i64::from(dt.month0()),
            day: i64::from(dt.day()),
            time_of_day_ms: ms - midnight,
        }
    }

    fn to_ms(self) -> i64 {
        let year = self.year + self.month0.div_euclid(12);
        let month0 = self.month0.rem_euclid(12);
        let first = NaiveDate::from_ymd_opt(year as i32, month0 as u32 + 1, 1).unwrap_or_default();
        let date = first + chrono::Duration::days(self.day - 1);
        date.and_hms_opt(0, 0, 0)
            .unwrap_or_default()
            .and_utc()
            .timestamp_millis()
            + self.time_of_day_ms
    }
}

fn days_in_month(year: i64, month0: i64) -> i64 {
    let next = JsDate {
        year,
        month0: month0 + 1,
        day: 1,
        time_of_day_ms: 0,
    }
    .to_ms();
    let this = JsDate {
        year,
        month0,
        day: 1,
        time_of_day_ms: 0,
    }
    .to_ms();
    (next - this) / 86_400_000
}

/// date-fns `differenceInMonths`.
fn difference_in_months(later_ms: i64, earlier_ms: i64) -> i64 {
    let sign: i64 = match later_ms.cmp(&earlier_ms) {
        std::cmp::Ordering::Less => -1,
        std::cmp::Ordering::Equal => 0,
        std::cmp::Ordering::Greater => 1,
    };
    let later = JsDate::from_ms(later_ms);
    let earlier = JsDate::from_ms(earlier_ms);
    let difference = ((later.year - earlier.year) * 12 + (later.month0 - earlier.month0)).abs();
    if difference < 1 {
        return 0;
    }

    let mut working = later;
    if working.month0 == 1 && working.day > 27 {
        working.day = 30;
        working = JsDate::from_ms(working.to_ms());
    }
    working.month0 -= sign * difference;
    let working_ms = working.to_ms();

    let compare = (working_ms - earlier_ms).signum();
    let mut is_last_month_not_full = compare == -sign;

    let is_last_day = later.day == days_in_month(later.year, later.month0);
    if is_last_day && difference == 1 && later_ms > earlier_ms {
        is_last_month_not_full = false;
    }

    sign * (difference - i64::from(is_last_month_not_full))
}

fn plural(one: &str, other: &str, count: i64) -> String {
    if count == 1 {
        one.to_string()
    } else {
        other.replace("{{count}}", &count.to_string())
    }
}

/// date-fns `formatDistanceToNow` with a suffix.
pub fn format_distance_to_now(date_ms: i64, now_ms: i64) -> String {
    let comparison = (date_ms - now_ms).signum();
    let (hi, lo) = if date_ms > now_ms {
        (date_ms, now_ms)
    } else {
        (now_ms, date_ms)
    };
    let seconds = ((hi - lo) as f64 / 1000.0).trunc();
    let minutes = js_round(seconds / 60.0) as i64;
    let minutes_in_day = 1440;
    let minutes_in_month = 43200;

    let text = if minutes < 2 {
        if minutes == 0 {
            "less than a minute".to_string()
        } else {
            plural("1 minute", "{{count}} minutes", minutes)
        }
    } else if minutes < 45 {
        plural("1 minute", "{{count}} minutes", minutes)
    } else if minutes < 90 {
        "about 1 hour".to_string()
    } else if minutes < minutes_in_day {
        let hours = js_round(minutes as f64 / 60.0) as i64;
        plural("about 1 hour", "about {{count}} hours", hours)
    } else if minutes < 2520 {
        "1 day".to_string()
    } else if minutes < minutes_in_month {
        let days = js_round(minutes as f64 / minutes_in_day as f64) as i64;
        plural("1 day", "{{count}} days", days)
    } else if minutes < minutes_in_month * 2 {
        let months = js_round(minutes as f64 / minutes_in_month as f64) as i64;
        plural("about 1 month", "about {{count}} months", months)
    } else {
        let months = difference_in_months(hi, lo);
        if months < 12 {
            let nearest = js_round(minutes as f64 / minutes_in_month as f64) as i64;
            plural("1 month", "{{count}} months", nearest)
        } else {
            let since_start_of_year = months % 12;
            let years = months / 12;
            if since_start_of_year < 3 {
                plural("about 1 year", "about {{count}} years", years)
            } else if since_start_of_year < 9 {
                plural("over 1 year", "over {{count}} years", years)
            } else {
                plural("almost 1 year", "almost {{count}} years", years + 1)
            }
        }
    };

    if comparison > 0 {
        format!("in {text}")
    } else {
        format!("{text} ago")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn js_number_printing() {
        assert_eq!(js_num(5.0), "5");
        assert_eq!(js_num(4.85), "4.85");
        assert_eq!(js_num(14.0 / 24.0), "0.5833333333333334");
        assert_eq!(js_num(0.1 + 0.2 * 1.0 + 0.0), "0.30000000000000004");
        assert_eq!(js_num(1e21), "1e+21");
        assert_eq!(js_num(1.5e-7), "1.5e-7");
        assert_eq!(js_num(f64::NAN), "NaN");
    }

    #[test]
    fn to_fixed_rounds_half_up() {
        assert_eq!(to_fixed(1.25, 1), "1.3");
        assert_eq!(to_fixed(0.05, 1), "0.1");
        assert_eq!(to_fixed(9.96, 1), "10.0");
        assert_eq!(to_fixed(4.0, 1), "4.0");
        assert_eq!(format_number(1250.0), "1.3K");
        assert_eq!(format_number(238_020_493.0), "238.0M");
        assert_eq!(format_number(999.0), "999");
    }

    #[test]
    fn truncation_counts_utf16_units() {
        assert_eq!(truncate_text("abcdef", 3), "abc...");
        assert_eq!(truncate_text("ab😀", 3), "ab\u{FFFD}...");
        assert_eq!(truncate_text("ab😀", 4), "ab😀");
    }

    #[test]
    fn wrapping_matches_js_split() {
        assert_eq!(wrap_text("aaa bbb ccc", 7), vec!["aaa bbb", "ccc"]);
        assert_eq!(wrap_text("  lead", 10), vec!["lead"]);
        assert_eq!(wrap_text("trail  ", 10), vec!["trail "]);
    }

    #[test]
    fn relative_time_wording() {
        let now = 1_700_000_000_000;
        let minute = 60_000;
        assert_eq!(format_distance_to_now(now, now), "less than a minute ago");
        assert_eq!(format_distance_to_now(now - 5 * minute, now), "5 minutes ago");
        assert_eq!(format_distance_to_now(now - 60 * minute, now), "about 1 hour ago");
        assert_eq!(format_distance_to_now(now - 3 * 1440 * minute, now), "3 days ago");
        assert_eq!(
            format_distance_to_now(now - 400 * 1440 * minute, now),
            "about 1 year ago"
        );
        assert_eq!(format_distance_to_now(now + 5 * minute, now), "in 5 minutes");
    }
}
