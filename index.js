const https = require('node:https');
const pgYaCloud = require('./pgYaCloud.js');

    // await pgYaCloud.pgQueryExecuteJResult("DROP TABLE IF EXISTS heroes;", [], (dbErr, dbRes)=>{
    //   if (dbErr){
    //     console.log(JSON.stringify({status: false, message: dbErr.where || dbRes}));
    //   } else {
    //     console.log(JSON.stringify({status: true, message: null}));
    //   }
    // })

https.get("https://rickandmortyapi.com/api/character/[1,2,3,4,5,6]", async res =>{
  let data = [];
  await res.on('data', chunk => {
    data.push(chunk);
  })

  await res.on('end', async()=>{

    await pgYaCloud.pgQueryExecuteJResult("CREATE TABLE IF NOT EXISTS heroes (id SERIAL PRIMARY KEY, name TEXT, data jsonb);", [], (dbErr, dbRes)=>{
      if (dbErr){
        console.log(JSON.stringify({status: false, message: dbErr.where || dbRes}));
      } else {
        console.log(JSON.stringify({status: true, message: null}));
      }
    })

    const characters = JSON.parse(Buffer.concat(data).toString())
    let query = `INSERT INTO heroes (name, data) VALUES `;
    let j = 1;
    for (let i = 0; i < data.length; i++){
      query += `($${j}, $${j+1}),`;
      j+=2;
    }
    query += `($${j}, $${j+1})`;
    console.log(query)
    console.log(j, data.length)
    let values = [];
    characters.map((obj => values.push(obj.name, obj)));
    
    await pgYaCloud.pgQueryExecuteJResult(query, values, (dbErr, dbRes)=>{
      if (dbErr){
        console.log(JSON.stringify({status: false, message: dbErr.where || dbRes}));
      } else {
        console.log(JSON.stringify({status: true, message: null}));
      }
    });
    await pgYaCloud.pgQueryExecuteJResult("SELECT COUNT(*) FROM heroes", [], (dbErr, dbRes)=>{
      if (dbErr){
        console.log(JSON.stringify({status: false, message: dbErr.where || dbRes}));
      } else {
        console.log(JSON.stringify({status: true, message: dbRes}));
      }
    });
  })
})

