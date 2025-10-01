// test.js  (or scripts/seed_db.js)
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { faker } = require("@faker-js/faker");

// adjust these requires if your project structure differs:
const User = require("./modules/userModule");
const Absence = require("./modules/absenceModule");
const RejectedAbsence = require("./modules/RejectedAbsence");

// CLI args: --numUsers=50 --maxAbsences=5 --wipe
const args = process.argv.slice(2).reduce((acc, cur) => {
  const [k, v] = cur.replace(/^--/, "").split("=");
  acc[k] = v === undefined ? true : v;
  return acc;
}, {});

const NUM_USERS = parseInt(args.numUsers || 50, 10);
const MAX_ABS_PER_USER = parseInt(args.maxAbsences || 5, 10);
const WIPE = !!args.wipe;

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL;
if (!MONGO_URI) {
  console.error("Please set MONGO_URI in .env before running the script.");
  process.exit(1);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function randomDateBetween(start, end) {
  const startTs = start.getTime();
  const endTs = end.getTime();
  return new Date(startTs + Math.floor(Math.random() * (endTs - startTs)));
}

async function seed() {
  await mongoose.connect(MONGO_URI, {});

  if (WIPE) {
    console.log(
      "WIPE ON — deleting User, Absence, RejectedAbsence collections."
    );
    await Promise.all([
      User.deleteMany({}),
      Absence.deleteMany({}),
      RejectedAbsence.deleteMany({}),
    ]);
  }

  const hashedPassword = await bcrypt.hash("Password123!", 10);

  let createdUsers = 0;
  let createdAbsences = 0;
  let createdRejected = 0;

  for (let i = 0; i < NUM_USERS; i++) {
    // Generate email in a way compatible with Faker versions
    const email =
      faker.internet && typeof faker.internet.email === "function"
        ? faker.internet.email().toLowerCase()
        : faker.internetEmail
        ? faker.internetEmail().toLowerCase()
        : `user${Date.now()}${i}@example.com`;

    // Build a username from the email prefix and a short suffix to keep uniqueness
    const emailPrefix = (email.split("@")[0] || `user${i}`).replace(
      /[^a-z0-9_.-]/gi,
      "_"
    );
    const username = `${emailPrefix}_${String(Date.now()).slice(-5)}_${i}`;

    // service (you said you added it)
    const service =
      faker.commerce && faker.commerce.department
        ? faker.commerce.department()
        : `Service-${Math.floor(Math.random() * 10)}`;

    // small fraction of RH / DRH
    const r = Math.random();
    const role = r < 0.03 ? "DRH" : r < 0.08 ? "RH" : "user";

    // createdAt random in past two years
    const createdAt = await randomDateBetween(
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 2),
      new Date()
    );

    // create user doc
    const userDoc = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
      service, // uses your added field
      createdAt,
    });

    createdUsers++;

    // create absences for this user
    const numAbs = Math.floor(Math.random() * MAX_ABS_PER_USER) + 1;
    for (let a = 0; a < numAbs; a++) {
      // weighted types
      const r2 = Math.random();
      let type;
      if (r2 < 0.3) type = "maladie";
      else if (r2 < 0.55) type = "conge_annuel";
      else if (r2 < 0.7) type = "conge_sans_solde";
      else if (r2 < 0.78) type = "maternite";
      else if (r2 < 0.92) type = "absence_sans_justification";
      else type = "deuil";

      // start random in past 2 years
      const start = await randomDateBetween(
        new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 2),
        new Date()
      );

      // decide duration based on type (rules you wanted)
      let durationDays;
      let proofUrl = null;
      if (type === "conge_annuel") {
        durationDays = Math.random() < 0.5 ? 15 : 30;
      } else if (type === "conge_sans_solde") {
        durationDays = Math.floor(Math.random() * 30) + 1;
      } else if (type === "maternite") {
        durationDays = 182; // ~6 months
      } else if (type === "deuil") {
        durationDays = Math.floor(Math.random() * 5) + 1;
      } else if (type === "maladie") {
        durationDays = Math.floor(Math.random() * 14) + 1;
        if (Math.random() < 0.6)
          proofUrl =
            faker.internet && faker.internet.url ? faker.internet.url() : null;
      } else {
        durationDays = Math.floor(Math.random() * 5) + 1;
      }

      const end = addDays(start, durationDays - 1);
      const status = Math.random() < 0.6 ? "accepted" : "pending";

      const absence = await Absence.create({
        user: userDoc._id,
        startDate: start,
        endDate: end,
        type,
        proofUrl,
        status,
      });

      createdAbsences++;

      if (status === "accepted") {
        const currentEnd = userDoc.endDate ? new Date(userDoc.endDate) : null;
        if (!currentEnd || end > currentEnd) {
          userDoc.endDate = end;
          await userDoc.save();
        }
      }

      // small chance to create a rejectedAbsence record
      if (Math.random() < 0.08) {
        await RejectedAbsence.create({
          user: userDoc._id,
          startDate: start,
          endDate: end,
          type,
          proofUrl: proofUrl || null,
          justification:
            faker.lorem && faker.lorem.sentence
              ? faker.lorem.sentence()
              : "justification",
          motif_rejet_RH:
            faker.lorem && faker.lorem.words
              ? faker.lorem.words(5)
              : "motif rejet",
        });
        createdRejected++;
      }
    } // end absences loop
  } // end users loop

  console.log("Seeding finished:");
  console.log("  Users created:", createdUsers);
  console.log("  Absences created:", createdAbsences);
  console.log("  RejectedAbsences created:", createdRejected);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  mongoose.disconnect().finally(() => process.exit(1));
});
