import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message } from "discord.js";
import { BONUS_REGEX, TOSSUP_REGEX } from "src/constants";
import { ServerChannelType, getServerChannels } from "src/utils";

export default async function handleNewQuestion(message:Message<boolean>) {
    const bonusMatch = message.content.match(BONUS_REGEX);
    const tossupMatch = message.content.match(TOSSUP_REGEX);
    const playtestingChannels = getServerChannels(message.guild!.id, ServerChannelType.Playtesting);

    if (playtestingChannels.find(c => c.channel_id === message.channel.id) && (bonusMatch || tossupMatch)) {
        const buttonLabel = 'Play ' + (bonusMatch ? "Bonus" : "Tossup");
        const button = new ButtonBuilder()
            .setStyle(ButtonStyle.Primary)
            .setLabel(buttonLabel)
            .setCustomId('play_question');

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
        await message.reply({ components: [row] });
    }
}