// const db = mysql.createConnection({
//     host: 'mysqldb-nodejs-db-nodejs.a.aivencloud.com',
//     port: '15292',
//     user: 'avnadmin',
//     password: 'AVNS_7_-TDwKOAalQNuMTrXl',
//     database: 'defaultdb',
//   });
//   const mysql22 = mysql.createConnection({
//     host: "192.168.3.124",
//     port: "3306",
//     user: "root",
//     password: "Root$#123",
//     database: "ezeefile_updc",
//   });
//   const misdb = mysql.createConnection({
//     host: "localhost",
//     port: "3306",
//     user: "root",
//     password: "root",
//     database: "updc_misdb",
//   });
  const dbConfig = {
    host: '192.168.3.124',
    port: '3306',
    user: 'root',
    password: 'Root$#123',
    database: 'ezeefile_updc',
  };
  
  module.exports = dbConfig;