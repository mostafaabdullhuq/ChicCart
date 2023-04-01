const sequelize = require("./../database/database"),
    { DataTypes } = require("sequelize");

const OrderItem = sequelize.define("orderitem", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    totalItemPrice: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
    },
    totalShippingPrice: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
    },
});

module.exports = OrderItem;
