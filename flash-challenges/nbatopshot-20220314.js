

// https://data.nba.net/10s/prod/v1/20220103/0022100552_boxscore.json

const axios = require('axios').default;
const _ = require('lodash')
const fs = require('fs')
const BB = require("bluebird");
const snoowrap = require('snoowrap');
require('dotenv').config();

const DATE_1 = '20220314'

const MONDAY_IDS = [
  [ 'LAC-CLE', '0022101020' ],
  [ 'POR-ATL', '0022101021' ],
  [ 'DEN-PHI', '0022101022' ],
  [ 'CHA-OKC', '0022101023' ],
  [ 'MIN-SAS', '0022101024' ],
  [ 'WAS-GSW', '0022101025' ],
  [ 'CHI-SAC', '0022101026' ],
  [ 'MIL-UTA', '0022101027' ],
  [ 'TOR-LAL', '0022101028' ]
]

const COMMENT_ID = 'i0oza0g'
const genUrls = (date_and_ids) => date_and_ids.map(date_and_id => `https://data.nba.net/10s/prod/v1/${date_and_id[0]}/${date_and_id[1]}_boxscore.json`);

const generateBoxScoreUrl = (gameId, date = DATE_1)  => `https://data.nba.net/10s/prod/v1/${date}/${gameId}_boxscore.json`;
const generatePlayByPlayUrl = (gameId)  => `https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_${gameId}.json`;

const zeroPad = (num, places) => String(num).padStart(places, '0')

const calculateSeconds = (time) => {
  if(!time) return 0;

  const timeArray = time.split(":");
  return Number(timeArray[0])*60 + Number(timeArray[1])
}

const formatStats = (players, gameData) => {
  return players.map(player => {
    const points = Number(player.points);
    const rebs = Number(player.totReb);
    const blks = Number(player.blocks);
    const steals = Number(player.steals);
    const assists = Number(player.assists);
    const fgm = Number(player.fgm);
    
    return {
      playerId: player.personId,
      name: `${player.firstName} ${player.lastName}`,
      points,
      rebs,
      blks,
      steals,
      fga: Number(player.fga),
      ftm: Number(player.ftm),
      tpm: Number(player.tpm),
      assists,
      fgm,
      fgmFtm: Number(player.ftm) + Number(player.fgm),
      teams: gameData.teams,
      team: gameData[player.teamId].code,
      gameOver: gameData.gameOver,
      teamMargin: gameData[player.teamId].margin,
      plusMinus: Number(player.plusMinus),
      secondsPlayed: calculateSeconds(player.min),
      timeLeft: gameData.timeLeft,
      stlBlks: steals + blks,
      rebAsts: rebs + assists,
    }
  })
}

const calculateTimeLeft = (period, clock) => {
  if(!clock && period > 3) return ''

  let minutes;
  let seconds;
  if(clock?.length){
    minutes = Number(clock.split(":")[0])
    seconds = clock.split(":")[1] || 0
  }else{
    minutes=0;
    seconds=0;
  }

  return `[Q${period}: ${zeroPad(minutes,2)}:${zeroPad(seconds,2)}]`
}

const fetchGameResults = async (urls) => {
  let remainingGames= 0;

  return {
    results: await BB.mapSeries(urls, async url => {
    return axios.get(url)
      .then(response => {
        const players = response.data.stats.activePlayers;
        const clockRunning = !!response.data.basicGameData.clock
        const period = response.data.basicGameData?.period?.current
        const gameOver = !clockRunning && period > 3;
        const timeLeft = calculateTimeLeft(period, response.data.basicGameData.clock)
        const vTeam = {
          code: response.data.basicGameData.vTeam.triCode,
          margin: Number(response.data.basicGameData.vTeam.score) - Number(response.data.basicGameData.hTeam.score),
          assists: Number(response.data.stats.vTeam.totals.assists),
        }

        const hTeam = {
          code: response.data.basicGameData.hTeam.triCode,
          margin: Number(response.data.basicGameData.hTeam.score) - Number(response.data.basicGameData.vTeam.score),
          assists: Number(response.data.stats.hTeam.totals.assists),
        }

        const gameData = {
          teams: [vTeam.code, hTeam.code].join('-'),
          gameOver: gameOver,
          [response.data.basicGameData.hTeam.teamId]: hTeam,
          [response.data.basicGameData.vTeam.teamId]: vTeam,
          vTeam,
          hTeam,
          timeLeft,
        }

        return formatStats(players, gameData)
      })
      .catch(function (error) {
        // handle error
        remainingGames++
        return []
      })
     }),
     remainingGames
  }
}

