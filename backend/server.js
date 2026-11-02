require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");


const authRoutes = require("./routes/authRoute");
const profileRoutes = require("./routes/profileRoute");
const preferenceRoutes = require("./routes/preferenceRoute");
const discoverRoutes = require("./routes/discoverRoute");
const interactionRoutes = require("./routes/interactionRoute");
const matchRoutes = require("./routes/matchRoute");



const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};
app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/preferences", preferenceRoutes);// Start the server after connecting to MongoDB
app.use("/api/discover", discoverRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/matches", matchRoutes);


startServer();