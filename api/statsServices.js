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

    const isSeasonMatch = points >= 27 && rebs >= 6 && assists >= 7;
    const isPointMatch = !isSeasonMatch && points >= 27;
    const isRebAstMatch = !isSeasonMatch && rebs >= 6 && assists >= 7;
    const offTracker = () => {
      if(isSeasonMatch || isPointMatch || isRebAstMatch) return 0;
      const offPoints = 27 - points;
      const offRebAst = Math.max((7 - assists), 0) + Math.max((6 - rebs), 0)
      return Math.max(offPoints/27, offRebAst/13)
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
      pointRebAst: points + rebs + assists,
      rebAst: rebs + assists,
      teams: gameData.teams,
      ownTeam: gameData[player.teamId].code,
      gameOver: gameData.gameOver,
      teamMargin: gameData[player.teamId].margin,
      plusMinus,
      secondsPlayed: calculateSeconds(player.min),
      timeLeft: gameData.timeLeft,
      isSeasonMatch,
      isPointMatch,
      isRebAstMatch,
      offTracker: offTracker(),
      specialMsg: `${points}pts / ${rebs}rebs / ${assists}assists`
    }
  })
}

exports.formatStats = formatStats;