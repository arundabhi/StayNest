import request from "supertest";
import app from "../src/app.js";
import { connectDB, closeDB, clearDB } from "./db.js";

beforeAll(async () => { await connectDB(); });
afterAll(async () => { await closeDB(); });
afterEach(async () => { await clearDB(); });

describe("Recommendation API", () => {
  test("GET /api/v1/recommendations/ - basic GET", async () => {
    const res = await request(app).get("/api/v1/recommendations/");
    expect(res.statusCode).toBeDefined();
  });
});
