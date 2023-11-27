import { Message } from "discord.js";
import { getBonusCategoryData, getTossupCategoryData } from "src/utils/queries";
import { getTable } from "src/utils/table";
import { formatDecimal, formatPercent } from "src/utils";
import { CATEGORY } from "src/constants";

export default async function handleCategoryCommand(message:Message<boolean>) {
    if (message.guildId) {
        const rawCategoryData = getTossupCategoryData(message.guildId!);
        const categoryData = rawCategoryData.map(d => Object.values({
            total_questions: String(d.total_questions).padStart(3, '0'),
            total_plays: String(d.total_plays).padStart(3, '0'),
            conversion_rate: formatPercent(d.conversion_rate, 2),
            neg_rate: formatPercent(d.neg_rate, 2),
            average_buzz: formatDecimal(d.average_buzz).padStart(3, '0'),
            earliest_buzz: String(d.earliest_buzz).padStart(3, '0'),
            category: d.category
        }));
        const tossupTable = getTable(
            [ 'Total', 'Total Plays', 'Conv. %', 'Neg %', 'Avg. Buzz', 'First Buzz', CATEGORY ], 
            categoryData
        );
        const bonusCategoryData = getBonusCategoryData(message.guildId!).map(d => Object.values({
            total_questions: String(d.total_questions).padStart(3, '0'),
            total_plays: d.total_plays.toFixed(0).padStart(3, '0'),
            ppb: formatDecimal(d.ppb).padStart(2, '0'),
            easy_conversion: formatPercent(d.easy_conversion, 2),
            medium_conversion: formatPercent(d.medium_conversion, 2),
            hard_conversion: formatPercent(d.hard_conversion, 2),
            category: d.category
        }));
        const bonusTable = getTable(
            [ 'Total', 'Total Plays', 'PPB', 'E%', 'M%', 'H%', CATEGORY], 
            bonusCategoryData
        );

        await message.reply(`## Tossups\n${tossupTable}`);
        await message.reply(`## Bonuses\n${bonusTable}`);
    }
}