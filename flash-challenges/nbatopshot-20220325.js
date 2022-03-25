const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const _ = require('lodash')

const DATE_1 = '20220325'

const FRIDAY_IDS = [
  '0022101100',
  '0022101101',
  '0022101102',
  '0022101103',
  '0022101104',
  '0022101105',
  '0022101106'
]

const COMMENT_ID = 'i249q32'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders } = sortServices;
  const { standingsByAttribute } = standingsServices;

  const FRIDAY_URLS = apiServices.generateBoxScoreUrls(FRIDAY_IDS, DATE_1);

  const {results:fridayResults, remainingGames: fridayRemainingGames} = await fetchGameResults(FRIDAY_URLS)

  const fridayPlayers = fridayResults.flat();
  const allPlayersRookie = fridayPlayers
  const sortedRookie = sortPlayersByAttribute(_.clone(allPlayersRookie), 'pointRebAst');
  const fridayOngoingLeaders = _.clone(sortedRookie).filter(x=>!x.isSeasonMatch && !x.isPointMatch && !x.isRebAstMatch && !x.gameOver)

  const seasonMatchVet = _.clone(allPlayersRookie).filter(x => x.isSeasonMatch)
  const scorersVet = _.clone(allPlayersRookie).filter(x => x.isPointMatch)
  const rebAstVet = _.clone(allPlayersRookie).filter(x => x.isRebAstMatch)

  const markdown = [
    `# Season Match Flash Challenge`,
    `## Season Match Leaders (Rookie/Hero)`,
    ...standingsByAttribute(sortedRookie, 'pointRebAst', {dividers: [4], limit: 7} ),
    `## Season Match Leaders (Vet)`,
    `### Season Matchers - R/L`,
    ...standingsByAttribute(seasonMatchVet, 'pointRebAst', {hasThreshold: false, hasDividers: false} ),
    `### Points Matcher - S1/S2`,
    ...standingsByAttribute(scorersVet, 'points', {hasThreshold: false, hasDividers: false} ),
    `### RebAsts Matcher - S1/S2`,
    ...standingsByAttribute(rebAstVet, 'rebAst', {hasThreshold: false, hasDividers: false} ),
    `### Ongoing`,
    ...standingsByAttribute(fridayOngoingLeaders, 'pointRebAst', {limit: 6} ),
    `There are ${fridayRemainingGames} games that have not started yet.`,
    `**Update: ${new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"})} PST**`,
    `**Bolded players** are done for the challenge`,
    `[Numbers] in bracket show time left in regulation for the game`,
    `Tiebreakers: Team Margin / Player's ± / Minutes Played`,
  ].join("\n\n")

  console.clear()
  console.log(markdown)

  redditBot.getComment(COMMENT_ID).edit(markdown)

}

setInterval(runFunction, 30000)
// runFunction()