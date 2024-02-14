import Database from 'better-sqlite3';

const db = new Database('database.db');

const tossupCategoryDataQuery = db.prepare(`
SELECT COALESCE(category, 'Unknown') category, 
count(distinct tossup.question_id) AS total_questions,
count(distinct buzz.id) AS total_plays,
cast(sum(iif(buzz.value > 0, 1, 0)) AS FLOAT) / count(distinct buzz.id) AS conversion_rate,
cast(sum(iif(buzz.value < 0, 1, 0)) AS FLOAT) / count(distinct buzz.id) AS neg_rate,
avg(iif(buzz.value > 0, buzz.characters_revealed, NULL)) AS average_buzz,
min(iif(buzz.value > 0, buzz.characters_revealed, NULL)) AS earliest_buzz
FROM tossup
JOIN buzz ON tossup.question_id = buzz.question_id
WHERE tossup.server_id = ?
GROUP BY category
ORDER BY count(distinct tossup.question_id) DESC`);

const bonusCategoryDataQuery = db.prepare(`
SELECT COALESCE(category, 'Unknown') category, 
count(distinct bonus.question_id) AS total_questions,
cast(count(distinct bonus_direct.id) as float) / 3 AS total_plays,
cast(sum(bonus_direct.value) AS FLOAT) / (cast(count(distinct bonus_direct.id) as FLOAT) / 3) AS ppb,
cast(sum(iif(bonus_part.difficulty = 'e' and bonus_direct.value > 0, 1, 0)) AS FLOAT) / sum(iif(bonus_part.difficulty = 'e', 1, 0)) AS easy_conversion,
cast(sum(iif(bonus_part.difficulty = 'm' and bonus_direct.value > 0, 1, 0)) AS FLOAT) / sum(iif(bonus_part.difficulty = 'm', 1, 0)) AS medium_conversion,
cast(sum(iif(bonus_part.difficulty = 'h' and bonus_direct.value > 0, 1, 0)) AS FLOAT) / sum(iif(bonus_part.difficulty = 'h', 1, 0)) AS hard_conversion
FROM bonus
JOIN bonus_direct ON bonus.question_id = bonus_direct.question_id
JOIN bonus_part ON bonus_direct.question_id = bonus_part.question_id AND bonus_direct.part = bonus_part.part
WHERE bonus.server_id = ?
GROUP BY category
ORDER BY count(distinct bonus.question_id) DESC
`);

const tossupAuthorDataQuery = db.prepare(`
SELECT tossup.author_id, 
count(distinct tossup.question_id) AS total_questions,
count(distinct buzz.id) AS total_plays,
cast(sum(iif(buzz.value > 0, 1, 0)) AS FLOAT) / count(distinct buzz.id) AS conversion_rate,
cast(sum(iif(buzz.value < 0, 1, 0)) AS FLOAT) / count(distinct buzz.id) AS neg_rate,
avg(iif(buzz.value > 0, buzz.characters_revealed, NULL)) AS average_buzz,
min(iif(buzz.value > 0, buzz.characters_revealed, NULL)) AS earliest_buzz
FROM tossup
JOIN buzz ON tossup.question_id = buzz.question_id
WHERE tossup.server_id = ?
GROUP BY tossup.author_id
ORDER BY count(distinct tossup.question_id) DESC`);

const bonusAuthorDataQuery = db.prepare(`
SELECT bonus.author_id, 
count(distinct bonus.question_id) AS total_questions,
cast(count(distinct bonus_direct.id) as FLOAT) / 3 AS total_plays,
cast(sum(bonus_direct.value) AS FLOAT) / (cast(count(distinct bonus_direct.id) as FLOAT) / 3) AS ppb,
cast(sum(iif(bonus_part.difficulty = 'e' and bonus_direct.value > 0, 1, 0)) AS FLOAT) / sum(iif(bonus_part.difficulty = 'e', 1, 0)) AS easy_conversion,
cast(sum(iif(bonus_part.difficulty = 'm' and bonus_direct.value > 0, 1, 0)) AS FLOAT) / sum(iif(bonus_part.difficulty = 'm', 1, 0)) AS medium_conversion,
cast(sum(iif(bonus_part.difficulty = 'h' and bonus_direct.value > 0, 1, 0)) AS FLOAT) / sum(iif(bonus_part.difficulty = 'h', 1, 0)) AS hard_conversion
FROM bonus
JOIN bonus_direct ON bonus.question_id = bonus_direct.question_id
JOIN bonus_part ON bonus_direct.question_id = bonus_part.question_id AND bonus_direct.part = bonus_part.part
WHERE bonus.server_id = ?
GROUP BY bonus.author_id
ORDER BY count(distinct bonus.question_id) DESC
`);

const getBonusSummaryQuery = db.prepare(`
SELECT bonus.question_id,
cast(count(distinct bonus_direct.id) as FLOAT) / 3 AS total_plays,
cast(sum(bonus_direct.value) AS FLOAT) / (cast(count(distinct bonus_direct.id) as FLOAT) / 3) AS ppb,
cast(sum(iif(bonus_part.difficulty = 'e' and bonus_direct.value > 0, 1, 0)) AS FLOAT) / sum(iif(bonus_part.difficulty = 'e', 1, 0)) AS easy_conversion,
cast(sum(iif(bonus_part.difficulty = 'm' and bonus_direct.value > 0, 1, 0)) AS FLOAT) / sum(iif(bonus_part.difficulty = 'm', 1, 0)) AS medium_conversion,
cast(sum(iif(bonus_part.difficulty = 'h' and bonus_direct.value > 0, 1, 0)) AS FLOAT) / sum(iif(bonus_part.difficulty = 'h', 1, 0)) AS hard_conversion
FROM bonus
JOIN bonus_direct ON bonus.question_id = bonus_direct.question_id
JOIN bonus_part ON bonus_direct.question_id = bonus_part.question_id AND bonus_direct.part = bonus_part.part
WHERE bonus.question_id = ?
GROUP BY bonus.question_id
`);

export function getTossupCategoryData(serverId: string):any[] {
    return tossupCategoryDataQuery.all(serverId) as any[];
}

export function getBonusCategoryData(serverId: string):any[] {
    return bonusCategoryDataQuery.all(serverId) as any[];
}

export function getTossupAuthorData(serverId: string):any[] {
    return tossupAuthorDataQuery.all(serverId) as any[];
}

export function getBonusAuthorData(serverId: string):any[] {
    return bonusAuthorDataQuery.all(serverId) as any[];
}

export function getBonusSummaryData(questionId: string):any {
    return getBonusSummaryQuery.get(questionId) as any;
}