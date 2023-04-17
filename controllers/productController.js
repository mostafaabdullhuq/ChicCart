const Product = require("../models/product"),
    VIEW_PREFIX = "shop/",
    { prodsPagination, prodsSort } = require("./utilsController");

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
exports.getProducts = async (req, res, next) => {
    // FOR PAGINATION

    const pagination = await prodsPagination(+req.query?.page || 1),
        sorter = prodsSort(req?.query?.sort);
    if (pagination) {
        return Product.find()
            .skip((pagination.currentPage - 1) * pagination.perPage) // FOR PAGINATION (SKIP FIRST N PRODUCTS)
            .limit(pagination.perPage)
            .sort(sorter.type)
            .then((products) => {
                res.render(`${VIEW_PREFIX}products`, {
                    products: products,
                    pageTitle: "Shop",
                    path: "all_products",
                    sortType: sorter.option,
                    pagination: pagination,
                });
            })
            .catch((err) => {
                const error = new Error(`Cannot get all products: ${err}`);
                return next(error);
            });
    }
    return Product.find()
        .sort(sorter.type)
        .then((products) => {
            res.render(`${VIEW_PREFIX}products`, {
                products: products,
                pageTitle: "Shop",
                path: "all_products",
                sortType: sorter.option,
                pagination: pagination,
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
