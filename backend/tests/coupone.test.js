import request from "supertest";
import app from "../src/app.js";
import { connectDB, closeDB, clearDB } from "./db.js";

beforeAll(async () => { await connectDB(); });
afterAll(async () => { await closeDB(); });
afterEach(async () => { await clearDB(); });

describe("Coupon API", () => {
  test("GET /api/v1/coupons/ - get all without auth", async () => {
    const res = await request(app).get("/api/v1/coupons/");
    expect(res.statusCode).toBe(401); // or 404
  });
});
