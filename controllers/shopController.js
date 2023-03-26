const Product = require("../models/product");

const VIEW_PREFIX = "shop/";

const Cart = require("./../models/cart");

// HOMEPAGE
exports.getIndex = (req, res, next) => {
    res.render("index", {
        products: Product.getNewestProducts(6),
        pageTitle: "ChicCart",
    });
};

// PRODUCTS PAGE
exports.getProducts = (req, res, next) => {
    res.render(`${VIEW_PREFIX}products`, {
        products: Product.getAllProducts(),
        pageTitle: "Shop",
    });
};

// PRODUCT DETAILS PAGE
exports.getProduct = (req, res, next) => {
    const productID = +req.params.id;
    if (productID) {
        let product = Product.getProduct(productID);
        if (product) {
            res.render(`${VIEW_PREFIX}product_details`, {
                product: product,
                pageTitle: "Shop",
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
exports.getCheckout = (req, res, next) => {
    res.render(`${VIEW_PREFIX}checkout`, {
        products: Product.getAllProducts(),
        pageTitle: "Confirm Order",
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
