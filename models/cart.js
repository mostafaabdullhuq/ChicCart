const path = require("path");
const fs = require("fs");

const filePath = path.join(__dirname, "..", "database", "cart.json");
module.exports = class Cart {
    static getCart() {
        try {
            return JSON.parse(fs.readFileSync(filePath));
        } catch (e) {
            return [];
        }
    }

    static addToCart(product) {
        let cart = Cart.getCart();
        const prodCartIndex = cart.findIndex((prod) => prod.id == product.id);
        console.log(prodCartIndex);
        if (prodCartIndex >= 0) {
            cart[prodCartIndex]["qty"] += Number(product.qty) || 0;
        } else {
            cart.push(product);
        }
        fs.writeFileSync(filePath, JSON.stringify(cart));
    }

    static updateProductQty(prodID, type) {
        let cart = Cart.getCart();
        let prodIndex = cart.findIndex((prod) => +prod.id === +prodID);
        console.log(prodIndex);
        if (prodIndex >= 0) {
            if (+type === 1) {
                cart[prodIndex]["qty"] += 1;
            } else {
                if (+cart[prodIndex]["qty"] > 1) {
                    cart[prodIndex]["qty"] -= 1;
                }
            }
            cart[prodIndex] = fs.writeFileSync(filePath, JSON.stringify(cart));
        }
    }

    static itemsCount() {
        let cart = Cart.getCart();
        if (cart) {
            let itemsCount = 0;
            cart.forEach((product) => {
                itemsCount += Number(product.qty) || 0;
            });
            return itemsCount;
        } else {
            return 0;
        }
    }

    static cartTotal() {
        let cart = Cart.getCart();
        if (cart) {
            let totalPrice = 0;
            cart.forEach((product) => {
                totalPrice += Number(product.price) * Number(product.qty) || 0;
            });
            return totalPrice;
        } else {
            return 0;
        }
    }

    static deleteProduct(productID) {
        let cart = Cart.getCart();
        let newCart = cart.filter((prod) => +prod.id !== +productID);

        fs.writeFileSync(filePath, JSON.stringify(newCart));
    }
};
