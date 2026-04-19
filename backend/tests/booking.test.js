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

describe("Booking API", () => {
  let token;
  const userPayload = {
    name: "Booking User",
    email: "booker@test.com",
    password: "Password123!",
    mobileNumber: "1234567891"
  };

  beforeEach(async () => {
    await request(app).post("/api/v1/auth/register").send(userPayload);
    const res = await request(app).post("/api/v1/auth/login").send({
      email: userPayload.email,
      password: userPayload.password
    });
    token = res.body.accessToken;
  });

  test("GET /api/v1/bookings/my - get my bookings", async () => {
    const res = await request(app)
      .get("/api/v1/bookings/my")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });

  test("GET /api/v1/bookings/past - get past bookings", async () => {
    const res = await request(app)
      .get("/api/v1/bookings/past")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });

  test("GET /api/v1/bookings/upcoming - get upcoming bookings", async () => {
    const res = await request(app)
      .get("/api/v1/bookings/upcoming")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });

  test("POST /api/v1/bookings/:hotelId/:roomId - create booking", async () => {
    const res = await request(app)
      .post("/api/v1/bookings/65abcd1234abcd1234abcd12/65abcd1234abcd1234abcd13")
      .set("Authorization", `Bearer ${token}`)
      .send({
        checkInDate: "2026-12-01",
        checkOutDate: "2026-12-05",
        guests: 2
      });
    expect(res.statusCode).not.toBe(200);
  });
});
