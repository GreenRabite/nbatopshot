const _ = require('lodash')

const VALID_FIRST_TO_STATS = {
  assists: true,
  rebs: true,
  points: true,
}

const VALID_LAST_MADE_SHOT = {
  tpm: true,
  fgm: true,
}

const VALID_FIRST_MADE_SHOT = {
  fgm: true,
}

/** 
 * Exported function that will take in an array of plays from NBA.com play by play
 * endpoint, the stat you are tracking, and the target number of the stat you are
 * looking for, will invoke the correct function to get that stat
 * array prepared for markdown.
 * @param {Object[]} plays plays from NBA.com play by play endpoint
 * @param {string} stat the stat attribute we are targetting to reach first for
 * @param {number} numer the targeted amount to reach first for the stat
 * @returns {string[]} Converted markdown
*/
const firstToStat = (plays, stat, number) => {
  if(!VALID_FIRST_TO_STATS[stat]){
    throw 'Stat isnt valid for this function'
  }
  
  if(stat === 'assists'){
    return findFirstToAst(plays, number);
  }else if(stat === 'rebs'){
    return findFirstToReb(plays, number)
  }else if(stat === 'points'){
    return findFirstToPoints(plays, number)
  }
}

const lastMadeShot = (plays, stat) => {
  if(!VALID_LAST_MADE_SHOT[stat]){
    throw 'Stat isnt valid for this function'
  }
  if(plays.length === 0) return undefined;

  if(stat === 'tpm'){
    return findLastMade3pm(plays)
  }else if(stat === 'fgm'){
    return findLastMadeShot(plays)
  }
}

const firstMadeShot = (plays, stat) => {
  if(!VALID_FIRST_MADE_SHOT[stat]){
    throw 'Stat isnt valid for this function'
  }
  if(plays.length === 0) return undefined;

  if(stat === 'fgm'){
    return findFirstMadeFgm(plays)
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
        teams: _.uniq(plays.map(play => play.teamTricode)).join('-'),
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
        teams: _.uniq(plays.map(play => play.teamTricode)).join('-'),
        status: 'in_progress',
        sorted,
      }
    }
  }

  return winner;
}

const findFirstToPoints = (plays, number) => {
  const results = {}
  let winner;
  const scoringPlays = {
    '2pt': true,
    '3pt': true,
    'freethrow': true
  }

  const filteredPlays = plays.filter(play => scoringPlays[play.actionType] && play.shotResult === 'Made')
  let someoneReachedTarget = false;
  filteredPlays.forEach(play => {
    const playerName = play.playerNameI;

    if(results[playerName]){
      results[playerName].sum = play.pointsTotal
    }else{
      results[playerName] = {
        name: playerName,
        sum: play.pointsTotal,
        playerId: String(play.personId)
      }
    }

    const isPlayerFinish = results[playerName]?.sum >= number;

    if(!someoneReachedTarget && isPlayerFinish){
      someoneReachedTarget = true
      winner = {
        teams: _.uniq(plays.map(play => play.teamTricode)).join('-'),
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
        teams: _.uniq(plays.map(play => play.teamTricode)).join('-'),
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
  const scoringPlays = plays.filter(play => play?.shotResult === 'Made' && play.isFieldGoal === 1);
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

const findFirstMadeFgm = (plays) => {
  const teams = _.uniq(plays.map(play => play.teamTricode).filter(x=>x)).join('-')
  const scoringPlays = plays.filter(play => play?.shotResult === 'Made' && play.isFieldGoal === 1);
  const winningShot = scoringPlays[0]
  let winner;
  if(!!winningShot){
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



exports.firstToStat = firstToStat
exports.lastMadeShot = lastMadeShot
exports.firstMadeShot = firstMadeShot