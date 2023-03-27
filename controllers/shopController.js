const Product = require("../models/product");

const VIEW_PREFIX = "shop/";

const Cart = require("./../models/cart");

// HOMEPAGE
exports.getIndex = async (req, res, next) => {
    res.render("index", {
        newestProducts: await Product.getAllProducts((sortType = "newest"), (limit = 20)),
        topRatedProducts: await Product.getAllProducts((sortType = "rating"), (limit = 20)),
        pageTitle: "ChicCart",
        path: "index",
    });
};

// PRODUCTS PAGE
exports.getProducts = async (req, res, next) => {
    res.render(`${VIEW_PREFIX}products`, {
        products: await Product.getAllProducts(),
        pageTitle: "Shop",
        path: "all_products",
    });
};

// PRODUCT DETAILS PAGE
exports.getProduct = async (req, res, next) => {
    const productID = +req.params.id;
    if (productID) {
        let product = await Product.getProduct(productID);
        if (product) {
            product.images = product.images.split(","); // CONVERT COMMA SEPARATED IMAGES INTO ARRAY
            res.render(`${VIEW_PREFIX}product_details`, {
                product: product,
                pageTitle: "Shop",
                path: "product_details",
            });
        } else {
            res.redirect("/products");
        }
    } else {
        res.redirect("/products");
    }
};

// CART PAGE
exports.getCart = (req, res, next) => {
    let shippingCost = 20;
    res.render(`${VIEW_PREFIX}cart`, {
        cart: Cart.getCart(),
        total: Cart.cartTotal(),
        shipping: shippingCost,
        items: Cart.itemsCount(),
        pageTitle: "Your Cart",
        path: null,
    });
};

exports.postCart = (req, res, next) => {
    const productID = +req.body.id,
        productQty = +req.body.quantity;
    if (productID && productQty) {
        let product = Product.getProduct(productID);
        if (product) {
            product.qty = productQty;
            Cart.addToCart(product);
            res.redirect("/cart");
        } else {
            res.redirect("/");
        }
    } else {
        res.redirect("/");
    }
};

// CHECKOUT PAGE
exports.getCheckout = async (req, res, next) => {
    res.render(`${VIEW_PREFIX}checkout`, {
        products: await Product.getAllProducts(),
        pageTitle: "Confirm Order",
        path: null,
    });
};

exports.getDeleteCart = (req, res, next) => {
    let productID = +req.body.id;
    if (productID) {
        Cart.deleteProduct(productID);
    }
    res.redirect("/cart");
};

exports.getCartUpdate = (req, res, next) => {
    let productID = +req.body.id;
    let type = +req.body.type;
    if (productID && type && (+type === 1 || +type === 2)) {
        console.log(productID, type);
        Cart.updateProductQty(productID, type);
    }
    res.redirect("/cart");
};
