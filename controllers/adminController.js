const Product = require("../models/product");
const Cart = require("../models/cart");
const VIEW_PREFIX = "admin/";

// ADD PRODUCT PAGE
exports.getAddProduct = (req, res, next) => {
    res.render(`${VIEW_PREFIX}add_product`, {
        pageTitle: "Add Product",
        path: "add_product",
    });
};

// ADD NEW PRODUCT POST REQUEST
exports.postAddProduct = async (req, res, next) => {
    const title = req.body.title,
        price = Number(req.body.price),
        description = req.body.description,
        images = req.body.images;
    if (title && price && description && images) {
        const product = new Product(title, price, images, description);
        let prodID = await product.save();
        if (prodID) res.redirect(`/product/${prodID}`);
        else res.redirect("/admin/products/create");
    } else {
        res.redirect("/admin/products");
    }
};

exports.getAdminProducts = async (req, res, next) => {
    res.render(`${VIEW_PREFIX}admin_products`, {
        pageTitle: "Admin Products",
        products: await Product.getAllProducts(),
        path: "admin_products",
    });
};

exports.getEditProduct = async (req, res, next) => {
    const productID = req.params.id;
    if (productID) {
        let product = await Product.getProduct(productID);
        if (product) {
            res.render(`${VIEW_PREFIX}edit_product`, {
                pageTitle: "Edit Product",
                product: product,
                path: "edit_product",
            });
        } else {
            res.redirect("/admin/products");
        }
    } else {
        res.redirect("/admin/products");
    }
};

exports.postEditProduct = async (req, res, next) => {
    const productID = req.params.id;
    const title = req.body.title,
        price = +req.body.price,
        description = req.body.description,
        images = req.body.images;
    if (title && price && description && images && productID) {
        const product = new Product(title, price, images, description);
        if (await Product.editProduct(productID, product)) {
            res.redirect(`/product/${productID}`);
        } else {
            res.redirect("/admin/products");
        }
    } else {
        res.redirect("/admin/products");
    }
};

exports.getDeleteProduct = async (req, res, next) => {
    const productID = req.params.id;
    if (+productID) {
        let isDeleted = await Product.deleteProduct(productID);
        if (isDeleted) res.redirect("/admin/products");
        else res.redirect("/");
    }
};