const fetchGameBoxScoreResult = async (url) => {
  return axios.get(url)
      .then(response => {
        const players = response.data.stats.activePlayers;
        const clockRunning = !!response.data.basicGameData.clock
        const period = response.data.basicGameData?.period?.current
        const gameOver = !clockRunning && period > 3;
        const timeLeft = calculateTimeLeft(period, response.data.basicGameData.clock)
        const vTeam = {
          code: response.data.basicGameData.vTeam.triCode,
          margin: Number(response.data.basicGameData.vTeam.score) - Number(response.data.basicGameData.hTeam.score),
          assists: Number(response.data.stats.vTeam.totals.assists),
        }

        const hTeam = {
          code: response.data.basicGameData.hTeam.triCode,
          margin: Number(response.data.basicGameData.hTeam.score) - Number(response.data.basicGameData.vTeam.score),
          assists: Number(response.data.stats.hTeam.totals.assists),
        }

        const gameData = {
          teams: [vTeam.code, hTeam.code].join('-'),
          gameOver: gameOver,
          [response.data.basicGameData.hTeam.teamId]: hTeam,
          [response.data.basicGameData.vTeam.teamId]: vTeam,
          vTeam,
          hTeam,
          timeLeft,
        }

        return formatStats(players, gameData)
      })
      .catch(function (error) {
        // handle error
        return []
      })
}

const fetchPlayByPlay = async (url) => {
  return axios.get(url)
      .then(response => {
        const plays = response.data.game.actions;
        // return findFirstToPoints(15, plays)
        // return findFirstToAst(5, plays);
        // return findFirstToFGM(7, plays);
        return plays;
      })
      .catch(function (error) {
        // handle error
        // console.log(error)
        // remainingGames++
        return [];
        // console.log(error.response.data);
        // console.log('Game has Not started yet');
      })
}

const sortPlayersByAttribute = (players, attribute) => {
  return players.sort((a,b) => {
    if(a[attribute] != b[attribute]){
      return b[attribute] - a[attribute]
    }

    // First tiebreaker
    if(a.teamMargin != b.teamMargin){
      return b.teamMargin - a.teamMargin
    }

    // Second tiebreaker
    if(a.plusMinus != b.plusMinus){
      return b.plusMinus - a.plusMinus
    }

    // Third tiebreaker
    if(a.secondsPlayed != b.secondsPlayed){
      return b.secondsPlayed - a.secondsPlayed
    }

    return 0;
  })
}

const standingsByAttribute = (players, attribute) => {
  if(players.length === 0) return ['No games have started yet']
  return players.map((player, idx) => {
    const playerInfo = player.gameOver ? `* **${player.name}: ${player[attribute]}**` : `${player.name}: ${player[attribute]}`

    if(idx===0) return `${playerInfo} ${player.timeLeft}\n\n-------------------------`
    if(idx >= 1 && player.gameOver) return undefined;
    return `${playerInfo} ${player.timeLeft}`
  }).filter(x => !!x).slice(0,3)
}

const firstToStat = (plays, stat, number) => {
  if(stat === 'assists'){
    return findFirstToAst(plays, number);
  }else if(stat === 'rebs'){
    return findFirstToReb(plays, number)
  }
}

const lastMade = (plays, stat) => {
  if(plays.length === 0) return undefined
  if(stat === 'tpm'){
    return findLastMade3pm(plays)
  }else if(stat === 'fgm'){
    return findLastMadeShot(plays)
  }
}

