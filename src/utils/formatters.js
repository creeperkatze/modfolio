export function formatNumber(num)
{
    if (num >= 1000000)
    {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000)
    {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

export function escapeXml(unsafe)
{
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
