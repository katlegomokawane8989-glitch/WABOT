"use strict";

const axios = require("axios");
const yts = require("yt-search");

const API_URL = "https://ytb-downloader-api.vercel.app/ytb";

function isUrl(text) {
  return /^https?:\/\//i.test(String(text || ""));
}

async function getDownloadData(videoUrl) {
  const res = await axios.get(API_URL, {
    params: { url: videoUrl, type: "360p" },
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 60000,
  });
  if (!res.data || res.data.success !== true) {
    throw new Error(res.data?.message || res.data?.error || "Download API failed");
  }
  return res.data;
}



function formatCaption(data) {
  const title = (data.title || "YouTube Video").trim().slice(0, 150);
  const author = data.channelName || "Unknown";
  const duration = data.duration || "Unknown";
  const size = data.fileSize || "Unknown";
  return (
    `🎥 *Video Downloader* 🎥\n\n` +
    `📝 Title: ${title}\n` +
    `👤 Creator: ${author}\n` +
    `⏱️ Duration: ${duration}\n` +
    `📦 Size: ${size}`
  );
}

async function resolveYouTubeUrl(query) {
  if (isUrl(query)) return query;
  const search = await yts(query);
  if (!search.videos.length) throw new Error("No results found for: " + query);
  return search.videos[0].url;
}

async function sendVideo({ api, message, event, videoUrl, statusID }) {
  try {
    await message.react("⏳");

    const data = await getDownloadData(videoUrl);
    if (!data.download_url) throw new Error("No download URL returned by API");

    if (statusID) await message.unsend(statusID).catch(() => { });

    await api.sendVideo(data.download_url, event.threadID, formatCaption(data), {
      mimetype: "video/mp4",
    });
    await message.react("✅");
  } catch (e) {
    if (statusID) await message.unsend(statusID).catch(() => { });
    await message.react("❌");
    await message.reply("❌ Failed: " + e.message).catch(() => { });
  }
}

module.exports = {
  config: {
    name: "video",
    aliases: [],
    version: "1.1.0",
    author: "Rômeo",
    role: 0,
    category: "media",
    shortDescription: "Download and send a YouTube video",
    longDescription: "Search YouTube or paste a URL to stream and send a video (360p).",
    guide: { en: "{pn} <search term | youtube url>\n{pn} -s <search term>  (to pick from a list)" },
  },

  onStart: async function ({ api, message, args, event }) {
    if (!args[0]) return message.reply("Enter a video name or YouTube URL.");

    let showList = false;
    if (args[0] === "-s") {
      showList = true;
      args.shift();
    }

    const query = args.join(" ").trim();
    if (!query) return message.reply("Enter a video name or YouTube URL.");

    if (!showList) {
      const status = await message.reply("⏳ Fetching video...");
      try {
        const videoUrl = await resolveYouTubeUrl(query);
        return sendVideo({ api, message, event, videoUrl, statusID: status?.messageID });
      } catch (e) {
        if (status?.messageID) await message.unsend(status.messageID).catch(() => { });
        return message.reply("❌ " + e.message);
      }
    }

    try {
      const search = await yts(query);
      if (!search.videos.length) return message.reply("No results found.");

      const top = search.videos.slice(0, 6);
      let msg = `🎥 *Video Search Results for:* "${query}"\n\n`;
      top.forEach((v, i) => {
        msg += `${i + 1}. ${v.title}\n⏱️ ${v.timestamp}\n\n`;
      });
      msg += "Reply with a number (1–6) to download.";

      const info = await message.reply(msg);
      if (info?.messageID) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: module.exports.config.name,
          author: event.senderID,
          videos: top,
        });
      }
    } catch (e) {
      return message.reply("❌ " + e.message);
    }
  },

  onReply: async function ({ api, message, event, Reply }) {
    const senderNorm = global.normUID ? global.normUID(event.senderID) : event.senderID;
    const authorNorm = global.normUID ? global.normUID(Reply.author) : Reply.author;
    if (senderNorm !== authorNorm) return message.reply("This is not your request.");

    const choice = parseInt((event.body || "").trim(), 10);
    if (Number.isNaN(choice) || choice < 1 || choice > Reply.videos.length) {
      return message.reply(`Invalid choice. Reply with 1–${Reply.videos.length}.`);
    }

    const replyID = event.messageReply?.messageID || event.replyToMessage?.messageID;
    if (replyID) {
      global.GoatBot.onReply.delete(replyID);
      await message.unsend(replyID).catch(() => { });
    }

    const status = await message.reply("⏳ Fetching video...");
    return sendVideo({
      api,
      message,
      event,
      videoUrl: Reply.videos[choice - 1].url,
      statusID: status?.messageID,
    });
  },
};
