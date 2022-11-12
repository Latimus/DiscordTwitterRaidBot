const { EmbedBuilder } = require("discord.js");

exports.successfulRewardEmbed = async (type, points, balance) => {
  let embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(
      `:white_check_mark: Congrats you have claimed ${points} ${type} points! `
    )
    .setAuthor({
      name: "Twitter Rewards",
      iconURL:
        "https://about.twitter.com/content/dam/about-twitter/en/brand-toolkit/brand-download-img-1.jpg.twimg.1920.jpg",
    })
    .addFields({
      name: ":moneybag: Balance :moneybag: ",
      value: `Your current available balance is **${balance}** points.`,
      inline: false,
    })
    .setFooter({
      text: `Powered by ${process.env.BRAND_NAME}`,
      iconURL: process.env.ICON_URL,
    });

  return embed;
};

exports.alreadyClaimed = async (type) => {
  let embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(
      `:x: Looks like you have already claimed the ${type} reward for this tweet. `
    )
    .setAuthor({
      name: "Twitter Rewards",
      iconURL:
        "https://about.twitter.com/content/dam/about-twitter/en/brand-toolkit/brand-download-img-1.jpg.twimg.1920.jpg",
    })

    .setFooter({
      text: `Powered by ${process.env.BRAND_NAME}`,
      iconURL: process.env.ICON_URL,
    });

  return embed;
};

exports.noActionPerformed = async (type) => {
  let embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(`:x: Uh-oh, looks like you haven't ${type} yet.`)
    .setAuthor({
      name: "Twitter Rewards",
      iconURL:
        "https://about.twitter.com/content/dam/about-twitter/en/brand-toolkit/brand-download-img-1.jpg.twimg.1920.jpg",
    })

    .setFooter({
      text: `Powered by ${process.env.BRAND_NAME}`,
      iconURL: process.env.ICON_URL,
    });

  return embed;
};

exports.insufficientFunds = async (label, balance) => {
  let embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(
      `:x: Uh-oh, looks like you don't have enough points to buy ${label}. Try selecting another item.`
    )
    .addFields({
      name: ":moneybag: Balance :moneybag: ",
      value: `Your current available balance is **${balance}** points.`,
      inline: false,
    })

    .setFooter({
      text: `Powered by ${process.env.BRAND_NAME}`,
      iconURL: process.env.ICON_URL,
    });

  return embed;
};

exports.outOfStock = async () => {
  let embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(
      `:x: Uh-oh, looks like that item is currently out of stock. Please check back later.`
    )

    .setFooter({
      text: `Powered by ${process.env.BRAND_NAME}`,
      iconURL: process.env.ICON_URL,
    });

  return embed;
};
