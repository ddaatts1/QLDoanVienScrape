const schedule = require("node-schedule");
const scrapeId = require("./scraper");
const scrapeInfo  = require("./scraperInfor");


// Run the scraper immediately on startup
// scrapeId();
scrapeInfo();
// Schedule the scraper to run every day at midnight
schedule.scheduleJob("0 0 * * *", () => {
    console.log("Running scheduled scraping task...");
    scrapeId();
});

console.log("Web scraper is running and scheduled.");
