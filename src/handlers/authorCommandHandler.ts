import { Message } from "discord.js";
import { getBonusAuthorData, getTossupAuthorData } from "src/utils/queries";
import { getTable } from "src/utils/table";
import { formatDecimal, formatPercent } from "src/utils";
import { AUTHOR } from "src/constants";

export default async function handleAuthorCommand(message:Message<boolean>) {
    if (message.guildId) {
        const categoryData = getTossupAuthorData(message.guildId!).map(d => Object.values({
            ...d,
            conversion_rate: formatPercent(d.conversion_rate),
            neg_rate: formatPercent(d.neg_rate),
            average_buzz: formatDecimal(d.average_buzz),
            earliest_buzz: d.earliest_buzz
        }));
        const tossupTable = getTable(
            [ AUTHOR, 'Total', 'Total Plays', 'Conv. %', 'Neg %', 'Avg. Buzz', 'First Buzz'], 
            categoryData
        );
        const bonusAuthorData = getBonusAuthorData(message.guildId!).map(d => Object.values({
            ...d,
            total_plays: d.total_plays.toFixed(0),
            ppb: formatDecimal(d.ppb),
            easy_conversion: formatPercent(d.easy_conversion),
            medium_conversion: formatPercent(d.medium_conversion),
            hard_conversion: formatPercent(d.hard_conversion)
        }));
        const bonusTable = getTable(
            [ AUTHOR, 'Total', 'Total Plays', 'PPB', 'Easy %', 'Medium %', 'Hard %'], 
            bonusAuthorData
        );

        await message.reply(`## Tossups\n${tossupTable}`);
        await message.reply(`## Bonuses\n${bonusTable}`);
    }
}