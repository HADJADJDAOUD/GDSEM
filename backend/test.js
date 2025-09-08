// scripts/seed-dev-users.js
// Usage:
//   MONGO_URI="mongodb://localhost:27017/yourdb" CLEAR_DB=true node scripts/seed-dev-users.js
//
// Adjust the require paths below if your models live elsewhere.
// e.g. const User = require("../modules/usermodule"); or require("../models/User");

dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGO = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dev_db";
const CLEAR_DB =
  process.env.CLEAR_DB === "true" || process.env.CLEAR_DB === "1";

let User;
let Absence;

try {
  // adjust based on your project layout:
  User = require("./modules/userModule"); // if your User model is at modules/usermodule.js
} catch (e) {
  try {
    User = require("./models/User"); // if it's models/User.js
  } catch (e2) {
    console.error("Cannot require User model. Adjust path in script.");
    process.exit(1);
  }
}

try {
  Absence = require("./modules/absenceModule");
} catch (e) {
  try {
    Absence = require("../modules/Absence");
  } catch (e2) {
    console.error("Cannot require Absence model. Adjust path in script.");
    process.exit(1);
  }
}

async function hash(pw) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  await mongoose.connect(MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to", MONGO);

  if (CLEAR_DB) {
    console.log("Clearing database...");
    await mongoose.connection.dropDatabase();
  }

  // Create 4 users
  const usersData = [
    {
      username: "alice",
      email: "alice@example.com",
      password: "Password123!",
      role: "user",
    },
    {
      username: "bob",
      email: "bob@example.com",
      password: "Password123!",
      role: "user",
    },
    {
      username: "carol",
      email: "carol@example.com",
      password: "Password123!",
      role: "RH",
    },
    {
      username: "dave",
      email: "dave@example.com",
      password: "Password123!",
      role: "DRH",
    },
  ];

  // Hash passwords and create users
  const createdUsers = [];
  for (const u of usersData) {
    const hashed = await hash(u.password);
    const userDoc = await User.create({
      username: u.username,
      email: u.email,
      password: hashed,
      role: u.role,
    });
    createdUsers.push(userDoc);
    console.log(`Created user ${userDoc.username} (${userDoc._id})`);
  }

  // Create some absences and link to users
  const now = new Date();

  const absencesData = [
    // Alice: one pending absence
    {
      user: createdUsers[0]._id,
      startDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // tomorrow
      endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // +3 days
      type: "conge",
      proofUrl: null,
      status: "pending",
    },
    // Bob: one accepted and one pending
    {
      user: createdUsers[1]._id,
      startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      endDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), // -8 days
      type: "maladie",
      proofUrl: "https://example.com/proof-bob-1.png",
      status: "accepted",
    },
    {
      user: createdUsers[1]._id,
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
      endDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000), // +8 days
      type: "absence",
      proofUrl: null,
      status: "pending",
    },
    // Carol (RH): no absences (manager)
    // Dave (DRH): one pending
    {
      user: createdUsers[3]._id,
      startDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // +2 days
      endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // same day
      type: "conge",
      proofUrl: null,
      status: "pending",
    },
  ];

  const createdAbsences = [];
  for (const a of absencesData) {
    try {
      const doc = await Absence.create(a);
      createdAbsences.push(doc);
      console.log(
        `Created absence ${doc._id} for user ${String(a.user).slice(0, 6)}...`
      );
      // Optionally update user's endDate to match last created absence endDate (mirrors old logic)
      await User.findByIdAndUpdate(
        a.user,
        { endDate: a.endDate },
        { new: true }
      );
    } catch (err) {
      console.error("Error creating absence:", err.message);
    }
  }

  // Demonstrate populating virtual 'absences' on users
  // Make sure your User schema has the virtual defined (absences virtual)
  const usersWithAbsences = await User.find({})
    .select("username email role endDate")
    .lean()
    .exec();

  // Populate using User.populate to ensure virtuals appear
  // Note: if you used toJSON/toObject virtuals options, you could use .populate() on Mongoose docs
  // but since we used .lean(), do a separate query to populate properly:
  const userDocs = await User.find({}).populate({
    path: "absences",
    match: { removed: false },
    options: { sort: { createdAt: -1 } },
  });

  console.log("\n=== Users and populated absences ===");
  for (const u of userDocs) {
    console.log(`- ${u.username} (${u.role}) - absences: ${u.absences.length}`);
    u.absences.forEach((ab) => {
      console.log(
        `   • [${ab.status}] ${ab.type} ${
          ab.startDate.toISOString().split("T")[0]
        } -> ${ab.endDate.toISOString().split("T")[0]} (id:${ab._id})`
      );
    });
  }

  console.log(
    "\nDone. Created users:",
    createdUsers.length,
    "Created absences:",
    createdAbsences.length
  );
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
