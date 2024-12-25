# Playtesting Bot

This is a Discord bot that can be used to playtest ACF-style quizbowl questions. After the bot is invited to a server and configured, it can be used for either or both of two situations:

* Internal "**asynchronous**" playtesting (question-by-question)
  * As questions are written and edited, they can be playtested internally by other members of the editing team. This occurs asynchronously, with each member playing the question individually.
  * In this situation, editors play questions via DMs with the bot. Each question can be discussed in an associated thread. The results are published to a new thread in another channel.
* External "**bulk**" playtesting (packet-by-packet or category-by-category)
  * Once a set reaches the stage at which packets are being assembled, packets can be playtested as a whole with a troupe of playtesters who are not on the editing team. This occurs in "bulk," with the troupe at once hearing all of the questions in a given packet being read over audio.
  * In this situation, playtesters give answers in a bulk playtesting channel. Playtesters use reactions to indicate their results for each question (e.g. "10"/"0" for tossups; "E"/"M"/"H" for bonuses). Each question can be discussed in an associated thread.

The bot was created by Jordan Brownstein in 2023 for the production of 2024 Chicago Open. Jordan wrote the bulk of the code, and in 2024 Ani Perumalla added a few new features for the production of 2025 ACF Regionals. Ophir Lifshitz designed the bulk playtesting react emojis and provided suggestions and feedback on features.

## Instructions for Users

These instructions have been split based on whether you are a manager for the bot or whether you are just an editor in the production server. Bot managers must configure the bot before it may be used by editors and playtesters.

### Instructions for Bot Managers

#### Configuration

