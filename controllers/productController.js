const Product = require("../models/product");
const Image = require("../models/image");

const VIEW_PREFIX = "shop/";

// HOMEPAGE
exports.getIndex = (req, res, next) => {
    const productsLimit = 10;
    Product.findAll({
        order: ["createdAt"],
        include: Image,
        limit: productsLimit,
    })
        .then((dateResult) => {
            newestProducts = dateResult;
            return Product.findAll({
                order: ["title"],
                include: Image,
                limit: productsLimit,
            });
        })
        .then((ratingResult) => {
            res.render("index", {
                newestProducts: newestProducts,
                topRatedProducts: ratingResult,
                pageTitle: "ChicCart",
                path: "index",
            });
        })
        .catch((err) => {
            console.log("failed to fetch index products", err);
            res.redirect("404");
        });
};

// PRODUCTS PAGE
exports.getProducts = (req, res, next) => {
    Product.findAll({
        order: ["createdAt"],
        include: Image,
    })
        .then((products) => {
            res.render(`${VIEW_PREFIX}products`, {
                products: products,
                pageTitle: "Shop",
                path: "all_products",
            });
        })
        .catch((err) => {
            console.log("Error getting all products.", err);
            res.redirect("/");
        });
};

// PRODUCT DETAILS PAGE
exports.getProduct = async (req, res, next) => {
    const productID = +req.params.id;
    if (productID) {
        Product.findByPk(productID, {
            include: Image,
        })
            .then((product) => {
                product
                    ? res.render(`${VIEW_PREFIX}product_details`, {
                          product: product,
                          pageTitle: "Shop",
                          path: "product_details",
                      })
                    : res.redirect("/");
            })
            .catch((err) => {
                console.log("Failed to get product", err);
                res.redirect("/");
            });
    } else {
        res.redirect("/products");
    }
};
