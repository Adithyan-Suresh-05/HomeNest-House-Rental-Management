
const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        location: {
            type: String,
            required: true,
            trim: true
        },
        rent: {
            type: Number,
            required: true,
            min: 0
        },
        bedrooms: {
            type: Number,
            required: true,
            min: 0
        },
        propertyType: {
            type: String,
            required: true,
            enum: ["Apartment", "House", "Villa", "Room"]
        },
        description: {
            type: String,
            default: ""
        },
        imageUrl: {
            type: String,
            default: "",
            trim: true
        },
        available: {
            type: Boolean,
            default: true
        },
        tenantName: {
            type: String,
            default: "",
            trim: true
        },
        vacatedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Property", propertySchema);
