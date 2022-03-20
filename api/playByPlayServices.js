const _ = require('lodash')

const VALID_FIRST_TO_STATS = {
  assists: true,
  rebs: true,
}

const VALID_LAST_MADE_SHOT = {
  tpm: true,
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
const firstToStat = ({plays, stat, number}) => {
  if(!VALID_FIRST_TO_STATS[stat]){
    throw 'Stat isnt valid for this function'
  }
  
  if(stat === 'assists'){
    return findFirstToAst(plays, number);
  }else if(stat === 'rebs'){
    return findFirstToReb(plays, number)
  }
}

const lastMadeShot = ({plays, stat}) => {
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



exports.firstToStat = this.firstToStat
exports.lastMadeShot = this.lastMadeShot