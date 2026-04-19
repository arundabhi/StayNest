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

describe("Room API", () => {
  let token;
  const userPayload = {
    name: "Room Owner Test",
    email: "roomowner@test.com",
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

  test("GET /api/v1/rooms/search - search rooms", async () => {
    const res = await request(app).get("/api/v1/rooms/search");
    expect(res.statusCode).toBe(200);
  });

  test("GET /api/v1/rooms/:roomId - get invalid room", async () => {
    const res = await request(app).get("/api/v1/rooms/invalidRoomId");
    expect(res.statusCode).not.toBe(200);
  });

  test("POST /api/v1/rooms/hotel/:hotelId - create room (invalid)", async () => {
    const res = await request(app)
      .post("/api/v1/rooms/hotel/65abcd1234abcd1234abcd12")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Room"
      });
    expect(res.statusCode).not.toBe(201);
  });
});
