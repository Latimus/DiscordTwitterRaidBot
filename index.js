require("dotenv").config();
require("./db/mongoose");

const sanitize = require("mongo-sanitize");
const { randomUUID } = require("crypto");
const { TwitterApi } = require("twitter-api-v2");

const User = require("./Models/User");
const Item = require("./Models/Item");

const {
  successfulRewardEmbed,
  alreadyClaimed,
  noActionPerformed,
  insufficientFunds,
  outOfStock,
} = require("./controllers/claims");

const OAuth = require("oauth"),
  qs = require("querystring"),
  readline = require("readline");

const Auth = OAuth.OAuth;
const twitterConsumerKey = process.env.CONSUMER_KEY;
const twitterConsumerSecret = process.env.CONSUMER_SECRET;

var requestUrl = "https://twitter.com/oauth/request_token?oauth_callback=oob";
var accessUrl = "https://twitter.com/oauth/access_token";
var authorizeUrl = "https://twitter.com/oauth/authorize";

const oa = new Auth(
  requestUrl,
  accessUrl,
  twitterConsumerKey,
  twitterConsumerSecret,
  "1.0",
  null,
  "HMAC-SHA1"
);

const {
  Client,
  Intents,
  Partials,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputStyle,
  TextInputBuilder,
  SelectMenuBuilder,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
  //   partials: ["MESSAGE", "CHANNEL", "REACTION"],
});

process.on("uncaughtException", function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});

client.on("ready", () => {
  console.log("Bot is logged in");
});

