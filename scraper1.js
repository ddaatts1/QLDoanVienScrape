const puppeteer = require("puppeteer");
const db = require("./database");
const axios = require("axios");


// Hàm đệ quy để duyệt qua tất cả các danh sách con
async function processDropdown(page, parentElement,parentIndex = '') {
    if (!parentElement) {
        console.log("Parent element is null or undefined. Skipping...");
        return;
    }

    // Log the HTML content of the parent element
    const parentHTML = await page.evaluate((el) => el.outerHTML, parentElement);
    console.log("HTML of parentElement:\n", parentHTML);



    // Find all the child elements after expansion
    const childElements = await parentElement.$$('span.haschild');
    // const childElementsI = await parentElement.$$('span.expand-button');
    const childElementsI = await parentElement.$$(
        'span.expand-button i'
    );
    const childElementsLi = await parentElement.$$(
        'li'
    );

    for (let i = 1; i < childElements.length; i++) {
        const child = childElements[i];
        const childI = childElementsI[i];

        // Get the text of the child element
        const childText = await page.evaluate(el => el.textContent, child);
        const currentChildIndex = `${parentIndex}.${i}`;  // Format as "1.1", "1.1.1", etc.
        console.log(`Processing child element ${currentChildIndex}: ${childText.trim()}`);



        // Check if the <i> tag inside childI has a class other than 'fa-folder'
        const childIClass = await page.evaluate((el) => {
            return el ? el.className : '';
        }, childI);

        if (childIClass && !childIClass.includes('fa-folder')) {
            // console.log("Skipping as <i> does not have class:  "+childText.trim());
            const insertQuery = `
            INSERT INTO tochucdoanvien (parentId, name,isfilled, column1, column2, column3, column4, column5, column6 )
            VALUES (?, ?,?, ?, ?, ?, ?, ?, ?)
        `;

            const values = [
                currentChildIndex,  // parentId
                childText.trim(),    // name
                0,
                "", "", "", "", "", ""
            ];

            db.query(insertQuery, values, (err, results) => {
                if (err) {
                    console.error("Error inserting data into the database:", err);
                    return;
                }
                console.log(`Inserted data for ${childText.trim()} into the database.`);
            });

            continue; // Skip this iteration if <i> has a different class
        }

        // Click the first span to expand
        if (childI) {
            console.log(`Clicking on first span to expand children of ${currentChildIndex}`);
            await childI.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const insertQuery = `
            INSERT INTO tochucdoanvien (parentId, name,isfilled, column1, column2, column3, column4, column5, column6)
            VALUES (?, ?, ?, ?,?, ?, ?, ?, ?)
        `;

        const values = [
            currentChildIndex,  // parentId
            childText.trim(),    // name
            1,
            "", "", "", "", "", ""
        ];

        db.query(insertQuery, values, (err, results) => {
            if (err) {
                console.error("Error inserting data into the database:", err);
                return;
            }
            console.log(`Inserted data for ${childText.trim()} into the database.`);
        });


        // Recursively process the children if there are any
        await processDropdown(page, childElementsLi[i-1],currentChildIndex);
    }
}





async function scrapeId() {
    // Launch Puppeteer
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--start-maximized'],
        defaultViewport: {
            width: 1920,
            height: 1080,
        },
    });



    const page = await browser.newPage();

    try {
        const url = "https://quanlydoanvien.doanthanhnien.vn/home";
        console.log("Navigating to:", url);

        // Navigate to the login page
        await page.goto(url, { waitUntil: "networkidle2" });

        // Wait for the form to load
        await page.waitForSelector('form.login-form');

        // Input username and password
        const username = "tinhdoanthaibinh.tbh"; // Replace with your username
        const password = "123@xaydungdoan"; // Replace with your password

        await page.type('input[formcontrolname="username"]', username); // Adjust the selector
        await page.type('input[formcontrolname="password"]', password); // Adjust the selector

        // Click the submit button (using text "Đăng nhập")
        await Promise.all([
            page.evaluate(() => {
                document.querySelector("button.ant-btn-primary").click();
            }),
            page.waitForNavigation({ waitUntil: "networkidle2" }),
        ]);

        console.log("Login successful!");

        // Sau khi đăng nhập thành công, chuyển hướng đến URL cần lấy dữ liệu
        const targetUrl = "https://quanlydoanvien.doanthanhnien.vn/bctk/bao-cao-yum";
        await page.goto(targetUrl, { waitUntil: "networkidle2" });




        // Wait and click the div
        await page.locator('div[role="tab"][id="mat-tab-label-0-1"]').click();

        console.log('Clicked the "Số liệu đoàn viên" tab.');
        await new Promise(resolve => setTimeout(resolve, 2000));

        await page.waitForSelector('i.fa-refresh.fa-spin', { hidden: true, timeout: 30000 });

        console.log('Loading completed!');
        // Đợi dropdown xuất hiện và click vào
        await page.waitForSelector('button.bdb-dropdown', { visible: true });
        await page.click('button.bdb-dropdown');

        // Đợi menu dropdown mở và lấy dữ liệu từ các mục trong menu
        await page.waitForSelector('.dropdown-menu', { visible: true });





        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log("Starting recursion from 'Tỉnh/Thành phố Tỉnh Thái Bình'...");

        const parentElementLi = await page.evaluateHandle(() => {
            const spans = document.querySelectorAll('span.haschild');
            for (let i = 0; i < spans.length; i++) {
                if (spans[i].textContent.trim() === "Tỉnh/Thành phố Tỉnh Thái Bình") {
                    const parentLi = spans[i].closest('li'); // Get the closest parent <li>
                   return parentLi
                }
            }
            return null;
        });
        await processDropdown(page, parentElementLi,"TB");


        await new Promise(resolve => setTimeout(resolve, 2000));

        // Sau khi click, có thể thực hiện các hành động tiếp theo, ví dụ lấy dữ liệu hoặc kiểm tra kết quả.

    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        await browser.close();
    }




}

module.exports = scrapeId;
