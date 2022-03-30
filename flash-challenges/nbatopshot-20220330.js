const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const _ = require('lodash')

const DATE_1 = '20220330'

const WEDNESDAY_IDS = [
  '0022101136',
  '0022101137',
  '0022101138',
  '0022101139',
  '0022101140',
  '0022101141',
  '0022101142',
  '0022101143',
  '0022101144',
  '0022101145',
  '0022101146'
]

const COMMENT_ID = 'i2rw7dd'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders } = sortServices;
  const { standingsByAttribute } = standingsServices;

  const WEDNESDAY_URLS = apiServices.generateBoxScoreUrls(WEDNESDAY_IDS, DATE_1);

  const {results:wednesdayResults, remainingGames: wednesdayRemainingGames} = await fetchGameResults(WEDNESDAY_URLS)

  
  const wednesdayPlayers = wednesdayResults.flat();
  const sortedPlayers = sortPlayersByAttribute(_.clone(wednesdayPlayers), 'assists');
  const assistsVet = filterPlayersByThreshold(_.clone(sortedPlayers), 'assists', 7);
  const ongoingLeaders = _.clone(sortedPlayers).filter(x => !x.gameOver)

  const markdown = [
    `# All The Dimes Flash Challenge`,
    `## All The Dimes Leaders (Rookie)`,
    ...standingsByAttribute(sortedPlayers, 'assists', {dividers: [9], limit: 15} ),
    `## All The Dimes Leaders (Vet)`,
    `### All The Dimes`,
    ...standingsByAttribute(assistsVet, 'assists', {hasThreshold: false, hasDividers: false} ),
    `### Ongoing`,
    ...standingsByAttribute(ongoingLeaders, 'assists', {limit: 6} ),
    `There are ${wednesdayRemainingGames} games that have not started yet.`,
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