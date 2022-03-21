const BB = require("bluebird");
const apiServices = require('../api/apiServices')
const sortServices = require('../api/sortServices')
const standingsServices = require('../api/standingsServices')
const statsServices = require('../api/statsServices')
const timeServices = require('../api/timeServices')
const playByPlayServices = require('../api/playByPlayServices')
const _ = require('lodash')

const DATE_1 = '20220321'

const MONDAY_IDS = [
  [ 'NOP-CHA', '0022101071' ],
  [ 'LAL-CLE', '0022101072' ],
  [ 'POR-DET', '0022101073' ],
  [ 'MIA-PHI', '0022101074' ],
  [ 'UTA-BKN', '0022101075' ],
  [ 'TOR-CHI', '0022101076' ],
  [ 'WAS-HOU', '0022101077' ],
  [ 'BOS-OKC', '0022101078' ],
  [ 'MIN-DAL', '0022101079' ]
]

const GAME_MAPPING = {
    'NOP-CHA': {
      teams: 'NOP-CHA',
      type: 'box_score',
      stat: 'rebs'
    },
    'LAL-CLE': {
      teams: 'LAL-CLE',
      type: 'play_by_play',
      method: 'lastMade',
      stat: 'fgm'
    },
    'POR-DET': {
      teams: 'POR-DET',
      type: 'box_score',
      stat: 'tpm'
    },
    'MIA-PHI': {
      teams: 'MIA-PHI',
      type: 'play_by_play',
      method: 'firstToStat',
      stat: 'points',
      number: 15
    },
    'UTA-BKN': {
      teams: 'UTA-BKN',
      type: 'box_score',
      stat: 'steals'
    },
    'TOR-CHI': {
      teams: 'TOR-CHI',
      type: 'box_score',
      stat: 'points'
    },
    'WAS-HOU': {
      teams: 'WAS-HOU',
      type: 'play_by_play',
      method: 'lastMade',
      stat: 'tpm'
    },
    'BOS-OKC': {
      teams: 'BOS-OKC',
      type: 'box_score',
      stat: 'blks'
    },
    'MIN-DAL': {
      teams: 'MIN-DAL',
      type: 'box_score',
      stat: 'assists'
    }
  }

const COMMENT_ID = 'i1l3eop'

const listPlayByPlay = (sorted) => {
  return sorted.map((player, idx) => {
    if(idx===0) return `${player.name} ${player.sum}\n\n-------------------------`
    return `${player.name} ${player.sum}`
  }).slice(0,4)
}

const renderSortedArray = (result, stat) => {
  if(result.status === 'finished'){
    return [
      `_First to ${stat}_`,
      `* **${result.name}**`
    ].join('\n\n')
  }else if(result.status === 'in_progress'){
    return [
      `_First to ${stat}_`,
      ...listPlayByPlay(result.sorted)
    ].join('\n\n')
  }
}

const renderLastShot = (result) => {
  if(!result) return [];
  if(result.status === 'finished'){
    return [`**${result.teams}**`,`* Last Shot: **${result.name}**`].join('\n\n')
  }else if(result.status === 'in_progress'){
    return [`**${result.teams}**`, `Current Last Shot: ${result.currentLastShot}`].join('\n\n')
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
    const sorted =  sortPlayersByAttribute(_.clone(result), config.stat)
    return [`**${config.teams}**`, `_Most ${config.stat}_`, ...standingsByAttribute(sorted, config.stat, {dividers: [0], threshold: 3})].join('\n\n')
  })

  const playByPlays = await BB.mapSeries(playByPlayUrls, async (config) => {
    const results = await fetchPlayByPlay(config.url);
    const method = config.method
    if(method === 'firstToStat'){
      return  [`**${config.teams}**`, renderSortedArray(firstToStat(results, config.stat, config.number), config.stat)].join('\n\n')
    }else if(method === 'lastMade'){
      const lastShot = lastMadeShot(results, config.stat)
      return renderLastShot(lastShot)
    }else{
      return []
    }
  })

  const markdown = [
    `# Spin It Challenge`,
    `## The Highlight Reel`,
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