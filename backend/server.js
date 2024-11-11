const express = require('express');
const dotenv = require('dotenv');
const { db } = require('./firebase');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cors = require('cors');
dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const app = express();

app.use(
	cors({
		origin: 'https://kitty-zen-bot.vercel.app/',
		methods: ['GET', 'POST', 'PUT', 'DELETE'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	})
);

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

// Endpoint to create or retrieve player profile
app.post('/player', async (req, res) => {
	const { playerId } = req.body;
	try {
		const playerRef = db.collection('players').doc(playerId);
		const doc = await playerRef.get();
		if (!doc.exists) {
			// Initialize new player data
			const newPlayerProfile = {
				playerId,
				currency: 100, // Initial vKITTY amount
				cats: [{ level: 1 }], // Starting with one Level 1 cat
				vKITTY: 0,
			};
			await playerRef.set(newPlayerProfile);
			res.status(201).send(newPlayerProfile);
		} else {
			res.status(200).send(doc.data());
		}
	} catch (error) {
		res.status(500).send(error.message);
	}
});

app.post('/mergeCats', async (req, res) => {
	const { playerId, catIndex1, catIndex2 } = req.body;

	try {
		const playerRef = db.collection('players').doc(playerId);
		const doc = await playerRef.get();

		if (doc.exists) {
			const playerData = doc.data();
			const cats = playerData.cats;

			// Check if both cats are at the same level and merge them
			if (cats[catIndex1].level === cats[catIndex2].level) {
				const newLevel = cats[catIndex1].level + 1;
				cats.splice(catIndex1, 1); // Remove one cat
				cats[catIndex2].level = newLevel; // Upgrade the other

				await playerRef.update({ cats });
				res.status(200).send({
					message: `Cats merged to Level ${newLevel}.`,
				});
			} else {
				res.status(400).send(
					'Cats must be of the same level to merge.'
				);
			}
		} else {
			res.status(404).send('Player not found.');
		}
	} catch (error) {
		res.status(500).send(error.message);
	}
});

app.post('/updateCurrency', async (req, res) => {
	const { playerId } = req.body;

	try {
		const playerRef = db.collection('players').doc(playerId);
		const doc = await playerRef.get();

		if (doc.exists) {
			const playerData = doc.data();
			const cats = playerData.cats;

			// Calculate vKITTY production rate based on cat levels
			const vKITTYRate = cats.reduce((sum, cat) => sum + cat.level, 0);

			// Update player's vKITTY
			await playerRef.update({ vKITTY: playerData.vKITTY + vKITTYRate });
			res.status(200).send({
				message: `vKITTY updated by ${vKITTYRate}.`,
			});
		} else {
			res.status(404).send('Player not found.');
		}
	} catch (error) {
		res.status(500).send(error.message);
	}
});

app.post('/buyCat', async (req, res) => {
	const { playerId } = req.body;
	const catPrice = 3; // Set a fixed price for each new cat

	try {
		const playerRef = db.collection('players').doc(playerId);
		const doc = await playerRef.get();

		if (doc.exists) {
			const playerData = doc.data();
			if (playerData.currency >= catPrice) {
				// Deduct vKITTY for the purchase
				playerData.currency -= catPrice;

				// Add a new Level 1 cat to the player's cats array
				playerData.cats.push({ level: 1 });

				// Update the player document in Firestore
				await playerRef.update({
					currency: playerData.currency,
					cats: playerData.cats,
				});

				res.status(200).send({
					message: `You have purchased a new Level 1 cat!`,
					currency: playerData.currency,
					cats: playerData.cats,
				});
			} else {
				res.status(400).send('Not enough vKITTY to buy a new cat.');
			}
		} else {
			res.status(404).send('Player not found.');
		}
	} catch (error) {
		res.status(500).send(error.message);
	}
});

// bot.onText(/\/start/, (msg) => {
// 	const chatId = msg.chat.id;
// 	bot.sendMessage(
// 		chatId,
// 		'Welcome to Catizen! Use /profile to view your cat collection and vKITTY balance.'
// 	);
// });

bot.onText(/\/start/, (msg) => {
	const chatId = msg.chat.id;
	const gameUrl = `https://kitty-zen-bot.vercel.app/kittyzen?playerId=${chatId}`; // Player ID is passed as a query parameter

	bot.sendMessage(
		chatId,
		"Welcome to KittyZen! Tap 'Play' to start the game:",
		{
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: 'Play KittyZen',
							web_app: { url: gameUrl },
						},
					],
				],
			},
		}
	);
});

bot.onText(/\/profile/, async (msg) => {
	const chatId = msg.chat.id;
	const playerId = chatId.toString(); // Use chat ID as player ID for simplicity

	console.log(`Received /profile command from chatId: ${chatId}`);

	try {
		// Send request to backend to fetch player profile
		const response = await axios.post(`${process.env.HEROKU_URL}/player`, {
			playerId,
		});
		console.log('Received response from backend:', response.data);

		const { currency, cats, vKITTY } = response.data;

		// Format and send profile data to the user
		const profileMessage = `🐱 Catizen Profile 🐱\n\nvKITTY: ${vKITTY}\nCats: ${
			cats.length
		} (Levels: ${cats.map((cat) => cat.level).join(', ')})`;
		bot.sendMessage(chatId, profileMessage);
	} catch (error) {
		console.error('Error fetching profile:', error);
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
		const response = await axios.post(
			`${process.env.HEROKU_URL}/mergeCats`,
			{
				playerId,
				catIndex1,
				catIndex2,
			}
		);

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
			`${process.env.HEROKU_URL}/updateCurrency`,
			{ playerId }
		);
		bot.sendMessage(chatId, response.data.message);
	} catch (error) {
		bot.sendMessage(chatId, 'Error updating vKITTY balance.');
	}
});

bot.onText(/\/buycat/, async (msg) => {
	const chatId = msg.chat.id;
	const playerId = chatId.toString();

	try {
		const response = await axios.post(`${process.env.HEROKU_URL}/buyCat`, {
			playerId,
		});
		bot.sendMessage(chatId, response.data.message);
	} catch (error) {
		bot.sendMessage(chatId, 'Error buying a cat: ' + error.response.data);
	}
});
