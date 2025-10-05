const mongoose = require("mongoose");
require("dotenv").config();
const uri = process.env.MONGO_URI;
const dns = require("dns");
console.log(uri);
dns.setServers(["1.1.1.1", "8.8.8.8"]);
mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10000, // 10 seconds (timeout for MongoDB server selection)
  socketTimeoutMS: 15000,          // 15 seconds (timeout for socket inactivity)
  connectTimeoutMS: 10000,         // 10 seconds (initial connection timeout)
})
  .then(() => console.log("Connected ✅"))
  .catch(err => console.error("Error ❌", err));