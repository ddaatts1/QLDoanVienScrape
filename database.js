const mysql = require("mysql2");

// MySQL connection configuration
const db = mysql.createConnection({
    host: "localhost",     // Your MySQL host
    user: "root",          // Your MySQL username
    password: "123456",          // Your MySQL password
    database: "scrape_db", // Your MySQL database
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error("Error connecting to the database:", err);
        process.exit(1);
    }
    console.log("Connected to the MySQL database.");
});

module.exports = db;
