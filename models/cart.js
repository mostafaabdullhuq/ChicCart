const { mongoDB } = require("./../database/database");

class Cart {
    constructor(userID, productsCount) {
        this.userID = userID;
        this.products = [];
        this.productsCount = 0;
        this.totalPrice = 0;
        this.totalShipping = 0;
    }

    save() {
        return mongoDB().collection("carts").insertOne(this);
    }
}

module.exports = Cart;
