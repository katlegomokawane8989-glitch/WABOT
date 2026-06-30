"use strict";

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function editOrReply(message, info, text) {
  if (info && info.messageID && typeof message.edit === "function") {
    try {
      await message.edit(info.messageID, text);
      return info;
    } catch (_) {}
  }
  return message.reply(text);
}

module.exports = {
  config: {
    name: "slot",
    aliases: [],
    version: "1.0.0",
    author: "Rômeo",
    countDown: 15,
    role: 0,
    shortDescription: "Slot machine",
    longDescription: "Spin the slot machine and win coins",
    category: "economy",
    guide: {
      en: "{pn} <bet>"
    }
  },

  onStart: async ({ message, event, args }) => {
    const usersData = global.db.usersData;

    const bet = parseInt(args[0]);

    if (!bet || bet <= 0)
      return message.reply("❌ Please enter a valid bet amount.");

    const userData = await usersData.get(event.senderID);

    if ((userData.money || 0) < bet)
      return message.reply("❌ You don't have enough coins.");

    const slots = ["🍒", "🍋", "🍇", "💎", "🍀", "7️⃣"];

    let info = await message.reply("🎰 Starting Slot Machine...");

    for (let i = 0; i < 3; i++) {
      const s1 = slots[Math.floor(Math.random() * slots.length)];
      const s2 = slots[Math.floor(Math.random() * slots.length)];
      const s3 = slots[Math.floor(Math.random() * slots.length)];

      await delay(800);

      info = await editOrReply(
        message,
        info,
        `🎰 SLOT MACHINE 🎰\n\n${s1} │ ${s2} │ ${s3}\n\n🔄 Spinning...`
      );
    }

    const slot1 = slots[Math.floor(Math.random() * slots.length)];
    const slot2 = slots[Math.floor(Math.random() * slots.length)];
    const slot3 = slots[Math.floor(Math.random() * slots.length)];

    let reward = 0;
    let resultText = "";

    if (slot1 === slot2 && slot2 === slot3) {
      reward = bet * 5;
      resultText = "🏆 JACKPOT!";
    }
    else if (
      slot1 === slot2 ||
      slot2 === slot3 ||
      slot1 === slot3
    ) {
      reward = bet * 2;
      resultText = "🎉 WIN!";
    }
    else {
      reward = -bet;
      resultText = "💔 LOST!";
    }

    await usersData.set(event.senderID, {
      money: (userData.money || 0) + reward
    });

    const newBalance =
      (userData.money || 0) + reward;

    return editOrReply(
      message,
      info,
      `╔════ 🎰 SLOT MACHINE 🎰 ════╗

┃   ${slot1} │ ${slot2} │ ${slot3}

╚═════════════════════════╝

${resultText}

${reward > 0
          ? `💰 Won: ${reward} Coins`
          : `📉 Lost: ${bet} Coins`
        }

🏦 Balance: ${newBalance} Coins`
    );
  }
};