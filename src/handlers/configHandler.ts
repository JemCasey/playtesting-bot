import { Message } from "discord.js";
import { SECRET_ROLE } from "src/constants";
import { ServerChannelType, saveServerChannelsFromMessage } from "src/utils";

export default async function handleConfig(message:Message<boolean>) {
    await message.channel.send('Please list any channels that will be used for playtesting in a message of the format `#playtesting-channel #playtesting-channel-2`');

    try {
        let filter = (m: Message<boolean>) => m.author.id === message.author.id
        let collected = await message.channel.awaitMessages({
            filter,
            max: 1
        });

        saveServerChannelsFromMessage(collected, message.guild!, ServerChannelType.Playtesting);

        await message.channel.send('Please indicate the channel where playtesting results should be sent in a message of the format `#playtesting-results`. Only one results channel can be specified for now.');
        collected = await message.channel.awaitMessages({
            filter,
            max: 1
        });

        saveServerChannelsFromMessage(collected, message.guild!, ServerChannelType.Results);
        await message.channel.send('Configuration saved successfully.');
        await message.channel.send(`If you would like question answers and player notes to be encrypted in the bot's database, please create a role called \`${SECRET_ROLE}\`.`);
    } catch {
        await message.channel.send("An error occurred, please try again");
    }
}