const findFirstToAst = (plays, number) => {
  const results = {}
  let winner;
  const filteredPlays = plays.filter(play => play.assistTotal)
  let someoneReachedTarget = false;
  filteredPlays.forEach(play => {
    const astPlayerName = play.assistPlayerNameInitial;

    if(results[astPlayerName]){
      results[astPlayerName].sum = play.assistTotal
    }else{
      results[astPlayerName] = {
        name: astPlayerName,
        sum: play.assistTotal,
        playerId: String(play.assistPersonId)
      }
    }

    const isAstPlayerFinish = results[astPlayerName]?.sum >= number;

    if(!someoneReachedTarget && isAstPlayerFinish){
      someoneReachedTarget = true
      winner = {
        teams: _.uniq(filteredPlays.map(play => play.teamTricode)).join('-'),
        status: 'finished',
        name: astPlayerName
      }
    }
  })

  if(!someoneReachedTarget){
    const sorted = 
      Object.keys(results)
      .sort((a,b) =>results[b].sum - results[a].sum )
      .map(key => results[key])

    if(sorted){
      winner = {
        teams: _.uniq(filteredPlays.map(play => play.teamTricode)).join('-'),
        status: 'in_progress',
        sorted,
      }
    }
  }

  return winner;
}

const findFirstToReb = (plays, number) => {
  const results = {}
  let winner;
  const filteredPlays = plays.filter(play => play.actionType === 'rebound')
  let someoneReachedTarget = false;
  filteredPlays.forEach(play => {
    const playerName = play.playerNameI;

    if(results[playerName]){
      results[playerName].sum = play.reboundTotal
    }else{
      results[playerName] = {
        name: playerName,
        sum: play.reboundTotal,
        playerId: String(play.personId)
      }
    }

    const isPlayerFinish = results[playerName]?.sum >= number;

    if(!someoneReachedTarget && isPlayerFinish){
      someoneReachedTarget = true
      winner = {
        teams: _.uniq(filteredPlays.map(play => play.teamTricode)).join('-'),
        status: 'finished',
        name: playerName
      }
    }
  })

  if(!someoneReachedTarget){
    const sorted = 
      Object.keys(results)
      .sort((a,b) =>results[b].sum - results[a].sum )
      .map(key => results[key])

    if(sorted){
      winner = {
        teams: _.uniq(filteredPlays.map(play => play.teamTricode)).join('-'),
        status: 'in_progress',
        sorted,
      }
    }
  }

  return winner;
}

const findLastMadeShot = (plays) => {
  const teams = _.uniq(plays.map(play => play.teamTricode).filter(x=>x)).join('-')
  const lastPlay = plays[plays.length - 1]
  const scoringPlays = plays.filter(play => play?.shotResult === MADE);
  const winningShot = scoringPlays[scoringPlays.length - 1]
  let winner;
  if(lastPlay.actionType === 'game' && lastPlay.subType === 'end'){
    const playerName = winningShot.playerNameI
    winner = {
      name: playerName,
      team: winningShot.teamTricode,
      teams,
      status: 'finished'
    }
    return winner;
  }

  return {
    teams,
    currentLastShot: winningShot.playerNameI,
    status: 'in_progress'
  };
}

const findLastMade3pm = (plays) => {
  const teams = _.uniq(plays.map(play => play.teamTricode).filter(x=>x)).join('-')
  const lastPlay = plays[plays.length - 1]
  const filteredPlays = plays.filter(play => play.actionType === '3pt' && play.shotResult === 'Made');
  const winningShot = filteredPlays[filteredPlays.length - 1]
  let winner;
  if(lastPlay.actionType === 'game' && lastPlay.subType === 'end'){
    const playerName = winningShot.playerNameI
    winner = {
      name: playerName,
      team: winningShot.teamTricode,
      teams,
      status: 'finished'
    }
    return winner;
  }

  return {
    teams,
    currentLastShot: winningShot.playerNameI,
    status: 'in_progress'
  };
}

const listPlayByPlay = (sorted) => {
  return sorted.map((player, idx) => {
    if(idx===0) return `${player.name} ${player.sum}\n\n-------------------------`
    return `${player.name} ${player.sum}`
  }).slice(0,4)
}

const renderSortedArray = (result, stat) => {
  if(result.status === 'finished'){
    return [
      `**${result.teams}**`,
      `_First to ${stat}_`,
      `* **${result.name}**`
    ].join('\n\n')
  }else if(result.status === 'in_progress'){
    return [
      result.teams,
      `_First to ${stat}_`,
      ...listPlayByPlay(result.sorted)
    ]
  }
}

