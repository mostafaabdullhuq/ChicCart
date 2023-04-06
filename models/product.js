const { Schema, model } = require("mongoose"),
    Types = Schema.Types,
    fs = require("fs"),
    { join } = require("path");

const ProductSchema = new Schema({
    //_id Will Be Created Automatically

    title: {
        type: Types.String,
        required: true,
        trim: true, // Remove whitespace from start and end
        maxLength: 250, // Maximum length for string
    },
    price: {
        type: Types.Number,
        required: true,
        min: 0, // Minimum value
    },
    shippingPrice: {
        type: Types.Number,
        required: true,
        default: 0, // set default value
        min: 0,
    },
    description: {
        type: Types.String,
        required: true,
        trim: true,
        maxLength: 2000,
    },
    images: {
        type: [Types.String], // Array of strings
        required: true,
    },
    rating: {
        type: Types.Number,
        default: 0,
        min: 0,
        max: 5,
    },
    createdAt: {
        type: Date,
        default: Date.now, // We Can Use Default javaScript Data types also
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    userID: {
        type: Types.ObjectId,
        required: true,
        ref: "User",
    },
});

// static function on product module that loads a specific number of products from products json file and return them as array
ProductSchema.statics.generateProducts = function (prodsNo = null) {
    let products;
    try {
        products = fs.readFileSync(join(__dirname, "..", "database", "products.json"));
    } catch (err) {
        products = [];
    }

    if (products) {
        products = JSON.parse(products).slice(0, prodsNo > products.length ? products.length : prodsNo ?? products.length);
        return products;
    }
    return [];
};

module.exports = model("Product", ProductSchema);
