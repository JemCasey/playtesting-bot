import { Message } from "discord.js";
import { SECRET_ROLE } from "src/constants";
import { saveServerChannelsFromMessage } from "src/utils";

export default async function handleConfig(message:Message<boolean>) {
    await message.channel.send('Please list any channels that will be used for playtesting in a message of the format `#playtesting-channel / #playtesting-results-channel #playtesting-channel-2 / #playtesting-results-channel-2`. NOTE: multiple playtesting channels can share a playtesting-results-channel');

    try {
        let filter = (m: Message<boolean>) => m.author.id === message.author.id
        let collected = await message.channel.awaitMessages({
            filter,
            max: 1
        });

        saveServerChannelsFromMessage(collected, message.guild!);

        await message.channel.send('Configuration saved successfully.');
        await message.channel.send(`If you would like question answers and player notes to be encrypted in the bot's database, please create a role called \`${SECRET_ROLE}\`.`);
    } catch {
        await message.channel.send("An error occurred, please try again");
    }
}