var fs = require('fs');
var jqueryCSV = require('jquery-csv');

const CSV_FILE = "./data/moments_20220108.csv"

fs.readFile(CSV_FILE, 'UTF-8', function (err, csv) {
  if (err) { console.log(err); }
  const objects = jqueryCSV.toObjects(csv)
  console.log(objects)
  // jqueryCSV.toArrays(csv, {}, function(err, data) {
  //   for(var i=0, len=data.length; i<len; i++) {
  //     console.log(data[i]); //Will print every csv line as a newline
  //   }
  // });
})