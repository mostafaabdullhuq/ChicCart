const Product = require("../models/product"),
    VIEW_PREFIX = "admin/";

// ADD PRODUCT PAGE
exports.getAddProduct = (req, res, next) => {
    res.render(`${VIEW_PREFIX}add_product`, {
        pageTitle: "Add Product",
        path: "add_product",
        errors: [],
        data: null,
    });
};

// ADD NEW PRODUCT POST REQUEST
exports.postAddProduct = (req, res, next) => {
    let images = [];
    const reqFiles = req.files;
    reqFiles.forEach((file) => {
        images.push(file.path.replace("public/", "/"));
    });
    let product = new Product({
        title: req.body.title,
        description: req.body.description,
        price: +req.body.price,
        shippingPrice: +req.body.shippingPrice,
        images: images,
        userID: req.user._id,
    });
    product
        .save()
        .then((createdProduct) => {
            if (createdProduct) {
                return res.redirect(`/product/${createdProduct._id}`);
            }
        })
        .catch((err) => {
            const error = new Error(`Cannot add product: ${err}`);
            return next(error);
        });
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
            const error = new Error(`Cannot get admin products: ${err}`);
            return next(error);
        });
};

exports.getEditProduct = async (req, res, next) => {
    Product.findOne({
        _id: req.params.id,
        userID: req.user._id,
    })
        .then((product) => {
            if (product) {
                res.render(`${VIEW_PREFIX}edit_product`, {
                    pageTitle: "Edit Product",
                    product: product,
                    path: "edit_product",
                    errors: req.flash("editErr"),
                });
            } else res.redirect("/admin/products/create");
        })
        .catch((err) => {
            const error = new Error(`Cannot get edit product: ${err}`);
            return next(error);
        });
};

exports.postEditProduct = async (req, res, next) => {
    let productID = req.params.id;
    const reqFiles = req.files;
    Product.findOne({
        _id: productID,
        userID: req.user._id,
    })
        .then((product) => {
            product.title = req.body.title;
            product.price = +req.body.price;
            product.shippingPrice = +req.body.shippingPrice;
            product.description = req.body.description;
            if (reqFiles?.length) {
                let images = [];
                reqFiles.forEach((file) => {
                    images.push(file.path.replace("public/", "/"));
                });
                product.images = images;
            }

            product.save();
            res.redirect(`/product/${product._id}`);
        })
        .catch((err) => {
            const error = new Error(`Cannot edit product: ${err}`);
            return next(error);
        });
};

exports.getDeleteProduct = async (req, res, next) => {
    Product.findOneAndDelete({
        _id: req.params.id,
        userID: req.user._id,
    })
        .then((deleteResult) => {
            console.log(deleteResult);
            res.redirect("/admin/products");
        })
        .catch((err) => {
            const error = new Error(`Cannot delete product: ${err}`);
            return next(error);
        });
};
