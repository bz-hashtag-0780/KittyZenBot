const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
	const chatId = msg.chat.id;
	bot.sendMessage(
		chatId,
		'Welcome to Catizen! Use /profile to view your cat collection and vKITTY balance.'
	);
});

bot.onText(/\/profile/, async (msg) => {
	const chatId = msg.chat.id;
	const playerId = chatId.toString(); // Use chat ID as player ID for simplicity

	try {
		// Send request to backend to fetch player profile
		const response = await axios.post('http://localhost:3000/player', {
			playerId,
		});
		const { currency, cats, vKITTY } = response.data;

		// Format and send profile data to the user
		const profileMessage = `🐱 Catizen Profile 🐱\n\nvKITTY: ${vKITTY}\nCats: ${
			cats.length
		} (Levels: ${cats.map((cat) => cat.level).join(', ')})`;
		bot.sendMessage(chatId, profileMessage);
	} catch (error) {
		bot.sendMessage(
			chatId,
			'Error fetching profile. Please try again later.'
		);
	}
});

bot.onText(/\/merge (\d+) (\d+)/, async (msg, match) => {
	const chatId = msg.chat.id;
	const playerId = chatId.toString();
	const catIndex1 = parseInt(match[1]);
	const catIndex2 = parseInt(match[2]);

	try {
		// Send merge request to backend
		const response = await axios.post('http://localhost:3000/mergeCats', {
			playerId,
			catIndex1,
			catIndex2,
		});

		bot.sendMessage(chatId, response.data.message);
	} catch (error) {
		bot.sendMessage(
			chatId,
			'Error merging cats. Ensure both cats are at the same level.'
		);
	}
});

bot.onText(/\/updateCurrency/, async (msg) => {
	const chatId = msg.chat.id;
	const playerId = chatId.toString();

	try {
		// Request to update currency in the backend
		const response = await axios.post(
			'http://localhost:3000/updateCurrency',
			{ playerId }
		);
		bot.sendMessage(chatId, response.data.message);
	} catch (error) {
		bot.sendMessage(chatId, 'Error updating vKITTY balance.');
	}
});
