const Product = require("../models/product");
const Cart = require("../models/cart");
const Image = require("./../models/image");
const VIEW_PREFIX = "admin/";

// ADD PRODUCT PAGE
exports.getAddProduct = (req, res, next) => {
    res.render(`${VIEW_PREFIX}add_product`, {
        pageTitle: "Add Product",
        path: "add_product",
    });
};

// ADD NEW PRODUCT POST REQUEST
exports.postAddProduct = (req, res, next) => {
    const title = req.body.title,
        price = +req.body.price,
        shippingPrice = +req.body.shippingPrice,
        description = req.body.description,
        images = req.body.images;
    if (title && price && description && images) {
        req.user
            .createProduct({
                title: title,
                price: price,
                shippingPrice: shippingPrice,
                description: description,
            })
            .then((createdProd) => {
                return Product.findByPk(createdProd.id);
            })
            .then((createdProd) => {
                images.split("\n").forEach(async (imageURL) => {
                    try {
                        await createdProd.createImage({ url: imageURL });
                    } catch (err) {
                        console.log("failed to create image, ", err);
                    }
                });
                res.redirect("/admin/products/create");
            })
            .catch((err) => {
                console.log("failed to create product", err);
                res.redirect("/admin/products/create");
            });
    } else {
        res.redirect("/admin/products/create");
    }
};

exports.getAdminProducts = async (req, res, next) => {
    req.user
        .getProducts({ include: Image })
        .then((products) => {
            res.render(`${VIEW_PREFIX}admin_products`, {
                pageTitle: "Admin Products",
                products: products,
                path: "admin_products",
            });
        })
        .catch((err) => {
            console.log("failed to get user products", err);
            res.redirect("/");
        });
};

exports.getEditProduct = async (req, res, next) => {
    const productID = +req.params.id;
    if (productID)
        req.user
            .getProducts({
                where: {
                    id: productID,
                },
                include: Image,
            })
            .then((products) => {
                if (products.length)
                    res.render(`${VIEW_PREFIX}edit_product`, {
                        pageTitle: "Edit Product",
                        product: products[0],
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
        shippingPrice = +req.body.shippingPrice;
    (description = req.body.description), (images = req.body.images?.trim()?.split("\n"));
    if (title && price && description && images && productID)
        req.user
            .getProducts({
                where: {
                    id: productID,
                },
            })
            .then((products) => {
                if (products.length) {
                    console.log("found product");
                    return products[0];
                }
                return null;
            })
            .then((product) => {
                if (product) {
                    return product.update({
                        title: title,
                        price: price,
                        shippingPrice: shippingPrice,
                        description: description,
                    });
                }
                return null;
            })
            .then((product) => {
                if (product) {
                    return product.setImages([]); // remove old photos for product
                }
                return null;
            })
            .then(async (product) => {
                if (product) {
                    for (let image of images) {
                        await product.createImage({
                            url: image,
                        });
                    }
                    return product;
                }
                return null;
            })
            .then((product) => {
                if (product) res.redirect("/admin/products");
                else res.redirect(`/admin/products/${productID}/edit`);
            })
            .catch((err) => {
                console.log("error editing product", err);
                res.redirect(`/admin/products/${productID}/edit`);
            });
};

exports.getDeleteProduct = async (req, res, next) => {
    const productID = req.params.id;
    if (+productID) {
        Product.findByPk(productID)
            .then((product) => {
                if (product) {
                    return product.destroy({
                        force: true,
                    });
                }
                return null;
            })
            .then((deleteResult) => {
                res.redirect("/admin/products");
            })
            .catch((err) => {
                console.log("error deleting product", err);
            });
    }
};
