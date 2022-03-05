const axios = require('axios').default;
const _ = require('lodash')
const BB = require("bluebird");
const snoowrap = require('snoowrap');
require('dotenv').config();

const IDS = [
  '0022100932',
  '0022100933',
  '0022100934',
  '0022100935',
  '0022100936',
  '0022100937',
  '0022100938',
  '0022100939'
]

const DATE = '20220302'

const URLS = IDS.map(id => `https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_${id}.json`);
const THURSDAY_BOXSCORE_URLS = IDS.map(id => `https://data.nba.net/10s/prod/v1/${DATE}/${id}_boxscore.json`);

const COMMENT_ID = 'hz43njz'
const MADE = 'Made'

const scoringPlays = {
  '2pt': true,
  '3pt': true,
  'freethrow': true
}

const zeroPad = (num, 
  places) => String(num).padStart(places, '0')

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

const findFirstToPoints = (targetPoints, plays) => {
  const results = {}
  const shootingPlays = plays.filter(play => scoringPlays[play.actionType] && play.shotResult === MADE)
  const teams = _.uniq(shootingPlays.map(play => play.teamTricode)).join('-')
  let someoneReachedTargetedPoints = false
  let winner;
  shootingPlays.forEach(play => {
    if(!someoneReachedTargetedPoints && play.pointsTotal >= targetPoints){
      someoneReachedTargetedPoints = true
      // console.log(play.playerNameI, play.teamTricode)
      winner = [play.playerNameI, play.teamTricode, teams]
    }
    results[play.playerNameI] = play.pointsTotal
  })

  if(!someoneReachedTargetedPoints){
    const sorted = 
      Object.keys(results)
      .sort((a,b) =>results[b] - results[a] )
      .slice(0,4)
      .reduce(
        (_sortedObj, key) => ({
          ..._sortedObj,
          [key]: results[key]
        }),
        {}
      );
    if(sorted){
      winner = {
        teams: _.uniq(shootingPlays.map(play => play.teamTricode)).join('-'),
        sorted,
      }
    }
  }

  return winner;
}

const findFirstToAst = (targetAst, plays) => {
  const results = {}
  const assistedPlays = plays.filter(play => play.assistTotal)
  const teams = _.uniq(assistedPlays.map(play => play.teamTricode)).join('-')
  let someoneReachedTargetedAssists = false
  let winner;
  assistedPlays.forEach(play => {
    if(!someoneReachedTargetedAssists && play.assistTotal >= targetAst){
      someoneReachedTargetedAssists = true
      winner = [play.assistPlayerNameInitial, play.teamTricode, teams]
    }
    results[play.assistPlayerNameInitial] = play.assistTotal
  })

  if(!someoneReachedTargetedAssists){
    const sorted = 
      Object.keys(results)
      .sort((a,b) =>results[b] - results[a] )
      .slice(0,4)
      .reduce(
        (_sortedObj, key) => ({
          ..._sortedObj,
          [key]: results[key]
        }),
        {}
      );
    if(sorted){
      winner = {
        teams: _.uniq(assistedPlays.map(play => play.teamTricode)).join('-'),
        sorted,
      }
    }
  }

  return winner;
}

const findFirstTo3PM = (target3PM, plays) => {
  const results = {}
  const threePointsPlays = plays.filter(play => play.actionType === '3pt' && play.shotResult === 'Made')
  const teams = _.uniq(threePointsPlays.map(play => play.teamTricode)).join('-')
  let someoneReached3PMTarget = false
  let winner;
  // console.log(threePointsPlays.map(p => p.playerNameI))
  threePointsPlays.forEach(play => {
    const playerName = play.playerNameI
    if(results[playerName]){
      results[playerName] += 1
    }else{
      results[playerName] = 1
    }

    if(!someoneReached3PMTarget && results[playerName] >= target3PM){
      someoneReached3PMTarget = true
      // console.log(play.playerNameI, play.teamTricode)
      winner = [playerName, play.teamTricode, teams]
      // console.log(winner)
    }
  })

  if(!someoneReached3PMTarget){
    const sorted = 
      Object.keys(results)
      .sort((a,b) =>results[b] - results[a] )
      .slice(0,4)
      .reduce(
        (_sortedObj, key) => ({
          ..._sortedObj,
          [key]: results[key]
        }),
        {}
      );
    if(sorted){
      winner = {
        teams: _.uniq(threePointsPlays.map(play => play.teamTricode)).join('-'),
        sorted,
      }
    }
  }

  return winner;
}

