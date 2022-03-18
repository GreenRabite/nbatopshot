const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const _ = require('lodash')

const DATE_1 = '20220318'

const FRIDAY_IDS = [
  '0022101046',
  '0022101047',
  '0022101048',
  '0022101049',
  '0022101050',
  '0022101051',
  '0022101052',
  '0022101053',
  '0022101054',
  '0022101055',
  '0022101056',
  '0022101057',
]

const COMMENT_ID = 'i17l9ir'

const runFunction = async () => {
  const { redditBot, fetchGameResults } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders } = sortServices;
  const { standingsByAttribute } = standingsServices;

  const FRIDAY_URLS = apiServices.generateBoxScoreUrls(FRIDAY_IDS, DATE_1);
  const {results:fridayResults, remainingGames: fridayRemainingGames} = await fetchGameResults(FRIDAY_URLS)

  const fridayPlayers = fridayResults.flat();
  const fridaySorted = sortPlayersByAttribute(_.clone(fridayPlayers), 'points');
  const fridayLeaders = filterPlayersByThreshold(_.clone(fridaySorted), 'points', 35)
  const fridayOngoingLeaders = onGoingLeaders(_.clone(fridaySorted), 'points', 35, {limit: 4})

  const markdown = [
    `# Mayhem Flash Challenge`,
    `## Friday Leaders`,
    `### Scoring Leaders`,
    ...standingsByAttribute(fridayLeaders, 'points', {dividers: [2], hasThreshold: false} ),
    `### Ongoing Games`,
    ...standingsByAttribute(fridayOngoingLeaders, 'points', {hasDividers: false, hasThreshold: false, onGoing: true} ),
    `## Saturday Leaders`,
    `Games Have Not Started Yet`,
    `## Sunday Leaders`,
    `Games Have Not Started Yet`,
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