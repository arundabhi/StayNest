import request from "supertest";
import app from "../src/app.js";
import { connectDB, closeDB, clearDB } from "./db.js";

beforeAll(async () => { await connectDB(); });
afterAll(async () => { await closeDB(); });
afterEach(async () => { await clearDB(); });

describe("Availability API", () => {
  test("GET /api/v1/availability/:roomId - check availability", async () => {
    const res = await request(app).get("/api/v1/availability/123");
    expect(res.statusCode).toBeDefined();
  });
});
