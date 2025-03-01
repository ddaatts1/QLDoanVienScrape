const schedule = require("node-schedule");
const scrapeId = require("./scraper1");
const scrapeId_TK = require("./QuanLyTaiKhoan/scraper_TK");
const scrapeInfo = require("./scraperInfo1");
const scrapeInfo_TK = require("./QuanLyTaiKhoan/scraperInfor_TK");

// Hàm chạy hai chức năng lần lượt
async function runScrapers() {
    try {
        console.log("Starting scraping tasks...");

        // Đo thời gian chạy của scrapeId
        const startScrapeId = Date.now();
        // await scrapeId(); // Chạy scrapeId
        const endScrapeId = Date.now();
        console.log(`scrapeId completed in ${(endScrapeId - startScrapeId) / 1000} seconds.`);

        // Đo thời gian chạy của scrapeInfo
        const startScrapeInfo = Date.now();
        await scrapeInfo(); // Chạy scrapeInfo
        const endScrapeInfo = Date.now();
        console.log(`scrapeInfo completed in ${(endScrapeInfo - startScrapeInfo) / 1000} seconds.`);
        console.log(`scrapeId completed in ${(endScrapeId - startScrapeId) / 1000} seconds.`);

    } catch (err) {
        console.error("Error during scraping tasks:", err);
    }
}


async function runScrapers_TK() {
    try {
        console.log("Starting scraping tasks...");

        // Đo thời gian chạy của scrapeId
        const startScrapeId = Date.now();
        // await scrapeId_TK(); // Chạy scrapeId
        const endScrapeId = Date.now();
        console.log(`scrapeId completed in ${(endScrapeId - startScrapeId) / 1000} seconds.`);

        // Đo thời gian chạy của scrapeInfo
        const startScrapeInfo = Date.now();
        await scrapeInfo_TK(); // Chạy scrapeInfo
        const endScrapeInfo = Date.now();
        console.log(`scrapeInfo completed in ${(endScrapeInfo - startScrapeInfo) / 1000} seconds.`);
        console.log(`scrapeId completed in ${(endScrapeId - startScrapeId) / 1000} seconds.`);

    } catch (err) {
        console.error("Error during scraping tasks:", err);
    }
}


(async () => {
    // Chạy khi ứng dụng khởi động
    // await runScrapers();
    await runScrapers_TK();

// Lên lịch chạy hàng ngày lúc 0:15 sáng
    schedule.scheduleJob("15 0 * * *", async () => {
        console.log("Running scheduled scraping tasks at 0:15 AM...");
        await runScrapers();
    });

    console.log("Web scraper is running and scheduled.");
})();



async function runWithTimeout(fn, timeout) {
    return new Promise((resolve, reject) => {
        // Hẹn giờ dừng sau `timeout` (ms)
        const timer = setTimeout(() => {
            reject(new Error("Function execution timed out after " + timeout + "ms"));
        }, timeout);

        // Gọi hàm `fn`
        fn()
            .then((result) => {
                clearTimeout(timer); // Hủy hẹn giờ nếu hàm hoàn thành
                resolve(result);
            })
            .catch((err) => {
                clearTimeout(timer); // Hủy hẹn giờ nếu lỗi xảy ra
                reject(err);
            });
    });
}