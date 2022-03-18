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
      teams: gameData.teams,
      ownTeam: gameData[player.teamId].code,
      gameOver: gameData.gameOver,
      teamMargin: gameData[player.teamId].margin,
      plusMinus,
      secondsPlayed: calculateSeconds(player.min),
      timeLeft: gameData.timeLeft,
    }
  })
}

exports.formatStats = formatStats;