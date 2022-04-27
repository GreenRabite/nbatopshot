const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const playByPlayServices = require('../api/playByPlayServices')
const markdownServices = require('../api/markdownServices')
const _ = require('lodash')

const DATE_1 = "20220416"
const DATE_2 = "20220417"
const DATE_3 = "20220418"
const DATE_4 = "20220419"
const DATE_5 = "20220420"
const DATE_6 = "20220421"
const DATE_7 = "20220422"
const DATE_8 = "20220423"
const DATE_9 = "20220424"
const DATE_10 = "20220425"
const DATE_11 = "20220426"
const DATE_12 = "20220427"


const DAL_VS_UTAH_IDS = [
  [DATE_1, '0042100171'],
  [DATE_3, '0042100172'],
  [DATE_6, '0042100173'],
  [DATE_8, '0042100174'],
  [DATE_10, '0042100175'],
]

const MIN_VS_MEM_IDS = [
  [DATE_1, '0042100151'],
  [DATE_4, '0042100152'],
  [DATE_6, '0042100153'],
  [DATE_8, '0042100154'],
  [DATE_11, '0042100155'],
]

const TOR_VS_PHI_IDS = [
  [DATE_1, '0042100131'],
  [DATE_3, '0042100132'],
  [DATE_5, '0042100133'],
  [DATE_8, '0042100134'],
  [DATE_10, '0042100135'],
]

const DEN_VS_GSW_IDS = [
  [DATE_1, '0042100161'],
  [DATE_3, '0042100162'],
  [DATE_6, '0042100163'],
  [DATE_9, '0042100164'],
  [DATE_12, '0042100165'],
]

const ATL_VS_MIA_IDS = [
  [DATE_2, '0042100101'],
  [DATE_4, '0042100102'],
  [DATE_7, '0042100103'],
  [DATE_9, '0042100104'],
  [DATE_11, '0042100105'],
]

const BKN_VS_BOS_IDS = [
  [DATE_2, '0042100111'],
  [DATE_5, '0042100112'],
  [DATE_8, '0042100113'],
  [DATE_10, '0042100114'],
]

const CHI_VS_MIL_IDS = [
  [DATE_2, '0042100121'],
  [DATE_5, '0042100122'],
  [DATE_7, '0042100123'],
  [DATE_9, '0042100124'],
  [DATE_12, '0042100125'],
]

const NOP_VS_PHX_IDS = [
  [DATE_2, '0042100141'],
  [DATE_4, '0042100142'],
  [DATE_7, '0042100143'],
  [DATE_9, '0042100144'],
  [DATE_11, '0042100145'],
]

const COMMENT_ID = 'i53ku6y'

