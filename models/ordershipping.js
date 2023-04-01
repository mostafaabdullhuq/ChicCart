const sequelize = require("./../database/database"),
    { DataTypes } = require("sequelize");

const OrderShipping = sequelize.define("ordershipping", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    streetAddress: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    buildingNo: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    state: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    postalCode: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    deliveryNotes: DataTypes.STRING,
});

module.exports = OrderShipping;
