const Product = require("../models/product"),
    VIEW_PREFIX = "admin/";

// ADD PRODUCT PAGE
exports.getAddProduct = (req, res, next) => {
    if (req.user) {
        res.render(`${VIEW_PREFIX}add_product`, {
            pageTitle: "Add Product",
            path: "add_product",
        });
    } else {
        res.redirect("/");
    }
};

// ADD NEW PRODUCT POST REQUEST
exports.postAddProduct = (req, res, next) => {
    const title = req.body.title,
        price = +req.body.price,
        shippingPrice = +req.body.shippingPrice,
        description = req.body.description,
        images = req.body.images,
        userID = req.user._id;
    if (title && price && shippingPrice && description && images && userID) {
        let product = new Product(title, price, shippingPrice, description, images.split("\n"), userID);
        product
            .save()
            .then((result) => {
                res.redirect("/admin/products/create");
            })
            .catch((err) => {
                console.log("Cannot add product", err);
                res.redirect("/admin/products/create");
            });
    } else {
        res.redirect("/admin/products/create");
    }
};

exports.getAdminProducts = async (req, res, next) => {
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
    req.user
        .getProducts(sortType)
        .then((products) => {
            res.render(`${VIEW_PREFIX}admin_products`, {
                pageTitle: "Admin Products",
                products: products,
                path: "admin_products",
                sortType: sortOption,
            });
        })
        .catch((err) => {
            console.log("Cannot get all products", err);
            res.redirect("/");
        });
};

exports.getEditProduct = async (req, res, next) => {
    const productID = req.params.id;
    if (productID)
        req.user
            .getProduct(productID)
            .then((product) => {
                if (product)
                    res.render(`${VIEW_PREFIX}edit_product`, {
                        pageTitle: "Edit Product",
                        product: product,
                        path: "edit_product",
                    });
                else res.redirect("/admin/products/create");
            })
            .catch((err) => {
                console.log("error getting product");
                res.redirect("/admin/products");
            });
    else res.redirect("/admin/products");
};

exports.postEditProduct = async (req, res, next) => {
    const productID = req.params.id,
        title = req.body.title,
        price = +req.body.price,
        shippingPrice = +req.body.shippingPrice,
        description = req.body.description,
        images = req.body.images?.trim()?.split("\n"),
        userID = req.user._id;
    if (title && price && shippingPrice && description && images && productID && userID) {
        const product = new Product(title, price, shippingPrice, description, images, userID, productID);
        req.user
            .updateProduct(product)
            .then((product) => {
                console.log(product);
                if (product && product?.acknowledged) {
                    res.redirect(`/product/${productID}`);
                } else {
                    res.redirect(`/admin/products/${productID}/edit`);
                }
            })
            .catch((err) => {
                console.log("Cannot update product", err);
                res.redirect(`/admin/products/${productID}/edit`);
            });
    } else {
        res.redirect("/admin/products");
    }
};

exports.getDeleteProduct = async (req, res, next) => {
    const productID = req.params.id;
    if (productID) {
        req.user
            .deleteProduct(productID)
            .then((deleteResult) => {
                res.redirect("/admin/products");
            })
            .catch((err) => {
                console.log("error deleting product", err);
            });
    }
};
