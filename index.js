const https = require('node:https');
const pgYaCloud = require('./pgYaCloud.js');

    // pgYaCloud.pgQueryExecuteJResult("DROP TABLE IF EXISTS heroes;", [], (dbErr, dbRes)=>{
    //   if (dbErr){
    //     console.log(JSON.stringify({status: false, message: dbErr.where || dbRes}));
    //   } else {
    //     console.log(JSON.stringify({status: true, message: null}));
    //   }
    // })

https.get("https://rickandmortyapi.com/api/character/[1,2,3,4,5,6]", async res =>{
  // --------------- Getting characters from service ---------------------------------
  let data = [];
  res.on('data', chunk => {
    data.push(chunk);
  })

  res.on('end', async()=>{

    // ------------- Creating table ---------------------------------------------------
    await new Promise((resolve, reject)=>{
      pgYaCloud.pgQueryExecuteJResult("CREATE TABLE IF NOT EXISTS heroes (id SERIAL PRIMARY KEY, name TEXT, data jsonb);", [], (dbErr, dbRes)=>{
        if (dbErr){
          console.log(JSON.stringify({status: false, message: dbErr.where || dbRes}));
          reject(dbErr);
        } else {
          console.log(JSON.stringify({status: true, message: dbRes}));
          resolve(dbRes);
        }
      })
    });

    // --- Making string and formating values to pass them to function later ----------

    let characters = JSON.parse(Buffer.concat(data).toString())
    let query = `INSERT INTO heroes (name, data) VALUES `;
    let j = 1;
    for (let i = 0; i < characters.length; i++){
      query += `($${j}, $${j+1}),`;
      j+=2;
    }
    query = query.slice(0, -1);
    let values = [];
    characters.map((obj => values.push(obj.name, obj)));

    // ------------- Inserting values to database -------------------------------------
    await new Promise((resolve, reject)=>{
      pgYaCloud.pgQueryExecuteJResult(query, values, (dbErr, dbRes)=>{
        if (dbErr){
          console.log(JSON.stringify({status: false, message: dbErr.where || dbRes}));
          reject(dbErr);
        } else {
          console.log(JSON.stringify({status: true, message: null}));
          resolve(dbRes);
        }
      });
    });

    // ------------- Count query to check if inserting works properly --------------------
    await new Promise((resolve, reject)=>{
      pgYaCloud.pgQueryExecuteJResult("SELECT COUNT(*) FROM heroes", [], (dbErr, dbRes)=>{
        if (dbErr){
          console.log(JSON.stringify({status: false, message: dbErr.where || dbRes}));
          reject(dbErr);
        } else {
          console.log(JSON.stringify({status: true, message: dbRes}));
          resolve(dbRes);
        }
      });
    });
  })
})

