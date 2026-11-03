use std::fmt::Write as _;

use chrono::{DateTime, TimeDelta, Utc};

pub fn format_number(num: f64) -> String {
    if num >= 1_000_000.0 {
        format!("{:.1}M", num / 1_000_000.0)
    } else if num >= 1000.0 {
        format!("{:.1}K", num / 1000.0)
    } else {
        // Adding zero turns the -0.0 of an empty sum into 0.0.
        (num + 0.0).to_string()
    }
}

pub fn escape_xml(text: &str) -> String {
    quick_xml::escape::escape(text).into_owned()
}

pub fn truncate_text(text: &str, max_chars: usize) -> String {
    match text.char_indices().nth(max_chars) {
        Some((end, _)) => format!("{}...", &text[..end]),
        None => text.to_string(),
    }
}

pub fn wrap_text(text: &str, max_chars: usize) -> Vec<String> {
    let options = textwrap::Options::new(max_chars).break_words(false);
    textwrap::wrap(text.trim(), options)
        .into_iter()
        .map(|line| line.into_owned())
        .collect()
}

pub fn format_short_date(date: DateTime<Utc>) -> String {
    date.format("%b %-d, %Y").to_string()
}

pub fn relative_time(date: DateTime<Utc>, now: DateTime<Utc>) -> String {
    let mut formatter = timeago::Formatter::new();
    formatter.min_unit(timeago::TimeUnit::Minutes);
    formatter.convert_chrono(date.min(now), now)
}

pub struct Sparkline {
    pub path: String,
    pub fill_path: String,
}

/// A smooth line of how many dates fall on each of the last 30 days.
pub fn generate_sparkline(dates: &[DateTime<Utc>], width: f64, max_height: f64) -> Sparkline {
    if dates.is_empty() {
        return Sparkline {
            path: String::new(),
            fill_path: String::new(),
        };
    }

    const DAYS: usize = 30;
    const BASELINE_Y: f64 = 108.5;

    let now = Utc::now();
    let mut daily_counts = [0u32; DAYS];
    for date in dates {
        let age = now - *date;
        if age >= TimeDelta::zero() && age < TimeDelta::days(DAYS as i64) {
            daily_counts[DAYS - 1 - age.num_days() as usize] += 1;
        }
    }

    let max_count = f64::from(daily_counts.iter().copied().max().unwrap_or(0).max(1));
    let step = width / (DAYS + 1) as f64;
    let points: Vec<(f64, f64)> = daily_counts
        .iter()
        .enumerate()
        .map(|(i, &count)| {
            (
                (i + 1) as f64 * step,
                BASELINE_Y - f64::from(count) / max_count * max_height,
            )
        })
        .collect();

    let mut path = format!("M 0,{BASELINE_Y} L {},{}", points[0].0, points[0].1);
    for i in 1..points.len() {
        let (prev_x, prev_y) = points[i - 1];
        let (x, y) = points[i];
        let next_x = points.get(i + 1).map_or(x, |p| p.0);
        let cp1x = prev_x + (x - prev_x) * 0.5;
        let cp2x = x - (next_x - prev_x) * 0.16;
        let _ = write!(path, " C {cp1x},{prev_y} {cp2x},{y} {x},{y}");
    }
    let _ = write!(path, " L {width},{BASELINE_Y}");

    let fill_path = format!("{path} Z");
    Sparkline { path, fill_path }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn number_formatting() {
        assert_eq!(format_number(999.0), "999");
        assert_eq!(format_number(Vec::<f64>::new().into_iter().sum()), "0");
        assert_eq!(format_number(1260.0), "1.3K");
        assert_eq!(format_number(238_020_493.0), "238.0M");
    }

    #[test]
    fn truncation() {
        assert_eq!(truncate_text("abcdef", 3), "abc...");
        assert_eq!(truncate_text("ab😀", 3), "ab😀");
        assert_eq!(truncate_text("ab😀c", 3), "ab😀...");
    }

    #[test]
    fn wrapping() {
        assert_eq!(wrap_text("aaa bbb ccc", 7), vec!["aaa bbb", "ccc"]);
        assert_eq!(wrap_text("  lead trail  ", 10), vec!["lead trail"]);
        assert_eq!(wrap_text("a verylongword", 5), vec!["a", "verylongword"]);
    }

    #[test]
    fn dates() {
        let now = DateTime::parse_from_rfc3339("2024-03-05T12:00:00Z").unwrap().to_utc();
        assert_eq!(format_short_date(now), "Mar 5, 2024");
        assert_eq!(relative_time(now, now), "now");
        assert_eq!(relative_time(now - TimeDelta::minutes(5), now), "5 minutes ago");
        assert_eq!(relative_time(now - TimeDelta::days(3), now), "3 days ago");
        assert_eq!(relative_time(now + TimeDelta::days(3), now), "now");
    }
}
