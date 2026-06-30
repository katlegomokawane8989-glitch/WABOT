const fs = require("fs");

module.exports = {
  config: {
    name: "adminonly",
    aliases: ["adonly", "onlyad", "onlyadmin"],
    version: "1.5",
    author: "Rômeo",
    countDown: 5,
    role: 2,
    description: {
      en: "turn on/off only admin can use bot"
    },
    category: "admin",
    guide: {
      en: "   {pn} [on | off]: turn on/off the mode only admin can use bot"
    }
  },

  onStart: function ({ args, message }) {
    const { config } = global.GoatBot;
    const { client } = global;

    if (!config.featureBox) config.featureBox = {};

    let value;
    if (args[0] === "on") value = true;
    else if (args[0] === "off") value = false;
    else return message.reply("❌ Syntax error, only use .adminonly on or .adminonly off");

    config.featureBox.adminOnly = value;
    message.reply(value ? "✅ Turned on the mode only admin can use bot" : "❎ Turned off the mode only admin can use bot");

    fs.writeFileSync(client.dirConfig, JSON.stringify(config, null, 2), "utf8");
  }
};
