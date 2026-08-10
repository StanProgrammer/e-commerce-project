// Upserts an admin test account directly in MongoDB.
// Usage: node scripts/seedAdmin.js  (run from the server directory)
require("dotenv").config({ quiet: true });

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.local";
require("dotenv").config({ path: envFile, override: true, quiet: true });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { config, validateCoreEnv } = require("../config/env");
const User = require("../models/userModel");

// Credentials come from env vars; committed defaults are only for local/test use.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@willowrue.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@1234";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";

const buildUniqueUsername = async (baseName) => {
  let username = baseName;
  let suffix = 1;

  while (await User.exists({ username })) {
    username = `${baseName}${suffix}`;
    suffix += 1;
  }

  return username;
};

const run = async () => {
  validateCoreEnv();
  await mongoose.connect(config.dbUrl, { serverSelectionTimeoutMS: 15000 });
  console.log("Connected to MongoDB");

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const existing = await User.findOne({ email: ADMIN_EMAIL });

  if (existing) {
    existing.role = "admin";
    existing.password = hashed;
    existing.isDeleted = false;
    await existing.save();
    console.log(`Updated existing user "${existing.username}" to admin.`);
  } else {
    const username = await buildUniqueUsername(ADMIN_USERNAME);
    await User.create({
      username,
      email: ADMIN_EMAIL,
      password: hashed,
      role: "admin",
      profilePic: "",
    });
    console.log("Created admin user.");
  }

  console.log("------------------------------------------");
  console.log("Admin credentials for testing:");
  console.log("  Email:    " + ADMIN_EMAIL);
  console.log("  Password: " + ADMIN_PASSWORD);
  console.log("------------------------------------------");

  await mongoose.connection.close();
};

run().catch(async (err) => {
  console.error("Seeding failed:", err.message);
  try {
    await mongoose.connection.close();
  } catch {
    // Ignore close errors
  }
  process.exit(1);
});