const renderLastShot = (result) => {
  if(!result) return [];
  if(result.status === 'finished'){
    return [`* **${result.name}**`]
  }else if(result.status === 'in_progress'){
    return [`**${result.teams}**`, `Current Last Shot: ${result.currentLastShot}`].join('\n\n')
  }
}

const runFunction = async () => {

  const GAME_MAPPING = {
    'LAC-CLE': {
      teams: 'LAC-CLE',
      type: 'box_score',
      stat: 'tpm'
    },
    'POR-ATL': {
      teams: 'POR-ATL',
      type: 'box_score',
      stat: 'rebs'
    },
    'DEN-PHI': {
      teams: 'DEN-PHI',
      type: 'play_by_play',
      method: 'lastMade',
      stat: 'tpm'
    },
    'CHA-OKC': {
      teams: 'CHA-OKC',
      type: 'play_by_play',
      method: 'firstToStat',
      stat: 'assists',
      number: 5
    },
    'MIN-SAS': {
      teams: 'MIN-SAS',
      type: 'box_score',
      stat: 'fgm'
    },
    'WAS-GSW': {
      teams: 'WAS-GSW',
      type: 'box_score',
      stat: 'blks'
    },
    'CHI-SAC': {
      teams: 'CHI-SAC',
      type: 'play_by_play',
      method: 'lastMade',
      stat: 'fgm'
    },
    'MIL-UTA': {
      teams: 'MIL-UTA',
      type: 'play_by_play',
      method: 'firstToStat',
      stat: 'rebs',
      number: 7
    },
    'TOR-LAL': {
      teams: 'TOR-LAL',
      type: 'box_score',
      stat: 'steals'
    },
  }

  const groupsOfUrls = MONDAY_IDS.reduce((groups,teamAndId) => {
    const [teams, gameId] = teamAndId
    const config = GAME_MAPPING[teams];
    if(config.type === 'box_score'){
      config['url'] = generateBoxScoreUrl(gameId)
      groups['box_score']= [...groups['box_score'], config]
    }else if(config.type === 'play_by_play'){
      config['url'] = generatePlayByPlayUrl(gameId)
      groups['play_by_play']= [...groups['play_by_play'], config]
    }

    return groups;
  }, {
    'box_score': [],
    'play_by_play': []
  })

  const boxScores = await BB.mapSeries(groupsOfUrls['box_score'], async (config) => {
    const results = await fetchGameBoxScoreResult(config.url);
    const sorted =  sortPlayersByAttribute(results, config.stat)
    return [`**${config.teams}**`, `Most ${config.stat}`, ...standingsByAttribute(sorted, config.stat)].join('\n\n')
  })

  const playByPlay = await BB.mapSeries(groupsOfUrls['play_by_play'], async (config) => {
    const results = await fetchPlayByPlay(config.url);
    const method = config.method
    if(method === 'firstToStat'){
      return  renderSortedArray(firstToStat(results, config.stat, config.number), config.stat)
    }else if(method === 'lastMade'){
      return renderLastShot(lastMade(results, config.stat))
    }else{
      return []
    }
    // const sorted =  sortPlayersByAttribute(results, config.stat)
    // return [config.teams, `Most ${config.stat}`, ...standingsByAttribute(sorted, config.stat)].join('\n')
  })


  const r = new snoowrap({
    userAgent: 'KobeBot',
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_SECRET_ID,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN,
  });

  const markdown = [
    `# Spin It Challenge`,
    `## Wheel Challenge`,
    ...boxScores,
    ...playByPlay,
    // `There are ${sundayRemainingGames} Sunday games that have not started yet.`,
    `**Update: ${new Date().toLocaleString("en-US", {timeZone: "America/Los_Angeles"})} PST**`,
    `**Bolded players** are done for the challenge`,
    `[Numbers] in bracket show time left in regulation for the game`,
    `Tiebreakers: Team Margin / Player's ± / Minutes Played`,
  ].join("\n\n")

  console.clear()
  console.log(markdown)

  r.getComment(COMMENT_ID).edit(markdown)

}



// setInterval(runFunction, 30000)
runFunction()
