# Playtesting Bot

This is a discord bot that can be used to playtest ACF-style quizbowl questions. After it is invited to a server and configured, it will reply to spoiler-tagged questions with a button to play the question via dm and share playtesters' results in designated channel(s).

The bot can be invited to your server [here](https://discord.com/api/oauth2/authorize?client_id=1128432579436101724&permissions=67584&scope=bot). However, please note this version of **the bot is in alpha and 24/7 availability is not guaranteed**. If this is a concern for your project, you can follow the steps under [Installation for developers](#installation-for-developers) to set up your own instance.

## Configuring the bot
Once you've followed the steps at the link above and the bot has joined your server:
- Give the bot any roles it needs to access your playtesting channels
- Create a channel where the bot can create threads of question results (e.g. `#playtesting-results`)
- Send `!config` in a channel the bot has access to and follow the steps.
- If you would like sensitive data, such as question answers and playtester notes, to be encrypted in the bot's database, please add a role to your server called `secret` before playtesting any questions. **Once created, this role should not be deleted.** Some planned commands that access answer data will not be able to decrypt it if the role is removed or recreated.

## Using the bot (to playtest your question)
- If playtesting a tossup, send it in the following format to one of the configured playtesting channels:
```
||This thinker claimed to see “another universe” upon reading an essay prompt asking whether culture
leads to “the purification of morals.”|| ||This thinker’s story of hunters who defect to pursue a hare inspired
Brian Skyrms’s “stag hunt” game.|| ||This thinker accused David Hume of plotting against him while Hume
sheltered him during the fallout over one of his books,|| ||which notes that those who “refuse” to join the “whole
body” will be “forced to be free.”|| ||This thinker defined amour-propre and amour de soi|| ||in a book that traces
civil society to the first man who “enclosed a piece of ground” and declared, “This is mine.”|| ||This thinker theorized
the “general will”|| ||in a book that claims man is “everywhere… in chains.”|| ||For 10 points, name this author of
Discourse on Inequality and The Social Contract.||
ANSWER: ||Jean-Jacques Rousseau||
<||Philosophy||, JB>
```
- If playtesting a bonus, send it in the following format:
```
This author’s daughter Susan protested declining biodiversity in essays like “Lament for the Birds” and her
“nature diary” Rural Hours. For 10 points each:
[10||h||] Name this author of a novel whose protagonist decries the “wasty ways” of the townsfolk of Templeton, who
massacre thousands of passenger pigeons and leave piles of fish rotting on the shores of Lake Otsego.
ANSWER: ||James Fenimore Cooper||
[10||e||] ||Cooper presented his early preservationist views via the character of Natty Bumppo in works like The
Pioneers and this novel. Chingachgook, who is the title character of this novel, escorts Colonel Munro’s daughters.||
ANSWER: ||The Last of the Mohicans||
[10||m||] ||In The Pioneers, Natty is arrested for performing this action after Templeton adopts anti-waste laws. Natty’s
rifle is nicknamed for this action, which titles the chronologically first Leatherstocking Tale.||
ANSWER: ||killing a deer [accept any synonyms in place of “killing,” such as hunting or shooting; accept Killdeer
or The Deerslayer; prompt on partial answers]||
<||American Literature||, JB>
```
- As of now, messages should only contain one question; if you're playtesting a batch of questions, please send them one by one.

## Using the bot (to playtest a question)
- Click the "Play Tossup" or "Play Bonus" button provided by the bot
- Look for a DM from the bot. Use the keyboard commands described by the bot to interact with the question.
- When you're done, your result will be shared in a thread in any designated playtesting results channels.

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