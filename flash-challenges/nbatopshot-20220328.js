const BB = require("bluebird");
const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const playByPlayServices = require('../api/playByPlayServices')
const _ = require('lodash')

const DATE_1 = '20220328'

const MONDAY_IDS = [
  [ 'DEN-CHA', '0022101122' ],
  [ 'ORL-CLE', '0022101123' ],
  [ 'ATL-IND', '0022101124' ],
  [ 'SAC-MIA', '0022101125' ],
  [ 'CHI-NYK', '0022101126' ],
  [ 'BOS-TOR', '0022101127' ],
  [ 'SAS-HOU', '0022101128' ],
  [ 'GSW-MEM', '0022101129' ],
  [ 'OKC-POR', '0022101130' ],
]

const GAME_MAPPING = {
    'DEN-CHA': {
      teams: 'DEN-CHA',
      type: 'box_score',
      stat: 'rebs'
    },
    'ORL-CLE': {
      teams: 'ORL-CLE',
      type: 'play_by_play',
      method: 'firstToStat',
      stat: 'rebs',
      number: 7
    },
    'ATL-IND': {
      teams: 'ATL-IND',
      type: 'box_score',
      stat: 'points'
    },
    'SAC-MIA': {
      teams: 'SAC-MIA',
      type: 'box_score',
      stat: 'blks'
    },
    'CHI-NYK': {
      teams: 'CHI-NYK',
      type: 'box_score',
      stat: 'tpm'
    },
    'BOS-TOR': {
      teams: 'BOS-TOR',
      type: 'box_score',
      stat: 'steals'
    },
    'SAS-HOU': {
      teams: 'SAS-HOU',
      type: 'play_by_play',
      method: 'firstToStat',
      stat: 'assists',
      number: 5
    },
    'GSW-MEM': {
      teams: 'GSW-MEM',
      type: 'play_by_play',
      method: 'lastMade',
      stat: 'tpm'
    },
    'OKC-POR': {
      teams: 'OKC-POR',
      type: 'box_score',
      stat: 'assists'
    }
  }

const COMMENT_ID = 'i2hy2rn'

const listPlayByPlay = (sorted) => {
  return sorted.map((player, idx) => {
    if(idx===0) return `${player.name} ${player.sum}\n\n-------------------------`
    return `${player.name} ${player.sum}`
  }).slice(0,4)
}

const renderSortedArray = (result, {stat, target}) => {
  if(result.status === 'finished'){
    return [
      `_First to ${target} ${stat}_`,
      `* **${result.name}**`
    ].join('\n\n')
  }else if(result.status === 'in_progress'){
    return [
      `_First to ${target} ${stat}_`,
      ...listPlayByPlay(result.sorted)
    ].join('\n\n')
  }
}

const renderLastShot = (result, {stat}) => {
  if(!result) return [];
  if(result.status === 'finished'){
    return [`**${result.teams}**`,`Last Shot(${stat}):`, `* **${result.name}**`].join('\n\n')
  }else if(result.status === 'in_progress'){
    return [`**${result.teams}**`, `Current Last Shot(${stat}):`, `${result.currentLastShot}`].join('\n\n')
  }
}

const runFunction = async () => {
  const { redditBot, fetchPlayByPlay, fetchGameResult, fetchMixScoreResults } = apiServices;
  const { sortPlayersByAttribute, filterPlayersByThreshold, onGoingLeaders } = sortServices;
  const { standingsByAttribute } = standingsServices;
  const { firstToStat, lastMadeShot } = playByPlayServices;

  const { box_score: boxScoreUrls, play_by_play: playByPlayUrls } = await fetchMixScoreResults(MONDAY_IDS, DATE_1, GAME_MAPPING);

  const boxScores = await BB.mapSeries(boxScoreUrls, async (config) => {
    const result = await fetchGameResult(config.url);
    const sorted =  sortPlayersByAttribute(_.clone(result).filter(x=> x.name !== 'Brandon Williams'), config.stat)
    return [`**${config.teams}**`, `_Most ${config.stat}_`, ...standingsByAttribute(sorted, config.stat, {dividers: [0], threshold: 1})].join('\n\n')
  })

  const playByPlays = await BB.mapSeries(playByPlayUrls, async (config) => {
    const results = await fetchPlayByPlay(config.url);
    if(!results) return [];
    const method = config.method
    if(method === 'firstToStat'){
      return  [`**${config.teams}**`, renderSortedArray(firstToStat(results, config.stat, config.number), {stat: config.stat, target: config.number})].join('\n\n')
    }else if(method === 'lastMade'){
      const lastShot = lastMadeShot(results, config.stat)
      return renderLastShot(lastShot, {stat: config.stat})
    }else{
      return []
    }
  })

  const markdown = [
    `# Spin It Challenge`,
    `## Rookie Rotation`,
    ...boxScores,
    ...playByPlays,
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