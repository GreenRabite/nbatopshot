// https://data.nba.net/10s/prod/v1/20220123/0022100708_boxscore.json

const apiServices = require('../api/apiServices')

const {fetchGameResults} = apiServices;
fetchGameResults(['https://data.nba.net/10s/prod/v1/20220123/0022100708_boxscore.json']).then(res => console.log(res))