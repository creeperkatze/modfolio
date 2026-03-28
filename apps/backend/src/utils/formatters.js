export function formatNumber(num)
{
    if (num >= 1000000)
    {
        return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000)
    {
        return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
}

export function escapeXml(unsafe)
{
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

export function escapeHtml(unsafe)
{
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function truncateText(text, maxLength)
{
    if (text.length > maxLength)
    {
        return text.substring(0, maxLength) + "...";
    }
    return text;
}

export function generateSparkline(dates, width = 420, maxHeight = 56.25)
{
    if (!dates || dates.length === 0) {
        return { path: "", fillPath: "" };
    }

    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const oneDayMs = 24 * 60 * 60 * 1000;
    const baselineY = 108.5;

    // Create array for last 30 days (0 = 30 days ago, 29 = today)
    const dailyCounts = new Array(30).fill(0);

    // Count events per day
    dates.forEach(date => {
        const timestamp = new Date(date).getTime();
        if (timestamp >= thirtyDaysAgo) {
            const dayIndex = Math.floor((timestamp - thirtyDaysAgo) / oneDayMs);
            if (dayIndex >= 0 && dayIndex < 30) {
                dailyCounts[dayIndex]++;
            }
        }
    });

    const maxDailyCount = Math.max(...dailyCounts, 1);

    // Calculate points
    const points = [];
    dailyCounts.forEach((count, index) => {
        const x = (index + 1) * (width / 31);
        const normalizedValue = count / maxDailyCount;
        const y = baselineY - (normalizedValue * maxHeight);
        points.push({ x, y });
    });

    // Generate smooth curve using cubic bezier curves
    let sparklinePath = `M 0,${baselineY} L ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = i < points.length - 1 ? points[i + 1] : curr;

        // Calculate control points for smooth curve
        const cp1x = prev.x + (curr.x - prev.x) * 0.5;
        const cp1y = prev.y;
        const cp2x = curr.x - (next.x - prev.x) * 0.16;
        const cp2y = curr.y;

        sparklinePath += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
    }
    sparklinePath += ` L ${width},${baselineY}`;

    const sparklineFillPath = sparklinePath + " Z";

    return {
        path: sparklinePath,
        fillPath: sparklineFillPath
    };
}
