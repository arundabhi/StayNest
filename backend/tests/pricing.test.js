import request from "supertest";
import app from "../src/app.js";
import { connectDB, closeDB, clearDB } from "./db.js";

beforeAll(async () => { await connectDB(); });
afterAll(async () => { await closeDB(); });
afterEach(async () => { await clearDB(); });

describe("Pricing API", () => {
  test("GET /api/v1/pricing/:roomId - preview price", async () => {
    const res = await request(app).get("/api/v1/pricing/123");
    expect(res.statusCode).not.toBe(200);
  });
});