const runFunction = async () => {
  const { redditBot, fetchGameResults, fetchTeamResults, fetchTeamStatsResults, fetchPlayByPlays } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders, sortTeamsByAttribute } = sortServices;
  const { standingsByAttribute, standingsByTeamAttribute } = standingsServices;
  const { firstToStat, lastMadeShot, firstMadeShot } = playByPlayServices;
  const { renderLastShot, renderFirstShot } = markdownServices;
  const { combineStats } = statsServices;

  const DAL_VS_UTAH_URLS = DAL_VS_UTAH_IDS.map(date_and_id => apiServices.generateBoxScoreUrl(date_and_id[1], date_and_id[0]))
  const MIN_VS_MEM_URLS = MIN_VS_MEM_IDS.map(date_and_id => apiServices.generateBoxScoreUrl(date_and_id[1], date_and_id[0]))
  const TOR_VS_PHI_URLS = TOR_VS_PHI_IDS.map(date_and_id => apiServices.generateBoxScoreUrl(date_and_id[1], date_and_id[0]))
  const DEN_VS_GSW_URLS = DEN_VS_GSW_IDS.map(date_and_id => apiServices.generateBoxScoreUrl(date_and_id[1], date_and_id[0]))
  const ATL_VS_MIA_URLS = ATL_VS_MIA_IDS.map(date_and_id => apiServices.generateBoxScoreUrl(date_and_id[1], date_and_id[0]))
  const BKN_VS_BOS_URLS = BKN_VS_BOS_IDS.map(date_and_id => apiServices.generateBoxScoreUrl(date_and_id[1], date_and_id[0]))
  const CHI_VS_MIL_URLS = CHI_VS_MIL_IDS.map(date_and_id => apiServices.generateBoxScoreUrl(date_and_id[1], date_and_id[0]))
  const NOP_VS_PHX_URLS = NOP_VS_PHX_IDS.map(date_and_id => apiServices.generateBoxScoreUrl(date_and_id[1], date_and_id[0]))

  const {results:dallasUtahResults, remainingGames: _x1} = await fetchGameResults(DAL_VS_UTAH_URLS)
  const {results:minnMemphisResults, remainingGames: _x2} = await fetchGameResults(MIN_VS_MEM_URLS)
  const {results:torPhiResults, remainingGames: _x3} = await fetchGameResults(TOR_VS_PHI_URLS)
  const {results:denGSWResults, remainingGames: _x4} = await fetchGameResults(DEN_VS_GSW_URLS)
  const {results:atlMiaResults, remainingGames: _x5} = await fetchGameResults(ATL_VS_MIA_URLS)
  const {results:bknBosResults, remainingGames: _x6} = await fetchGameResults(BKN_VS_BOS_URLS)
  const {results:chiMilResults, remainingGames: _x7} = await fetchGameResults(CHI_VS_MIL_URLS)
  const {results:nopPhxResults, remainingGames: _x8} = await fetchGameResults(NOP_VS_PHX_URLS)

  const updatedAtlMiaResults = [{
      playerId: "203992",
      name: "Bogdan Bogdanovic",
      teamId: "1610612737",
      tpm: 5,
      gameOver: true,
      timeLeft: '',
      teamMargin: -10,
      teams: 'ATL-MIA',
      ownTeam: 'ATL',
    },
    {
      playerId: "200782",
      name: "P.J. Tucker",
      teamId: "1610612748",
      tpm: 1,
      gameOver: true,
      timeLeft: '',
      teamMargin: 10,
      teams: 'ATL-MIA',
      ownTeam: 'MIA',
    },
    {
      playerId: "1629216",
      name: "Gabe Vincent",
      teamId: "1610612748",
      tpm: 3,
      gameOver: true,
      timeLeft: '',
      teamMargin: 10,
      teams: 'ATL-MIA',
      ownTeam: 'MIA',
    },
  ...atlMiaResults.flat()]

  
  const dallasUtahSort = sortPlayersByAttribute(_.clone(combineStats(dallasUtahResults.flat())), 'points');
  const minnMemphisSort = sortPlayersByAttribute(_.clone(combineStats(minnMemphisResults.flat())), 'ftm');
  const torPhiSort = sortPlayersByAttribute(_.clone(combineStats(torPhiResults.flat())), 'assists');
  const denGSWSort = sortPlayersByAttribute(_.clone(combineStats(denGSWResults.flat())), 'blks');
  const atlMiaSort = sortPlayersByAttribute(_.clone(combineStats(updatedAtlMiaResults)), 'tpm');
  const bknBosSort = sortPlayersByAttribute(_.clone(combineStats(bknBosResults.flat())), 'fgm');
  const chiMilSort = sortPlayersByAttribute(_.clone(combineStats(chiMilResults.flat())), 'steals');
  const nopPhxSort = sortPlayersByAttribute(_.clone(combineStats(nopPhxResults.flat())), 'rebs');

  const markdown = [
    `# The Wheel 🏀 Round 1 NBA Playoffs`,
    `## DALLAS-UTAH: Most Points`,
    ...standingsByAttribute(dallasUtahSort, 'points', {dividers: [4], limit: 8, dontHideFinished: true} ),
    `## MINNESOTA-MEMPHIS: Most Free Throws Made`,
    ...standingsByAttribute(minnMemphisSort, 'ftm', {dividers: [4], limit: 8, dontHideFinished: true} ),
    `## TORONTO-PHILADEPHIA: Most Assists`,
    ...standingsByAttribute(torPhiSort, 'assists', {dividers: [4], limit: 8, dontHideFinished: true} ),
    `## DENVER-GOLDEN STATE: Most Blocks`,
    ...standingsByAttribute(denGSWSort, 'blks', {dividers: [4], limit: 8, dontHideFinished: true} ),
    `## ATLANTA-MIAMI: Most Triples`,
    ...standingsByAttribute(atlMiaSort, 'tpm', {dividers: [4], limit: 8, dontHideFinished: true} ),
    `## BROOKLYN-BOSTON: Most Field Goals Made`,
    ...standingsByAttribute(bknBosSort, 'fgm', {dividers: [4], limit: 8, dontHideFinished: true} ),
    `## CHICAGO-MILWAUKEE: Most Steals`,
    ...standingsByAttribute(chiMilSort, 'steals', {dividers: [4], limit: 8, dontHideFinished: true} ),
    `## NEW ORLEANS-PHOENIX: Most Rebounds`,
    ...standingsByAttribute(nopPhxSort, 'rebs', {dividers: [4], limit: 8, dontHideFinished: true} ),
    // `There are ${fridayRemainingGames} games that have not started yet.`,
    `**Update: ${new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"})} PST**`,
    `**Bolded players** are done for the challenge`,
    `[Numbers] in bracket show time left in regulation for the game`,
    `Tiebreakers: Team Margin / Player's ± / Minutes Played`,
  ].join("\n\n")

  // console.clear()
  console.log(markdown)

  redditBot.getComment(COMMENT_ID).edit(markdown)

}

setInterval(runFunction, 15000)
// runFunction()