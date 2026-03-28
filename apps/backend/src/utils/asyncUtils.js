// Limit concurrent promise execution
export async function pLimit(promises, limit)
{
    const results = [];
    const executing = [];

    for (const promise of promises)
    {
        const p = Promise.resolve(promise()).then(result => {
            executing.splice(executing.indexOf(p), 1);
            return result;
        });

        results.push(p);
        executing.push(p);

        if (executing.length >= limit)
        {
            await Promise.race(executing);
        }
    }

    return Promise.all(results);
}

// Request deduplication - prevents multiple identical requests
class RequestDeduplicator
{
    constructor()
    {
        this.pending = new Map();
    }

    async dedupe(key, fetcher)
    {
        // If already pending, return existing promise
        if (this.pending.has(key))
        {
            return this.pending.get(key);
        }

        // Create new promise
        const promise = fetcher()
            .finally(() => {
                // Clean up after completion
                this.pending.delete(key);
            });

        this.pending.set(key, promise);
        return promise;
    }

    clear()
    {
        this.pending.clear();
    }
}

export const requestDeduplicator = new RequestDeduplicator();
