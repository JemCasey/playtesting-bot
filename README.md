# Playtesting Bot

This is a discord bot that can be used to playtest ACF-style quizbowl questions. After it is invited to a server and configured, it will reply to spoiler-tagged questions with a button to play the question via dm and share playtesters' results in designated channel(s).

The bot can be invited to your server [here](https://discord.com/api/oauth2/authorize?client_id=1128432579436101724&permissions=67584&scope=bot). However, please note this version of **the bot is in alpha and 24/7 availability is not guaranteed**. Secondly, note that **while the bot does not store question content, it does maintain some question conversion data and player notes**, which are not encrypted as of now. Only I have access to this data and will never access it without permission. However, if these are concerns for your project you can follow the steps under [Installation for developers](#installation-for-developers) to set up your own instance.

## Configuring the bot
Once you've followed the steps at the link above and the bot has joined your server:
- Give the bot any roles it needs to access your playtesting channels
- Create a channel where the bot can create threads of question results (e.g. `#playtesting-results`)
- Send `!config` in a channel the bot has access to and follow the steps.
 
## Installation for developers
You will need to have [Node](https://nodejs.org/en/download) installed.
- Clone the repository
- Run `npm install`
- Run `npm run initDB`
- Visit the Discord Developer Portal and create a bot
- In the portal, copy your bot's token and application id. Create a file called `.env` in the repo's root directory and add those keys in the following format:
```env
DISCORD_TOKEN=[token goes here]
DISCORD_APPLICATION_ID=[application id goes here]
```
- Launch a dev build of your bot by running `npm run dev`, or create and run a production build by running `npm run build` and `npm run start`
- To add your bot to a server, visit `https://discord.com/api/oauth2/authorize?client_id=[application id goes here]&permissions=67584&scope=bot` or share the link with an admin of your playtesting server. Then, you can follow steps above [Configuring the bot](#configuring-the-bot)

## License

[ISC](https://choosealicense.com/licenses/isc/)