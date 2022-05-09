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
    const fga = Number(player.fga);
    const ftm = Number(player.ftm);
    const tpm = Number(player.tpm);
    const plusMinus = Number(player.plusMinus);

    const atLeastOne = (num) => num > 0;
    const isFiveCat = atLeastOne(points) && atLeastOne(rebs) && atLeastOne(blks) && atLeastOne(steals) && atLeastOne(assists);
    const offTracker = () => {
      if(isFiveCat) return 0;
      return [atLeastOne(points), atLeastOne(rebs), atLeastOne(blks), atLeastOne(steals), atLeastOne(assists)].filter(x=>x).length
    }
    
    return {
      playerId: player.personId,
      name: `${player.firstName} ${player.lastName}`,
      points,
      rebs,
      blks,
      steals,
      fgm,
      fga,
      ftm,
      tpm,
      assists,
      fiveCat: isFiveCat,
      rebAst: rebs + assists,
      rebStlBlk: rebs + steals + blks,
      teams: gameData.teams,
      ownTeam: gameData[player.teamId].code,
      gameOver: gameData.gameOver,
      teamMargin: gameData[player.teamId].margin,
      plusMinus,
      secondsPlayed: calculateSeconds(player.min),
      timeLeft: gameData.timeLeft,
      offTracker: offTracker(),
      specialMsg: `[${points}pts | ${rebs}rebs | ${steals}steals | ${assists}assists | ${blks}blks]`,
      specialMsg2: points + rebs + steals + assists + blks,
    }
  })
}

const combineStats = (players) => {
  const results =  players.reduce((accum, player) => {
    if(accum[player.playerId]){
      const oldPlayerStat = accum[player.playerId];
      accum[player.playerId] = {
        ...player,
        points: oldPlayerStat.points + player.points,
        tpm: oldPlayerStat.tpm + player.tpm,
        fgm: oldPlayerStat.fgm + player.fgm,
        steals: oldPlayerStat.steals + player.steals,
        assists: oldPlayerStat.assists + player.assists,
        rebs: oldPlayerStat.rebs + player.rebs,
        ftm: oldPlayerStat.ftm + player.ftm,
        blks: oldPlayerStat.blks + player.blks,
      };
    }else{
      accum[player.playerId] = player;
    }
    return accum;
  }, {})

  return Object.values(results)
}

exports.formatStats = formatStats;
exports.combineStats = combineStats;