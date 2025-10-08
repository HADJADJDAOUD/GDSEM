const mongoose = require("mongoose");
dotenv= require("dotenv");
dotenv.config();

// Replace this with your actual MongoDB connection string
const mongoURI = 'mongodb://127.0.0.1:27017/gdsem' || "mongodb://localhost:27017/your_database_name";

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));

db.once("open", async () => {
  try {
    console.log("Connected to MongoDB!");
    console.log(`Dropping database: ${db.name}`);
    await db.dropDatabase();
    console.log("Database dropped successfully.");
  } catch (err) {
    console.error("Failed to drop database:", err);
  } finally {
    // It's important to close the connection after the operation
    await mongoose.connection.close();
    console.log("Connection closed.");
  }
});
