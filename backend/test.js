// seed_users.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// adjust this path to where your model is located
const User = require("./modules/usermodule");

const USERS = [
  {
    username: "alice",
    email: "alice@test.local",
    password: "Password123",
    role: "user",
  },
  {
    username: "bob",
    email: "bob@test.local",
    password: "Password123",
    role: "user",
  },
  {
    username: "carol",
    email: "carol@test.local",
    password: "Password123",
    role: "RH",
  },
  {
    username: "dave",
    email: "dave@test.local",
    password: "Password123",
    role: "DRH",
  },
];

const SALT_ROUNDS = 12;

(async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to DB:", mongoose.connection.db.databaseName);

    // Remove existing test users with same emails to avoid unique index errors
    const emails = USERS.map((u) => u.email);
    await User.deleteMany({ email: { $in: emails } });
    console.log("Cleaned previous test users (if any).");

    const created = [];
    for (const u of USERS) {
      const hashed = await bcrypt.hash(u.password, SALT_ROUNDS);
      const doc = await User.create({
        username: u.username,
        email: u.email,
        password: hashed,
        role: u.role,
      });
      created.push({
        id: doc._id.toString(),
        email: doc.email,
        role: doc.role,
      });
      console.log(`Created: ${doc.email} (id: ${doc._id})`);
    }

    console.log("\nSummary:");
    created.forEach((c) =>
      console.log(` - ${c.email}  | role: ${c.role} | id: ${c.id}`)
    );

    await mongoose.disconnect();
    console.log("Disconnected.");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
})();
