const express = require('express');
var cors = require('cors')
const mysql = require('mysql2');


const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors())

const db = mysql.createConnection({
  host: 'mysqldb-nodejs-db-nodejs.a.aivencloud.com',
  port: '15292',
  user: 'avnadmin',
  password: 'AVNS_7_-TDwKOAalQNuMTrXl',
  database: 'defaultdb',
});
const mysql22 = mysql.createConnection({
  host: '192.168.3.124',
  port: '3306',
  user: 'root',
  password: 'Root$#123',
  database: 'ezeefile_updc',
})
const misdb = mysql.createConnection({
  host: 'localhost',
  port:'3306',
  user:'root',
  password:'root',
  database:'updc_misdb',
})

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

app.get('/summaryLocation', cors(corsOptions), (req, res) => {
  const locationName = req.query.locationname; // Retrieve location name from query parameter

  if (!locationName) {
    return res.status(400).json({ error: 'Location name is required' }); // Return error if location name is not provided
  }

  const query = `
        SELECT
            locationid,
            locationname AS 'LocationName',
            SUM(inventoryfiles) AS 'CollectionFiles',
            SUM(inventoryimages) AS 'CollectionImages',
            SUM(scanfiles) AS 'ScannedFiles',
            SUM(scanimages) AS 'ScannedImages',
            SUM(qcfiles) AS 'QCFiles',
            SUM(qcimages) AS 'QCImages',
            SUM(flaggingfiles) AS 'FlaggingFiles',
            SUM(flaggingimages) AS 'FlaggingImages',
            SUM(indexfiles) AS 'IndexingFiles',
            SUM(indeximages) AS 'IndexingImages',
            SUM(cbslqafiles) AS 'CBSL_QAFiles',
            SUM(cbslqaimages) AS 'CBSL_QAImages',
            SUM(exportpdffiles) AS 'Export_PdfFiles',
            SUM(exportpdfimages) AS 'Export_PdfImages',
            SUM(clientqaacceptfiles) AS 'Client_QA_AcceptedFiles',
            SUM(clientqaacceptimages) AS 'Client_QA_AcceptedImages',
            SUM(clientqarejectfiles) AS 'Client_QA_RejectedFiles',
            SUM(clientqarejectimages) AS 'Client_QA_RejectedImages',
            SUM(digisignfiles) AS 'Digi_SignFiles',
            SUM(digisignimages) AS 'Digi_SignImages'
        FROM
            scanned
        WHERE
            locationname = ?
        GROUP BY
            LocationName;`;

  mysql22.query(query, [locationName], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});

app.get('/graph', cors(corsOptions), (req, res) => {
  db.query("SELECT * from graph_test;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});
app.get('/scanned_images', cors(corsOptions), (req, res) => {
  db.query("SELECT * FROM scanned_images;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});
// app.get('/location_report', cors(corsOptions), (req, res) => {
//   mysql22.query("SELECT * FROM location_report;", (err,results) => {
//     if(err) throw err;
//     res.json(results);
//   });
// });


app.get('/locations', cors(corsOptions), (req, res) => {
  mysql22.query("SELECT LocationID, LocationName from locationmaster;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.get('/summary', cors(corsOptions), (req, res) => {
  const { locationNames } = req.query;

  let query = `SELECT 
  
    COUNT(DISTINCT locationid) as TotalLocation,
    SUM(inventoryfiles) as CollectionFiles,
    SUM(inventoryimages) as CollectionImages,
    SUM(scanfiles) as ScannedFiles,
    SUM(scanimages) as ScannedImages,
    SUM(qcfiles) as QCFiles,
    SUM(qcimages) as QCImages,
    SUM(flaggingfiles) as FlaggingFiles,
    SUM(flaggingimages) as FlaggingImages,
    SUM(indexfiles) as IndexingFiles,
    SUM(indeximages) as IndexingImages,
    SUM(cbslqafiles) as CBSL_QAFiles,
    SUM(cbslqaimages) as CBSL_QAImages,
    SUM(exportpdffiles) as Export_PdfFiles,
    SUM(exportpdfimages) as Export_PdfImages,
    SUM(clientqaacceptfiles) as Client_QA_AcceptedFiles,
    SUM(clientqaacceptimages) as Client_QA_AcceptedImages,
    SUM(clientqarejectfiles) as Client_QA_RejectedFiles,
    SUM(clientqarejectimages) as Client_QA_RejectedImages,
    SUM(digisignfiles) as Digi_SignFiles,
    SUM(digisignimages) as Digi_SignImages
  FROM scanned`;

  // If locationNames are provided, construct the WHERE clause to filter by location
  if (locationNames ) {
    query += " WHERE locationname IN (?)";
  }

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results);
  });
});


app.get('/usermaster', cors(corsOptions), (req, res) => {
  mysql22.query("SELECT user_id, first_name,last_name,designation FROM tbl_user_master where designation in ('project manager', 'site manager', 'site incharge','project head');", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});
app.get('/designations', cors(corsOptions), (req, res) => {
  mysql22.query("SELECT * FROM tbl_designation_master;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});
app.get('/graph5', cors(corsOptions), (req, res) => {
  const { locationNames } = req.query;
  let query = "SELECT DATE_FORMAT(scandate, '%Y-%m-%d') as scandate, SUM(scanfiles) as scannedfiles FROM scanned s WHERE scandate >= DATE_SUB(NOW(), INTERVAL 1 WEEK) AND scandate <= NOW()";

  if (locationNames && locationNames.length > 0) {
    query += " AND locationname IN (?)";
  }

  query += " GROUP BY DATE_FORMAT(scandate, '%Y-%m-%d');";

  mysql22.query(query, [locationNames], (err, results) => {
    if(err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results);
  });
});

app.get('/graph6', cors(corsOptions), (req, res) => {
  const { locationNames } = req.query;
  let query = "SELECT DATE_FORMAT(scandate, '%Y-%m-%d') as scandate, SUM(scanimages) as scannedimages FROM scanned s WHERE scandate >= DATE_SUB(NOW(), INTERVAL 1 WEEK) AND scandate <= NOW()";

  if (locationNames && locationNames.length > 0) {
    query += " AND locationname IN (?)";
  }

  query += " GROUP BY DATE_FORMAT(scandate, '%Y-%m-%d');";

  mysql22.query(query, [locationNames], (err, results) => {
    if(err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results);
  });
});
app.get('/graphmonth', cors(corsOptions), (req, res) => {
  const { locationNames } = req.query;
  let query = "SELECT DATE_FORMAT(scandate,'%Y-%m-%d') AS 'scandate',SUM(scanimages) AS 'Scanned No Of Images' FROM scanned s WHERE scandate BETWEEN CURDATE() - INTERVAL 30 DAY AND CURDATE() ";

  if (locationNames && locationNames.length > 0) {
    query += " AND locationname IN (?)";
  }

  query += " GROUP BY DATE_FORMAT(scandate, '%Y-%m-%d');";

  mysql22.query(query, [locationNames], (err, results) => {
    if(err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results);
  });
});




app.get('/reportTable', cors(corsOptions), (req, res) => {
  mysql22.query("SELECT locationid,locationname as 'LocationName',sum(`inventoryfiles`) as 'CollectionFiles',sum(`inventoryimages`) as 'CollectionImages',sum(`scanfiles`) as 'ScannedFiles',sum(`scanimages`) as 'ScannedImages',sum(`qcfiles`) as 'QCFiles',sum(`qcimages`) as 'QCImages',sum(`flaggingfiles`)  as 'FlaggingFiles',sum(`flaggingimages`)  as 'FlaggingImages',sum(`indexfiles`) as 'IndexingFiles',sum(`indeximages`) as 'IndexingImages',sum(`cbslqafiles`)  as 'CBSL_QAFiles',sum(`cbslqaimages`) as 'CBSL_QAImages',sum(`exportpdffiles`)  as 'Export_PdfFiles', sum(`exportpdfimages`)  as 'Export_PdfImages',sum(`clientqaacceptfiles`)  as 'Client_QA_AcceptedFiles', sum(`clientqaacceptimages`)  as 'Client_QA_AcceptedImages',sum(`clientqarejectfiles`)  as 'Client_QA_RejectedFiles',sum(`clientqarejectimages`)  as 'Client_QA_RejectedImages',sum(`digisignfiles`)  as 'Digi_SignFiles',sum(`digisignimages`)  as 'Digi_SignImages' FROM scanned  group by LocationName;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});
app.get('/reportLocationWiseTable', cors(corsOptions), (req, res) => {
  const locationName = req.query.locationname; // Retrieve location name from query parameter

  if (!locationName) {
    return res.status(400).json({ error: 'Location name is required' }); // Return error if location name is not provided
  }

  const query = `
        SELECT
            locationid,
            locationname AS 'LocationName',
            SUM(inventoryfiles) AS 'CollectionFiles',
            SUM(inventoryimages) AS 'CollectionImages',
            SUM(scanfiles) AS 'ScannedFiles',
            SUM(scanimages) AS 'ScannedImages',
            SUM(qcfiles) AS 'QCFiles',
            SUM(qcimages) AS 'QCImages',
            SUM(flaggingfiles) AS 'FlaggingFiles',
            SUM(flaggingimages) AS 'FlaggingImages',
            SUM(indexfiles) AS 'IndexingFiles',
            SUM(indeximages) AS 'IndexingImages',
            SUM(cbslqafiles) AS 'CBSL_QAFiles',
            SUM(cbslqaimages) AS 'CBSL_QAImages',
            SUM(exportpdffiles) AS 'Export_PdfFiles',
            SUM(exportpdfimages) AS 'Export_PdfImages',
            SUM(clientqaacceptfiles) AS 'Client_QA_AcceptedFiles',
            SUM(clientqaacceptimages) AS 'Client_QA_AcceptedImages',
            SUM(clientqarejectfiles) AS 'Client_QA_RejectedFiles',
            SUM(clientqarejectimages) AS 'Client_QA_RejectedImages',
            SUM(digisignfiles) AS 'Digi_SignFiles',
            SUM(digisignimages) AS 'Digi_SignImages'
        FROM
            scanned
        WHERE
            locationname = ?
        GROUP BY
            LocationName;`;

  mysql22.query(query, [locationName], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});
app.get('/graph1LocationWise', cors(corsOptions), (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

  let query = `
    SELECT 
    locationid,
    locationname AS 'LocationName',
    sum(exportpdffiles) as 'Export PDF' , 
    sum(cbslqafiles)-sum(clientqaacceptfiles) as 'Client QA Pending', 
    sum(clientqaacceptfiles) as 'Client QA',  
    sum(cbslqafiles) as 'CBSL QA', 
    sum(scanfiles) as 'Scanned', 
    sum(inventoryfiles) as 'Received'  
    FROM scanned
  `;

  if (locationNames && locationNames.length > 0) {
    query += ` WHERE locationname IN (?)`;
  }

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});


app.get('/graph2', cors(corsOptions), (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location name from query parameter

  let query = `
  SELECT 
  sum(exportpdfimages) as 'Export PDF' , 
  sum(cbslqaimages)-sum(clientqaacceptimages) as 'Client QA Pending', 
  sum(clientqaacceptimages) as 'Client QA',  sum(cbslqaimages) as 'CBSL QA', 
  sum(scanimages) as 'Scanned', 
  sum(inventoryimages) as 'Received'  
  from scanned
  `;

  if (locationNames && locationNames.length > 0) {
    query += ` WHERE locationname IN (?)`;
  }

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});
app.get('/civil', cors(corsOptions), (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

  let query = "SELECT sum(scanfiles) as 'Civil Files', sum(scanimages) as 'Civil Images' FROM `scanned` WHERE casetypename NOT LIKE '%Criminal%'";

  if (locationNames && locationNames.length > 0) {
    query += " AND locationname IN (?)";
  }

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});
app.get('/criminal', cors(corsOptions), (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

  let query = "SELECT  sum(scanfiles) as 'Criminal Files' , sum(scanimages) as 'Criminal Images' FROM `scanned` WHERE  casetypename Like '%Criminal%'";

  if (locationNames && locationNames.length > 0) {
    // If locationNames is an array, use parameterized query
    query += " AND locationname IN (?)";
  }

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});



app.get('/graph7', cors(corsOptions), (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

  let query = "SELECT sum(exportpdffiles) as 'Export PDF', " +
    "sum(cbslqafiles) - sum(clientqaacceptfiles) as 'Client QA Pending', " +
    "sum(clientqaacceptfiles) as 'Client QA', " +
    "sum(cbslqafiles) as 'CBSL QA', " +
    "sum(scanfiles) as 'Scanned', " +
    "sum(inventoryfiles) as 'Received' " +
    "FROM scanned " +
    "WHERE (DATE(inventorydate) = CURDATE() - 1 " +
    "OR DATE(scandate) = CURDATE() - 1 " +
    "OR DATE(cbslqadate) = CURDATE() - 1 " +
    "OR DATE(clientqaacceptdate) = CURDATE() - 1 " +
    "OR DATE(exportdate) = CURDATE() - 1)";

  if (locationNames && locationNames.length > 0) {
    query += ` AND locationname IN (?)`;
  }

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});


app.get('/graph8', cors(corsOptions), (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

  let query = "SELECT sum(exportpdfimages) as 'Export PDF', " +
    "sum(cbslqaimages) - sum(clientqaacceptimages) as 'Client QA Pending', " +
    "sum(clientqaacceptimages) as 'Client QA', " +
    "sum(cbslqaimages) as 'CBSL QA', " +
    "sum(scanimages) as 'Scanned', " +
    "sum(inventoryimages) as 'Received' " +
    "FROM scanned " +
    "WHERE (DATE(inventorydate) = CURDATE() - 1 " +
    "OR DATE(scandate) = CURDATE() - 1 " +
    "OR DATE(cbslqadate) = CURDATE() - 1 " +
    "OR DATE(clientqaacceptdate) = CURDATE() - 1 " +
    "OR DATE(exportdate) = CURDATE() - 1)";

  if (locationNames && locationNames.length > 0) {
    query += ` AND locationname IN (?)`;
  }

  

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});

app.get('/graph8', cors(corsOptions), (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location name from query parameter

  let query = "SELECT sum(exportpdfimages) as 'Export PDF' , sum(cbslqaimages)-sum(clientqaacceptimages) as 'Client QA Pending', sum(clientqaacceptimages) as 'Client QA',  sum(cbslqaimages) as 'CBSL QA', sum(scanimages) as 'Scanned', sum(inventoryimages) as 'Received'  from scanned where (DATE(`inventorydate`) = CURDATE()-1 or DATE(`scandate`) = CURDATE()-1 or DATE(`cbslqadate`) = CURDATE()-1 or DATE(`clientqaacceptdate`) = CURDATE()-1 or DATE(`exportdate`) = CURDATE()-1);";

  if (locationNames && locationNames.length > 0) {
    query += `  AND locationname IN (?)`;
  }

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});
app.get('/graph9', cors(corsOptions), (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

  let query = "SELECT locationname AS 'Location Name', sum(scanimages) AS 'Images' FROM scanned WHERE scandate = CURDATE() - INTERVAL 1 DAY";

  if (locationNames && locationNames.length > 0) {
    query += ` AND locationname IN (?)`;
  }

  query += " GROUP BY locationname";

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});

app.get('/graph10', cors(corsOptions), (req, res) => {
  const locationNames = req.query.locationname; // Retrieve location names from query parameter

  let query = "SELECT locationname AS 'Location Name', sum(scanimages) AS 'Images' FROM scanned";

  if (locationNames && locationNames.length > 0) {
    query += ` WHERE locationname IN (?)`;
  }

  query += " GROUP BY locationname";

  mysql22.query(query, [locationNames], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});





app.get('/api/data', (req, res) => {
  let query1Results, query2Results;

  // Execute first query
  connection.query('SELECT * FROM table1', (error1, results1, fields1) => {
    if (error1) {
      console.error('Error executing first query: ', error1);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    query1Results = results1;

    // Execute second query
    connection.query('SELECT * FROM table2', (error2, results2, fields2) => {
      if (error2) {
        console.error('Error executing second query: ', error2);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      query2Results = results2;

      // Combine results
      const combinedResults = { query1Results, query2Results };
      res.json(combinedResults);
    });
  });
});














app.get('/api/tabularData', (req, res) => {
  const locationId = req.query.locationid; // Assuming locationid is passed as a query parameter

  let query = `
      SELECT 
      tt.LocationName as 'LocationName',
      tt.ScannedNoOfFilesTotal as 'Total_Files',
      tt.ScannedNoOfImagesTotal as 'Total_Images',
      td.ScannedNoOfFilesToday as 'Today_Files',
      td.ScannedNoOfImagesToday as 'Today_Images',
      tdyes.ScannedNoOfFilesYes as 'Yes_Files',
      tdyes.ScannedNoOfImagesYes as 'Yes_Images',
      tdprev.ScannedNoOfFilesPrev as 'Prev_Files',
      tdprev.ScannedNoOfImagesPrev as 'Prev_Images'
      FROM 
        (SELECT 
          s.locationname AS 'LocationName',
          SUM(s.scanfiles) AS 'ScannedNoOfFilesTotal',
          SUM(s.scanimages) AS 'ScannedNoOfImagesTotal' 
        FROM 
          scanned s 
        ${locationId ? `WHERE CONVERT(s.locationid, SIGNED) IN (${locationId})` : ''}
        GROUP BY 
          s.locationname) tt 
        LEFT JOIN 
          (SELECT 
            s.locationname AS 'LocationName',
            SUM(s.scanfiles) AS 'ScannedNoOfFilesYes',
            SUM(s.scanimages) AS 'ScannedNoOfImagesYes' 
          FROM 
            scanned s 
          WHERE 
            s.scandate = CURDATE() - INTERVAL 1 DAY 
            ${locationId ? `AND CONVERT(s.locationid, SIGNED) IN (${locationId})` : ''}
          GROUP BY 
            s.locationname) tdyes 
        ON 
          tdyes.LocationName = tt.LocationName 
        LEFT JOIN 
          (SELECT 
            s.locationname AS 'LocationName',
            SUM(s.scanfiles) AS 'ScannedNoOfFilesPrev',
            SUM(s.scanimages) AS 'ScannedNoOfImagesPrev' 
          FROM 
            scanned s 
          WHERE 
            s.scandate = CURDATE() - INTERVAL 2 DAY 
            ${locationId ? `AND CONVERT(s.locationid, SIGNED) IN (${locationId})` : ''}
          GROUP BY 
            s.locationname) tdprev 
        ON 
          tdprev.LocationName = tt.LocationName 
        LEFT JOIN 
          (SELECT 
            s.locationname AS 'LocationName',
            SUM(s.scanfiles) AS 'ScannedNoOfFilesToday',
            SUM(s.scanimages) AS 'ScannedNoOfImagesToday' 
          FROM 
            scanned s 
          WHERE 
            s.scandate = CURDATE() 
            ${locationId ? `AND CONVERT(s.locationid, SIGNED) IN (${locationId})` : ''}
          GROUP BY 
            s.locationname) td 
        ON 
          td.LocationName = tt.LocationName 
      ORDER BY 
        tt.LocationName
    `;

  // Execute the query
  mysql22.query(query, (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results);
  });
});












app.get('/graph2', cors(corsOptions), (req, res) => {
  mysql22.query("SELECT sum(exportpdfimages) as 'Export PDF' , sum(cbslqaimages)-sum(clientqaacceptimages) as 'Client QA Pending', sum(clientqaacceptimages) as 'Client QA',  sum(cbslqaimages) as 'CBSL QA', sum(scanimages) as 'Scanned', sum(inventoryimages) as 'Received'  from scanned;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});



app.get('/graph9', cors(corsOptions), (req, res) => {
  mysql22.query("SELECT locationname 'Location Name',sum(`scanimages`) as 'Images' FROM scanned where scandate= CURDATE()- INTERVAL 1 DAY group by locationname;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});


app.get('/graph10', cors(corsOptions), (req, res) => {
  mysql22.query("SELECT locationname 'Location Name',sum(`scanimages`) as 'Images' FROM scanned group by locationname;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});
app.get('/user_master', cors(corsOptions), (req, res) => {
  misdb.query("SELECT * FROM tbl_user_master where user_id and active_inactive_users = '1' order by first_name, last_name asc;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});
app.get('/group_master', cors(corsOptions), (req, res) => {
  misdb.query("SELECT group_id,group_name FROM tbl_group_master order by group_name asc;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.get("/csv", cors(corsOptions), (req, res, next) => {
  const getCsv = `SELECT tt.LocationName as 'LocationName',
    tt.ScannedNoOfFilesTotal as 'Total_Files',
    tt.ScannedNoOfImagesTotal as 'Total_Images',
    td.ScannedNoOfFilesToday as 'Today_Files ',
    td.ScannedNoOfImagesToday as 'Today_Images ',
    tdyes.ScannedNoOfFilesYes as 'Yes_Files ',
    tdyes.ScannedNoOfImagesYes as 'Yes_Images ',
    tdprev.ScannedNoOfFilesPrev as 'Prev_Files ',
    tdprev.ScannedNoOfImagesPrev as 'Prev_Images '
    FROM (SELECT s.locationname 'LocationName',
    SUM(s.scanfiles) as 'ScannedNoOfFilesTotal',
    SUM(s.scanimages) as 'ScannedNoOfImagesTotal'
    FROM scanned s 
    GROUP BY s.locationname) tt
    LEFT JOIN (SELECT s.locationname 'LocationName',
    SUM(s.scanfiles) as 'ScannedNoOfFilesYes',
    SUM(s.scanimages) as 'ScannedNoOfImagesYes'
    FROM scanned s 
    WHERE s.scandate = CURDATE() - INTERVAL 1 DAY
    GROUP BY s.locationname) tdyes
    ON tdyes.LocationName = tt.LocationName 
    LEFT JOIN (SELECT s.locationname 'LocationName',
    SUM(s.scanfiles) as 'ScannedNoOfFilesPrev',
    SUM(s.scanimages) as 'ScannedNoOfImagesPrev' 
    FROM scanned s 
    WHERE s.scandate = CURDATE() - INTERVAL 2 DAY 
    GROUP BY s.locationname) tdprev 
    ON tdprev.LocationName = tt.LocationName 
    LEFT JOIN (SELECT s.locationname 'LocationName',
    SUM(s.scanfiles) as 'ScannedNoOfFilesToday',
    SUM(s.scanimages) as 'ScannedNoOfImagesToday' 
    FROM scanned s 
    WHERE s.scandate = CURDATE() 
    GROUP BY s.locationname) td 
    ON td.LocationName = tt.LocationName 
    ORDER BY tt.LocationName;`
  mysql22.query(getCsv, (error, result, field) => {
    if (error) {
      console.error("Error occured when export csv:", err);
      res.status(500).json({ error: 'An error occurred while exporting csv file' });
      return;
    }
    const data = result;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition',
      'attachment;filename =' + "export.csv" + "'");
    res.write("Location Name,Total Files,Total Images,Today Files,Today Images,Yes Files,Yes Images,Prev Files, Prev Images\n");
    if (data == null) {
      res.end();
      return;
    }
    data.forEach((row) => {
      res.write(row.LocationName + "," + row.Total_Files + "," + row.Total_Images + "," + row.Today_Files + "," + row.Today_Images + "," + row.Yes_Files + "," + row.Yes_Images + "," + row.Prev_Files + "," + row.Prev_Images + "\n")
    });
    res.end();
  });
});


app.get('/tabularData', cors(corsOptions), (req, res) => {
  mysql22.query(`
    SELECT tt.LocationName as 'LocationName',
           tt.ScannedNoOfFilesTotal as 'Total_Files',
           tt.ScannedNoOfImagesTotal as 'Total_Images',
           td.ScannedNoOfFilesToday as 'Today_Files',
           td.ScannedNoOfImagesToday as 'Today_Images',
           tdyes.ScannedNoOfFilesYes as 'Yes_Files',
           tdyes.ScannedNoOfImagesYes as 'Yes_Images',
           tdprev.ScannedNoOfFilesPrev as 'Prev_Files',
           tdprev.ScannedNoOfImagesPrev as 'Prev_Images'
    FROM (SELECT s.locationname 'LocationName',
                 SUM(s.scanfiles) as 'ScannedNoOfFilesTotal',
                 SUM(s.scanimages) as 'ScannedNoOfImagesTotal'
          FROM scanned s
          GROUP BY s.locationname) tt
    LEFT JOIN (SELECT s.locationname 'LocationName',
                      SUM(s.scanfiles) as 'ScannedNoOfFilesYes',
                      SUM(s.scanimages) as 'ScannedNoOfImagesYes'
               FROM scanned s
               WHERE s.scandate = CURDATE() - INTERVAL 1 DAY
               GROUP BY s.locationname) tdyes
           ON tdyes.LocationName = tt.LocationName
    LEFT JOIN (SELECT s.locationname 'LocationName',
                      SUM(s.scanfiles) as 'ScannedNoOfFilesPrev',
                      SUM(s.scanimages) as 'ScannedNoOfImagesPrev'
               FROM scanned s
               WHERE s.scandate = CURDATE() - INTERVAL 2 DAY
               GROUP BY s.locationname) tdprev
           ON tdprev.LocationName = tt.LocationName
    LEFT JOIN (SELECT s.locationname 'LocationName',
                      SUM(s.scanfiles) as 'ScannedNoOfFilesToday',
                      SUM(s.scanimages) as 'ScannedNoOfImagesToday'
               FROM scanned s
               WHERE s.scandate = CURDATE()
               GROUP BY s.locationname) td
           ON td.LocationName = tt.LocationName
    ORDER BY tt.LocationName;
  ;`, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});
app.get('/api/uploadlog', (req, res) => {
  let whereClause = ''; // Assuming you will pass the where clause as a query parameter

  let query = `
    SELECT 
      l.locationname,
      MAX(CAST(t.filedate AS DATE)) AS filedate,
      MAX(CAST(t.upload_date AS DATE)) AS uploaddate,
      MAX(t.appVersion) AS appVersion
    FROM 
      tbl_upload_log t 
      INNER JOIN 
      locationmaster l 
      ON 
      l.locationcode = CAST(t.location_code AS INT)
      ${whereClause}
    GROUP BY 
      l.locationname
    ORDER BY 
      MAX(t.upload_date) DESC;
  `;

  // Execute the query
  mysql22.query(query, (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results);
  });
});


// app.get('/site_MPData', cors(corsOptions), (req, res) => {
//   updcPrayagraj.query("SELECT * FROM tbl_site_mp;", (err,results) => {
//     if(err) throw err;
//     res.json(results);
//   });
// });

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

app.post('/usermasterinfo', (req, res) => {
  const { Desig_ID, Desig_name } = req.body;
  const query = 'INSERT INTO tbl_user_master (Desig_ID, Desig_name) VALUES (?, ?)';
  misdb.query(query, [Desig_ID, Desig_name], (err, result) => {
    if (err) {
      console.error("Error inserting user:", err);
      res.status(500).json({ error: 'An error occurred while inserting user' });
    } else {
      res.status(200).json({ message: 'User added successfully', id: result.insertId });
    }
  });
});
app.post('/usermasterinfo', (req, res) => {
  const { Desig_ID, Desig_name } = req.body;
  const query = 'INSERT INTO tbl_designation_master (Desig_ID, Desig_name) VALUES (?, ?)';
  mysql22.query(query, [Desig_ID, Desig_name], (err, result) => {
    if (err) {
      console.error("Error inserting user:", err);
      res.status(500).json({ error: 'An error occurred while inserting user' });
    } else {
      res.status(200).json({ message: 'User added successfully', id: result.insertId });
    }
  });
});
// app.post('/site_MP', (req, res) => {
//   const {  PH_Id,PO_Id, PM_Id, PCo_Id, SM_Id, Coll_Index_MP, Barc_MP, Barc_TF, Barc_TI, Page_No_MP, Prepare_MP, Prepare_TF, Prepare_TI, Scan_MP, Cover_Page_MP, Cover_Page_TF, Rescan_MP, Image_QC_MP, Doc_MP, Index_MP, CBSL_QA_MP, Ready_Cust_QA_MP, Cust_QA_Done_MP, PDF_Export_MP, Refilling_Files_MP, Refilling_Files_TF, Refilling_Files_TI, Inventory_MP, Location_Id, } = req.body;
//   const query = 'INSERT INTO tbl_site_mp (PH_Id,PO_Id, PM_Id, PCo_Id, SM_Id, Coll_Index_MP, Barc_MP, Barc_TF, Barc_TI, Page_No_MP, Prepare_MP, Prepare_TF, Prepare_TI, Scan_MP, Cover_Page_MP, Cover_Page_TF, Rescan_MP, Image_QC_MP, Doc_MP, Index_MP, CBSL_QA_MP, Ready_Cust_QA_MP, Cust_QA_Done_MP, PDF_Export_MP, Refilling_Files_MP, Refilling_Files_TF, Refilling_Files_TI, Inventory_MP, Location_ID) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
//   updcPrayagraj.query(query, [PH_Id,PO_Id, PM_Id, PCo_Id, SM_Id, Coll_Index_MP, Barc_MP, Barc_TF, Barc_TI, Page_No_MP, Prepare_MP, Prepare_TF, Prepare_TI, Scan_MP, Cover_Page_MP, Cover_Page_TF, Rescan_MP, Image_QC_MP, Doc_MP, Index_MP, CBSL_QA_MP, Ready_Cust_QA_MP, Cust_QA_Done_MP, PDF_Export_MP, Refilling_Files_MP, Refilling_Files_TF, Refilling_Files_TI, Inventory_MP, Location_Id,], (err, result) => {
//     if (err) {
//       console.error("Error inserting user:", err);
//       res.status(500).json({ error: 'An error occurred while inserting user' });
//     } else {
//       res.status(200).json({ message: 'ManPower added successfully', id: result.insertId });
//     }
//   });
// });
app.put('/usermasterupdate/:Desig_ID', (req, res) => {
  const { Desig_name, Desig_ID } = req.body;
  const query = 'UPDATE tbl_designation_master SET Desig_name = ? where Desig_ID = ?;';
  mysql22.query(query, [Desig_name, Desig_ID], (err, result) => {
    if (err) {
      console.error("Error inserting user:", err);
      res.status(500).json({ error: 'An error occurred while updating user' });
    } else {
      res.status(200).json({ message: 'User updated successfully', id: req.params.Desig_ID });

    }
  });
});
app.delete('/usermasterdelete/:Desig_ID', (req, res) => {
  const { Desig_ID } = req.params;
  mysql22.query('DELETE FROM tbl_designation_master WHERE Desig_ID = ?', [Desig_ID], (err) => {
    if (err) throw err;
    res.json({ message: 'User deleted successfully' });
  });
});






//SELECT first_name,last_name,designation FROM tbl_user_master where designation in ('project manager', 'site incharge', 'project owner', 'site manager');
