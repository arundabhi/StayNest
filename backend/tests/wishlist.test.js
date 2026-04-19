import request from "supertest";
import app from "../src/app.js";
import { connectDB, closeDB, clearDB } from "./db.js";

beforeAll(async () => { await connectDB(); });
afterAll(async () => { await closeDB(); });
afterEach(async () => { await clearDB(); });

describe("Wishlist API", () => {
  test("GET /api/v1/wishlists/my - without auth", async () => {
    const res = await request(app).get("/api/v1/wishlists/my");
    expect(res.statusCode).toBe(401);
  });
});
