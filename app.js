const express = require('express');
const { Client } = require('pg');
const fs = require('fs')
const _ = require('lodash');
const Moment = require('./db/models/moment');
const OwnedMoment = require('./db/models/owned_moment');

const run = async () => {
	const moments = await Moment.findAll();
	const commonMoments = moments.filter(moment =>moment.tier === 'Common' && moment.series != '1' )
															 .filter(m => m.setName != 'WNBA: Best of 2021' && m.setName != 'Archive Set' && m.setName != 'Run It Back 2005-06')
	const momentsHash = commonMoments.reduce((accum,moment) => {
		if(accum[moment.name]){
			accum[moment.name].push({
				id: moment.id,
				count: moment.circulation,
			})
			return accum;
		}else{
			accum[moment.name] = [{
				id: moment.id,
				count: moment.circulation,
			}]
			return accum;
		}
	}, {})

	const ownedMoments = await OwnedMoment.findAll();
	const ownedMomentsNames = _.uniq(ownedMoments.map(moment => moment.name))

	const keys = Object.keys(momentsHash).filter(key => momentsHash[key].length <= 2 && momentsHash[key].every(set => set.count < 60000))
	
	const needed = keys.filter(key => !ownedMomentsNames.includes(key))

	fs.writeFile('data/needed_moments.txt', needed.map(need => [need,momentsHash[need].map(obj => obj.count).join('-')].join(": ")).join('\n'), err => {
  if (err) {
    console.error(err)
    return
  }
  //file written successfully
})

	
}

run()