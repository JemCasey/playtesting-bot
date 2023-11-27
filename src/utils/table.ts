import { AUTHOR, CATEGORY } from "src/constants";

function getCategoryEmoji(category: string) {
    if (category.includes('Literature'))
        return '📚';
    if (category.includes('History'))
        return '🌍';
    if (category.includes('Biology'))
        return '🧫';
    if (category.includes('Chemistry'))
        return '🧪';
    if (category.includes('Physics'))
        return '⚛';
    if (category.includes('Science'))
        return '🔭';
    if (category.includes('Painting') || category.includes('Visual Art'))
        return '🎨';
    if (category.includes('Classical') || category.includes('Auditory'))
        return '🎼';
    if (category.includes('Other Art'))
        return '🏛';
    if (category.includes('Religion'))
        return '🛐';
    if (category.includes('Mythology'))
        return '👺';
    if (category.includes('Philosophy'))
        return '🚋';
    if (category.includes('Social Science'))
        return '📈';
    if (category.includes('Other Academic'))
        return '📖';
    if (category.includes('Current Events'))
        return '📰';
    
    return '☑';
}

export function getTable(columns: string[], data: any[]) {
    let tableString = '';

    data.forEach(d => {
        for (const [i, val] of d.entries()) {
            if (i > 0)
                tableString += '\t';

            if (columns[i] === CATEGORY)
                tableString += `${getCategoryEmoji(val)} **${val}** `;
            else if (columns[i] === AUTHOR)
                tableString += `**<@${val}>** `;
            else
                tableString += `${columns[i]}: **${val == null || val === '' ? 'N/A' : val}**`;
        }

        tableString += '\n';
    });

    return tableString;
}