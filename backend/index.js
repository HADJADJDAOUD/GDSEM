const express = require("express");

const cors = require("cors");
const morgan = require("morgan");

const mongoose = require("mongoose");
const path = require("path");
const app = express();
require("dotenv").config();
// password npm install mongod

app.use(cors());
app.use(express.json());

///
/// routes section

const userRoutes = require("./routes/userRoutes.js");
const uploadRoutes = require("./routes/upload.js");
app.use("/api/user", userRoutes);
app.use("/api/user/upload", uploadRoutes); // <--- mount upload routes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/////
///
//////
app.use(morgan("dev"));
const PORT = process.env.PORT || 5000;


mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
