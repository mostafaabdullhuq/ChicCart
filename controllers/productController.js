const Product = require("../models/product"),
    VIEW_PREFIX = "shop/";

// HOMEPAGE
exports.getIndex = (req, res, next) => {
    const productsLimit = 20;
    Product.getAllProducts("newest", productsLimit)
        .then((dateResult) => {
            newestProducts = dateResult;
            return Product.getAllProducts("rating", productsLimit);
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
    const sortType = req?.query?.sort;
    let sortOption;
    switch (sortType) {
        case "newest":
            sortOption = "Newest Arrivals";
            break;
        case "rating":
            sortOption = "Customer Reviews";
            break;
        case "title":
            sortOption = "Product Name";
            break;
        case "price_h_to_l":
            sortOption = "Price: High to Low";
            break;
        case "price_l_to_h":
            sortOption = "Price: Low to High";
            break;
        default:
            sortOption = "Product Name";
            break;
    }
    Product.getAllProducts(sortType)
        .then((products) => {
            res.render(`${VIEW_PREFIX}products`, {
                products: products,
                pageTitle: "Shop",
                path: "all_products",
                sortType: sortOption,
            });
        })
        .catch((err) => {
            console.log("Cannot get all products", err);
            res.redirect("/");
        });
};

// PRODUCT DETAILS PAGE
exports.getProduct = async (req, res, next) => {
    const productID = req.params.id;
    if (productID) {
        Product.getProduct(productID)
            .then((product) => {
                product
                    ? res.render(`${VIEW_PREFIX}product_details`, {
                          product: product,
                          pageTitle: "Shop",
                          path: "product_details",
                      })
                    : res.redirect("/admin/products");
            })
            .catch((err) => {
                res.redirect("/");

                console.log("Cannot get product", err);
            });
    } else {
        res.redirect("/products");
    }
};
