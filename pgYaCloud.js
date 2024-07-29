const pg = require("pg");
const fs = require("fs");
const util = require('util');
const path = require('path');

// >> connection parm init -------------------------------------------------------------------
const connectionParm = require('./config.json')['db']["pgYaCloud"];

const connectionUrl = util.format('postgres://%s:%s@%s/%s', connectionParm.dbUser, encodeURIComponent(connectionParm.dbPass), connectionParm.dbHosts.join(','), connectionParm.dbName);

const connectionOptions = {
    connectionString: connectionUrl,
    ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync(path.join(__dirname,  './postgresql', connectionParm.caCert)).toString()
    },
}
// << connection parm init -------------------------------------------------------------------


exports.pgQueryExecuteJResult = function (query, data, callback){
    const pgClient = new pg.Client(connectionOptions);
    pgClient.connect((err) => {
        if (err) {
            callback(err, err.message);
            return false;
        }
    });

    pgClient.query(query, data, (err, q) => {
        if (err) {
            pgClient.end();
            callback(err, err.message);
            return false;
        }
        callback(false, q.rows[0]);
        pgClient.end();
    });
}

