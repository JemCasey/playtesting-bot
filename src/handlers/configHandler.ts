import { Message, TextChannel } from "discord.js";
import { SECRET_ROLE } from "src/constants";
import { saveAsyncServerChannelsFromMessage, saveBulkServerChannelsFromMessage, deleteServerChannelsCommand } from "src/utils";

export default async function handleConfig(message:Message<boolean>) {
    const msgChannel = ( await message.channel.fetch() as TextChannel );

    await msgChannel.send('First, configure the channels used for internal, asynchronous playtesting - where the results should be saved to a separate channel.');
    await msgChannel.send('List these channels in the form: `#playtesting-channel/#playtesting-results-channel #playtesting-channel-2/#playtesting-results-channel-2`.');
    await msgChannel.send('Make sure to add exactly one space between each set of playtesting and results channels. Note: Multiple playtesting channels can share a `playtesting-results-channel`.');

    try {
        let filter = (m: Message<boolean>) => m.author.id === message.author.id
        let collected = await msgChannel.awaitMessages({
            filter,
            max: 1
        });

        deleteServerChannelsCommand.run(message.guild!.id);

        saveAsyncServerChannelsFromMessage(collected, message.guild!);

        await msgChannel.send('Configuration saved successfully.');
        await msgChannel.send(`If you would like question answers and player notes to be encrypted in the bot's database, please create a role called \`${SECRET_ROLE}\`.`);

        await msgChannel.send('Now, list the channels used for bulk playtesting - where playtesters will use reactions to indicate their results.');
        await msgChannel.send('List these channels in the form: `#playtesting-channel #playtesting-channel-2`.');
        await msgChannel.send('Do not repeat any channels from asynchronous playtesting. Make sure to add exactly one space between set of playtesting channels.');

        try {
            let filter = (m: Message<boolean>) => m.author.id === message.author.id
            let collected = await msgChannel.awaitMessages({
                filter,
                max: 1
            });

            saveBulkServerChannelsFromMessage(collected, message.guild!);

            await msgChannel.send('Configuration saved successfully.');
        } catch {
            await msgChannel.send("An error occurred, please try again.");
        }
    } catch {
        await msgChannel.send("An error occurred, please try again.");
    }
}