client.on("messageCreate", async (msg) => {
  if (!msg.content.startsWith(`${process.env.prefix}`)) return;

  //   Update the stock for an item
  if (msg.content.startsWith(`${process.env.prefix}stock`)) {
    try {
      let isAdmin = msg.member.roles.cache.some(
        (role) => role.id === process.env.ADMIN_ROLE
      );

      let isDev = msg.member.roles.cache.some(
        (role) => role.id === process.env.DEVELOPER_ROLE
      );

      if (!isAdmin && !isDev) {
        console.log("Access denied");
        return await msg.delete();
      }

      if (msg.channel.id !== process.env.BOT_CHANNEL) {
        console.log("Wrong channel");
        return await msg.delete();
      }

      const addStockTo = msg.content.split(" ")[1];

      const amount = msg.content.split(" ")[2];

      let item = await Item.findOne({ label: sanitize(addStockTo) });

      if (!item) {
        await msg.reply(`Invalid item name. Check capitilization`);
        return await msg.delete();
      }

      item.stock = sanitize(amount);

      await item.save();

      await msg.reply(`Inventory updated for ${item.label}`);
      return await msg.delete();
    } catch (e) {
      console.log(e);
    }
  }

  //   Update the price for an item
  if (msg.content.startsWith(`${process.env.prefix}price`)) {
    try {
      let isAdmin = msg.member.roles.cache.some(
        (role) => role.id === process.env.ADMIN_ROLE
      );

      let isDev = msg.member.roles.cache.some(
        (role) => role.id === process.env.DEVELOPER_ROLE
      );

      if (!isAdmin && !isDev) {
        console.log("Access denied");
        return await msg.delete();
      }

      if (msg.channel.id !== process.env.BOT_CHANNEL) {
        console.log("Wrong channel");
        return await msg.delete();
      }

      const updatePriceFor = msg.content.split(" ")[1];

      const amount = msg.content.split(" ")[2];

      let item = await Item.findOne({ label: sanitize(updatePriceFor) });

      if (!item) {
        await msg.reply(`Invalid item name. Check capitilization`);
        return await msg.delete();
      }

      item.price = sanitize(amount);

      await item.save();

      await msg.reply(`Inventory updated for ${item.label}`);
      return await msg.delete();
    } catch (e) {
      console.log(e);
    }
  }

  //   Handle create TWITTER REWARDS
  if (msg.content.startsWith(`${process.env.prefix}tweet`)) {
    try {
      let isAdmin = msg.member.roles.cache.some(
        (role) => role.id === process.env.ADMIN_ROLE
      );

      let isDev = msg.member.roles.cache.some(
        (role) => role.id === process.env.DEVELOPER_ROLE
      );

      if (!isAdmin && !isDev) {
        console.log("Access denied");
        return await msg.delete();
      }

      if (msg.channel.id !== process.env.REWARDS_CHANNEL) {
        console.log("Wrong channel");
        return await msg.delete();
      }

      // Check that the command is properly formatted
      if (!msg.content.split(" ")[1] || !msg.content.split(" ")[2]) {
        return await msg.reply(
          "All parameters are required ex. <!tweet url points>"
        );
      }

      if (isNaN(msg.content.split(" ")[2])) {
        return await msg.reply("Points must be a number ex. <!tweet url 123>");
      }

      let embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("Twitter Action Rewards")
        .setAuthor({
          name: `${process.env.BOT_BRAND_NAME} Rewards`,
          iconURL:
            "https://about.twitter.com/content/dam/about-twitter/en/brand-toolkit/brand-download-img-1.jpg.twimg.1920.jpg",
        })
        .addFields(
          {
            name: "\u200b",
            value:
              "`1` **LIKE**, **COMMENT** and **RETWEET** the tweet linked below. \n`2` Click on the buttons below to claim your rewards.",
            inline: false,
          },

          {
            name: "**🔗 Tweet Link 🔗**",
            value: msg.content.split(" ")[1],
            inline: false,
          },

          {
            name: ":moneybag: **Reward** :moneybag:",
            value: msg.content.split(" ")[2],
            inline: false,
          },

          {
            name: "\u200b",
            value: "\u200b",
            inline: false,
          }
        )
        .setFooter({
          text: `Powered by ${process.env.BRAND_NAME}`,
          iconURL: process.env.ICON_URL,
        });

      let points = msg.content.split(" ")[2].toString();

      const row = new ActionRowBuilder().addComponents(
        // new ButtonBuilder()
        //   .setCustomId(`follow ${points} ${msg.content.split(" ")[1]} `)
        //   .setLabel("Claim Follow Points")
        //   .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId(`like ${points} ${msg.content.split(" ")[1]} `)
          .setLabel("Claim Like Points")
          .setStyle(ButtonStyle.Success)
          .setEmoji(process.env.BUTTON_EMOJI),

        new ButtonBuilder()
          .setCustomId(`retweet ${points} ${msg.content.split(" ")[1]} `)
          .setLabel("Claim Retweet Points")
          .setStyle(ButtonStyle.Primary)
          .setEmoji(process.env.BUTTON_EMOJI),

        new ButtonBuilder()
          .setCustomId(`comment ${points} ${msg.content.split(" ")[1]} `)
          .setLabel("Claim Comment Points")
          .setStyle(ButtonStyle.Danger)
          .setEmoji(process.env.BUTTON_EMOJI)
      );

      await msg.channel.send({
        embeds: [embed],
        components: [row],
      });
      return await msg.delete();
    } catch (e) {
      console.log(e);
    }
  }

  //   Handle create SHOP
  if (msg.content.startsWith(`${process.env.prefix}shop`)) {
    try {
      let isAdmin = msg.member.roles.cache.some(
        (role) => role.id === process.env.ADMIN_ROLE
      );

      let isDev = msg.member.roles.cache.some(
        (role) => role.id === process.env.DEVELOPER_ROLE
      );

      if (!isAdmin && !isDev) {
        console.log("Access denied");
        return await msg.delete();
      }

      if (msg.channel.id !== process.env.SHOP_CHANNEL) {
        console.log("Wrong channel");
        return await msg.delete();
      }

      // Check that the command is properly formatted
      let embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setAuthor({
          name: `Welcome to the ${process.env.BOT_BRAND_NAME} Store`,
          iconURL: process.env.ICON_URL,
          // iconURL:
          //   "https://about.twitter.com/content/dam/about-twitter/en/brand-toolkit/brand-download-img-1.jpg.twimg.1920.jpg",
        })
        .addFields(
          {
            name: "\u200b",
            value: "You can come here to buy roles, whitelist, & more.",
            inline: false,
          },

          {
            name: "\u200b",
            value:
              "This is the place to shop around at. Click on the **View Store Items** button below to display a dropdown for all store items. You can then select an item to view it's details and buy it. Alternatively you can use **Check Balance** to see your current available points balance.",
            inline: false,
          }
        )
        .setFooter({
          text: `Powered by ${process.env.BRAND_NAME}`,
          iconURL: process.env.ICON_URL,
        });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`viewStore`)
          .setLabel("View Store Items")
          .setStyle(ButtonStyle.Success)
          .setEmoji(process.env.BUTTON_EMOJI),

        new ButtonBuilder()
          .setCustomId(`checkBalance`)
          .setLabel("Check Balance")
          .setStyle(ButtonStyle.Danger)
          .setEmoji(process.env.BUTTON_EMOJI)
      );

      await msg.channel.send({
        embeds: [embed],
        components: [row],
      });
      return await msg.delete();
    } catch (e) {
      console.log(e);
    }
  }

  //   Handle create NEW SHOP ITEM
  if (msg.content.startsWith(`${process.env.prefix}item`)) {
    try {
      let isAdmin = msg.member.roles.cache.some(
        (role) => role.id === process.env.ADMIN_ROLE
      );

      let isDev = msg.member.roles.cache.some(
        (role) => role.id === process.env.DEVELOPER_ROLE
      );

      if (!isAdmin && !isDev) {
        console.log("Access denied");
        return await msg.delete();
      }

      if (msg.channel.id !== process.env.BOT_CHANNEL) {
        console.log("Wrong channel");
        return await msg.delete();
      }

      let ctx = msg.content.split("-");

      let label = ctx[1];
      let description = ctx[2];
      let stock = ctx[3];
      let price = ctx[4];
      let roleId = ctx[5];

      if (
        !label ||
        !description ||
        !stock ||
        !price ||
        !roleId ||
        isNaN(stock) ||
        isNaN(price)
      ) {
        await msg.reply({
          content:
            "Invalid shop item entry. ```Valid syntax = !item-<Label>-<Description>-<Stock>-<Price>-<Role ID>```",
        });
        return await msg.delete();
      }

      const itemExist = await Item.findOne({ label });

      if (itemExist) {
        await msg.reply({
          content:
            "An Item with that label already exist. Please try using a different label.",
        });
        return await msg.delete();
      }

      const item = new Item({
        label,
        description,
        value: label,
        stock,
        price,
        roleId,
        createdAt: Date.now(),
        uuid: randomUUID(),
      });

      await item.save();

      await msg.reply({
        content: `You have succesfully added a new item ${label}`,
      });
      return await msg.delete();
    } catch (e) {
      console.log(e);
    }
  }
});

