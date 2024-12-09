import { Message } from "discord.js";
import { getBonusAuthorData, getTossupAuthorData } from "src/utils/queries";
import { getTable } from "src/utils/table";
import { formatDecimal, formatPercent } from "src/utils";
import { AUTHOR } from "src/constants";

export default async function handleAuthorCommand(message:Message<boolean>) {
    if (message.guildId) {
        const categoryData = getTossupAuthorData(message.guildId!).map(d => Object.values({
            total_questions: String(d.total_questions).padStart(3, ' '),
            total_plays: d.total_plays.toFixed(0).padStart(3, ' '),
            conversion_rate: formatPercent(d.conversion_rate),
            neg_rate: formatPercent(d.neg_rate),
            average_buzz: formatDecimal(d.average_buzz),
            earliest_buzz: d.earliest_buzz,
            author_id: d.author_id
        }));
        const tossupTable = getTable(
            [ 'Total', 'Total Plays', 'Conv. %', 'Neg %', 'Avg. Buzz', 'First Buzz', AUTHOR ],
            categoryData
        );
        const bonusAuthorData = getBonusAuthorData(message.guildId!).map(d => Object.values({
            total_questions: String(d.total_questions).padStart(3, ' '),
            total_plays: d.total_plays.toFixed(0).padStart(3, ' '),
            ppb: formatDecimal(d.ppb).padStart(2, ' '),
            easy_conversion: formatPercent(d.easy_conversion, 2),
            medium_conversion: formatPercent(d.medium_conversion, 2),
            hard_conversion: formatPercent(d.hard_conversion, 2),
            author_id: d.author_id
        }));
        const bonusTable = getTable(
            [ 'Total', 'Total Plays', 'PPB', 'E%', 'M%', 'H%', AUTHOR ],
            bonusAuthorData
        );

        await message.reply(`## Tossups\n${tossupTable}`);
        await message.reply(`## Bonuses\n${bonusTable}`);
    }
}
