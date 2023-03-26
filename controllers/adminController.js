const Product = require("../models/product");
const Cart = require("../models/cart");
const VIEW_PREFIX = "admin/";

// ADD PRODUCT PAGE
exports.getAddProduct = (req, res, next) => {
    res.render(`${VIEW_PREFIX}add_product`, {
        pageTitle: "Add Product",
    });
};

// ADD NEW PRODUCT POST REQUEST
exports.postAddProduct = (req, res, next) => {
    const title = req.body.title,
        price = Number(req.body.price),
        description = req.body.description,
        images = req.body.images;
    if (title && price && description && images) {
        const product = new Product(title, price, images, description);
        product.save();
        res.redirect("/admin/products/create");
    } else {
        res.redirect("/admin/products");
    }
};

exports.getAdminProducts = (req, res, next) => {
    res.render(`${VIEW_PREFIX}admin_products`, {
        pageTitle: "Admin Products",
        products: Product.getAllProducts(),
    });
};

exports.getEditProduct = (req, res, next) => {
    const productID = req.params.id;
    if (productID) {
        let product = Product.getProduct(productID);
        if (product) {
            res.render(`${VIEW_PREFIX}edit_product`, {
                pageTitle: "Edit Product",
                product: product,
            });
        } else {
            res.redirect("/admin/products");
        }
    } else {
        res.redirect("/admin/products");
    }
};

exports.postEditProduct = (req, res, next) => {
    const productID = req.params.id;
    const title = req.body.title,
        price = Number(req.body.price),
        description = req.body.description,
        images = req.body.images;
    if (title && price && description && images && productID) {
        const product = new Product(title, price, images, description);
        if (Product.editProduct(productID, product)) {
            res.redirect(`/product/${productID}`);
        } else {
            res.redirect("/admin/products");
        }
    } else {
        res.redirect("/admin/products");
    }
};

exports.getDeleteProduct = (req, res, next) => {
    const productID = req.params.id;
    Product.deleteProduct(productID);
    Cart.deleteProduct(productID);
    res.redirect("/admin/products");
};
