
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Property = require("../models/Property");

// Ensure the uploads folder exists
const uploadDirectory = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Configure where uploaded images are stored
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const uniqueName =
            "property-" + Date.now() + "-" +
            Math.round(Math.random() * 1e9) + extension;

        cb(null, uniqueName);
    }
});

// Allow only supported image formats
const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
];

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG, WebP, and GIF images are allowed."));
        }
    }
});

// CREATE: Add a property
router.post("/", upload.single("image"), async (req, res) => {
    let uploadedFilePath = null;

    try {
        const propertyData = { ...req.body };

        if (req.file) {
            uploadedFilePath = req.file.path;
            propertyData.imageUrl = `/uploads/${req.file.filename}`;
        }

        if (typeof propertyData.available === "string") {
            propertyData.available = propertyData.available === "true";
        }

        const property = await Property.create(propertyData);
        res.status(201).json(property);
    } catch (error) {
        if (uploadedFilePath) {
            fs.unlink(uploadedFilePath, () => {});
        }

        res.status(400).json({ message: error.message });
    }
});

// READ: Get all properties
router.get("/", async (req, res) => {
    try {
        const properties = await Property.find().sort({ createdAt: -1 });
        res.json(properties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// READ: Get one property by ID
router.get("/:id", async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        res.json(property);
    } catch (error) {
        res.status(400).json({ message: "Invalid property ID" });
    }
});

// UPDATE: Edit property details and optionally replace the image
router.put("/:id", upload.single("image"), async (req, res) => {
    let uploadedFilePath = null;

    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        const updates = { ...req.body };

        if (typeof updates.available === "string") {
            updates.available = updates.available === "true";
        }

        if (req.file) {
            uploadedFilePath = req.file.path;
            updates.imageUrl = `/uploads/${req.file.filename}`;
        }

        Object.assign(property, updates);
        await property.save();

        // Remove the previous locally uploaded image after replacement
        if (req.file && property.imageUrl !== `/uploads/${req.file.filename}`) {
            const oldImage = property.imageUrl;

            if (oldImage && oldImage.startsWith("/uploads/")) {
                const oldPath = path.join(uploadDirectory, path.basename(oldImage));
                fs.unlink(oldPath, () => {});
            }
        }

        res.json(property);
    } catch (error) {
        if (uploadedFilePath) {
            fs.unlink(uploadedFilePath, () => {});
        }

        res.status(400).json({ message: error.message });
    }
});

// VACATE: Record tenant departure and make property available
router.patch("/:id/vacate", async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        if (property.available) {
            return res.status(400).json({
                message: "This property is already available."
            });
        }

        property.available = true;
        property.vacatedAt = new Date();
        property.tenantName = "";

        await property.save();

        res.json({
            message: "House vacated successfully. It is now available for rent.",
            property
        });
    } catch (error) {
        res.status(400).json({
            message: "Invalid property ID or vacate request."
        });
    }
});

// DELETE: Remove a property
router.delete("/:id", async (req, res) => {
    try {
        const property = await Property.findByIdAndDelete(req.params.id);

        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        // Delete the locally uploaded image, if one exists
        if (property.imageUrl && property.imageUrl.startsWith("/uploads/")) {
            const imagePath = path.join(
                uploadDirectory,
                path.basename(property.imageUrl)
            );

            fs.unlink(imagePath, () => {});
        }

        res.json({ message: "Property deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: "Invalid property ID" });
    }
});

// Handle upload errors
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        const message =
            error.code === "LIMIT_FILE_SIZE"
                ? "Image must be 5 MB or smaller."
                : error.message;

        return res.status(400).json({ message });
    }

    if (error) {
        return res.status(400).json({ message: error.message });
    }

    next();
});

module.exports = router;
