import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API URLs
const topClansApiUrl = 'https://biggamesapi.io/api/clans?page=1&pageSize=100&sort=Points&sortOrder=desc';
const clanApiUrl = 'https://biggamesapi.io/api/clan/';
const INVENTORY_API_BASE = 'https://inventory.roblox.com/v1/users/';
const USER_API_BASE = 'https://users.roblox.com/v1/users/';

// Function to pause execution for a specified time (in milliseconds)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to fetch game passes from the cache file
async function fetchGamePasses() {
  try {
    const data = await fs.promises.readFile(path.resolve(__dirname, 'GamepassCache.json'), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read game pass cache file:', error);
    return {}; // Return an empty object if file is missing or unreadable
  }
}

// Function to check game pass ownership for a specific user
async function checkGamePassOwnership(userId, gamePassId) {
  try {
    const response = await axios.get(`${INVENTORY_API_BASE}${userId}/items/GamePass/${gamePassId}`);
    const hasGamePass = response.data.data.length > 0;
    return hasGamePass;
  } catch (error) {
    console.error(`Error checking GamePass ID ${gamePassId} for UserID ${userId}:`, error);
    return null; // Use null to indicate an error occurred
  }
}

// Function to check all game passes for a specific user
async function checkUserGamePasses(userId) {
  const gamePasses = await fetchGamePasses();
  const results = [];

  for (const [gamePassId, gamePassName] of Object.entries(gamePasses)) {
    const ownsGamePass = await checkGamePassOwnership(userId, gamePassId);
    const status = ownsGamePass === null ? 'Error' : ownsGamePass ? 'Owned' : 'Missing';
    results.push(`${gamePassName} (${gamePassId}): ${status}`);
  }

  return results;
}

// Function to fetch data for a specific clan and user
async function fetchClanData(clanName, userID) {
  try {
    const response = await axios.get(`${clanApiUrl}${clanName}`);
    const clanData = response.data.data;
    const battles = clanData.Battles;
    const results = [];

    // Iterating through each battle
    for (const battleID in battles) {
      const battle = battles[battleID];
      let userPoints = 0;
      let totalBattlePoints = 0;

      // Check if PointContributions is iterable
      if (!Array.isArray(battle.PointContributions)) {
        continue;
      }

      // Iterating through contributions to check for matching IDs
      for (const contribution of battle.PointContributions) {
        totalBattlePoints += contribution.Points;

        let contributionUserID = contribution.UserID.toString();
        if (contributionUserID.startsWith("u")) {
          contributionUserID = contributionUserID.substring(1);
        }

        if (contributionUserID === userID.toString()) {
          userPoints = contribution.Points;
        }
      }

      if (userPoints > 0) {
        let percentage = ((userPoints / totalBattlePoints) * 100).toFixed(2);
        results.push(`Clan ${clanName} - ${battleID}: User Points = ${userPoints}, Total Points = ${totalBattlePoints}, Contribution = ${percentage}%`);
      }
    }

    return results;
  } catch (error) {
    console.error(`Failed to fetch data for clan ${clanName}:`, error);
    return [];
  }
}

// Function to fetch the top 100 clans
async function fetchTopClans() {
  try {
    const response = await axios.get(topClansApiUrl);
    if (response.data && response.data.data) {
      return response.data.data.map(clan => clan.Name);
    } else {
      console.error('Invalid response structure:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch top clans:', error);
    return [];
  }
}

// Function to fetch user details
async function fetchUserDetails(userId) {
  try {
    const response = await axios.get(`${USER_API_BASE}${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch user details for UserID ${userId}:`, error);
    return null; // Return null to indicate an error occurred
  }
}

// Function to investigate user data and send results in Discord
async function investigateUser(userId, message) {
  const statuses = [
    'Investigating user data, please wait.....',
    'Scanning top 100 clans for user point data......',
    'Hatching Titanics......',
    'AFKing in the last zone......',
    'Grinding shiny pets......',
    'Exploring the Deep Backrooms......',
    'Collecting keys to free friends from jail......',
    'Participating in global events......',
    'Trying my luck at the claw machine......',
    'Battling the BOSS in the Backrooms......',
    'Unlocking secret pets......'
  ];

  let statusIndex = 0;
  const statusInterval = setInterval(() => {
    if (statusIndex < statuses.length) {
      message.edit(statuses[statusIndex]);
      statusIndex++;
    }
  }, 5000); // Update status every 5 seconds

  const topClans = await fetchTopClans();
  const finalResults = [];

  for (const clanName of topClans) {
    const results = await fetchClanData(clanName, userId);
    finalResults.push(...results);
    await sleep(600); // Delay of 600 milliseconds to adhere to rate limit (100 requests per minute)
  }

  const gamePassResults = await checkUserGamePasses(userId);
  const userDetails = await fetchUserDetails(userId);

  clearInterval(statusInterval);

  return { finalResults, gamePassResults, userDetails };
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const args = message.content.split(" ");
  const command = args.shift().toLowerCase();

  if (command === '!investigate') {
    const userId = args[0];

    if (!userId) {
      return message.reply('Please provide a user ID.');
    }

    const initialMessage = await message.channel.send('Investigating user data, please wait.....');

    try {
      const { finalResults, gamePassResults, userDetails } = await investigateUser(userId, initialMessage);

      const gamePassEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle(`Game Pass Ownership for ID ${userId}`)
        .addFields(
          { name: 'Username', value: userDetails.name, inline: true },
          { name: 'ID', value: userDetails.id.toString(), inline: true },
          { name: 'Join Date', value: new Date(userDetails.created).toLocaleDateString(), inline: true },
          { name: 'Banned', value: userDetails.isBanned ? 'Yes' : 'No', inline: true },
          { name: 'Game Passes', value: gamePassResults.length > 0 ? gamePassResults.join('\n') : 'No game passes found.' }
        )
        .setTimestamp();

      const clanEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`User Clan Participation for ID ${userId}`)
        .setDescription(finalResults.length > 0 ? finalResults.join('\n') : 'No contributions found.')
        .setTimestamp();

      await initialMessage.edit({ content: 'Investigation complete!', embeds: [gamePassEmbed, clanEmbed] });
    } catch (error) {
      console.error('An error occurred:', error);
      await initialMessage.edit('Failed to fetch user data. Please try again later.');
    }
  }
});

const token = fs.readFileSync('token.txt', 'utf8').trim();
client.login(token);
