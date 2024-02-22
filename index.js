const express = require('express');
var cors = require('cors')
const mysql = require('mysql2');

 
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors())

const db = mysql.createConnection({
  host: 'mysqldb-nodejs-db-nodejs.a.aivencloud.com',
  port:'15292',
  user: 'avnadmin',
  password: 'AVNS_7_-TDwKOAalQNuMTrXl',
  database: 'defaultdb',
});

var corsOptions = {
  origin: 'https://cen-dboard.vercel.app',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
app.options('/users', cors(corsOptions), (req, res) => {
  res.sendStatus(200);
});

app.get('/users', cors(corsOptions), (req, res) => {
    db.query('SELECT * from userinfo;', (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  });
  app.get('/locations', cors(corsOptions), (req, res) => {
    db.query("SELECT * from locations;", (err,results) => {
      if(err) throw err;
      res.json(results);
    });
  });
  app.get('/summary', cors(corsOptions), (req, res) => {
    db.query("SELECT * from summary_data;", (err,results) => {
      if(err) throw err;
      res.json(results);
    });
  });
  app.get('/graph', cors(corsOptions), (req, res) => {
    db.query("SELECT * from graph_test;", (err,results) => {
      if(err) throw err;
      res.json(results);
    });
  });


  app.post('/userinfo', (req, res) => {
  const { name, email, phone, password } = req.body;
  const query = 'INSERT INTO userinfo (username, email, phone, password) VALUES (?, ?, ?, ?)';
  db.query(query, [name, email, phone, password], (err, result) => {
    if (err) {
      console.error("Error inserting user:", err);
      res.status(500).json({ error: 'An error occurred while inserting user' });
    } else {
      res.status(200).json({ message: 'User added successfully', id: result.insertId });
    }
  });
});
