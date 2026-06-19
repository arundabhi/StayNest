import request from "supertest";
import app from "../src/app.js";
import { connectDB, closeDB, clearDB } from "./db.js";

beforeAll(async () => { await connectDB(); });
afterAll(async () => { await closeDB(); });
afterEach(async () => { await clearDB(); });

describe("Waitlist API", () => {
  test("POST /api/v1/waitlists/:roomId - join without auth", async () => {
    const res = await request(app).post("/api/v1/waitlists/456");
    expect(res.statusCode).toBe(401);
  });
});