const findFirstToValentine = (plays) => {
  const results = {}
  const valentinePlays = plays.filter(play =>{
    const isScoringPlay = scoringPlays[play.actionType] && play.shotResult === MADE
    const isReboundPlay = play.actionType === 'rebound'
    return isScoringPlay || isReboundPlay
  })
  const teams = _.uniq(plays.map(play => play.teamTricode).filter(x=>x)).join('-')
  let someoneReachedValentineTarget = false
  let winner;
  // console.log(threePointsPlays.map(p => p.playerNameI))
  valentinePlays.forEach(play => {
    const isScoringPlay = scoringPlays[play.actionType] && play.shotResult === MADE
    const isReboundPlay = play.actionType === 'rebound'
    const playerName = play.playerNameI;
    const astPlayerName = play.assistPlayerNameInitial

    if(!results[playerName]){
      results[playerName] = {
        points: 0,
        rebs: 0,
        ast: 0,
        sum: 0
      }
    }
    if(astPlayerName && !results[astPlayerName]){
      results[astPlayerName] = {
        points: 0,
        rebs: 0,
        ast: 0,
        sum: 0
      }
    }

    if(isReboundPlay){
      results[playerName]['rebs'] = Number(play.reboundTotal)
    }else if(isScoringPlay){
      results[playerName]['points'] = Number(play.pointsTotal)
      if(play.assistTotal){
        results[astPlayerName]['ast'] = Number(play.assistTotal)
      }
    }

    const isPlayerFinish = results[playerName] && results[playerName].points >= 10 && results[playerName].rebs >= 2 && results[playerName].ast >= 2
    const isAstPlayerFinish = results[astPlayerName] && results[astPlayerName].points >= 10 && results[astPlayerName].rebs >= 2 && results[astPlayerName].ast >= 2
    
    if(!someoneReachedValentineTarget && isPlayerFinish){
      someoneReachedValentineTarget = true
      // console.log(play.playerNameI, play.teamTricode)
      winner = [playerName, play.teamTricode, teams]
      // console.log(winner)
    }else if(!someoneReachedValentineTarget && isAstPlayerFinish){
      someoneReachedValentineTarget = true
      winner = [astPlayerName, play.teamTricode, teams]
    }

    Object.keys(results).filter(x=>x).forEach(key => {
      results[key].sum = Number(results[key].points) + Number(results[key].rebs) + Number(results[key].ast)
    })
  })

  if(!someoneReachedValentineTarget){
    const sorted = 
      Object.keys(results)
      .filter(x=>x)
      .sort((a,b) =>results[b].sum - results[a].sum )
      .slice(0,4)
      .reduce(
        (_sortedObj, key) => ({
          ..._sortedObj,
          [key]: results[key]
        }),
        {}
      );
    if(sorted){
      winner = {
        teams: _.uniq(valentinePlays.map(play => play.teamTricode)).join('-'),
        sorted,
      }
    }
  }

  return winner;
}

const findFirstToRebAndAst = (targetAmt, plays) => {
  const results = {}
  const rebsOrAstsPlays = plays.filter(play => play.assistTotal || play.actionType === 'rebound')
  const teams = _.uniq(rebsOrAstsPlays.map(play => play.teamTricode)).join('-')
  let someoneReachedTarget = false
  let winner;
  // assistedPlays.forEach(play => {
  //   if(!someoneReachedTarget && play.assistTotal >= targetAst){
  //     someoneReachedTarget = true
  //     winner = [play.assistPlayerNameInitial, play.teamTricode, teams]
  //   }
  //   results[play.assistPlayerNameInitial] = play.assistTotal
  // })

  rebsOrAstsPlays.forEach(play => {

    const playerName = play.playerNameI;
    const astPlayerName = play.assistPlayerNameInitial

    const isAstPlay = play.assistTotal;
    const isReboundPlay = play.actionType === 'rebound';

    if(isAstPlay){
      if(results[astPlayerName]){
        results[astPlayerName].asts = play.assistTotal
      }else{
        results[astPlayerName] = {
          name: astPlayerName,
          rebs: 0,
          asts: play.assistTotal,
          playerId: String(play.assistPersonId)
        }
      }
    }

    if(isReboundPlay){
      if(results[playerName]){
        results[playerName].rebs = play.reboundTotal
      }else{
        results[playerName] = {
          name: playerName,
          rebs: play.reboundTotal,
          asts: 0,
          playerId: String(play.assistPersonId)
        }
      }
    }

    const isPlayerFinish = results[playerName]?.rebs >= targetAmt && results[playerName]?.asts >= targetAmt
    const isAstPlayerFinish = results[astPlayerName]?.rebs >= targetAmt && results[astPlayerName]?.asts >= targetAmt

    if(!someoneReachedTarget && isPlayerFinish && playerName != 'T. Watford'){
      someoneReachedTarget = true
      // winner = [playerName, play.teamTricode, teams]
      // console.log(results)
      winner = {
        teams: _.uniq(rebsOrAstsPlays.map(play => play.teamTricode)).join('-'),
        status: 'finished',
        name: playerName
      }
    }else if(!someoneReachedTarget && isAstPlayerFinish && astPlayerName != 'T. Watford'){
      someoneReachedTarget = true
      // winner = [astPlayerName, play.teamTricode, teams]
      // console.log(results)
      winner = {
        teams: _.uniq(rebsOrAstsPlays.map(play => play.teamTricode)).join('-'),
        status: 'finished',
        name: astPlayerName
      }
    }

    Object.keys(results).filter(x=>x).forEach(key => {
      results[key].sum = (Number(results[key].rebs) + Number(results[key].asts)) || 0
    })
  })

  if(!someoneReachedTarget){
    const sorted = 
      Object.keys(results)
      .sort((a,b) =>results[b].sum - results[a].sum )
      .map(key => results[key])

      console.log(sorted)

    if(sorted){
      winner = {
        teams: _.uniq(rebsOrAstsPlays.map(play => play.teamTricode)).join('-'),
        status: 'in_progress',
        sorted,
      }
    }
  }

  return winner;
}

