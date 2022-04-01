const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const _ = require('lodash')

const DATE_1 = '20220401'
// const DATE_2 = '20220326'
// const DATE_3 = '20220327'

const FRIDAY_IDS = [
  '0022101151',
  '0022101152',
  '0022101153',
  '0022101154',
  '0022101155',
  '0022101156',
  '0022101157',
  '0022101158',
  '0022101159',
  '0022101160'
]

// const SATURDAY_IDS = [
//   '0022101107',
//   '0022101108',
//   '0022101109',
//   '0022101110',
//   '0022101111',
//   '0022101112',
//   '0022101113',
//   '0022101114'
// ]

// const SUNDAY_IDS = [
//   '0022101115',
//   '0022101116',
//   '0022101117',
//   '0022101118',
//   '0022101119',
//   '0022101120',
//   '0022101121'
// ]

const COMMENT_ID = 'i31odws'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders } = sortServices;
  const { standingsByAttribute } = standingsServices;

  const FRIDAY_URLS = apiServices.generateBoxScoreUrls(FRIDAY_IDS, DATE_1);
  // const SATURDAY_URLS = apiServices.generateBoxScoreUrls(SATURDAY_IDS, DATE_2);
  // const SUNDAY_URLS = apiServices.generateBoxScoreUrls(SUNDAY_IDS, DATE_3);

  const {results:fridayResults, remainingGames: fridayRemainingGames} = await fetchGameResults(FRIDAY_URLS)
  // const {results:saturdayResults, remainingGames: saturdayRemainingGames} = await fetchGameResults(SATURDAY_URLS)
  // const {results:sundayResults, remainingGames: sundayRemainingGames} = await fetchGameResults(SUNDAY_URLS)

  const fridayPlayers = fridayResults.flat();
  // const saturdayPlayers = saturdayResults.flat();
  // const sundayPlayers = sundayResults.flat();
  const allPlayersRookie = [...fridayPlayers]
  const sortedBlks = sortPlayersByAttribute(_.clone(allPlayersRookie), 'blks');
  const sortedStls = sortPlayersByAttribute(_.clone(allPlayersRookie), 'steals');
  const sortedTpm = sortPlayersByAttribute(_.clone(allPlayersRookie), 'tpm');

  const fridayBlkVet = filterPlayersByThreshold(_.clone(fridayPlayers), 'blks', 3)
  // const saturdayStlsVet = filterPlayersByThreshold(_.clone(saturdayPlayers), 'steals', 2)
  // const sundayTpmVet = filterPlayersByThreshold(_.clone(sundayPlayers), 'tpm', 4)

  // Update
  const onGoingSortedRookie = sortPlayersByAttribute(_.clone(fridayPlayers), 'offTracker');
  const ongoingLeaders = _.clone(onGoingSortedRookie).filter(x=>!x.gameOver)

  const markdown = [
    `# Season High Flash Challenge`,
    `## Season High Leaders (Rookie/Hero)`,
    `## Block Leaders`,
    ...standingsByAttribute(sortedBlks, 'blks', {dividers: [4], limit: 7, showTeams: true} ),
    `## Steals Leaders`,
    ...standingsByAttribute(sortedStls, 'steals', {dividers: [4], limit: 7, showTeams: true} ),
    `## 3PM Leaders`,
    ...standingsByAttribute(sortedTpm, 'tpm', {dividers: [4], limit: 7, showTeams: true} ),
    `## Season High Leaders (Vet)`,
    `### Friday Block Matchers`,
    ...standingsByAttribute(fridayBlkVet, 'blks', {hasThreshold: false, hasDividers: false, showTeams: true} ),
    `### Saturday Steals Matchers`,
    'Games have not started yet',
    // ...standingsByAttribute(saturdayStlsVet, 'steals', {hasThreshold: false, hasDividers: false, showTeams: true} ),
    `### Sunday 3PM Matchers`,
    'Games have not started yet',
    // ...standingsByAttribute(sundayTpmVet, 'tpm', {hasThreshold: false, hasDividers: false, showTeams: true} ),
    `### Ongoing`,
    ...standingsByAttribute(ongoingLeaders, 'specialMsg', {limit: 5} ),
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