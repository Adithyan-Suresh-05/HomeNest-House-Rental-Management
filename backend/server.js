
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const propertyRoutes = require("./routes/propertyRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded property images
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// Main route
app.get("/", (req, res) => {
    res.send("House Rental Management API is running!");
});

// Property API routes
app.use("/api/properties", propertyRoutes);

// Connect to MongoDB and start the server
const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected successfully!");

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    });
