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

describe("Hotel API", () => {
  let token;
  const userPayload = {
    name: "Owner Test",
    email: "owner@test.com",
    password: "Password123!",
    mobileNumber: "1234567890"
  };

  beforeEach(async () => {
    await request(app).post("/api/v1/auth/register").send(userPayload);
    const res = await request(app).post("/api/v1/auth/login").send({
      email: userPayload.email,
      password: userPayload.password
    });
    token = res.body.accessToken;
  });

  test("GET /api/v1/hotels/ - get all hotels", async () => {
    const res = await request(app).get("/api/v1/hotels/");
    expect(res.statusCode).toBe(200);
  });

  test("GET /api/v1/hotels/search - search hotels", async () => {
    const res = await request(app).get("/api/v1/hotels/search?query=somnath");
    expect(res.statusCode).toBe(200);
  });

  test("GET /api/v1/hotels/:hotelId - get invalid hotel by id", async () => {
    const res = await request(app).get("/api/v1/hotels/invalidId");
    expect(res.statusCode).not.toBe(200);
  });

  test("POST /api/v1/hotels/ - create hotel (invalid data)", async () => {
    const res = await request(app)
      .post("/api/v1/hotels/")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test",
      });
    expect(res.statusCode).not.toBe(201);
  });
});
