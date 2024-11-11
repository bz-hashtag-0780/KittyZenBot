'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const backendUrl = 'https://kittyzen-dfc7b310d5af.herokuapp.com/';

interface Cat {
	level: number;
}

interface PlayerData {
	playerId: string;
	vKITTY: number;
	cats: Cat[];
}

export default function KittyZenPage() {
	const [playerId, setPlayerId] = useState<string>('');
	const [vKITTY, setVKITTY] = useState<number>(0);
	const [cats, setCats] = useState<Cat[]>([]);

	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const id = urlParams.get('playerId') || 'defaultPlayer';
		setPlayerId(id);
		fetchPlayerProfile(id);
	}, []);

	async function fetchPlayerProfile(id: string) {
		try {
			const response = await axios.post<PlayerData>(
				`${backendUrl}/player`,
				{ playerId: id }
			);
			const data = response.data;
			setVKITTY(data.vKITTY);
			setCats(data.cats);
		} catch (error) {
			console.error('Error fetching profile:', error);
		}
	}

	async function handleBuyCat() {
		try {
			const response = await axios.post<{ message: string }>(
				`${backendUrl}/buyCat`,
				{ playerId }
			);
			alert(response.data.message);
			fetchPlayerProfile(playerId);
		} catch (error) {
			console.error('Error buying cat:', error);
		}
	}

	async function handleMergeCats() {
		const catIndex1 = prompt('Enter the index of the first cat to merge:');
		const catIndex2 = prompt('Enter the index of the second cat to merge:');
		try {
			const response = await axios.post<{ message: string }>(
				`${backendUrl}/mergeCats`,
				{
					playerId,
					catIndex1: parseInt(catIndex1 ?? '0'),
					catIndex2: parseInt(catIndex2 ?? '0'),
				}
			);
			alert(response.data.message);
			fetchPlayerProfile(playerId);
		} catch (error) {
			console.error('Error merging cats:', error);
		}
	}

	async function handleDailyReward() {
		try {
			const response = await axios.post<{ message: string }>(
				`${backendUrl}/claimDailyReward`,
				{ playerId }
			);
			alert(response.data.message);
			fetchPlayerProfile(playerId);
		} catch (error) {
			console.error('Error claiming daily reward:', error);
		}
	}

	return (
		<div id="game-container">
			<h1 id="title">🐱 KittyZen 🐱</h1>
			<div className="stats">
				<p>vKITTY: {vKITTY}</p>
				<p>Cats: {cats.length}</p>
			</div>
			<button onClick={handleBuyCat}>Buy Cat</button>
			<button onClick={handleMergeCats}>Merge Cats</button>
			<button onClick={handleDailyReward}>Claim Daily Reward</button>
			<ul id="cat-list">
				{cats.map((cat, index) => (
					<li key={index} className="cat-item cat-animate">
						<p>Cat {index + 1}</p>
						<p>Level {cat.level}</p>
					</li>
				))}
			</ul>
		</div>
	);
}
