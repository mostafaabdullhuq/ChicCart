const { ObjectId } = require("mongodb"),
    { mongoDB } = require("../database/database"),
    Product = require("./product");

class User {
    constructor(firstName, lastName, username, email, password, isAdmin, city, address, postalCode, building, state, phoneNumber, id = null, cart) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
        this.email = email;
        this.password = password;
        this.isAdmin = isAdmin;
        this.city = city;
        this.address = address;
        this.postalCode = postalCode;
        this.building = building;
        this.state = state;
        this.phoneNumber = phoneNumber;
        this._id = id ? new ObjectId(id) : null;
        this.cart = cart ?? [];
    }

    save() {
        return mongoDB().collection("users").insertOne(this);
    }

    static getUser(userID) {
        return mongoDB()
            .collection("users")
            .findOne({ _id: new ObjectId(userID) });
    }

    static getAllUsers() {
        return mongoDB().collection("users").find().toArray();
    }

    getProducts(sortType = null, limit = null) {
        let sortOption;
        switch (sortType) {
            case "newest":
                sortOption = { creationAt: -1 };
                break;
            case "rating":
                sortOption = { rating: -1 };
                break;
            case "title":
                sortOption = { title: 1 };
                break;
            case "price_h_to_l":
                sortOption = { price: -1 };
                break;
            case "price_l_to_h":
                sortOption = { price: 1 };
                break;
            default:
                sortOption = { title: 1 };
                break;
        }
        const db = mongoDB();
        if (+limit) {
            return db
                .collection("products")
                .find({
                    userID: this._id,
                })
                .limit(limit)
                .sort(sortOption)
                .toArray();
        }
        return db
            .collection("products")
            .find({
                userID: this._id,
            })
            .sort(sortOption)
            .toArray();
    }

    getProduct(productID) {
        try {
            const db = mongoDB();
            return db
                .collection("products")
                .find({
                    _id: new ObjectId(productID),
                    userID: this._id,
                })
                .next()
                .then((product) => {
                    return product;
                })
                .catch((err) => {
                    return false;
                });
        } catch (err) {
            console.log("Cannot get product", err);
            return false;
        }
    }

    updateProduct(product) {
        try {
            return mongoDB().collection("products").updateOne(
                {
                    _id: product._id,
                    userID: this._id,
                },
                {
                    $set: product,
                }
            );
        } catch (err) {
            console.log("Cannot get product", err);
            return false;
        }
    }

    deleteProduct(productID) {
        try {
            return mongoDB()
                .collection("products")
                .deleteOne({
                    _id: new ObjectId(productID),
                    userID: this._id,
                });
        } catch {
            return false;
        }
    }

    addToCart(productID, quantity = 1) {
        return mongoDB()
            .collection("users")
            .findOne({
                _id: this._id,
            })
            .then((user) => {
                return user.cart;
            })
            .then((cart) => {
                const productIndex = cart.findIndex((item) => {
                    return item._id == productID;
                });
                // IF PRODUCT ALREADY EXISTS
                if (productIndex > -1) {
                    cart[productIndex].quantity += quantity;
                } else {
                    cart.push({
                        _id: new ObjectId(productID),
                        quantity: quantity,
                    });
                }
                return cart;
            })
            .then((newCart) => {
                this.cart = newCart;
                return this.updateCart();
            })
            .catch((err) => {
                throw err;
            });
    }

    updateCart() {
        return mongoDB()
            .collection("users")
            .updateOne(
                {
                    _id: this._id,
                },
                {
                    $set: {
                        cart: this.cart,
                    },
                }
            );
    }

    async getCart() {
        return mongoDB()
            .collection("users")
            .findOne({ _id: this._id })
            .then((user) => {
                return user.cart;
            })
            .then(async (cart) => {
                this.cart = cart;
                const detailedCart = {
                    items: [],
                    price: 0,
                    shipping: 0,
                    itemsCount: 0,
                };
                detailedCart.items = await Promise.all(
                    cart.map(async (cartItem) => {
                        let detailedProduct = await Product.getProduct(cartItem._id);
                        detailedProduct.quantity = cartItem.quantity;
                        delete detailedProduct.userID;
                        detailedCart.price += detailedProduct.price * detailedProduct.quantity;
                        detailedCart.shipping += detailedProduct.shippingPrice;
                        detailedCart.itemsCount += detailedProduct.quantity;
                        return detailedProduct;
                    })
                );
                return detailedCart;
            })
            .catch((err) => {
                throw err;
            });
    }

    async deleteCartProduct(productID) {
        return this.getCart()
            .then((cart) => {
                this.cart = this.cart.filter((item) => {
                    return item._id != productID;
                });
                return this.cart;
            })
            .then((newCart) => {
                return this.updateCart();
            })
            .catch((err) => {
                throw err;
            });
    }

    clearCart() {
        this.cart = [];
        this.updateCart();
    }

    async calculateCartDiscount(promoCode) {
        let discountValue = 0;
        if (promoCode) {
            return this.getCart()
                .then((cart) => {
                    if (promoCode) {
                        // IF PROMOCODE IS PERCENTAGE
                        if (promoCode.discountType === 1) {
                            discountValue = ((cart.price + cart.shipping) * (promoCode.discountValue / 100)).toFixed(2);
                            if (discountValue > promoCode.maxDiscount) {
                                discountValue = promoCode.maxDiscount;
                            }
                        }
                        // IF DISCOUNT VALUE BY CURRENCY
                        else {
                            discountValue = promoCode.discountValue;
                        }
                    }
                    return +discountValue;
                })
                .catch((err) => {
                    console.log("Cannot calculate cart discount", err);
                    return discountValue;
                });
        } else {
            return new Promise((res, rej) => {
                res(discountValue);
            });
        }
    }

    createOrder(order) {
        order.userID = this._id;
        return mongoDB().collection("orders").insertOne(order);
    }
}

module.exports = User;
