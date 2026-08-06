const request = require("supertest");
const jwt = require("jsonwebtoken");
const buildTestApp = require("./helpers/buildApp");

jest.mock("../models/userModel", () => {
  const users = [];

  // A Promise that also supports .select()/.lean() chaining, mirroring how a
  // Mongoose query is await-able and chainable.
  const createQuery = (data) => {
    let resolveData;
    const query = new Promise((resolve) => {
      resolveData = resolve;
    });
    query.select = () => query;
    query.lean = () => query;
    resolveData(data);
    return query;
  };

  class User {
    constructor(data = {}) {
      Object.assign(this, data);
      this._id = `user-${users.length + 1}`;
      this.isDeleted = false;
    }

    async save() {
      users.push(this);
      return this;
    }

    static findOne(query = {}) {
      const found =
        users.find((user) =>
          Object.entries(query).every(([key, value]) => {
            if (key === "$or") {
              return value.some((condition) =>
                Object.entries(condition).every(
                  ([condKey, condValue]) => user[condKey] === condValue
                )
              );
            }
            return user[key] === value;
          })
        ) || null;

      if (!found) {
        return null;
      }

      return createQuery({ ...found });
    }

    static async exists(query) {
      const found = await this.findOne(query);
      return found ? { _id: found._id } : null;
    }
  }

  return User;
});

const app = buildTestApp();

describe("Auth routes", () => {
  it("registers a new user and sets an auth cookie", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: "jane",
      email: "jane@example.com",
      password: "StrongPass1!",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("jane@example.com");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects duplicate registration", async () => {
    const payload = {
      username: "dupe",
      email: "dupe@example.com",
      password: "StrongPass1!",
    };

    await request(app).post("/api/auth/register").send(payload);

    const res = await request(app).post("/api/auth/register").send(payload);

    expect(res.status).toBe(409);
  });

  it("rejects invalid registration payloads with validation details", async () => {
    const res = await request(app).post("/api/auth/register").send({
      username: "x",
      email: "not-an-email",
      password: "short",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it("logs in with valid credentials", async () => {
    const email = "login@example.com";

    await request(app).post("/api/auth/register").send({
      username: "loginuser",
      email,
      password: "StrongPass1!",
    });

    const res = await request(app).post("/api/auth/login").send({
      email,
      password: "StrongPass1!",
    });

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects wrong passwords with a generic message", async () => {
    const email = "wrong@example.com";

    await request(app).post("/api/auth/register").send({
      username: "wronguser",
      email,
      password: "StrongPass1!",
    });

    const res = await request(app).post("/api/auth/login").send({
      email,
      password: "WrongPass1!",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password.");
  });

  it("reports unauthenticated state for /auth/me without a token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.isAuthenticated).toBe(false);
    expect(res.body.user).toBeNull();
  });

  it("returns the user for /auth/me with a valid token", async () => {
    const regRes = await request(app).post("/api/auth/register").send({
      username: "meuser",
      email: "me@example.com",
      password: "StrongPass1!",
    });

    const token = jwt.sign(
      { sub: regRes.body.user._id },
      process.env.JWT_SECRET
    );

    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", [`token=${token}`]);

    expect(res.status).toBe(200);
    expect(res.body.isAuthenticated).toBe(true);
    expect(res.body.user.email).toBe("me@example.com");
  });
});
