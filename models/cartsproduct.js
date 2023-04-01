const sequelize = require("./../database/database");
const { Sequelize, DataTypes } = require("sequelize");

const CartsProduct = sequelize.define("cartsproduct", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false,
    },
    totalPrice: {
        type: DataTypes.DECIMAL(8, 2),
        defaultValue: 0,
        allowNull: false,
    },
    shippingPrice: {
        type: DataTypes.DECIMAL(8, 2),
        defaultValue: 0,
        allowNull: false,
    },
});

module.exports = CartsProduct;
