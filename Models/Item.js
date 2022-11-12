const mongoose = require("mongoose");

const options = { timestamps: true };

const itemSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      unique: true,
    },

    description: {
      type: String,
      required: true,
    },

    value: {
      type: String,
      required: true,
    },

    stock: {
      type: Number,
      default: 0,
      required: true,
    },

    price: {
      type: Number,
      default: 0,
      required: true,
    },

    roleId: {
      type: String,
      retuired: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    uuid: {
      type: String,
      required: true,
      unique: true,
    },
  },
  options
);

const Item = mongoose.model("item", itemSchema);

module.exports = Item;
