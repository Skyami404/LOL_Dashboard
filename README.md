# LoL Esports Dashboard

A fully functioning League of Legends esports dashboard with live updating stats for players, teams, matches, and tournaments.

## Features

- **Players**: View player statistics and performance from wiki pages (auto-updates every 5 minutes)
- **Teams**: Explore team rosters and rankings
- **Matches**: Check live and recent match results from tournament pages
- **Tournaments**: Follow ongoing and upcoming tournaments
- **Live Updates**: Data refreshes automatically from the LoL Esports Wiki

## Data Source

All data is pulled directly from the [League of Legends Esports Wiki](https://lol.fandom.com/wiki/League_of_Legends_Esports_Wiki) using the MediaWiki API. The dashboard auto-updates every 5 minutes to reflect the latest changes on the wiki.

## Getting Started

1. Clone the repository.
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Technologies Used

- Next.js
- TypeScript
- Tailwind CSS
- MediaWiki API (Fandom)
- Tailwind CSS
- Riot Games API

## API Key

To use the Riot Games API, you need to obtain an API key from the [Riot Developer Portal](https://developer.riotgames.com/).

Note: The API key should be kept secure and not committed to version control.