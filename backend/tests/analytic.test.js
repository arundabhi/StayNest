import request from "supertest";
import app from "../src/app.js";
import { connectDB, closeDB, clearDB } from "./db.js";

beforeAll(async () => { await connectDB(); });
afterAll(async () => { await closeDB(); });
afterEach(async () => { await clearDB(); });

describe("Analytic API", () => {
  test("GET /api/v1/analytics/ - get without auth", async () => {
    const res = await request(app).get("/api/v1/analytics/");
    expect(res.statusCode).not.toBe(200);
  });
});
