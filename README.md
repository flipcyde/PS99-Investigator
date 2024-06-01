
# Pet Simulator 99 Investigation Bot

## Overview
The Pet Simulator 99 Investigation Bot is a Discord bot designed to fetch and display detailed information about a Roblox user's participation in Pet Simulator 99 clans and their game pass ownership. It enhances the user experience by providing engaging status updates while processing requests.

## Features
- **Investigate User Data**: Fetches and displays user participation in the top 100 Pet Simulator 99 clans.
- **Game Pass Ownership**: Retrieves and displays the game passes owned by the specified Roblox user.
- **Dynamic Status Updates**: Provides fun, themed status updates while fetching data.
- **Discord Integration**: Uses normal Discord commands for user interaction.

## Commands
- `!investigate <userid>`: Investigate the specified user's clan participation and game pass ownership.

## Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/flipcyde/PS99-Investigator.git
   cd Investigation-Bot
   ```

2. **Install Dependencies**
   ```bash
   npm install discord.js axios fs path url
   ```

3. **Create Required Files**
   - `token.txt`: Your Discord bot token.
   - `GamepassCache.json`: Cache file for game passes (sample format below).

4. **Run the Bot**
   ```bash
   node your-script-file.js
   ```

## GamepassCache.json Sample Format
```json
{
  "gamePassId1": "Game Pass Name 1",
  "gamePassId2": "Game Pass Name 2"
}
```

## Bot Usage

1. **Start the Bot**
   ```bash
   node your-script-file.js
   ```

2. **Use the Command in Discord**
   - Type `!investigate <userid>` in a Discord channel where the bot is present.
   - The bot will respond with dynamic status updates while it fetches the data.
   - Once the data is fetched, it will display the user's clan participation and game pass ownership.

## Example
![image](https://github.com/flipcyde/PS99-Investigator/assets/39178036/0e9e1060-4fd1-40cc-a6a3-62eb484fcd53)


## Contributing
Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License
This project is licensed under the MIT License.
