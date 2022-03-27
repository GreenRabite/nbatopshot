const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const _ = require('lodash')

const DATE_1 = '20220325'
const DATE_2 = '20220326'
const DATE_3 = '20220327'

const FRIDAY_IDS = [
  '0022101100',
  '0022101101',
  '0022101102',
  '0022101103',
  '0022101104',
  '0022101105',
  '0022101106'
]

const SATURDAY_IDS = [
  '0022101107',
  '0022101108',
  '0022101109',
  '0022101110',
  '0022101111',
  '0022101112',
  '0022101113',
  '0022101114'
]

const SUNDAY_IDS = [
  '0022101115',
  '0022101116',
  '0022101117',
  '0022101118',
  '0022101119',
  '0022101120',
  '0022101121'
]

const COMMENT_ID = 'i249q32'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders } = sortServices;
  const { standingsByAttribute } = standingsServices;

  const FRIDAY_URLS = apiServices.generateBoxScoreUrls(FRIDAY_IDS, DATE_1);
  const SATURDAY_URLS = apiServices.generateBoxScoreUrls(SATURDAY_IDS, DATE_2);
  const SUNDAY_URLS = apiServices.generateBoxScoreUrls(SUNDAY_IDS, DATE_3);

  const {results:fridayResults, remainingGames: fridayRemainingGames} = await fetchGameResults(FRIDAY_URLS)
  const {results:saturdayResults, remainingGames: saturdayRemainingGames} = await fetchGameResults(SATURDAY_URLS)
  const {results:sundayResults, remainingGames: sundayRemainingGames} = await fetchGameResults(SUNDAY_URLS)

  const fridayPlayers = fridayResults.flat();
  const saturdayPlayers = saturdayResults.flat();
  const sundayPlayers = sundayResults.flat();
  const allPlayersRookie = [...fridayPlayers, ...saturdayPlayers, ...sundayPlayers]
  const sortedRookie = sortPlayersByAttribute(_.clone(allPlayersRookie), 'pointRebAst');

  const onGoingSortedRookie = sortPlayersByAttribute(_.clone(allPlayersRookie), 'offTracker');
  const ongoingLeaders = _.clone(onGoingSortedRookie).filter(x=>!x.isSeasonMatch && !x.isPointMatch && !x.isRebAstMatch && !x.gameOver)

  const seasonMatchVet = _.clone(sortedRookie).filter(x => x.isSeasonMatch)
  const scorersVet = _.clone(sortedRookie).filter(x => x.isPointMatch)
  const rebAstVet = _.clone(sortedRookie).filter(x => x.isRebAstMatch)

  const markdown = [
    `# Season Match Flash Challenge`,
    `## Season Match Leaders (Rookie/Hero)`,
    ...standingsByAttribute(sortedRookie, 'pointRebAst', {dividers: [4], limit: 7, showTeams: true} ),
    `## Season Match Leaders (Vet)`,
    `### Season Matchers - R/L`,
    ...standingsByAttribute(seasonMatchVet, 'pointRebAst', {hasThreshold: false, hasDividers: false, showTeams: true} ),
    `### Points Matcher - S1/S2`,
    ...standingsByAttribute(scorersVet, 'points', {hasThreshold: false, hasDividers: false, showTeams: true} ),
    `### RebAsts Matcher - S1/S2`,
    ...standingsByAttribute(rebAstVet, 'rebAst', {hasThreshold: false, hasDividers: false, showTeams: true} ),
    `### Ongoing`,
    ...standingsByAttribute(ongoingLeaders, 'specialMsg', {limit: 6} ),
    `There are ${sundayRemainingGames} games that have not started yet.`,
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