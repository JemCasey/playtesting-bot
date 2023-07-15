import { Message } from "discord.js";
import { ServerChannelType, saveServerChannelsFromMessage } from "src/utils";

export default async function handleConfig(message:Message<boolean>) {
    message.channel.send('Please list any channels that will be used for playtesting in a message of the format `#playtesting-channel #playtesting-channel-2`');

    try {
        let filter = (m: Message<boolean>) => m.author.id === message.author.id
        let collected = await message.channel.awaitMessages({
            filter,
            max: 1
        });

        saveServerChannelsFromMessage(collected, message.guild!, ServerChannelType.Playtesting);

        message.channel.send('Please list any channels where playtesting results should be sent in a message of the format `#playtesting-results`');
        collected = await message.channel.awaitMessages({
            filter,
            max: 1
        });

        saveServerChannelsFromMessage(collected, message.guild!, ServerChannelType.Results);
        message.channel.send('Configuration saved successfully.');
    } catch {
        message.channel.send("An error occurred, please try again");
    }
}