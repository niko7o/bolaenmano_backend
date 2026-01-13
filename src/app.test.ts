import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildApp } from "./app";

describe("GET /version", () => {
  it("returns the current version", async () => {
    const { app } = buildApp();

    const response = await request(app).get("/version");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ version: "1.2.0" });
  });
});

