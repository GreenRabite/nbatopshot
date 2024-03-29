const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const _ = require('lodash')

const DATE_1 = '20220405'
const DATE_2 = '20220406'

const TUESDAY_IDS = [
  '0022101179',
  '0022101178',
  '0022101180',
  '0022101181',
  '0022101182',
  '0022101183',
  '0022101184',
  '0022101185',
  '0022101186',
  '0022101187',
  '0022101188',
  '0022101189'
]

const WEDNESDAY_IDS = [
  '0022101190',
  '0022101191',
  '0022101192',
  '0022101193',
  '0022101194',
  '0022101195'
]

const COMMENT_ID = 'i3jumpl'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults, fetchTeamStatsResults } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders, sortTeamsByAttribute } = sortServices;
  const { standingsByAttribute, standingsByTeamAttribute } = standingsServices;

  const TUESDAY_URLS = apiServices.generateBoxScoreUrls(TUESDAY_IDS, DATE_1);
  const WEDNESDAY_URLS = apiServices.generateBoxScoreUrls(WEDNESDAY_IDS, DATE_2);

  const {results:tuesdayResults, remainingGames: tuesdayRemainingGames} = await fetchGameResults(TUESDAY_URLS)
  const {results:tuesdayCombinedResults, remainingGames: _x1} = await fetchTeamResults(TUESDAY_URLS, {type: 'combined'})
  const {results:tuesdayTeamStatResults, remainingGames: _x2} = await fetchTeamStatsResults(TUESDAY_URLS)
  const {results:wednesdayResults, remainingGames: wednesdayRemainingGames} = await fetchGameResults(WEDNESDAY_URLS)
  const {results:wednesdayCombinedResults, remainingGames: _x3} = await fetchTeamResults(WEDNESDAY_URLS, {type: 'combined'})
  const {results:wednesdayTeamStatResults, remainingGames: _x4} = await fetchTeamStatsResults(WEDNESDAY_URLS)

  const tuesdayPlayers = tuesdayResults.flat();
  const wednesdayPlayers = wednesdayResults.flat();
  const allPlayers = [...tuesdayPlayers, ...wednesdayPlayers]
  const sortedPlayers = sortPlayersByAttribute(_.clone(allPlayers), 'tpm', {customSort: ['points']});
  
  const tuesdayTeams = tuesdayTeamStatResults.flat()
  const wednesdayTeams = wednesdayTeamStatResults.flat()
  const allTeams = [...tuesdayTeams, ...wednesdayTeams]
  const sortedTeams = sortTeamsByAttribute(_.clone(allTeams), 'tpm')

  const combinedPlayers = [...tuesdayCombinedResults, ...wednesdayCombinedResults]
  const combinedPlayerMarkdown = combinedPlayers.map(result => {
    const sorted = sortPlayersByAttribute(_.clone(result.filter(x => x.name !== 'Jaylen Hoard' && x.name !=="Ish Wainright")), 'tpm', {customSort: ['points']});
    return [
      `**${sorted[0].teams}**`,
      ...standingsByAttribute(sorted, 'tpm', {dividers: [0], limit: 3} )
    ].join('\n\n')
  })

  const combinedTeams = [...tuesdayTeamStatResults, ...wednesdayTeamStatResults]
  const combinedTeamMarkdown = combinedTeams.map(result => {
    const sorted = sortPlayersByAttribute(_.clone(result), 'tpm');
    return [
      `**${sorted[0].teams}**`,
      ...standingsByTeamAttribute(sorted, 'tpm', {dividers: [1], limit: 2, showTeams: true})
    ].join('\n\n')
  })

  const markdown = [
    `# Past and Present Flash Challenge`,
    `## Past and Present Leaders (Rookie)`,
    `### Players`,
    ...standingsByAttribute(sortedPlayers, 'tpm', {dividers: [4], limit: 7, showTeams: true} ),
    `### Teams`,
    ...standingsByTeamAttribute(sortedTeams, 'tpm', {dividers: [4], limit: 7}),
    `## Past and Present Leaders (Vet)`,
    `### Players`,
    ...combinedPlayerMarkdown,
    `### Teams`,
    ...combinedTeamMarkdown,
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