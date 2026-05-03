import { describe, expect, it, vi } from "vitest";
import { BasePlatformClient, PlatformApiError } from "../../services/baseClient.js";

describe("BasePlatformClient", () => {
    it("maps upstream 5xx responses to a 502 platform error", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
            JSON.stringify({ error: "database_error" }),
            { status: 500 }
        )));

        const client = new BasePlatformClient("Modrinth", { baseUrl: "https://api.example.test" });

        await expect(client.fetch("/user/prospector")).rejects.toMatchObject({
            name: "PlatformApiError",
            platformName: "Modrinth",
            upstreamStatusCode: 500,
            statusCode: 502,
            detailText: "database_error"
        });
    });

    it("returns null for upstream client errors", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Not found", { status: 404 })));

        const client = new BasePlatformClient("Modrinth", { baseUrl: "https://api.example.test" });

        await expect(client.fetch("/missing")).resolves.toBeNull();
    });

    it("can be matched as a typed platform API error", () => {
        const err = new PlatformApiError("Modrinth", 503, "maintenance");

        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(PlatformApiError);
        expect(err.message).toBe("Modrinth API error: 503: maintenance");
        expect(err.statusCode).toBe(502);
    });
});