Use [this invite link](https://discord.com/api/oauth2/authorize?client_id=1128432579436101724&permissions=67584&scope=bot) to add the default instance of the bot (**Botticelli**) to your server.

> [!IMPORTANT]
> Botticelli is **in alpha and 24/7 availability is not guaranteed**. If this is a concern for your project, you can follow the steps under [Instruction for Developers](#instructions-for-developers) to set up your own instance.

> [!TIP]
> It is strongly recommended that you use the [ACF Production Server Template](https://discord.new/ps5S8Bsxwfra) [^1] for your production/playtesting server. The bot has been extensively tested in that framework, and using it will save you the significant amount of time necessary to set up all the necessary roles, permissions, and channels.

Once added to the server, follow the instructions below to configure the bot:

* Give the bot any roles it needs to access the playtesting channels. If you use the ACF Production Server Template, just give it the `Bot` role.
* To prepare for asynchronous playtesting:
  * Create channel(s) where the bot can access questions for async playtesting (e.g. `#literature`, `#arts`).
  * Create channel(s) where the bot can produce the results of playtesting (e.g. `#results`).
* To prepare for bulk playtesting:
  * Create channel(s) where the bot can access questions for bulk playtesting (e.g. `#playtesting`).
  * Create a channel where the bot can "echo" question metadata (e.g. `#questions`). This channel will serve as an index for anyone to easily find each question's discussion thread.
* The above steps are already completed if you use the ACF Production Server Template.
* Send `!config` in a channel to which the bot has access (e.g. `#bots`). **You must follow all necessary steps.**

> [!IMPORTANT]
> If you would like sensitive data, such as question answers and playtester notes, to be encrypted in the bot's database, please add a role to your server called `secret` before playtesting any questions. **Once created, this role should not be deleted.** Some planned commands that access answer data will not be able to decrypt it if the role is removed or recreated.

### Instructions for Editors

#### Formatting

To set up a question for playtesting through the bot, add spoiler marks as per the examples below for [tossups](#tossup-formatting) and [bonuses](#bonus-formatting) and paste the content in the desired channel.

> [!TIP]
> Add `!t` somewhere in the question message if you want the bot to auto-create a discussion thread (this is recommended). If triggered via this command, the bot will automatically parse the category and add users with the corresponding role to the thread.

> [!TIP]
> It is strongly recommended that users of Google Docs use the [Paster Dingus](https://minkowski.space/quizbowl/paster/). This tool converts the content of a Google Docs question to the spoiler-tagged Discord Markdown version expected by the bot. Copy the question from Google Docs and paste into the tool's left panel; the formatted version will appear on the right panel. Tick the checkbox to add spoiler marks and the auto-thread command.

> [!NOTE]
> Messages should only contain one question; if you're playtesting a batch of questions, send them one by one.

##### Tossup Formatting

<code>\*\*||This thinker claimed to see “another universe” upon reading an essay prompt asking whether culture leads to “the purification of morals.”|| ||This thinker’s story of hunters who defect to pursue a hare inspired Brian Skyrms’s “stag hunt” game.|| ||This thinker accused David Hume of plotting against him while Hume sheltered him during the fallout over one of his books,|| ||which notes that those who “refuse” to join the “whole body” will be “forced to be free.”|| ||This thinker defined (\*)||\*\* ||\_amour-propre\_ and \_amour de soi\_|| ||in a book that traces civil society to the first man who “enclosed a piece of ground” and declared, “This is mine.”|| ||This thinker theorized the “general will”|| ||in a book that claims man is “everywhere… in chains.”|| ||For 10 points, name this author of \_Discourse on Inequality\_ and \_The Social Contract\_.||
ANSWER: ||Jean-Jacques \_\_\*\*Rousseau\*\*\_\_||
\<JB\, Philosophy\>
!t</code>

##### Bonus Formatting

<code>This author’s daughter Susan protested declining biodiversity in essays like “Lament for the Birds” and her “nature diary” \_Rural Hours\_. For 10 points each:
[10] Name this author of a novel whose protagonist decries the “wasty ways” of the townsfolk of Templeton, who massacre thousands of passenger pigeons and leave piles of fish rotting on the shores of Lake Otsego.
ANSWER: ||James Fenimore \_\_\*\*Cooper\*\*\_\_||
[10] ||Cooper presented his early preservationist views via the character of Natty Bumppo in works like \_The Pioneers\_ and this novel. Chingachgook, who is the title character of this novel, escorts Colonel Munro’s daughters.||
ANSWER: ||\_The\_\_\*\*Last of the Mohicans\*\*\_\_\_||
[10] ||In \_The Pioneers\_, Natty is arrested for performing this action after Templeton adopts anti-waste laws. Natty’s rifle is nicknamed for this action, which titles the chronologically first Leatherstocking Tale.||
ANSWER: ||\_\_\*\*kill\*\*\_\_ing a \_\_\*\*deer\*\*\_\_ [accept any synonyms in place of “killing,” such as \_\_\*\*hunt\*\*\_\_ing or \_\_\*\*shoot\*\*\_\_ing; accept \_\_\*\*Killdeer\*\*\_\_ or \_The \_\_\*\*Deerslay\*\*\_\_er\_; prompt on partial answers]||
\<JB\, American Literature\>
||h/e/m||
!t</code>

> [!TIP]
> The formatting style seen above is the default output style used by the [Paster Dingus](https://minkowski.space/quizbowl/paster/). An alternative style is to add the difficulty marks inside each `[10]` tag in the form `10||h||`.

#### Asynchronous Playtesting

To play [an asynchronous question that has been detected by the bot](./examples/async-question.png):

* Click the `Play Tossup` or `Play Bonus` button in the bot's reply to the question.
* Look for a DM from the bot. Use the keyboard commands provided by the bot to interact with the question.
* When you're done, your results will be shared in [a thread in the designated playtesting results channel](./examples/async-results.png).

#### Bulk Playtesting

* To begin reading a packet (e.g. `Packet A`), send the message `!read A` or `!packet A` or `!round A`. [^2]
* [For each question in the packet to be playtested](./examples/bulk.png), paste the spoiler-tagged question in any of the bulk playtesting channels. Just like in asynchronous playtesting, adding `!t` to the question content will auto-create a discussion thread.
  * The bot will auto-react to the question message with a set of reacts depending on if it's a tossup or bonus:
    * Tossups
      * 15 points - `:tossup_15:` (if the tossup is powermarked with `(*)`)
      * 10 points - `:tossup_10:`
      * -5 points - `:tossup_neg5:`
      * DNC (did not convert) - `:tossup_DNC:`
    * Bonuses
      * Easy part - `:bonus_E:`
      * Medium part - `:bonus_M:`
      * Hard part - `:bonus_H:`
      * 0 points - `:bonus_0:`
      * Note that the bot will auto-order the bonus reacts based on the order of the bonus difficulties.
  * If configured, [the bot will send a link to the question in the echo channel](./examples/echo.png).
  * The bot will automatically parse the category and add users with the corresponding role to the thread.
* At any time, send the message `!packet` or `!round` to print the current packet name.
* At any time, send the message `!tally` or `!count` to automatically tally the reacts to each question in the current packet and publish the counts to the echo channel.
  * To tally reacts for any specific packet (e.g. `Packet A`), send the message `!tally A` or `!count A`.
* To finish the packet, send the message `!end`. This will tally reacts for the current packet and then reset the packet name.
* To reset the packet name, send the message `!packet reset` or `!packet clear`.

## Instructions for Developers

As [mentioned above](#configuration), there is already an instance of the bot that is ready to use. If you want to create and run your own instance of the bot, execute the following instructions.

### Prerequisites

* [Node v. 23+](https://nodejs.org/en/download)
* Clone this repository.

### Creating Your Bot

* Visit the [Discord Developer Application Portal](https://discord.com/developers/applications) and create a bot by clicking the `New Application` button.
* In the portal, take note of your bot's token and application ID by going to the `OAuth2` panel. The token is called the "Client Secret" and the application ID is called the "Client ID."
* Create a file called `.env` in your local clone's root directory.
* Add the token and application ID to `.env` in the following format:

  ```env
  DISCORD_TOKEN=[Your Token]
  DISCORD_APPLICATION_ID=[Your Application ID]
  ```

* Go to the `Bot` panel and check the boxes for `Presence Intent`, `Server Members Intent`, and `Message Content Intent`. These are required for the bot to receive information about messages and members of each server.
* Go to the `Emojis` panel and upload all of the emojis in the [`react_emojis` zip file](./react_emojis.zip) to your bot.

### Running Your Bot

* In your local clone's main directory, open a Bash terminal (not Command Prompt) and run:

  ```bash
  $ npm install
  $ npm run initDB
  ```

  * `initDB` is a script that creates a local database to store the information for each server and the text of all asynchronously playtested questions in each server. See [`init-schema.ts`](/src/init-schema.ts) for more details.

* To run a dev build of your bot:

  ```bash
  $ npm run dev
  ```

  * If successful, the terminal screen will be cleared of content and will print `Logged in as [Your Bot's Discord Username]`.

> [!NOTE]
> Note that in dev mode, the bot is capable of "hot-reload." If you edit the code, no need to restart the run for the changes to take effect; just saving is enough.

* To run a production build of your bot:

  ```bash
  $ npm run build
  $ npm run start
  ```

### Using Your Bot

* The invite URL for your bot is of the format below [^3]:

  ```none
  https://discord.com/api/oauth2/authorize?client_id=[Bot Application ID]&permissions=9122779245632&scope=bot
  ```

* Any admin of your playtesting server can invite the bot to the server using the above link.
* Follow the steps in [Instructions for Users](#instructions-for-users) to configure and use the bot.

## License

[ISC](https://choosealicense.com/licenses/isc/)

[^1]: The ACF Production Server Template was created in 2024 by Ani Perumalla for the production of 2025 ACF Regionals.

[^2]: The packet name length is restricted to at most 2 characters.

[^3]: The permissions integer `9122779245632` in the URL is based on the permissions that the bot should need to run properly. If you encounter any problems, try re-adding the bot to the server using the same URL but with the integer replaced with `8` (the administrator integer).
