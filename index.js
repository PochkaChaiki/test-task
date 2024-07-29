const pgYaCloud = require('./pgYaCloud.js');
const https = require('node:https');

async function getCharacters(url) {
  console.log(url);
  return new Promise((resolve, reject) => {
    https.get(url, async res => {
      let data = [];
      res.on('data', chunk => {
        data.push(chunk);
      });

      res.on('end', async () => {
        try {
          let dataObject = JSON.parse(Buffer.concat(data).toString());
          let nextUrl = dataObject.info.next;

          let characters = dataObject.results;
          let query = `INSERT INTO heroes (name, data) VALUES `;
          let j = 1;
          for (let i = 0; i < characters.length; i++) {
            query += `($${j}, $${j+1}),`;
            j += 2;
          }
          query = query.slice(0, -1);
          let values = [];
          characters.forEach(obj => values.push(obj.name, obj));

          //------------------------ Inserting values to database ------------------------------
          await new Promise((resolve, reject) => {
            pgYaCloud.pgQueryExecuteJResult(query, values, (dbErr, dbRes) => {
              if (dbErr) {
                console.log(JSON.stringify({status: false, message: dbErr.where || dbRes}));
                reject(dbErr);
              } else {
                console.log(JSON.stringify({status: true, message: dbRes}));
                resolve(dbRes);
              }
            });
          });

          // ---------------- Count query to check if inserting works properly -----------------
          await new Promise((resolve, reject) => {
            pgYaCloud.pgQueryExecuteJResult("SELECT COUNT(*) FROM heroes", [], (dbErr, dbRes) => {
              if (dbErr) {
                console.log(JSON.stringify({status: false, message: dbErr.where || dbRes}));
                reject(dbErr);
              } else {
                console.log(JSON.stringify({status: true, message: dbRes}));
                resolve(dbRes);
              }
            });
          });

          resolve(nextUrl);
        } catch (error) {
          reject(error);
        }
      });

      res.on('error', reject);
    })
  });
}

async function main() {
  
  // await new Promise((resolve, reject) => {
  //   pgYaCloud.pgQueryExecuteJResult("DROP TABLE IF EXISTS heroes;", [], (dbErr, dbRes)=>{
  //     if (dbErr) {
  //       console.log(JSON.stringify({status: false, message: dbErr.where || dbRes}));
  //       reject(dbErr);
  //     } else {
  //       console.log(JSON.stringify({status: true, message: dbRes}));
  //       resolve(dbRes);
  //     }
  //   })
  // });

  await new Promise((resolve, reject) => {
    pgYaCloud.pgQueryExecuteJResult("CREATE TABLE IF NOT EXISTS heroes (id SERIAL PRIMARY KEY, name TEXT, data jsonb);", [], (dbErr, dbRes) => {
      if (dbErr) {
        console.log(JSON.stringify({status: false, message: dbErr.where || dbRes}));
        reject(dbErr);
      } else {
        console.log(JSON.stringify({status: true, message: dbRes}));
        resolve(dbRes);
      }
    });
  });

  let nextUrl = "https://rickandmortyapi.com/api/character";
  while (nextUrl) {
    try {
      nextUrl = await getCharacters(nextUrl);
    } catch (error) {
      console.error("Error fetching characters:", error);
      break;
    }
  }
}

main();
