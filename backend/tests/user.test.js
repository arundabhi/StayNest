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

describe("User API", () => {
  let token;
  const userPayload = {
    name: "User Test",
    email: "user@test.com",
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

  test("GET /api/v1/users/me - get profile", async () => {
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${token}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(userPayload.email);
  });

  test("PUT /api/v1/users/update - update profile", async () => {
    const res = await request(app)
      .put("/api/v1/users/update")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Name" });

    expect(res.statusCode).toBe(200);
  });

  test("DELETE /api/v1/users/delete - delete profile", async () => {
    const res = await request(app)
      .delete("/api/v1/users/delete")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });
});
