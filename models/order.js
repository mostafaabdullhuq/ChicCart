const { Schema, model } = require("mongoose"),
    Types = Schema.Types;

const OrderSchema = new Schema({
    items: {
        type: [{}],
        required: true,
    },
    price: {
        type: Number,
        min: 0,
        required: true,
    },
    shipping: {
        type: Number,
        min: 0,
        required: true,
    },
    promoCode: {
        type: Types.ObjectId,
        ref: "PromoCode",
        default: null,
    },
    shippingDetails: {
        type: {
            firstName: {
                type: String,
                validate: {
                    validator: (value) => {
                        return /^[\p{Letter}\p{Mark}\s]{2,20}$/u.test(value);
                    },
                    message: "Invalid first name format",
                },
            },
            lastName: {
                type: String,
                validate: {
                    validator: (value) => {
                        return /^[\p{Letter}\p{Mark}\s]{2,20}$/u.test(value);
                    },
                    message: "Invalid last name format",
                },
            },
            streetAddress: {
                type: String,
                validate: {
                    validator: (value) => {
                        return /^[\p{Letter}\p{Mark}\s\d-]{5,100}$/u.test(value);
                    },
                    message: "Invalid street address format",
                },
            },
            buildingNo: {
                type: String,
                validate: {
                    validator: (value) => {
                        return /^[\p{Letter}\p{Mark}\s\d-]{1,10}$/u.test(value);
                    },
                    message: "Invalid building number format.",
                },
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
            state: {
                type: String,
                validate: {
                    validator: (value) => {
                        return /^[\p{Letter}\p{Mark}\s\d-]{3,20}$/u.test(value);
                    },
                    message: "Invalid state format",
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
            phoneNumber: {
                type: String,
                validate: {
                    validator: (value) => {
                        return /^\+?(?:[0-9] ?){6,14}[0-9]$/u.test(value);
                    },
                    message: "Invalid phone number format",
                },
            },
            deliveryNotes: { type: String },
        },
    },
    paymentMethod: {
        type: Number,
        enum: [1, 2, 3],
        required: true,
    },
    discountValue: {
        type: Number,
        default: 0,
    },
    userID: {
        type: Types.ObjectId,
        required: true,
        ref: "User",
    },
    createdAt: {
        type: Date,
        required: true,
        default: new Date(),
    },
    status: {
        type: Number,
        enum: [1, 2, 3, 4], // PENDING, SHIPPED, DELIVERED, CANCELLED
        default: 1,
    },
});

module.exports = model("Order", OrderSchema);
