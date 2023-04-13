const Product = require("../models/product"),
    VIEW_PREFIX = "shop/";

// HOMEPAGE
exports.getIndex = (req, res, next) => {
    const productsLimit = 20;
    Product.find()
        .sort({
            createdAt: -1,
        })
        .limit(productsLimit)
        .then((dateResult) => {
            newestProducts = dateResult;
            return Product.find()
                .sort({
                    rating: -1,
                })
                .limit(productsLimit);
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
            return next(new Error(`failed to fetch index products: ${err}`));
        });
};

// PRODUCTS PAGE
exports.getProducts = (req, res, next) => {
    const reqSortType = req?.query?.sort;
    let sortType;
    let sortOption;
    switch (reqSortType) {
        case "newest":
            sortOption = "Newest Arrivals";
            sortType = { createdAt: -1 };
            break;
        case "rating":
            sortOption = "Customer Reviews";
            sortType = { rating: -1 };
            break;
        case "title":
            sortOption = "Product Name";
            sortType = { title: 1 };
            break;
        case "price_h_to_l":
            sortOption = "Price: High to Low";
            sortType = { price: -1 };
            break;
        case "price_l_to_h":
            sortOption = "Price: Low to High";
            sortType = { price: 1 };
            break;
        default:
            sortOption = "Product Name";
            sortType = { title: 1 };
            break;
    }
    Product.find()
        .sort(sortType)
        .then((products) => {
            res.render(`${VIEW_PREFIX}products`, {
                products: products,
                pageTitle: "Shop",
                path: "all_products",
                sortType: sortOption,
            });
        })
        .catch((err) => {
            const error = new Error(`Cannot get all products: ${err}`);
            return next(error);
        });
};

// PRODUCT DETAILS PAGE
exports.getProduct = async (req, res, next) => {
    Product.findById(req.params.id)
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
            const error = new Error(`Cannot get product: ${err}`);
            return next(error);
        });
};
