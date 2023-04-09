const product = require("./product");

const { Schema, model } = require("mongoose"),
    Types = Schema.Types,
    Product = require("./product");

const UserSchema = new Schema({
    firstName: {
        type: String,
        minLength: 3,
        required: [true, "First name is required"], // Set a validation message
        validate: {
            validator: (value) => {
                return /^[\p{Letter}\p{Mark}\s]{2,20}$/u.test(value);
            },
            message: "Invalid first name format",
        },
    },
    lastName: {
        type: String,
        minLength: 3,
        required: true,
        validate: {
            validator: (value) => {
                return /^[\p{Letter}\p{Mark}\s]{2,20}$/u.test(value);
            },
            message: "Invalid last name format",
        },
    },
    username: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: (value) => {
                return /^[a-zA-Z]{1}([a-zA-Z0-9_.]){4,16}$/i.test(value);
            },
            message: "Username should be at least 5 characters, maximum 16 characters, starts with a letter, and contains only alphanumeric values and _ or .",
        },
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: (value) => {
                return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(value);
            },
            message: "Invalid email address format",
        },
    },
    password: {
        type: String,
        required: true,
        minLength: [6, "Password should be at least 6 characters"],
        maxLength: [128, "Password should not exceed 30 characters"],
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    city: {
        type: String,
        validate: {
            validator: (value) => {
                return /^[\p{Letter}\p{Mark}\s\d-]{3,20}$/u.test(value);
            },
            message: "Invalid city format",
        },
    },
    address: {
        type: String,
        validate: {
            validator: (value) => {
                return /^[\p{Letter}\p{Mark}\s\d-]{5,100}$/u.test(value);
            },
            message: "Invalid street address format",
        },
    },
    postalCode: {
        type: String,
        validate: {
            validator: (value) => {
                return /^[\p{Letter}\p{Mark}\s\d-]{3,20}$/u.test(value);
            },
            message: "Invalid postal code format",
        },
    },
    building: {
        type: String,
        validate: {
            validator: (value) => {
                return /^[\p{Letter}\p{Mark}\s\d-]{1,10}$/u.test(value);
            },
            message: "Invalid building number format.",
        },
    },
    state: {
        type: String,
        validate: {
            validator: (value) => {
                return /^[\p{Letter}\p{Mark}\s\d-]{3,20}$/u.test(value);
            },
            message: "Invalid state format",
        },
    },
    phoneNumber: {
        type: String,
        validate: {
            validator: (value) => {
                return /^\+?(?:[0-9] ?){6,14}[0-9]$/u.test(value);
            },
            message: "Invalid phone number format",
        },
    },
    cart: {
        type: [
            {
                product: {
                    type: Types.ObjectId,
                    required: true,
                    ref: "Product",
                },
                quantity: {
                    type: Number,
                    required: true,
                    default: 1,
                    min: 1,
                },
            },
        ],
        default: [],
    },
});

UserSchema.methods.getProducts = function (sortType = null) {
    switch (sortType) {
        case "newest":
            sortOption = { createdAt: -1 };
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
    return Product.find({ userID: this._id }).select("-userID").sort(sortOption);
};

UserSchema.methods.getCart = async function () {
    return model("User")
        .findById(this._id)
        .populate("cart.product")
        .then((user) => {
            return user.cart;
        })
        .then(async (cart) => {
            const detailedCart = {
                items: [],
                price: 0,
                shipping: 0,
                itemsCount: 0,
            };
            cart.forEach((item) => {
                item.product.quantity = item.quantity;
                detailedCart.items.push(item.product);
                detailedCart.price += item.product.price * item.quantity;
                detailedCart.shipping += item.product.shippingPrice;
                detailedCart.itemsCount += item.quantity;
            });
            return detailedCart;
        })
        .catch((err) => {
            throw err;
        });
};

UserSchema.methods.addToCart = async function (productID, quantity = 1) {
    return model("User")
        .findOne({
            _id: this._id,
        })
        .then((user) => {
            return user.cart;
        })
        .then((cart) => {
            const productIndex = cart.findIndex((item) => {
                return item.product == productID;
            });
            // IF PRODUCT ALREADY EXISTS
            if (productIndex > -1) {
                cart[productIndex].quantity += quantity;
            }
            // IF First time to add product
            else {
                cart.push({
                    product: productID,
                    quantity: quantity,
                });
            }
            this.cart = cart;
            return this.save();
        })
        .catch((err) => {
            throw err;
        });
};

UserSchema.methods.deleteCartProduct = function (productID) {
    this.cart = this.cart.filter((item) => {
        return item.product != productID;
    });
    return this.save();
};

UserSchema.methods.calculateCartDiscount = function (promoCode, cart) {
    let discountValue = 0;
    if (promoCode) {
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
};

module.exports = model("User", UserSchema);
