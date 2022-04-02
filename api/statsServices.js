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

    const isBlkMatch = blks >= 3;
    const isStealsMatch = steals >=2;
    const isTpmMatch = tpm >= 4;
    const offTracker = () => {
      if(isStealsMatch) return 0;
      const offSteals = Math.max((2 - blks), 0);
      return 1 - Math.min(offSteals/2)
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
      isBlkMatch,
      isStealsMatch,
      isTpmMatch,
      offTracker: offTracker(),
      specialMsg: `${steals}stls / ${blks}blks / ${tpm}TPM`
    }
  })
}

exports.formatStats = formatStats;