const countNumberOfDunks = (plays) => {
  const results = {}
  // const valentinePlays = plays.filter(play =>{
  //   const isScoringPlay = scoringPlays[play.actionType] && play.shotResult === MADE
  //   const isReboundPlay = play.actionType === 'rebound'
  //   return isScoringPlay || isReboundPlay
  // })

  const dunkPlays = plays.filter(play => play.subType === 'DUNK' && play.shotResult === MADE)
  const teams = _.uniq(plays.map(play => play.teamTricode).filter(x=>x)).join('-')
  let winner;
  dunkPlays.forEach(play => {

    const playerName = play.playerNameI;

    if(results[playerName]){
      results[playerName].dunks += 1
    }else{
      results[playerName] = {
        name: playerName,
        dunks: 1,
        playerId: String(play.personId)
      }
    }
  })

  // console.log(results)

  const sorted = 
    Object.keys(results)
    .sort((a,b) =>results[b].dunks - results[a].dunks)
    .map(key => results[key])

  return sorted;
}

const renderSortedObject = (sortedObj) => {
  const result = []
  console.log(sortedObj)
  for(const person in sortedObj){
    console.log(person)
    if(person != 'undefined'){
      result.push(`* ${person}: ${sortedObj[person].points}pts / ${sortedObj[person].rebs}rebs / ${sortedObj[person].ast}ast`)
    }
    // console.log(`- ${person}: ${sortedObj[person]}`)
  }

  // console.log(result)

  return result.slice(0,3)
}

const calculateSeconds = (time) => {
  if(!time) return 0;

  const timeArray = time.split(":");
  return Number(timeArray[0])*60 + Number(timeArray[1])
}

const formatStats = (players, gameData) => {
  return players.map(player => {
    return {
      name: `${player.firstName} ${player.lastName}`,
      points: Number(player.points),
      rebs: Number(player.totReb),
      blks: Number(player.blocks),
      fga: Number(player.fga),
      ftm: Number(player.ftm),
      assists: Number(player.assists),
      fgm: Number(player.fgm),
      fgmFtm: Number(player.ftm) + Number(player.fgm),
      teams: gameData.teams,
      team: gameData[player.teamId].code,
      gameOver: gameData.gameOver,
      teamMargin: gameData[player.teamId].margin,
      plusMinus: Number(player.plusMinus),
      secondsPlayed: calculateSeconds(player.min),
      timeLeft: gameData.timeLeft,
      playerId: player.personId,
      // to be handle by other endpoints
      dunks: 0
    }
  })
}

const fetchGameResults = async (urls) => {
  let remainingGames= 0;

  return {
    results: await BB.map(urls, async url => {
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
        // console.log(hTeam.code, vTeam.code)

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
        // console.log(error)
        remainingGames++
        // console.log('Game has Not started yet');
        return []
      })
     }),
     remainingGames
  }
}

