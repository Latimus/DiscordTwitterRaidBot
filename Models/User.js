const mongoose = require("mongoose");

const options = { timestamps: true };

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },

    userId: {
      type: String,
      unique: true,
      required: true,
    },

    requestToken: {
      trim: true,
      type: String,
    },

    requestSecret: {
      trim: true,
      type: String,
    },

    accessToken: {
      trim: true,
      type: String,
    },

    accessSecret: {
      trim: true,
      type: String,
    },

    claimedLikes: [
      {
        id: String,
      },
    ],

    claimedComments: [
      {
        id: String,
      },
    ],

    claimedRetweets: [
      {
        id: String,
      },
    ],

    claimedFollows: [
      {
        id: String,
      },
    ],

    balance: {
      type: Number,
      default: 0,
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

const User = mongoose.model("user", userSchema);

module.exports = User;
