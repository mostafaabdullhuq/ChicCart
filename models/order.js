const { ObjectId } = require("mongodb"),
    { mongoDB } = require("../database/database");

class Order {
    constructor(id = null, items, price, shipping, promoCode, shippingDetails, paymentMethod) {
        this._id = id ? new ObjectId(id) : null;
        this.items = items;
        this.price = price;
        this.shipping = shipping;
        this.promoCode = promoCode;
        this.shippingDetails = shippingDetails;
        this.paymentMethod = paymentMethod;
        this.discountValue = 0;
    }

    validate() {
        const validationResult = {
            isValid: true,
            errors: [],
        };

        // VALIDATE PAYMENT METHOD
        if (![1, 2, 3].includes(+this.paymentMethod)) {
            validationResult.errors.push("Select a valid payment method.");
        }

        // VALIDATE FIRST NAME (MATCH LETTERS ONLY BETWEEN 2 TO 20 CHARACTERS)
        if (!/^[\p{Letter}\p{Mark}\s]{2,20}$/u.test(this.shippingDetails.firstName)) {
            validationResult.errors.push("Invalid first name format.");
        }

        // VALIDATE LAST NAME (MATCH LETTERS ONLY BETWEEN 2 TO 20 CHARACTERS)
        if (!/^[\p{Letter}\p{Mark}\s]{2,20}$/u.test(this.shippingDetails.lastName)) {
            validationResult.errors.push("Invalid last name format.");
        }

        // VALIDATE STREET ADDRESS (MATCH LETTERS, SPACES, DIGITS, - AND LENGTH BETWEEN 5 TO 100 )
        if (!/^[\p{Letter}\p{Mark}\s\d-]{5,100}$/u.test(this.shippingDetails.streetAddress)) {
            validationResult.errors.push("Invalid street address format.");
        }

        // VALIDATE BUILDING NUMBER (MATCH LETTERS, SPACES, DIGITS, - AND LENGTH BETWEEN 1 TO 10 )
        if (!/^[\p{Letter}\p{Mark}\s\d-]{1,10}$/u.test(this.shippingDetails.buildingNo)) {
            validationResult.errors.push("Invalid building number format.");
        }

        // VALIDATE CITY (MATCH LETTERS, SPACES, DIGITS, - AND LENGTH BETWEEN 1 TO 10 )
        if (!/^[\p{Letter}\p{Mark}\s\d-]{3,20}$/u.test(this.shippingDetails.city)) {
            validationResult.errors.push("Invalid city format.");
        }

        // VALIDATE STATE (MATCH LETTERS, SPACES, DIGITS, - AND LENGTH BETWEEN 1 TO 10 )
        if (!/^[\p{Letter}\p{Mark}\s\d-]{3,20}$/u.test(this.shippingDetails.state)) {
            validationResult.errors.push("Invalid state format.");
        }

        // VALIDATE POSTAL CODE (MATCH LETTERS, SPACES, DIGITS, - AND LENGTH BETWEEN 1 TO 10 )
        if (!/^[\p{Letter}\p{Mark}\s\d-]{3,20}$/u.test(this.shippingDetails.postalCode)) {
            validationResult.errors.push("Invalid postal code format.");
        }
        // VALIDATE PHONE NUMBER (MATCH + (NOT REQUIRED), DIGITS, SPACES )
        if (!/^\+?(?:[0-9] ?){6,14}[0-9]$/u.test(this.shippingDetails.phoneNumber)) {
            validationResult.errors.push("Invalid phone number format.");
        }

        if (validationResult.errors.length) {
            validationResult.isValid = false;
        }
        return validationResult;
    }

    async calculateDiscount() {
        let discountValue = 0;
        if (this.promoCode) {
            // IF PROMOCODE IS PERCENTAGE
            if (this.promoCode.discountType === 1) {
                discountValue = ((this.price + this.shipping) * (this.promoCode.discountValue / 100)).toFixed(2);
                if (discountValue > this.promoCode.maxDiscount) {
                    discountValue = this.promoCode.maxDiscount;
                }
            }
            // IF DISCOUNT VALUE BY CURRENCY
            else {
                discountValue = this.promoCode.discountValue;
            }
        }
        return +discountValue;
    }

    static getAllOrders() {
        return mongoDB().collection("orders").find().toArray();
    }

    static getOrder(orderID) {
        return mongoDB()
            .collection("orders")
            .findOne({
                _id: new ObjectId(orderID),
            });
    }
}

module.exports = Order;
