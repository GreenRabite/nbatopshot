const { Client } = require('pg');
var connectionString = process.env.LOCALHOST_DB_CONNECTION;

const client = new Client({
    connectionString: connectionString
});