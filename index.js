const express = require("express");
var cors = require("cors");
const mysql = require("mysql2");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
  host: "mysqldb-nodejs-db-nodejs.a.aivencloud.com",
  port: "15292",
  user: "avnadmin",
  password: "AVNS_7_-TDwKOAalQNuMTrXl",
  database: "defaultdb",
});
const mysql22 = mysql.createConnection({
  host: "192.168.3.124",
  port: "3306",
  user: "root",
  password: "Root$#123",
  database: "ezeefile_updc",
});
const updcPrayagraj = mysql.createConnection({
  host: "localhost",
  port: "3306",
  user: "root",
  password: "cbsl@123",
  database: "updc_live",
});

var corsOptions = {
  origin: "http://localhost:5000",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
app.options("/users", cors(corsOptions), (req, res) => {
  res.sendStatus(200);
});

app.get("/users", cors(corsOptions), (req, res) => {
  db.query("SELECT * from userinfo;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.get("/summary", cors(corsOptions), (req, res) => {
  mysql22.query(
    "SELECT Count(distinct locationid) as TotalLocation,sum(`inventoryfiles`) as 'CollectionFiles',sum(`inventoryimages`) as 'CollectionImages',sum(`scanfiles`) as 'ScannedFiles',sum(`scanimages`) as 'ScannedImages',sum(`qcfiles`) as 'QCFiles',sum(`qcimages`) as 'QCImages',sum(`flaggingfiles`)  as 'FlaggingFiles',sum(`flaggingimages`)  as 'FlaggingImages',sum(`indexfiles`) as 'IndexingFiles',sum(`indeximages`) as 'IndexingImages',sum(`cbslqafiles`)  as 'CBSL_QAFiles',sum(`cbslqaimages`) as 'CBSL_QAImages',sum(`exportpdffiles`)  as 'Export_PdfFiles',sum(`exportpdfimages`)  as 'Export_PdfImages',sum(`clientqaacceptfiles`)  as 'Client_QA_AcceptedFiles',sum(`clientqaacceptimages`)  as 'Client_QA_AcceptedImages',sum(`clientqarejectfiles`)  as 'Client_QA_RejectedFiles',sum(`clientqarejectimages`)  as 'Client_QA_RejectedImages',sum(`digisignfiles`)  as 'Digi_SignFiles',sum(`digisignimages`)  as 'Digi_SignImages'FROM scanned s;",
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});

app.get("/summarylocationname", cors(corsOptions), (req, res) => {
  const locationName = req.query.locationname; // Retrieve location name from query parameter

  if (!locationName) {
    return res.status(400).json({ error: "Location name is required" }); // Return error if location name is not provided
  }
  mysql22.query(
    "SELECT locationname, Count(distinct locationid) as TotalLocation, sum(`inventoryfiles`) as 'CollectionFiles', sum(`inventoryimages`) as 'CollectionImages', sum(`scanfiles`) as 'ScannedFiles', sum(`scanimages`) as 'ScannedImages', sum(`qcfiles`) as 'QCFiles', sum(`qcimages`) as 'QCImages', sum(`flaggingfiles`) as 'FlaggingFiles', sum(`flaggingimages`) as 'FlaggingImages', sum(`indexfiles`) as 'IndexingFiles', sum(`indeximages`) as 'IndexingImages', sum(`cbslqafiles`) as 'CBSL_QAFiles', sum(`cbslqaimages`) as 'CBSL_QAImages', sum(`exportpdffiles`) as 'Export_PdfFiles', sum(`exportpdfimages`) as 'Export_PdfImages', sum(`clientqaacceptfiles`) as 'Client_QA_AcceptedFiles', sum(`clientqaacceptimages`) as 'Client_QA_AcceptedImages', sum(`clientqarejectfiles`) as 'Client_QA_RejectedFiles', sum(`clientqarejectimages`) as 'Client_QA_RejectedImages', sum(`digisignfiles`) as 'Digi_SignFiles', sum(`digisignimages`) as 'Digi_SignImages' FROM scanned s WHERE locationname = ? GROUP BY locationname;",
    [locationName], // Pass locationName as parameter
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});




app.get("/summarycsv", cors(corsOptions), (req, res, next) => {
  const locationName = req.query.locationName;

// Modify the SQL query to include a WHERE clause if a specific location is provided
let whereClause = "";
if (locationName) {
  whereClause = `WHERE s.locationname = '${locationName}'`;
}
  
  // const getCsv =
  //   "SELECT Count(distinct locationid) as TotalLocation,sum(`inventoryfiles`) as 'CollectionFiles',sum(`inventoryimages`) as 'CollectionImages',sum(`scanfiles`) as 'ScannedFiles',sum(`scanimages`) as 'ScannedImages',sum(`qcfiles`) as 'QCFiles',sum(`qcimages`) as 'QCImages',sum(`flaggingfiles`)  as 'FlaggingFiles',sum(`flaggingimages`)  as 'FlaggingImages',sum(`indexfiles`) as 'IndexingFiles',sum(`indeximages`) as 'IndexingImages',sum(`cbslqafiles`)  as 'CBSL_QAFiles',sum(`cbslqaimages`) as 'CBSL_QAImages',sum(`exportpdffiles`)  as 'Export_PdfFiles',sum(`exportpdfimages`)  as 'Export_PdfImages',sum(`clientqaacceptfiles`)  as 'Client_QA_AcceptedFiles',sum(`clientqaacceptimages`)  as 'Client_QA_AcceptedImages',sum(`clientqarejectfiles`)  as 'Client_QA_RejectedFiles',sum(`clientqarejectimages`)  as 'Client_QA_RejectedImages',sum(`digisignfiles`)  as 'Digi_SignFiles',sum(`digisignimages`)  as 'Digi_SignImages'FROM scanned s;";
  
  // const getCsv =
  // `SELECT Count(distinct locationid) as TotalLocation,
  //         sum(inventoryfiles) as 'CollectionFiles',
  //         sum(inventoryimages) as 'CollectionImages',
  //         sum(scanfiles) as 'ScannedFiles',
  //         sum(scanimages) as 'ScannedImages',
  //         sum(qcfiles) as 'QCFiles',
  //         sum(qcimages) as 'QCImages',
  //         sum(flaggingfiles) as 'FlaggingFiles',
  //         sum(flaggingimages) as 'FlaggingImages',
  //         sum(indexfiles) as 'IndexingFiles',
  //         sum(indeximages) as 'IndexingImages',
  //         sum(cbslqafiles) as 'CBSL_QAFiles',
  //         sum(cbslqaimages) as 'CBSL_QAImages',
  //         sum(exportpdffiles) as 'Export_PdfFiles',
  //         sum(exportpdfimages) as 'Export_PdfImages',
  //         sum(clientqaacceptfiles) as 'Client_QA_AcceptedFiles',
  //         sum(clientqaacceptimages) as 'Client_QA_AcceptedImages',
  //         sum(clientqarejectfiles) as 'Client_QA_RejectedFiles',
  //         sum(clientqarejectimages) as 'Client_QA_RejectedImages',
  //         sum(digisignfiles) as 'Digi_SignFiles',
  //         sum(digisignimages) as 'Digi_SignImages'
  // FROM scanned s
  // ${whereClause};`;

  const getCsv = `
  SELECT Count(distinct locationid) as TotalLocation,
    case when sum(inventoryfiles) is null then '0' else sum(inventoryfiles) end as 'CollectionFiles',
    case when sum(inventoryimages) is null then '0' else sum(inventoryimages) end as 'CollectionImages',
    case when sum(scanfiles) is null then '0' else sum(scanfiles) end as 'ScannedFiles',
    case when sum(scanimages) is null then '0' else sum(scanimages) end as 'ScannedImages',
    case when sum(qcfiles) is null then '0' else sum(qcfiles) end as 'QCFiles',
    case when sum(qcimages) is null then '0' else sum(qcimages) end as 'QCImages',
    case when sum(flaggingfiles) is null then '0' else sum(flaggingfiles) end as 'FlaggingFiles',
    case when sum(flaggingimages) is null then '0' else sum(flaggingimages) end as 'FlaggingImages',
    case when sum(indexfiles) is null then '0' else sum(indexfiles) end as 'IndexingFiles',
    case when sum(indeximages) is null then '0' else sum(indeximages) end as 'IndexingImages',
    case when sum(cbslqafiles) is null then '0' else sum(cbslqafiles) end as 'CBSL_QAFiles',
    case when sum(cbslqaimages) is null then '0' else sum(cbslqaimages) end as 'CBSL_QAImages',
    case when sum(exportpdffiles) is null then '0' else sum(exportpdffiles) end as 'Export_PdfFiles',
    case when sum(exportpdfimages) is null then '0' else sum(exportpdfimages) end as 'Export_PdfImages',
    case when sum(clientqaacceptfiles) is null then '0' else sum(clientqaacceptfiles) end as 'Client_QA_AcceptedFiles',
    case when sum(clientqaacceptimages) is null then '0' else sum(clientqaacceptimages) end as 'Client_QA_AcceptedImages',
    case when sum(clientqarejectfiles) is null then '0' else sum(clientqarejectfiles) end as 'Client_QA_RejectedFiles',
    case when sum(clientqarejectimages) is null then '0' else sum(clientqarejectimages) end as 'Client_QA_RejectedImages',
    case when sum(digisignfiles) is null then '0' else sum(digisignfiles) end as 'Digi_SignFiles',
    case when sum(digisignimages) is null then '0' else sum(digisignimages) end as 'Digi_SignImages'
  FROM scanned s
  ${whereClause};`;

  
  mysql22.query(getCsv, (error, result, field) => {
    if (error) {
      console.error("Error occured when export csv:", err);
      res
        .status(500)
        .json({ error: "An error occurred while exporting csv file" });
      return;
    }
    const data = result;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment;filename=export.csv");
    res.write('Sr. No.,Location,Collection of Records, ,Scanning ADF, ,ImageQC, ,Document Classification, ,Indexing, ,CBSLQA, ,Export PDF, ,Client QA, ,CSV Generation, ,Inventory Out\n');
    res.write(
      " ,  ,Files, Images,Files,Images,Files,Images,Files,Images,Files, Images,Files,Images,Files,Images,Files,Images,Files,Images,Files,Images\n"
    );
    if (data == null) {
      res.end();
      return;
    }
    data.forEach((row,index) => {
      res.write(
        (index + 1) + "," + 
        row.TotalLocation +
          "," +
          row.CollectionFiles +
          "," +
          row.CollectionImages +
          "," +
          row.ScannedFiles +
          "," +
          row.ScannedImages +
          "," +
          row.QCFiles +
          "," +
          row.QCImages +
          "," +
          row.FlaggingFiles +
          "," +
          row.FlaggingImages +
          "," +
          row.IndexingFiles +
          "," +
          row.IndexingImages +
          "," +
          row.CBSL_QAFiles +
          "," +
          row.CBSL_QAImages +
          "," +
          row.Export_PdfFiles +
          "," +
          row.Export_PdfImages +
          "," +
          row.Client_QA_AcceptedFiles +
          "," +
          row.Client_QA_AcceptedImages +
          row.Client_QA_RejectedFiles +
          "," +
          row.Client_QA_RejectedImages +
          "," +
          row.Digi_SignFiles +
          "," +
          row.Digi_SignImages +
          "\n"
      );
    });
    res.end();
  });
});
app.get("/graph", cors(corsOptions), (req, res) => {
  db.query("SELECT * from graph_test;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});
app.get("/scanned_images", cors(corsOptions), (req, res) => {
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

app.get("/locations", cors(corsOptions), (req, res) => {
  mysql22.query(
    "SELECT LocationID, LocationName from locationmaster;",
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});

app.get("/locations/:id", cors(corsOptions), (req, res) => {
  const locationId = req.params.id;
  mysql22.query(
    "SELECT LocationName FROM locationmaster WHERE LocationID = ?;",
    [locationId],
    (err, results) => {
      if (err) {
        console.error("Error fetching location:", err);
        res.status(500).json({ error: "Internal server error" });
      } else {
        if (results.length > 0) {
          res.json({ locationName: results[0].LocationName });
        } else {
          res.status(404).json({ error: "Location not found" });
        }
      }
    }
  );
});

app.get("/usermaster", cors(corsOptions), (req, res) => {
  updcPrayagraj.query(
    "SELECT user_id, first_name,last_name,designation FROM tbl_user_master where designation in ('project manager', 'site manager', 'site incharge','project head');",
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});
app.get("/designations", cors(corsOptions), (req, res) => {
mysql22.query(
    "SELECT * FROM tbl_designation_master;",
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});
app.get("/graph5", cors(corsOptions), (req, res) => {
  // const query = "SELECT scandate,SUM(scanfiles) as scannedfiles FROM scanned s WHERE scandate >= DATE_SUB(NOW(), INTERVAL 1 WEEK)AND scandate <= NOW() GROUP BY scandate;"
  const query =
    "SELECT DATE_FORMAT(scandate, '%Y-%m-%d') as scandate, SUM(scanfiles) as scannedfiles FROM scanned s WHERE scandate >= DATE_SUB(NOW(), INTERVAL 1 WEEK) AND scandate <= NOW() GROUP BY DATE_FORMAT(scandate, '%Y-%m-%d');";
  updcPrayagraj.query(query, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.get("/graph6", cors(corsOptions), (req, res) => {
  const query =
    "SELECT DATE_FORMAT(scandate, '%Y-%m-%d') as scandate, SUM(scanimages) as scannedimages FROM scanned s WHERE scandate >= DATE_SUB(NOW(), INTERVAL 1 WEEK) AND scandate <= NOW() GROUP BY DATE_FORMAT(scandate, '%Y-%m-%d');";
  updcPrayagraj.query(query, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.get("/graphmonth", cors(corsOptions), (req, res) => {
  const query =
    "SELECT DATE_FORMAT(s.scandate,'%Y-%m-%d') AS 'scandate',SUM(s.scanimages) AS 'Scanned No Of Images' FROM scanned s WHERE s.scandate BETWEEN CURDATE() - INTERVAL 30 DAY AND CURDATE() GROUP BY DATE_FORMAT(s.scandate,'%Y-%m-%d');";
  updcPrayagraj.query(query, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});
app.get("/graph1", cors(corsOptions), (req, res) => {
  mysql22.query(
    "SELECT sum(exportpdffiles) as 'Export PDF' , sum(cbslqafiles)-sum(clientqaacceptfiles) as 'Client QA Pending', sum(clientqaacceptfiles) as 'Client QA',  sum(cbslqafiles) as 'CBSL QA', sum(scanfiles) as 'Scanned', sum(inventoryfiles) as 'Received'  from scanned;",
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});

// app.get('/graph1LocationWise', cors(corsOptions), (req, res) => {
//   const query = "SELECT locationid,locationname AS 'LocationName',sum(exportpdffiles) as 'Export PDF' , sum(cbslqafiles)-sum(clientqaacceptfiles) as 'Client QA Pending', sum(clientqaacceptfiles) as 'Client QA',  sum(cbslqafiles) as 'CBSL QA', sum(scanfiles) as 'Scanned', sum(inventoryfiles) as 'Received'  from scanned group by locationname;";


//   mysql22.query(query, (err, results)=> {
//     if (err) {
//       console.error('Error executing query:', err);
//       return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
//     }
  
  
//   const filters = req.query;
//     const filteredUsers = results.filter((user) => {
//       let isValid = true;
//       for (key in filters) {
//         console.log(key, user[key], filters[key]);
//         isValid = isValid && user[key] == filters[key];
//       }
//       return isValid;
//     });

//     res.send(filteredUsers);
//   });
// });



app.get('/graph1LocationWise', cors(corsOptions), (req, res) => {
  const locationName = req.query.locationname;
  const query = `SELECT locationid, locationname AS 'LocationName', sum(exportpdffiles) as 'Export PDF', 
                 sum(cbslqafiles)-sum(clientqaacceptfiles) as 'Client QA Pending', 
                 sum(clientqaacceptfiles) as 'Client QA', sum(cbslqafiles) as 'CBSL QA', 
                 sum(scanfiles) as 'Scanned', sum(inventoryfiles) as 'Received' 
                 FROM scanned WHERE locationname = ?`;

  mysql22.query(query, [locationName], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Send error response
    }

    res.send(results);
  });
});

// app.get("/api/locationwisetabularData", (req, res) => {
//   const locationName = req.query.locationName; // Assuming locationName is passed as a query parameter

//   // Construct the SQL query
//   let query = `
//       SELECT 
//       tt.LocationName as 'LocationName',
//       tt.ScannedNoOfFilesTotal as 'Total_Files',
//       tt.ScannedNoOfImagesTotal as 'Total_Images',
//       td.ScannedNoOfFilesToday as 'Today_Files',
//       td.ScannedNoOfImagesToday as 'Today_Images',
//       tdyes.ScannedNoOfFilesYes as 'Yes_Files',
//       tdyes.ScannedNoOfImagesYes as 'Yes_Images',
//       tdprev.ScannedNoOfFilesPrev as 'Prev_Files',
//       tdprev.ScannedNoOfImagesPrev as 'Prev_Images'
//       FROM 
//         (SELECT 
//           s.locationname AS 'LocationName',
//           SUM(s.scanfiles) AS 'ScannedNoOfFilesTotal',
//           SUM(s.scanimages) AS 'ScannedNoOfImagesTotal' 
//         FROM 
//           scanned s 
//         WHERE 
//           s.locationname = ? 
//         GROUP BY 
//           s.locationname) tt 
//         LEFT JOIN 
//           (SELECT 
//             s.locationname AS 'LocationName',
//             SUM(s.scanfiles) AS 'ScannedNoOfFilesYes',
//             SUM(s.scanimages) AS 'ScannedNoOfImagesYes' 
//           FROM 
//             scanned s 
//           WHERE 
//             s.scandate = CURDATE() - INTERVAL 1 DAY 
//           GROUP BY 
//             s.locationname) tdyes 
//         ON 
//           tdyes.LocationName = tt.LocationName 
//         LEFT JOIN 
//           (SELECT 
//             s.locationname AS 'LocationName',
//             SUM(s.scanfiles) AS 'ScannedNoOfFilesPrev',
//             SUM(s.scanimages) AS 'ScannedNoOfImagesPrev' 
//           FROM 
//             scanned s 
//           WHERE 
//             s.scandate = CURDATE() - INTERVAL 2 DAY 
//           GROUP BY 
//             s.locationname) tdprev 
//         ON 
//           tdprev.LocationName = tt.LocationName 
//         LEFT JOIN 
//           (SELECT 
//             s.locationname AS 'LocationName',
//             SUM(s.scanfiles) AS 'ScannedNoOfFilesToday',
//             SUM(s.scanimages) AS 'ScannedNoOfImagesToday' 
//           FROM 
//             scanned s 
//           WHERE 
//             s.scandate = CURDATE() 
//           GROUP BY 
//             s.locationname) td 
//         ON 
//           td.LocationName = tt.LocationName 
//       ORDER BY 
//         tt.LocationName
//     `;

//   // Execute the query with locationName as parameter
//   mysql22.query(
//     query,
//     [locationName, locationName, locationName],
//     (err, results) => {
//       if (err) {
//         throw err;
//       }
//       res.json(results);
//     }
//   );
// });











app.get("/reportTable", cors(corsOptions), (req, res) => {
  mysql22.query(
    "SELECT locationid,locationname as 'LocationName',sum(`inventoryfiles`) as 'CollectionFiles',sum(`inventoryimages`) as 'CollectionImages',sum(`scanfiles`) as 'ScannedFiles',sum(`scanimages`) as 'ScannedImages',sum(`qcfiles`) as 'QCFiles',sum(`qcimages`) as 'QCImages',sum(`flaggingfiles`)  as 'FlaggingFiles',sum(`flaggingimages`)  as 'FlaggingImages',sum(`indexfiles`) as 'IndexingFiles',sum(`indeximages`) as 'IndexingImages',sum(`cbslqafiles`)  as 'CBSL_QAFiles',sum(`cbslqaimages`) as 'CBSL_QAImages',sum(`exportpdffiles`)  as 'Export_PdfFiles', sum(`exportpdfimages`)  as 'Export_PdfImages',sum(`clientqaacceptfiles`)  as 'Client_QA_AcceptedFiles', sum(`clientqaacceptimages`)  as 'Client QA AcceptedImages',sum(`clientqarejectfiles`)  as 'Client_QA_RejectedFiles',sum(`clientqarejectimages`)  as 'Client_QA_RejectedImages',sum(`digisignfiles`)  as 'Digi_SignFiles',sum(`digisignimages`)  as 'Digi_SignImages' FROM scanned  group by locationname;",
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});

app.get("/reporttablecsv", cors(corsOptions), (req, res, next) => {
  const locationName = req.query.locationName;

// Modify the SQL query to include a WHERE clause if a specific location is provided
let whereClause = "";
if (locationName) {
  whereClause = `WHERE s.locationname = '${locationName}'`;
}
  // const getCsv =
  //   "SELECT locationid,locationname as 'LocationName',sum(`inventoryfiles`) as 'CollectionFiles',sum(`inventoryimages`) as 'CollectionImages',sum(`scanfiles`) as 'ScannedFiles',sum(`scanimages`) as 'ScannedImages',sum(`qcfiles`) as 'QCFiles',sum(`qcimages`) as 'QCImages',sum(`flaggingfiles`)  as 'FlaggingFiles',sum(`flaggingimages`)  as 'FlaggingImages',sum(`indexfiles`) as 'IndexingFiles',sum(`indeximages`) as 'IndexingImages',sum(`cbslqafiles`)  as 'CBSL_QAFiles',sum(`cbslqaimages`) as 'CBSL_QAImages',sum(`exportpdffiles`)  as 'Export_PdfFiles', sum(`exportpdfimages`)  as 'Export_PdfImages',sum(`clientqaacceptfiles`)  as 'Client_QA_AcceptedFiles', sum(`clientqaacceptimages`)  as 'Client QA AcceptedImages',sum(`clientqarejectfiles`)  as 'Client_QA_RejectedFiles',sum(`clientqarejectimages`)  as 'Client_QA_RejectedImages',sum(`digisignfiles`)  as 'Digi_SignFiles',sum(`digisignimages`)  as 'Digi_SignImages' FROM scanned  group by locationname;";
  
  const getCsv = `SELECT locationid, locationname as 'LocationName',
  case when sum(inventoryfiles) is null then '0' else sum(inventoryfiles) end as 'CollectionFiles',
  case when sum(inventoryimages) is null then '0' else sum(inventoryimages) end as 'CollectionImages',
  case when sum(scanfiles) is null then '0' else sum(scanfiles) end as 'ScannedFiles',
  case when sum(scanimages) is null then '0' else sum(scanimages) end as 'ScannedImages',
  case when sum(qcfiles) is null then '0' else sum(qcfiles) end as 'QCFiles',
  case when sum(qcimages) is null then '0' else sum(qcimages) end as 'QCImages',
  case when sum(flaggingfiles) is null then '0' else sum(flaggingfiles) end as 'FlaggingFiles',
  case when sum(flaggingimages) is null then '0' else sum(flaggingimages) end as 'FlaggingImages',
  case when sum(indexfiles) is null then '0' else sum(indexfiles) end as 'IndexingFiles',
  case when sum(indeximages) is null then '0' else sum(indeximages) end as 'IndexingImages',
  case when sum(cbslqafiles) is null then '0' else sum(cbslqafiles) end as 'CBSL_QAFiles',
  case when sum(cbslqaimages) is null then '0' else sum(cbslqaimages) end as 'CBSL_QAImages',
  case when sum(exportpdffiles) is null then '0' else sum(exportpdffiles) end as 'Export_PdfFiles',
  case when sum(exportpdfimages) is null then '0' else sum(exportpdfimages) end as 'Export_PdfImages',
  case when sum(clientqaacceptfiles) is null then '0' else sum(clientqaacceptfiles) end as 'Client_QA_AcceptedFiles',
  case when sum(clientqaacceptimages) is null then '0' else sum(clientqaacceptimages) end as 'Client_QA_AcceptedImages',
  case when sum(clientqarejectfiles) is null then '0' else sum(clientqarejectfiles) end as 'Client_QA_RejectedFiles',
  case when sum(clientqarejectimages) is null then '0' else sum(clientqarejectimages) end as 'Client_QA_RejectedImages',
  case when sum(digisignfiles) is null then '0' else sum(digisignfiles) end as 'Digi_SignFiles',
  case when sum(digisignimages) is null then '0' else sum(digisignimages) end as 'Digi_SignImages' 
  FROM scanned s 
  ${whereClause}
  GROUP BY  locationname;`;

  mysql22.query(getCsv, (error, result, field) => {
    if (error) {
      console.error("Error occured when export csv:", err);
      res
        .status(500)
        .json({ error: "An error occurred while exporting csv file" });
      return;
    }
    const data = result;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment;filename=export.csv");
    

    res.write('Sr. No.,Location,Collection of Records, ,Scanning ADF, ,ImageQC, ,Document Classification, ,Indexing, ,CBSLQA, ,Export PDF, ,Client QA, ,CSV Generation, ,Inventory Out\n');
    res.write(
      " ,  ,Files, Images,Files,Images,Files,Images,Files,Images,Files, Images,Files,Images,Files,Images,Files,Images,Files,Images,Files,Images\n"
    );
    if (data == null) {
      res.end();
      return;
    }
    data.forEach((row,index) => {
      res.write(
        (index+1) +"," +
        row.LocationName +
          "," +
          row.CollectionFiles +
          "," +
          row.CollectionImages +
          "," +
          row.ScannedFiles +
          "," +
          row.ScannedImages +
          "," +
          row.QCFiles +
          "," +
          row.QCImages +
          "," +
          row.FlaggingFiles +
          "," +
          row.FlaggingImages +
          "," +
          row.IndexingFiles +
          "," +
          row.IndexingImages +
          "," +
          row.CBSL_QAFiles +
          "," +
          row.CBSL_QAImages +
          "," +
          row.Export_PdfFiles +
          "," +
          row.Export_PdfImages +
          "," +
          row.Client_QA_AcceptedFiles +
          "," +
          row.Client_QA_AcceptedImages +
          row.Client_QA_RejectedFiles +
          "," +
          row.Client_QA_RejectedImages +
          "," +
          row.Digi_SignFiles +
          "," +
          row.Digi_SignImages +
          "\n"
      );
    });
    res.end();
  });
});

app.get("/api/data", (req, res) => {
  let query1Results, query2Results;

  // Execute first query
  connection.query("SELECT * FROM table1", (error1, results1, fields1) => {
    if (error1) {
      console.error("Error executing first query: ", error1);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    query1Results = results1;

    // Execute second query
    connection.query("SELECT * FROM table2", (error2, results2, fields2) => {
      if (error2) {
        console.error("Error executing second query: ", error2);
        res.status(500).json({ error: "Internal server error" });
        return;
      }
      query2Results = results2;

      // Combine results
      const combinedResults = { query1Results, query2Results };
      res.json(combinedResults);
    });
  });
});

app.get("/reportLocationWiseTable", cors(corsOptions), (req, res) => {
  const locationName = req.query.locationname; // Retrieve location name from query parameter

  if (!locationName) {
    return res.status(400).json({ error: "Location name is required" }); // Return error if location name is not provided
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
      console.error("Error executing query:", err);
      return res.status(500).json({ error: "Internal Server Error" }); // Send error response
    }
    res.json(results); // Send JSON response with query results
  });
});

app.get("/api/tabularData", (req, res) => {
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
        ${
          locationId
            ? `WHERE CONVERT(s.locationid, SIGNED) IN (${locationId})`
            : ""
        }
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
            ${
              locationId
                ? `AND CONVERT(s.locationid, SIGNED) IN (${locationId})`
                : ""
            }
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
            ${
              locationId
                ? `AND CONVERT(s.locationid, SIGNED) IN (${locationId})`
                : ""
            }
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
            ${
              locationId
                ? `AND CONVERT(s.locationid, SIGNED) IN (${locationId})`
                : ""
            }
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

app.get("/api/locationwisetabularData", (req, res) => {
  const locationName = req.query.locationName; // Assuming locationName is passed as a query parameter

  // Construct the SQL query
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
        WHERE 
          s.locationname = ? 
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
          GROUP BY 
            s.locationname) td 
        ON 
          td.LocationName = tt.LocationName 
      ORDER BY 
        tt.LocationName
    `;

  // Execute the query with locationName as parameter
  mysql22.query(
    query,
    [locationName, locationName, locationName],
    (err, results) => {
      if (err) {
        throw err;
      }
      res.json(results);
    }
  );
});

app.get("/graph2", cors(corsOptions), (req, res) => {
  updcPrayagraj.query(
    "SELECT sum(exportpdfimages) as 'Export PDF' , sum(cbslqaimages)-sum(clientqaacceptimages) as 'Client QA Pending', sum(clientqaacceptimages) as 'Client QA',  sum(cbslqaimages) as 'CBSL QA', sum(scanimages) as 'Scanned', sum(inventoryimages) as 'Received'  from scanned;",
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});
app.get("/civil", cors(corsOptions), (req, res) => {
  updcPrayagraj.query(
    "SELECT  sum(scanfiles) as 'Civil Files' , sum(scanimages) as 'Civil Images' FROM `scanned` where  casetypename Not Like '%Criminal%';",
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});
app.get("/criminal", cors(corsOptions), (req, res) => {
  updcPrayagraj.query(
    "SELECT  sum(scanfiles) as 'Criminal Files' , sum(scanimages) as 'Criminal Images' FROM `scanned` where  casetypename Like '%Criminal%';",
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});
app.get("/graph7", cors(corsOptions), (req, res) => {
  updcPrayagraj.query(
    "SELECT sum(exportpdffiles) as 'Export PDF' , sum(cbslqafiles)-sum(clientqaacceptfiles) as 'Client QA Pending', sum(clientqaacceptfiles) as 'Client QA',  sum(cbslqafiles) as 'CBSL QA', sum(scanfiles) as 'Scanned', sum(inventoryfiles) as 'Received'  from scanned where (DATE(`inventorydate`) = CURDATE()-1 or DATE(`scandate`) = CURDATE()-1 or DATE(`cbslqadate`) = CURDATE()-1 or DATE(`clientqaacceptdate`) = CURDATE()-1 or DATE(`exportdate`) = CURDATE()-1);",
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});
app.get("/graph8", cors(corsOptions), (req, res) => {
  updcPrayagraj.query(
    "SELECT sum(exportpdfimages) as 'Export PDF' , sum(cbslqaimages)-sum(clientqaacceptimages) as 'Client QA Pending', sum(clientqaacceptimages) as 'Client QA',  sum(cbslqaimages) as 'CBSL QA', sum(scanimages) as 'Scanned', sum(inventoryimages) as 'Received'  from scanned where (DATE(`inventorydate`) = CURDATE()-1 or DATE(`scandate`) = CURDATE()-1 or DATE(`cbslqadate`) = CURDATE()-1 or DATE(`clientqaacceptdate`) = CURDATE()-1 or DATE(`exportdate`) = CURDATE()-1);",
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});

app.get("/graph9", cors(corsOptions), (req, res) => {
  updcPrayagraj.query(
    "SELECT locationname 'Location Name',sum(`scanimages`) as 'Images' FROM scanned where scandate= CURDATE()- INTERVAL 1 DAY group by locationname;",
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});

app.get("/graph10", cors(corsOptions), (req, res) => {
  updcPrayagraj.query(
    "SELECT locationname 'Location Name',sum(`scanimages`) as 'Images' FROM scanned group by locationname;",
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});

app.use("/searchlocation", (req, res, next) => {
  let data =
    "SELECT locationid,locationname as 'LocationName',sum(`inventoryfiles`) as 'CollectionFiles',sum(`inventoryimages`) as 'CollectionImages',sum(`scanfiles`) as 'ScannedFiles',sum(`scanimages`) as 'ScannedImages',sum(`qcfiles`) as 'QCFiles',sum(`qcimages`) as 'QCImages',sum(`flaggingfiles`)  as 'FlaggingFiles',sum(`flaggingimages`)  as 'FlaggingImages',sum(`indexfiles`) as 'IndexingFiles',sum(`indeximages`) as 'IndexingImages',sum(`cbslqafiles`)  as 'CBSL_QAFiles',sum(`cbslqaimages`) as 'CBSL_QAImages',sum(`exportpdffiles`)  as 'Export_PdfFiles', sum(`exportpdfimages`)  as 'Export_PdfImages',sum(`clientqaacceptfiles`)  as 'Client_QA_AcceptedFiles', sum(`clientqaacceptimages`)  as 'Client QA AcceptedImages',sum(`clientqarejectfiles`)  as 'Client_QA_RejectedFiles',sum(`clientqarejectimages`)  as 'Client_QA_RejectedImages',sum(`digisignfiles`)  as 'Digi_SignFiles',sum(`digisignimages`)  as 'Digi_SignImages' FROM scanned  group by locationname;";
  updcPrayagraj.query(data, (error, results, fields) => {
    if (error) {
      res.status(500).send(error.message);
      return;
    }
    const filters = req.query;
    const filteredUsers = results.filter((user) => {
      let isValid = true;
      for (key in filters) {
        console.log(key, user[key], filters[key]);
        isValid = isValid && user[key] == filters[key];
      }
      return isValid;
    });

    res.send(filteredUsers);
  });
});

function formatDate(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

app.get("/csv", cors(corsOptions), (req, res, next) => {
  // Extract location name from the request query parameters
  const locationName = req.query.locationName;

  // Modify the SQL query to include a WHERE clause if a specific location is provided
  let whereClause = "";
  if (locationName) {
    whereClause = `WHERE tt.LocationName = '${locationName}'`;
  }

  const getCsv = `
    SELECT tt.LocationName as 'LocationName',
    case when tt.ScannedNoOfFilesTotal is null then '0' else tt.ScannedNoOfFilesTotal end as 'Total_Files',
    case when tt.ScannedNoOfImagesTotal is null then '0' else tt.ScannedNoOfImagesTotal end as 'Total_Images',
    case when td.ScannedNoOfFilesToday is null then '0' else td.ScannedNoOfFilesToday end as 'Today_Files',
    case when td.ScannedNoOfImagesToday is null then '0' else td.ScannedNoOfImagesToday end as 'Today_Images',
    case when tdyes.ScannedNoOfFilesYes is null then '0' else tdyes.ScannedNoOfFilesYes end as 'Yes_Files',
    case when tdyes.ScannedNoOfImagesYes is null then '0' else tdyes.ScannedNoOfImagesYes end as 'Yes_Images',
    case when tdprev.ScannedNoOfFilesPrev is null then '0' else tdprev.ScannedNoOfFilesPrev end as 'Prev_Files',
    case when tdprev.ScannedNoOfImagesPrev is null then '0' else tdprev.ScannedNoOfImagesPrev end as 'Prev_Images'
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
    ${whereClause}
    ORDER BY tt.LocationName;`;

  mysql22.query(getCsv, (error, result, field) => {
    if (error) {
      console.error("Error occurred when exporting csv:", error);
      res.status(500).json({ error: "An error occurred while exporting the CSV file" });
      return;
    }
    const formattedPreviousDate = formatDate(new Date(Date.now() - 86400000)); // Previous date
    const formattedYesterdayDate = formatDate(new Date(Date.now() - 2 * 86400000)); // Yesterday date
    const formattedCurrentDate = formatDate(new Date()); // Current date
    const data = result;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment;filename=export.csv");
    res.write(`Sr No.,Location Name,Scanned (${formattedYesterdayDate}),Scanned (${formattedYesterdayDate}),Scanned (${formattedPreviousDate}),Scanned (${formattedPreviousDate}),Scanned (${formattedCurrentDate}),Scanned (${formattedCurrentDate}),Cumulative till date,Cumulative till date,Remarks\n`);
    res.write(`,  ,Files,Images,Files,Images,Files,Images,Files,Images\n`);
    if (data == null) {
      res.end();
      return;
    }
    data.forEach((row,index) => {
      res.write(
        (index + 1) + "," + 
        row.LocationName +
          "," +
          row.Prev_Files +
          "," +
          row.Prev_Images +
          "," + 
          row.Yes_Files +
          "," +
          row.Yes_Images +
          "," +
          row.Today_Files +
          "," +
          row.Today_Images +
          "," +
          row.Total_Files +
          "," +
          row.Total_Images +
          "\n"
      );
    });
   

    res.end();
  });
});






// app.get("/csv", cors(corsOptions), (req, res, next) => {
//   const locationName = req.query.locationName;

//   const getCsv = `SELECT tt.LocationName as 'LocationName',
//     case when tt.ScannedNoOfFilesTotal is null then '0' else tt.ScannedNoOfFilesTotal end as 'Total_Files',
//     case when tt.ScannedNoOfImagesTotal is null then '0' else tt.ScannedNoOfImagesTotal end as 'Total_Images',
//     case when td.ScannedNoOfFilesToday is null then '0' else td.ScannedNoOfFilesToday end as 'Today_Files',
//     case when td.ScannedNoOfImagesToday is null then '0' else td.ScannedNoOfImagesToday end as 'Today_Images',
//     case when tdyes.ScannedNoOfFilesYes is null then '0' else tdyes.ScannedNoOfFilesYes end as 'Yes_Files',
//     case when tdyes.ScannedNoOfImagesYes is null then '0' else tdyes.ScannedNoOfImagesYes end as 'Yes_Images',
//     case when tdprev.ScannedNoOfFilesPrev is null then '0' else tdprev.ScannedNoOfFilesPrev end as 'Prev_Files',
//     case when tdprev.ScannedNoOfImagesPrev is null then '0' else tdprev.ScannedNoOfImagesPrev end as 'Prev_Images'
//     FROM (SELECT s.locationname 'LocationName',
//     SUM(s.scanfiles) as 'ScannedNoOfFilesTotal',
//     SUM(s.scanimages) as 'ScannedNoOfImagesTotal'
//     FROM scanned s
//     GROUP BY s.locationname) tt
//     LEFT JOIN (SELECT s.locationname 'LocationName',
//     SUM(s.scanfiles) as 'ScannedNoOfFilesYes',
//     SUM(s.scanimages) as 'ScannedNoOfImagesYes'
//     FROM scanned s 
//     WHERE s.scandate = CURDATE() - INTERVAL 1 DAY
//     GROUP BY s.locationname) tdyes
//     ON tdyes.LocationName = tt.LocationName 
//     LEFT JOIN (SELECT s.locationname 'LocationName',
//     SUM(s.scanfiles) as 'ScannedNoOfFilesPrev',
//     SUM(s.scanimages) as 'ScannedNoOfImagesPrev'
//     FROM scanned s 
//     WHERE s.scandate = CURDATE() - INTERVAL 2 DAY 
//     GROUP BY s.locationname) tdprev 
//     ON tdprev.LocationName = tt.LocationName 
//     LEFT JOIN (SELECT s.locationname 'LocationName',
//     SUM(s.scanfiles) as 'ScannedNoOfFilesToday',
//     SUM(s.scanimages) as 'ScannedNoOfImagesToday'
//     FROM scanned s 
//     WHERE s.scandate = CURDATE()
//     GROUP BY s.locationname) td 
//     ON td.LocationName = tt.LocationName 
//     ORDER BY tt.LocationName;`;
//   mysql22.query(getCsv, (error, result, field) => {
//     if (error) {
//       console.error("Error occured when export csv:", error);
//       res
//         .status(500)
//         .json({ error: "An error occurred while exporting csv file" });
//       return;
//     }
//     const data = result;
//     res.setHeader("Content-Type", "text/csv");
//     res.setHeader("Content-Disposition", "attachment;filename=export.csv");
//     res.write(
//       "Location Name,Files, Images,Files,Images,Files,Images,Files,Images\n"
//     );
//     if (data == null) {
//       res.end();
//       return;
//     }
//     data.forEach((row) => {
//       res.write(
//         row.LocationName +
//           "," +
//           row.Prev_Files +
//           "," +
//           row.Prev_Images +
//           "," +
//           row.Yes_Files +
//           "," +
//           row.Yes_Images +
//           "," +
//           row.Today_Files +
//           "," +
//           row.Today_Images +
//           "," +
//           row.Total_Files +
//           "," +
//           row.Total_Images +
//           "\n"
//       );
//     });
//     res.end();
//   });
// });


//  app.get("/csv", cors(corsOptions), (req, res, next) => {
//   const locationNames = req.query.locationname; // Retrieve location names from query parameter


//   let query = `SELECT tt.LocationName as 'LocationName',
//   tt.ScannedNoOfFilesTotal as 'Total_Files',
//   tt.ScannedNoOfImagesTotal as 'Total_Images',
//   td.ScannedNoOfFilesToday as 'Today_Files ',
//   td.ScannedNoOfImagesToday as 'Today_Images ',
//   tdyes.ScannedNoOfFilesYes as 'Yes_Files ',
//   tdyes.ScannedNoOfImagesYes as 'Yes_Images ',
//   tdprev.ScannedNoOfFilesPrev as 'Prev_Files ',
//   tdprev.ScannedNoOfImagesPrev as 'Prev_Images '
//   FROM (SELECT s.locationname 'LocationName',
//   SUM(s.scanfiles) as 'ScannedNoOfFilesTotal',
//   SUM(s.scanimages) as 'ScannedNoOfImagesTotal'
//   FROM scanned s
//   GROUP BY s.locationname) tt
//   LEFT JOIN (SELECT s.locationname 'LocationName',
//   SUM(s.scanfiles) as 'ScannedNoOfFilesYes',
//   SUM(s.scanimages) as 'ScannedNoOfImagesYes'
//   FROM scanned s 
//   WHERE s.scandate = CURDATE() - INTERVAL 1 DAY
//   GROUP BY s.locationname) tdyes
//   ON tdyes.LocationName = tt.LocationName 
//   LEFT JOIN (SELECT s.locationname 'LocationName',
//   SUM(s.scanfiles) as 'ScannedNoOfFilesPrev',
//   SUM(s.scanimages) as 'ScannedNoOfImagesPrev'
//   FROM scanned s 
//   WHERE s.scandate = CURDATE() - INTERVAL 2 DAY 
//   GROUP BY s.locationname) tdprev 
//   ON tdprev.LocationName = tt.LocationName 
//   LEFT JOIN (SELECT s.locationname 'LocationName',
//   SUM(s.scanfiles) as 'ScannedNoOfFilesToday',
//   SUM(s.scanimages) as 'ScannedNoOfImagesToday'
//   FROM scanned s 
//   WHERE s.scandate = CURDATE()
//   GROUP BY s.locationname) td 
//   ON td.LocationName = tt.LocationName 
//   ORDER BY tt.LocationName;`


//   if (locationNames && locationNames.length > 0) {
//     query += ` AND locationname IN (?)`;
//   }


//   mysql22.query(query, [locationNames], (error, result, field) => {
//     if (error) {
//       console.error("Error occured when export csv:", err);
//       res.status(500).json({ error: 'An error occurred while exporting csv file' });
//       return;
//     }
//     const data = result;
//     res.setHeader('Content-Type', 'text/csv');
//     res.setHeader('Content-Disposition',
//       'attachment;filename =' + "export.csv" + "'");
//     res.write("Location Name,Total Files,Total Images,Today Files,Today Images,Yes Files,Yes Images,Prev Files, Prev Images\n");
//     if (data == null) {
//       res.end();
//       return;
//     }
//     data.forEach((row) => {
//       res.write(row.LocationName + "," + row.Total_Files + "," + row.Total_Images + "," + row.Today_Files + "," + row.Today_Images + "," + row.Yes_Files + "," + row.Yes_Images + "," + row.Prev_Files + "," + row.Prev_Images + "\n")
//     });
//     res.end();
//   });
// });

// app.get("/csv", cors(corsOptions), (req, res, next) => {
//   const locationNames = req.query.locationname; // Retrieve location names from query parameter


//   let query = `SELECT tt.LocationName as 'LocationName',
//   tt.ScannedNoOfFilesTotal as 'Total_Files',
//   tt.ScannedNoOfImagesTotal as 'Total_Images',
//   td.ScannedNoOfFilesToday as 'Today_Files ',
//   td.ScannedNoOfImagesToday as 'Today_Images ',
//   tdyes.ScannedNoOfFilesYes as 'Yes_Files ',
//   tdyes.ScannedNoOfImagesYes as 'Yes_Images ',
//   tdprev.ScannedNoOfFilesPrev as 'Prev_Files ',
//   tdprev.ScannedNoOfImagesPrev as 'Prev_Images '
//   FROM (SELECT s.locationname 'LocationName',
//   SUM(s.scanfiles) as 'ScannedNoOfFilesTotal',
//   SUM(s.scanimages) as 'ScannedNoOfImagesTotal'
//   FROM scanned s
//   GROUP BY s.locationname) tt
//   LEFT JOIN (SELECT s.locationname 'LocationName',
//   SUM(s.scanfiles) as 'ScannedNoOfFilesYes',
//   SUM(s.scanimages) as 'ScannedNoOfImagesYes'
//   FROM scanned s 
//   WHERE s.scandate = CURDATE() - INTERVAL 1 DAY
//   GROUP BY s.locationname) tdyes
//   ON tdyes.LocationName = tt.LocationName 
//   LEFT JOIN (SELECT s.locationname 'LocationName',
//   SUM(s.scanfiles) as 'ScannedNoOfFilesPrev',
//   SUM(s.scanimages) as 'ScannedNoOfImagesPrev'
//   FROM scanned s 
//   WHERE s.scandate = CURDATE() - INTERVAL 2 DAY 
//   GROUP BY s.locationname) tdprev 
//   ON tdprev.LocationName = tt.LocationName 
//   LEFT JOIN (SELECT s.locationname 'LocationName',
//   SUM(s.scanfiles) as 'ScannedNoOfFilesToday',
//   SUM(s.scanimages) as 'ScannedNoOfImagesToday'
//   FROM scanned s 
//   WHERE s.scandate = CURDATE()
//   GROUP BY s.locationname) td 
//   ON td.LocationName = tt.LocationName 
//   ORDER BY tt.LocationName;`


//   if (locationNames && locationNames.length > 0) {
//     query += ` AND locationname IN (?)`;
//   }


//   mysql22.query(query, [locationNames], (error, result, field) => {
//     if (error) {
//       console.error("Error occured when export csv:", err);
//       res.status(500).json({ error: 'An error occurred while exporting csv file' });
//       return;
//     }
//     const data = result;
//     res.setHeader('Content-Type', 'text/csv');
//     res.setHeader('Content-Disposition',
//       'attachment;filename =' + "export.csv" + "'");
//     res.write("Location Name,Total Files,Total Images,Today Files,Today Images,Yes Files,Yes Images,Prev Files, Prev Images\n");
//     if (data == null) {
//       res.end();
//       return;
//     }
//     data.forEach((row) => {
//       res.write(row.LocationName + "," + row.Total_Files + "," + row.Total_Images + "," + row.Today_Files + "," + row.Today_Images + "," + row.Yes_Files + "," + row.Yes_Images + "," + row.Prev_Files + "," + row.Prev_Images + "\n")
//     });
//     res.end();
//   });
// });


app.get("/tabularData", cors(corsOptions), (req, res) => {
  mysql22.query(
    `
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
  ;`,
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});
app.get("/api/uploadlog", (req, res) => {
  let whereClause = ""; // Assuming you will pass the where clause as a query parameter

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

app.get("/site_MPData", cors(corsOptions), (req, res) => {
  mysql22.query("SELECT * FROM tbl_site_mp;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.get('/group_master' ,cors(corsOptions),(req,res)=>{
updcPrayagraj.query("select group_id,group_name from tbl_group_master order by group_name asc;" ,(err,results)=>{
  if (err){
    throw err;
  }
  res.json(results);
})
})

app.get("/privilege",cors(corsOptions),(req,res)=>{
  updcPrayagraj.query("select role_id,user_role from tbl_user_roles order by user_role asc;",(err,results)=>{
    if(err){
      throw err;
    }
    res.json(results);
  })
})

app.get('/privilege/:userId', cors(corsOptions), (req, res) => {
  const userId = req.params.userId;
  const query = `SELECT role_id, user_role FROM tbl_user_roles WHERE user_id = ?`;
  updcPrayagraj.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching user role:", err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(results[0]);
  });
});

app.get("/storage",cors(corsOptions),(req,res)=>{
  updcPrayagraj.query("select * from tbl_storage_level",(err,results)=>{
    if(err){
      throw err;
    }
    res.json(results);
  })
})

app.get("/reporting",cors(corsOptions),(req,res)=>{
  updcPrayagraj.query("select * from tbl_user_master where user_id  and active_inactive_users='1' order by first_name,last_name asc;",(err,results)=>{
    if(err){
      throw err;
    }
    res.json(results)
  })
})

app.get('/user_master', cors(corsOptions), (req, res) => {
  updcPrayagraj.query("SELECT * FROM tbl_user_master where user_id and active_inactive_users = '1' order by first_name, last_name asc;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.get('/user_email', cors(corsOptions), (req, res) => {
  updcPrayagraj.query("SELECT user_email_id FROM tbl_user_master;", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.post("/userinfo", (req, res) => {
  const { name, email, phone, password } = req.body;
  const query =
    "INSERT INTO userinfo (username, email, phone, password) VALUES (?, ?, ?, ?)";
  db.query(query, [name, email, phone, password], (err, result) => {
    if (err) {
      console.error("Error inserting user:", err);
      res.status(500).json({ error: "An error occurred while inserting user" });
    } else {
      res
        .status(200)
        .json({ message: "User added successfully", id: result.insertId });
    }
  });
});

app.post("/createuser", (req, res) => {
  const data = req.body;
  // console.log("data",req.body);

  const selectQuery = "SELECT * FROM tbl_user_master WHERE user_email_id=?";
  updcPrayagraj.query(selectQuery, [data.user_email_id], (err, rows) => {
    if (err) {
      console.error("Error checking user existence:", err);
      return res.status(500).json({ error: "An error occurred while checking user existence" });
    }
    
    // If user already exists, return error
    if (rows.length > 0) {
      return res.status(500).json({ error: "User already exists" });
    }

  const query1 = "INSERT INTO tbl_user_master (user_email_id,first_name,middle_name,last_name,password,designation,phone_no,profile_picture,superior_name,superior_email,user_created_date,emp_id,last_pass_change,login_disabled_date,fpi_template, fpi_template_two,fpi_template_three,fpi_template_four,lang,locations,user_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  updcPrayagraj.query(query1, [data.user_email_id, data.first_name, data.middle_name, data.last_name,data.password, data.designation, data.phone_no, data.profile_picture, data.superior_name, data.superior_email, data.user_created_date, data.emp_id, data.last_pass_change, data.login_disabled_date, data.fpi_template, data.fpi_template_two, data.fpi_template_three, data.fpi_template_four, data.lang, data.locations, data.user_type], (err, results) => {
    if (err) {
      console.error("Error inserting user:", err);
      return res.status(500).json({ error: "An error occurred while inserting user" });
    }
    const user_id = results.insertId;

    const query2 = "INSERT INTO tbl_storagelevel_to_permission (user_id, sl_id) VALUES (?, ?)";
    updcPrayagraj.query(query2, [data.user_id,data.sl_id], (err, results) => {
      if (err) {
        console.error("Error linking user with permission:", err);
        return res.status(500).json({ error: "An error occurred while linking user with permission" });
      }

      const query3 = "INSERT INTO tbl_ezeefile_logs (user_id, user_name, action_name, start_date, system_ip, remarks) VALUES (?, ?, ?, ?, ?, ?)";
      updcPrayagraj.query(query3, [data.user_id, data.user_name, data.action_name, data.start_date, data.system_ip, data.remarks], (err, results) => {
        if (err) {
          console.error("Error inserting user log:", err);
          return res.status(500).json({ error: "An error occurred while inserting user log" });
        }

        const query4 = "INSERT INTO tbl_bridge_role_to_um (role_id, user_ids) VALUES (?, ?)";
        updcPrayagraj.query(query4, [data.role_id,user_id, data.user_ids], (err, results) => {
          if (err) {
            console.error("Error inserting user role:", err);
            return res.status(500).json({ error: "An error occurred while inserting user role" });
          }
          

          const query5 = "INSERT INTO tbl_bridge_grp_to_um (group_id, user_ids ) VALUES (?, ?)";
          updcPrayagraj.query(query5, [data.group_id,user_id, data.user_ids], (err, results) => {
            if (err) {
              console.error("Error inserting user group:", err);
              return res.status(500).json({ error: "An error occurred while inserting user group" });
            }

            res.status(200).json({ message: "User added successfully", id: user_id });
          });
        });
        });
      });
    });
  });
  
});





app.post("/usermasterinfo", (req, res) => {
  const { Desig_ID, Desig_name } = req.body;
  const query =
    "INSERT INTO tbl_designation_master (Desig_ID, Desig_name) VALUES (?, ?)";
  updcPrayagraj.query(query, [Desig_ID, Desig_name], (err, result) => {
    if (err) {
      console.error("Error inserting user:", err);
      res.status(500).json({ error: "An error occurred while inserting user" });
    } else {
      res
        .status(200)
        .json({ message: "User added successfully", id: result.insertId });
    }
  });
});
app.post("/site_MP", (req, res) => {
  const {
    PH_Id,
    PO_Id,
    PM_Id,
    PCo_Id,
    SM_Id,
    Coll_Index_MP,
    Barc_MP,
    Barc_TF,
    Barc_TI,
    Page_No_MP,
    Prepare_MP,
    Prepare_TF,
    Prepare_TI,
    Scan_MP,
    Cover_Page_MP,
    Cover_Page_TF,
    Rescan_MP,
    Image_QC_MP,
    Doc_MP,
    Index_MP,
    CBSL_QA_MP,
    Ready_Cust_QA_MP,
    Cust_QA_Done_MP,
    PDF_Export_MP,
    Refilling_Files_MP,
    Refilling_Files_TF,
    Refilling_Files_TI,
    Inventory_MP,
    Location_Id,
  } = req.body;
  const query =
    "INSERT INTO tbl_site_mp (PH_Id,PO_Id, PM_Id, PCo_Id, SM_Id, Coll_Index_MP, Barc_MP, Barc_TF, Barc_TI, Page_No_MP, Prepare_MP, Prepare_TF, Prepare_TI, Scan_MP, Cover_Page_MP, Cover_Page_TF, Rescan_MP, Image_QC_MP, Doc_MP, Index_MP, CBSL_QA_MP, Ready_Cust_QA_MP, Cust_QA_Done_MP, PDF_Export_MP, Refilling_Files_MP, Refilling_Files_TF, Refilling_Files_TI, Inventory_MP, Location_ID) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
  mysql22.query(
    query,
    [
      PH_Id,
      PO_Id,
      PM_Id,
      PCo_Id,
      SM_Id,
      Coll_Index_MP,
      Barc_MP,
      Barc_TF,
      Barc_TI,
      Page_No_MP,
      Prepare_MP,
      Prepare_TF,
      Prepare_TI,
      Scan_MP,
      Cover_Page_MP,
      Cover_Page_TF,
      Rescan_MP,
      Image_QC_MP,
      Doc_MP,
      Index_MP,
      CBSL_QA_MP,
      Ready_Cust_QA_MP,
      Cust_QA_Done_MP,
      PDF_Export_MP,
      Refilling_Files_MP,
      Refilling_Files_TF,
      Refilling_Files_TI,
      Inventory_MP,
      Location_Id,
    ],
    (err, result) => {
      if (err) {
        console.error("Error inserting user:", err);
        res
          .status(500)
          .json({ error: "An error occurred while inserting user" });
      } else {
        res
          .status(200)
          .json({
            message: "ManPower added successfully",
            id: result.insertId,
          });
      }
    }
  );
});

// app.put("/createuserupdate/:user_id", (req, res) => {
//   const { data1, data2, data3, data4, data5 } = req.body;
//   const { user_id } = req.params;

//   const query1 = `
//     UPDATE tbl_user_master 
//     SET 
//       user_email_id = ?, 
//       first_name = ?, 
//       middle_name = ?, 
//       last_name = ?, 
//       password = ?, 
//       designation = ?, 
//       phone_no = ?, 
//       profile_picture = ?, 
//       superior_name = ?, 
//       superior_email = ?, 
//       user_created_date = ?, 
//       emp_id = ?, 
//       last_pass_change = ?, 
//       login_disabled_date = ?, 
//       fpi_template = ?, 
//       fpi_template_two = ?, 
//       fpi_template_three = ?, 
//       fpi_template_four = ?, 
//       lang = ?, 
//       locations = ?, 
//       user_type = ?
//     WHERE user_id = ?
//   `;

//   const params = [
//     data1.user_email_id, 
//     data1.first_name, 
//     data1.middle_name, 
//     data1.last_name, 
//     data1.password, 
//     data1.designation, 
//     data1.phone_no, 
//     data1.profile_picture, 
//     data1.superior_name, 
//     data1.superior_email, 
//     data1.user_created_date, 
//     data1.emp_id, 
//     data1.last_pass_change, 
//     data1.login_disabled_date, 
//     data1.fpi_template, 
//     data1.fpi_template_two, 
//     data1.fpi_template_three, 
//     data1.fpi_template_four, 
//     data1.lang, 
//     data1.locations, 
//     data1.user_type, 
//     user_id
//   ];

//   updcPrayagraj.query1(query1, params, (err, results) => {
//     if (err) {
//       console.error("Error updating user:", err);
//       return res.status(500).json({ error: "An error occurred while updating user" });
//     }

//     const query2 = `UPDATE tbl_bridge_role_to_um 
//     SET
//     user_ids=?
//     WHERE
//        role_id=?`;
//        const params =[
//         data5.user_ids,
//         role_id
//        ]
//     updcPrayagraj.query(query2, params, (err, results) => {
//       if (err) {
//         console.error("Error inserting user role:", err);
//         return res.status(500).json({ error: "An error occurred while inserting user role" });
//       }

//       const query3 = `UPDATE tbl_bridge_role_to_um 
//     SET
//     user_ids=?
//     WHERE
//        group_id=?`;
//        const params =[
//         group_id
//        ]
//     updcPrayagraj.query(query3, params, (err, results) => {
//       if (err) {
//         console.error("Error inserting user role:", err);
//         return res.status(500).json({ error: "An error occurred while inserting user role" });
//       }



//     res.status(200).json({ message: "User updated successfully", id: user_id });
//   });
// });

app.put("/createuserupdate/:user_id", (req, res) => {
  const  data = req.body;
  console.log(req.body)
  const { user_id } = req.params;

  const query1 = `
    UPDATE tbl_user_master 
    SET 
      user_email_id = ?, 
      first_name = ?, 
      middle_name = ?, 
      last_name = ?, 
      password = ?, 
      designation = ?, 
      phone_no = ?, 
      profile_picture = ?, 
      superior_name = ?, 
      superior_email = ?, 
      user_created_date = ?, 
      emp_id = ?, 
      last_pass_change = ?, 
      login_disabled_date = ?, 
      fpi_template = ?, 
      fpi_template_two = ?, 
      fpi_template_three = ?, 
      fpi_template_four = ?, 
      lang = ?, 
      locations = ?, 
      user_type = ?
    WHERE user_id = ?
  `;

  const params1 = [
    data.user_email_id, 
    data.first_name, 
    data.middle_name, 
    data.last_name, 
    data.password, 
    data.designation, 
    data.phone_no, 
    data.profile_picture, 
    data.superior_name, 
    data.superior_email, 
    data.user_created_date, 
    data.emp_id, 
    data.last_pass_change, 
    data.login_disabled_date, 
    data.fpi_template, 
    data.fpi_template_two, 
    data.fpi_template_three, 
    data.fpi_template_four, 
    data.lang, 
    data.locations, 
    data.user_type, 
    user_id
  ];

  updcPrayagraj.query(query1, params1, (err, results) => {
    if (err) {
      console.error("Error updating user:", err);
      return res.status(500).json({ error: "An error occurred while updating user" });
    }

    const query2 = `
      UPDATE tbl_bridge_role_to_um 
      SET
        user_ids=?
      WHERE
        role_id=?
    `;
    const params2 = [
      data.role_id,
      user_id,
      data.user_ids,
      
    ];
    updcPrayagraj.query(query2, params2, (err, results) => {
      if (err) {
        console.error("Error updating user role:", err);
        return res.status(500).json({ error: "An error occurred while updating user role" });
      }

      const query3 = `
        UPDATE tbl_bridge_grp_to_um 
        SET
          user_ids=?
        WHERE
          group_id=?
      `;
      const params3 = [
        data.group_id,
        user_id,
        data.user_ids,
        
      ];
      updcPrayagraj.query(query3, params3, (err, results) => {
        if (err) {
          console.error("Error updating user group:", err);
          return res.status(500).json({ error: "An error occurred while updating user group" });
        }

        res.status(200).json({ message: "User updated successfully", id: user_id });
      });
    });
  });
});


app.put("/usermasterupdate/:Desig_ID", (req, res) => {
  const { Desig_name, Desig_ID } = req.body;
  const query =
    "UPDATE tbl_designation_master SET Desig_name = ? where Desig_ID = ?;";
  updcPrayagraj.query(query, [Desig_name, Desig_ID], (err, result) => {
    if (err) {
      console.error("Error inserting user:", err);
      res.status(500).json({ error: "An error occurred while updating user" });
    } else {
      res
        .status(200)
        .json({
          message: "User updated successfully",
          id: req.params.Desig_ID,
        });
    }
  });
});

app.delete("/createuserdelete/:user_id", (req, res) => {
  const { user_id } = req.params;
  updcPrayagraj.query(
    "DELETE FROM tbl_user_master WHERE user_id = ?",
    [user_id],
    (err) => {
      if (err) throw err;
      res.json({ message: "User deleted successfully" });
    }
  );
});

app.delete("/usermasterdelete/:Desig_ID", (req, res) => {
  const { Desig_ID } = req.params;
  updcPrayagraj.query(
    "DELETE FROM tbl_designation_master WHERE Desig_ID = ?",
    [Desig_ID],
    (err) => {
      if (err) throw err;
      res.json({ message: "User deleted successfully" });
    }
  );
});

//SELECT first_name,last_name,designation FROM tbl_user_master where designation in ('project manager', 'site incharge', 'project owner', 'site manager');
// SELECT locationid,locationname as 'LocationName',
// case when sum(`inventoryfiles`) is null then '0' else sum(`inventoryfiles`) end as 'CollectionFiles',
// case when sum(`inventoryimages`) is null then '0' else sum(`inventoryimages`) end as 'CollectionImages',
// case when sum(`scanfiles`) is null then '0' else sum(`scanfiles`) end as 'ScannedFiles',
// case when sum(`scanimages`) is null then '0' else sum(`scanimages`) end as 'ScannedImages',
// case when sum(`qcfiles`) is null then '0' else sum(`qcfiles`) end as 'QCFiles',
// case when sum(`qcimages`) is null then '0' else sum(`qcimages`) end as 'QCImages',
// case when sum(`flaggingfiles`)is null then '0' else sum(`flaggingfiles`) end  as 'FlaggingFiles',
// case when sum(`flaggingimages`)is null then '0' else sum(`flaggingimages`) end  as 'FlaggingImages',
// case when sum(`indexfiles`) is null then '0' else sum(`indexfiles`) end as 'IndexingFiles',
// case when sum(`indeximages`) is null then '0' else sum(`indeximages`) end as 'IndexingImages',
// case when sum(`cbslqafiles`) is null then '0' else sum(`cbslqafiles`) end  as 'CBSL_QAFiles',
// case when sum(`cbslqaimages`)is null then '0' else sum(`cbslqaimages`) end as 'CBSL_QAImages',
// case when sum(`exportpdffiles`) is null then '0' else sum(`exportpdffiles`) end  as 'Export_PdfFiles',
// case when sum(`exportpdfimages`) is null then '0' else sum(`exportpdfimages`) end  as 'Export_PdfImages',
// case when sum(`clientqaacceptfiles`)is null then '0' else sum(`clientqaacceptfiles`) end as 'Client_QA_AcceptedFiles',
// case when sum(`clientqaacceptimages`)is null then '0' else sum(`clientqaacceptimages`)end as 'Client QA AcceptedImages',
// case when sum(`clientqarejectfiles`)is null then '0' else sum(`clientqarejectfiles`) end as 'Client_QA_RejectedFiles',
// case when sum(`clientqarejectimages`) is null then '0' else sum(`clientqarejectimages`) end  as 'Client_QA_RejectedImages',
// case when sum(`digisignfiles`) is null then '0' else sum(`digisignfiles`) end as 'Digi_SignFiles',
// case when sum(`digisignimages`) is null then '0' else sum(`digisignimages`)end as 'Digi_SignImages' FROM scanned  group by locationname;


 // const data1= {
  //   first_name,
  //   middle_name,
  //   last_name,
  //   user_email_id,
  //   password,
  //   designation,
  //   phone_no,
  //   emp_id,
  //   user_type,
  //   profile_picture,
  //   lang,
  //   user_created_date,
  //   last_pass_change,
  //   login_disabled_date,
  //   fpi_template,
  //   fpi_template_two,
  //   fpi_template_three,
  //   locations,
  //   fpi_template_four,
  //   superior_email,
  //   superior_name
  // } 