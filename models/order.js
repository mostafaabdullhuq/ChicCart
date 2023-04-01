const sequelize = require("./../database/database"),
    { DataTypes } = require("sequelize");

const Order = sequelize.define("order", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    totalItems: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    totalPrice: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    paymentMethod: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
});

module.exports = Order;
