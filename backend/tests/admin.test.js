import request from "supertest";
import app from "../src/app.js";
import { connectDB, closeDB, clearDB } from "./db.js";

beforeAll(async () => { await connectDB(); });
afterAll(async () => { await closeDB(); });
afterEach(async () => { await clearDB(); });

describe("Admin API", () => {
  test("GET /api/v1/admin/dashboard - get without auth", async () => {
    const res = await request(app).get("/api/v1/admin/dashboard");
    expect(res.statusCode).not.toBe(200);
  });
});