const getUser = async (userId) => {
  const user = await User.findOne({ userId });

  if (user && !user.accessToken) {
    await user.delete();
    return null;
  }

  return user;
};

client.on("interactionCreate", async (interaction) => {
  if (
    !interaction.isButton() &&
    !interaction.isModalSubmit() &&
    !interaction.isSelectMenu()
  )
    return;

  //   Show modal when user clicks submit pin button
  if (interaction.customId === "pinSubmit") {
    try {
      const modal = new ModalBuilder()
        .setCustomId("submitPinModal")
        .setTitle("Oauth PIN Verification");

      const pinInput = new TextInputBuilder()
        .setCustomId("pinInput")
        .setLabel("Please enter your Twitter Oauth PIN below.")
        .setStyle(TextInputStyle.Short);

      const firstActionRow = new ActionRowBuilder().addComponents(pinInput);

      modal.addComponents(firstActionRow);

      return await interaction.showModal(modal);
    } catch (e) {
      console.log(e);
    }
  }

  //   Verify pin code
  if (interaction.customId === "submitPinModal") {
    const user = await User.findOne({ userId: interaction.user.id });

    if (!user) return;

    verifier = interaction.fields.getTextInputValue("pinInput");

    oa.getOAuthAccessToken(
      user.requestToken,
      user.requestSecret,
      verifier,
      async (e, accessToken, accessTokenSecret) => {
        if (e) {
          let embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setAuthor({
              name: "Account Verification Failed!",
              iconURL:
                "https://about.twitter.com/content/dam/about-twitter/en/brand-toolkit/brand-download-img-1.jpg.twimg.1920.jpg",
            })
            .addFields({
              name: ":x: Failed!",
              value:
                "Please recheck your PIN and try again. If the problem persist try creating a new PIN. Your PIN is the NUMBER generated after authorizing the bot through the provided link.",
              inline: false,
            })
            .setFooter({
              text: `Powered by ${process.env.BRAND_NAME}`,
              iconURL: process.env.ICON_URL,
            });

          console.log(e, interaction.user.username, verifier);
          return await interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        }

        user.accessToken = accessToken;
        user.accessSecret = accessTokenSecret;
        await user.save();

        let embed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setAuthor({
            name: "Account Verification Complete!",
            iconURL:
              "https://about.twitter.com/content/dam/about-twitter/en/brand-toolkit/brand-download-img-1.jpg.twimg.1920.jpg",
          })
          .addFields({
            name: "Congratulations!",
            value: "You have successfully verified your twitter account.",
            inline: false,
          })
          .setFooter({
            text: `Powered by ${process.env.BRAND_NAME}`,
            iconURL: process.env.ICON_URL,
          });

        return await interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
      }
    );

    return;
  }

  const user = await getUser(interaction.user.id);

  if (!user) {
    try {
      return oa.getOAuthRequestToken(
        async (e, requestToken, requestTokenSecret, results) => {
          let authUrl =
            authorizeUrl + "?" + qs.stringify({ oauth_token: requestToken });

          let embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle("Verify Twitter Account Ownership")
            .setAuthor({
              name: "Twitter Oauth",
              iconURL:
                "https://about.twitter.com/content/dam/about-twitter/en/brand-toolkit/brand-download-img-1.jpg.twimg.1920.jpg",
            })
            .addFields(
              {
                name: "Step1",
                value: `Navigate to the [**Twitter OAuth Authorization**](${authUrl}) page and authorize the app using your twitter account.`,
                inline: false,
              },

              {
                name: "Step 2",
                value:
                  "Copy the **one-time pincode** provided and submit it via the 'Submit Pin' button below.",
                inline: false,
              }
            )
            .setFooter({
              text: "Note: This is a one time action and future attempts will not activate this prompt.",
            });

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`pinSubmit`)
              .setLabel("Submit Pin")
              .setStyle(ButtonStyle.Success)
              .setEmoji(process.env.BUTTON_EMOJI)
          );

          const newUser = new User({
            username: interaction.user.username,
            userId: interaction.user.id,
            requestToken: requestToken,
            requestSecret: requestTokenSecret,
            accessToken: null,
            accessSecret: null,
            claimedLikes: [],
            claimedComments: [],
            claimedRetweets: [],
            claimedFollows: [],
            balance: 0,
            createdAt: Date.now(),
            uuid: randomUUID(),
          });

          await newUser.save();

          return await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true,
          });
        }
      );
    } catch (e) {
      console.log(e);
    }
  }

  //   Handle FOLLOW claim
  if (interaction.customId.split(" ")[0] === "follow") {
    return;
    try {
      const url = interaction.customId.split(" ")[2];
      const currentUser = user.accessToken.split("-")[0];
      const tweetId = url.split("/");
      let points = interaction.customId.split(" ")[1];

      const client = new TwitterApi({
        appKey: process.env.CONSUMER_KEY,
        appSecret: process.env.CONSUMER_SECRET,
        accessToken: user.accessToken,
        accessSecret: user.accessSecret,
      });

      //   Get twitter handle from tweet url
      let handle = await client.v2.usersByUsernames([
        tweetId[tweetId.length - 3],
      ]);

      // Check if user has already claimed this reward
      let hasClaimed = user.claimedFollows.filter((claim) => {
        return claim.id.toString() === handle.data[0].id.toString();
      });

      // If user has claimed return error
      if (hasClaimed.length > 0) {
        embed = await alreadyClaimed("Follow");

        return interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
      }

      const followers = await client.v2.followers(handle.data[0].id, {
        asPaginator: true,
      });

      // check if the current users id is in the array of followers
      const hasFollowed = followers.data.data.filter((follower) => {
        return follower.id === currentUser;
      });

      // return success if user has followed the account
      if (hasFollowed.length > 0) {
        user.balance = parseInt(user.balance) + parseInt(points);
        user.claimedFollows.push({
          id: handle.data[0].id.toString(),
        });
        await user.save();

        embed = await successfulRewardEmbed("Follow", points, user.balance);

        return interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
      }

      // return failure if user has not followed the account
      if (hasFollowed.length <= 0) {
        let embed = await noActionPerformed("Followed");

        return interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
      }
    } catch (e) {
      console.log(e);
    }
  }

  //   Handle LIKE claim
  if (interaction.customId.split(" ")[0] === "like") {
    try {
      const url = interaction.customId.split(" ")[2];
      const currentUser = user.accessToken.split("-")[0];
      const tweetId = url.split("/");
      let points = interaction.customId.split(" ")[1];

      const client = new TwitterApi({
        appKey: process.env.CONSUMER_KEY,
        appSecret: process.env.CONSUMER_SECRET,
        accessToken: user.accessToken,
        accessSecret: user.accessSecret,
      });

      // Check if user has already claimed this reward
      let hasClaimed = user.claimedLikes.filter((claim) => {
        return claim.id.toString() === tweetId[tweetId.length - 1].toString();
      });

      // If user has claimed return error
      if (hasClaimed.length > 0) {
        try {
          let embed = await alreadyClaimed("Like");

          return interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        } catch (e) {
          console.log(e);
        }
      }

      // get an array of likes for this tweet
      const likers = await client.v2.tweetLikedBy(tweetId[tweetId.length - 1], {
        asPaginator: true,
      });

      //   console.log(likers.data.data[0]);

      // check if the current users id is in the array of likes
      const hasLiked = likers.data.data.filter((like) => {
        return like.id === currentUser;
      });

      // return success if user has liked the tweet
      if (hasLiked.length > 0) {
        try {
          user.balance = parseInt(user.balance) + parseInt(points);
          user.claimedLikes.push({
            id: [tweetId[tweetId.length - 1]].toString(),
          });
          await user.save();

          let embed = await successfulRewardEmbed("Like", points, user.balance);

          return interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        } catch (e) {
          console.log(e);
        }
      }

      // return failure if user has not liked the tweet
      if (hasLiked.length <= 0) {
        try {
          let embed = await noActionPerformed("Liked");

          return interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        } catch (e) {
          console.log(e);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  //   Handle RETWEET claim
  if (interaction.customId.split(" ")[0] === "retweet") {
    try {
      const url = interaction.customId.split(" ")[2];
      const currentUser = user.accessToken.split("-")[0];
      const tweetId = url.split("/");
      let points = interaction.customId.split(" ")[1];

      const client = new TwitterApi({
        appKey: process.env.CONSUMER_KEY,
        appSecret: process.env.CONSUMER_SECRET,
        accessToken: user.accessToken,
        accessSecret: user.accessSecret,
      });

      // Check if user has already claimed this reward
      let hasClaimed = user.claimedRetweets.filter((claim) => {
        return claim.id.toString() === tweetId[tweetId.length - 1].toString();
      });

      // If user has claimed return error
      if (hasClaimed.length > 0) {
        try {
          let embed = await alreadyClaimed("Retweet");

          return interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        } catch (e) {
          console.log(e);
        }
      }

      const retweeters = await client.v2.tweetRetweetedBy([
        tweetId[tweetId.length - 1],
      ]);

      // check if the current users id is in the array of retweets
      const hasRetweeted = retweeters.data.filter((retweet) => {
        return retweet.id === currentUser;
      });

      // return success if user has retweeted the tweet
      if (hasRetweeted.length > 0) {
        try {
          user.balance = parseInt(user.balance) + parseInt(points);
          user.claimedRetweets.push({
            id: [tweetId[tweetId.length - 1]].toString(),
          });

          await user.save();

          let embed = await successfulRewardEmbed(
            "Retweet",
            points,
            user.balance
          );

          return interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        } catch (e) {
          console.log(e);
        }
      }

      // return failure if user has not liked the tweet
      if (hasRetweeted.length <= 0) {
        try {
          let embed = await noActionPerformed("Retweeted");

          return interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        } catch (e) {
          console.log(e);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  //   Handle COMMENT claim
  if (interaction.customId.split(" ")[0] === "comment") {
    try {
      const url = interaction.customId.split(" ")[2];
      const currentUser = user.accessToken.split("-")[0];
      const tweetId = url.split("/");
      let points = interaction.customId.split(" ")[1];

      const client = new TwitterApi({
        appKey: process.env.CONSUMER_KEY,
        appSecret: process.env.CONSUMER_SECRET,
        accessToken: user.accessToken,
        accessSecret: user.accessSecret,
      });

      // Check if user has already claimed this reward
      let hasClaimed = user.claimedComments.filter((claim) => {
        return claim.id.toString() === tweetId[tweetId.length - 1].toString();
      });

      // If user has claimed return error
      if (hasClaimed.length > 0) {
        try {
          let embed = await alreadyClaimed("Comment");

          return interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        } catch (e) {
          console.log(e);
        }
      }

      //   Get twitter handle from tweet url
      const handle = await client.v2.usersByUsernames([
        tweetId[tweetId.length - 3],
      ]);

      const mentions = await client.v2.userMentionTimeline(handle.data[0].id);

      let recentIds = [];
      let authorIds = [];

      mentions.data.data.filter(async (comment) => {
        recentIds.push(comment.id);
      });

      for (let i = 0; i < recentIds.length; i++) {
        let author = await client.v2.singleTweet(recentIds[i].toString(), {
          expansions: [
            "entities.mentions.username",
            "in_reply_to_user_id",
            "author_id",
          ],
        });

        authorIds.push(author.data.author_id);
      }

      let hasCommented = authorIds.filter((id) => {
        return id === currentUser;
      });

      console.log(hasCommented);

      // return success if user has commented on the tweet
      if (hasCommented.length > 0) {
        try {
          user.balance = parseInt(user.balance) + parseInt(points);
          user.claimedComments.push({
            id: [tweetId[tweetId.length - 1]].toString(),
          });

          await user.save();

          let embed = await successfulRewardEmbed(
            "Comment",
            points,
            user.balance
          );

          return interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        } catch (e) {
          console.log(e);
        }
      }

      // return failure if user has not commented on the tweet
      if (hasCommented.length <= 0) {
        try {
          let embed = await noActionPerformed("Commented");

          return interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        } catch (e) {
          console.log(e);
        }
      }

      return;
    } catch (e) {
      console.log(e);
    }
  }

  //   Handle CHECK BALANCE
  if (interaction.customId.split(" ")[0] === "checkBalance") {
    try {
      let embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`Welcome to the ${process.env.BOT_BRAND_NAME} Bank`)
        .addFields({
          name: ":moneybag: Balance :moneybag: ",
          value: `Your current available balance is **${user.balance}** points.`,
          inline: false,
        })
        .setFooter({
          text: `Powered by ${process.env.BRAND_NAME}`,
          iconURL: process.env.ICON_URL,
        });

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } catch (e) {
      console.log(e);
    }
  }

  //   Handle VIEW STORE
  if (interaction.customId.split(" ")[0] === "viewStore") {
    try {
      const items = await Item.find({});

      let options = [];

      items.forEach((item) => {
        if (item.stock <= 0) return;

        let option = {
          label: item.label,
          description: `Price: ${item.price}`,
          value: item.label,
        };

        options.push(option);
      });

      const row = new ActionRowBuilder().addComponents(
        new SelectMenuBuilder()
          .setCustomId("buyItem")
          .setPlaceholder("Select an item")
          .addOptions(options)
      );

      return await interaction.reply({ components: [row], ephemeral: true });
    } catch (e) {
      console.log(e);
    }
  }

  if (interaction.customId.split(" ")[0] === "buyItem") {
    try {
      let selection = await Item.findOne({ label: interaction.values[0] });

      let embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`:shopping_bags:  ${selection.label} - Item Info`)
        .addFields(
          {
            name: "\u200b",
            value: `**Name:** ${selection.label} \n**Description:** ${selection.description}`,
            inline: false,
          },

          {
            name: "\u200b",
            value: `**Price:** ${selection.price}\n**Stock:** ${selection.stock}`,
            inline: false,
          },

          {
            name: "\u200b",
            value: `**Role Assigned:** <@&${selection.roleId}>`,
            inline: false,
          }
        )
        .setFooter({
          text: `Powered by ${process.env.BRAND_NAME}`,
          iconURL: process.env.ICON_URL,
        });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`BuyNow ${selection.label}`)
          .setLabel("Buy Now")
          .setStyle(ButtonStyle.Success)
          .setEmoji(process.env.BUTTON_EMOJI)
      );

      return await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true,
      });
    } catch (e) {
      console.log(e);
    }
  }

  // Handle BUY NOW BUTTON
  if (interaction.customId.split(" ")[0] === "BuyNow") {
    try {
      const selection = await Item.findOne({
        label: interaction.customId.split(" ")[1],
      });

      if (selection.price > user.balance) {
        try {
          let embed = await insufficientFunds(selection.label, user.balance);

          return await interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        } catch (e) {
          console.log(e);
        }
      }

      if (selection.stock <= 0) {
        try {
          let embed = await outOfStock();

          return await interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        } catch (e) {
          console.log(e);
        }
      }

      user.balance = parseInt(user.balance) - parseInt(selection.price);
      selection.stock = parseInt(selection.stock) - 1;
      await selection.save();
      await user.save();

      try {
        const role = interaction.member.guild.roles.cache.find(
          (role) => role.id === selection.roleId
        );

        interaction.member.roles.add(role);
      } catch (e) {
        console.log(e);
      }

      let embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(
          `:white_check_mark: Congrats! You have succesfully purchased ${selection.label} for ${selection.price} points.`
        )
        .addFields({
          name: ":moneybag: Balance :moneybag: ",
          value: `Your new available balance is **${user.balance}** points.`,
          inline: false,
        })

        .setFooter({
          text: `Powered by ${process.env.BRAND_NAME}`,
          iconURL: process.env.ICON_URL,
        });

      return await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } catch (e) {
      console.log(e);
    }
  }
});

client.login(process.env.BOT_TOKEN);
