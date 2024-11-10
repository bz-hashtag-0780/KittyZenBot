const express = require('express');
const dotenv = require('dotenv');
const { db } = require('./firebase');
dotenv.config();

const app = express();
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
			await playerRef.set({
				playerId,
				currency: 100, // Initial vKITTY amount
				cats: [{ level: 1 }], // Starting with one Level 1 cat
				vKITTY: 0,
			});
			res.status(201).send('New player profile created.');
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
