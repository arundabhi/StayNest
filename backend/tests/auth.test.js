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

describe("Auth API", () => {
  const validUser = {
    name: "Test User",
    email: "test555@gmail.com",
    password: "Password123!",
    mobileNumber: "9999799799"
  };

  test("POST /api/v1/auth/register - success", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(validUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.accessToken).toBeDefined();
  });

  test("POST /api/v1/auth/register - fail on missing fields", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({ email: validUser.email });
    expect(res.statusCode).toBe(400);
  });

  test("POST /api/v1/auth/login - success", async () => {
    await request(app).post("/api/v1/auth/register").send(validUser);
    
    const res = await request(app).post("/api/v1/auth/login").send({
      email: validUser.email,
      password: validUser.password
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  test("POST /api/v1/auth/login - fail on wrong credentials", async () => {
    await request(app).post("/api/v1/auth/register").send(validUser);
    
    const res = await request(app).post("/api/v1/auth/login").send({
      email: validUser.email,
      password: "WrongPassword!"
    });

    expect(res.statusCode).toBe(401);
  });
});