const sortPlayersByAttribute = (players, attribute) => {
  return players.sort((a,b) => {
    if(a[attribute] != b[attribute]){
      return b[attribute] - a[attribute]
    }

    // Special Tiebreaker
    if(a.points != b.points){
      return b.points - a.points
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
  return players.map((player, idx) => {
    const playerInfo = player.gameOver ? `* **${player.name}: ${player[attribute]}**` : `${player.name}: ${player[attribute]}`

    if(idx===0) return `${playerInfo} ${player.timeLeft}\n\n-------------------------`
    if(idx >= 1 && player.gameOver) return undefined;
    return `${playerInfo} ${player.timeLeft}`
  }).filter(x => !!x).slice(0,4)
}

const renderSortedArray = (sortedArray) => {
  // console.log(sortedArray)
  return sortedArray.filter(x=>x.name).map(res => `* ${res.name}: ${res.rebs} rebs / ${res.asts} asts`).slice(0,7)
}

const runFunction = async () => {
  let remainingGames= 0;
  // console.log(`## Final`)

  const results =await BB.map(URLS, async url => {
    return axios.get(url)
      .then(response => {
        const plays = response.data.game.actions;
        // return findFirstToPoints(15, plays)
        // return findFirstToAst(5, plays);
        return findFirstToRebAndAst(5,plays);
      })
      .catch(function (error) {
        // handle error
        // console.log(error)
        remainingGames++
        return undefined;
        // console.log(error.response.data);
        // console.log('Game has Not started yet');
      })
  })

  console.log(results.filter(r => r.sorted))

  const {results: boxScores, remainingGames: wednesdayRemainingGames} = await fetchGameResults(THURSDAY_BOXSCORE_URLS)

  const r = new snoowrap({
    userAgent: 'KobeBot',
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_SECRET_ID,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN,
  });

  // console.log(results)

  const allResults = results.filter(x=> x).flat()
  const allBoxScores = boxScores.filter(x=> x).flat()
  const allBoxScoresLookup = allBoxScores.reduce((accum, player) => {
    accum[player.playerId] = player;
    return accum
  }, {})

  const wednesdayPlayers = Object.values(allBoxScoresLookup)
  let wednesdayPlayersByGames = {}

  wednesdayPlayers.forEach(player => {
    if(wednesdayPlayersByGames[player.teams]){
      wednesdayPlayersByGames[player.teams].push(player)
    }else{
      wednesdayPlayersByGames[player.teams] = [player]
    }
  })

  const finished = results.filter(x=>x).filter(x => x.status === 'finished').map(player => {
    return [`**${player.teams}**\n\n* **${player.name}**`]
  })

  const gamesInProgress = results.filter(x=>x).filter(r => r.status === 'in_progress').map((res, idx) => {
    // return [`**${res.teams}**`, renderSortedObject(res.sorted)]
    if(idx===0) return [`## Ongoing Games`,`**${res.teams}**`, renderSortedArray(res.sorted).join("\n\n")].join("\n\n")
    return [`**${res.teams}**`, renderSortedArray(res.sorted).join("\n\n")].join("\n\n")
    // return [`## Ongoing Games`,`**${res.teams}**`, 'Status: TBD', `Last bucket: _${res.currentLastShot}_`].join("\n\n")
  })

  // console.log(gamesInProgress)

  
  // const wednesdayPlayers = Object.values(allBoxScoresLookup)
  // let wednesdayPlayersByGames = {}

  // wednesdayPlayers.forEach(player => {
  //   if(wednesdayPlayersByGames[player.teams]){
  //     wednesdayPlayersByGames[player.teams].push(player)
  //   }else{
  //     wednesdayPlayersByGames[player.teams] = [player]
  //   }
  // })

  // const thursdayLeaders = Object.keys(thursdayPlayersByGames).map(teams => {
  //   const sortedPlayers = sortPlayersByAttribute(thursdayPlayersByGames[teams], 'dunks')
  //   return [
  //     `**${teams}**`,
  //     ...standingsByAttribute(sortedPlayers, 'dunks')
  //   ].join('\n\n')
  // })

  // console.log(thursdayLeaders)

  const markdown = [
    `## First to Rebs/Asts Leaders`,
    ...finished,
    ...gamesInProgress,
    `There are ${wednesdayRemainingGames} Thursday games that have not started yet.`,
    `**Update: ${new Date().toLocaleString()} PST**`,
    `**Bolded players** are done for the challenge`,
    `[Numbers] in bracket show time left in regulation for the game`,
    `Tiebreakers: Points Scored / Team Margin / Player's ± / Minutes Played`,
  ].join("\n\n")

  console.clear()
  console.log(markdown)

  r.getComment(COMMENT_ID).edit(markdown)
  // setTimeout(()=>{
  //   r.getComment(COMMENT_ID_2).edit(markdown)
  // }, 15000)
}

// setInterval(runFunction, 45000)
runFunction()



