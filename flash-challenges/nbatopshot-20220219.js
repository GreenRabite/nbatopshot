

const fetchPlayByPlay = async (urls) => {
  let remainingGames= 0;
  
  return {
    results: await BB.map(URurlsLS, async url => {
      return axios.get(url)
        .then(response => {
          const plays = response.data.game.actions;
          return findLastMadeShot(plays);
        })
        .catch(function (error) {
          // handle error
          // console.log(error)
          remainingGames++
          return undefined;
        })
    }),
    remainingGames
  }
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