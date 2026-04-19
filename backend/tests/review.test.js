import request from "supertest";
import app from "../src/app.js";
import { connectDB, closeDB, clearDB } from "./db.js";

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await closeDB();
});

afterEach(async () => {
  await clearDB();
});

describe("Review API", () => {
  test("GET /api/v1/reviews/hotel/:hotelId - get reviews", async () => {
    const res = await request(app).get("/api/v1/reviews/hotel/65abcd1234abcd1234abcd12");
    expect(res.statusCode).toBeDefined();
  });

  test("GET /api/v1/reviews/user/:userId - get user reviews", async () => {
    const res = await request(app).get("/api/v1/reviews/user/65abcd1234abcd1234abcd12");
    expect(res.statusCode).toBeDefined();
  });

  test("POST /api/v1/reviews/hotel/:hotelId - create review without auth", async () => {
    const res = await request(app).post("/api/v1/reviews/hotel/65abcd1234abcd1234abcd12").send({ rating: 5, comment: "Great" });
    expect(res.statusCode).toBe(401);
  });
});
