const puppeteer = require("puppeteer");
const db = require("./database");
const axios = require("axios");



async function extractTableData(page) {
    // Xác định bảng theo ID
    const tableSelector = '#dataTables-hdnd';

    // Kiểm tra xem bảng có tồn tại không
    const tableExists = await page.$(tableSelector);
    if (!tableExists) {
        console.error("Table not found!");
        return [];
    }

    // Lấy dữ liệu từ bảng
    const tableData = await page.evaluate((selector) => {
        const table = document.querySelector(selector);
        const rows = table.querySelectorAll('tr'); // Lấy tất cả các hàng trong bảng
        const data = [];

        rows.forEach((row) => {
            const cells = row.querySelectorAll('td'); // Lấy các ô trong mỗi hàng
            const rowData = [];

            cells.forEach((cell) => {
                rowData.push(cell.textContent.trim()); // Lấy text của từng ô
            });

            if (rowData.length > 0) {
                data.push(rowData); // Chỉ thêm hàng có dữ liệu
            }
        });

        return data;
    }, tableSelector);

    return tableData;
}
async function extractBodyTableData(page) {
    // Xác định bảng theo ID
    const tableSelector = '#dataTables-hdnd';

    // Kiểm tra xem bảng có tồn tại không
    const tableExists = await page.$(tableSelector);
    if (!tableExists) {
        console.error("Table not found!");
        return [];
    }

    // Lấy dữ liệu từ bảng
    const tableData = await page.evaluate((selector) => {
        const table = document.querySelector(selector);
        const rows = table.querySelectorAll('tr'); // Lấy tất cả các hàng trong bảng
        const data = [];

        rows.forEach((row) => {
            const cells = row.querySelectorAll('td'); // Lấy các ô trong mỗi hàng
            const rowData = [];

            cells.forEach((cell) => {
                rowData.push(cell.textContent.trim()); // Lấy text của từng ô
            });

            if (rowData.length > 0) {
                data.push(rowData); // Chỉ thêm hàng có dữ liệu
            }
        });

        return data;
    }, tableSelector);

    // console.log("Extracted Body Table Data:", tableData);
    return tableData;
}



// Hàm đệ quy để duyệt qua tất cả các danh sách con
async function processDropdown(page, parentElement,parentIndex = '',id) {
    if (!parentElement) {
        console.log("Parent element is null or undefined. Skipping...");
        return;
    }

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

        if(id==currentChildIndex){
            console.log(`=================> Clicking ${currentChildIndex}: `+ id);
            await child.click();

            break;
        }

        // Check if the <i> tag inside childI has a class other than 'fa-folder'
        const childIClass = await page.evaluate((el) => {
            return el ? el.className : '';
        }, childI);

        if (childIClass && !childIClass.includes('fa-folder')) {
            // console.log("Skipping as <i> does not have class:  "+childText.trim());
            continue; // Skip this iteration if <i> has a different class
        }

        // Click the first span to expand
        if (childI && id.includes(currentChildIndex)) {
            console.log(`Clicking on first span to expand children of ${currentChildIndex}`);
            // Log the HTML content of the parent element
            const childIHTML = await page.evaluate((el) => el.outerHTML, childI);
            console.log("HTML of childIHTML:\n", childIHTML);

            await childI.click();
            await new Promise(resolve => setTimeout(resolve, 1000));

        }

        // Recursively process the children if there are any
        await processDropdown(page, childElementsLi[i-1],currentChildIndex,id);
    }
}




async function processFilledRecordsInBatches(batchSize = 100,page, parentElement,parentIndex = '',browser) {
    try {
        let offset = 0;
        let recordsProcessed = 0;
        const maxRetries = 50;
        let attempt = 0;
        let i=0

        while (attempt < maxRetries) {
            attempt++;
            let hasError=false
            // Fetch a batch of records
            const selectQuery = `
                SELECT * FROM ToChucDoanVien WHERE isFilled = 1 LIMIT ? OFFSET ?
            `;

            const records = await new Promise((resolve, reject) => {
                db.query(selectQuery, [batchSize, offset], (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                });
            });

            // If no records are found, exit the loop
            if (records.length === 0) {
                console.log("No more records to process.");
                break;
            }

            console.log(`Processing batch with ${records.length} records (Offset: ${offset})`);

            // Process each record in the batch
            for (const record of records) {
                console.log(`Processing record with ID: ${record.parentId}, Name: ${record.name}`);

                try {
                    // Your logic for processing the record


                    if(i==0){
                        await processDropdown(page, parentElement,"TB",record.parentId);

                    }else {
                        // Sau khi đăng nhập thành công, chuyển hướng đến URL cần lấy dữ liệu
                        const targetUrl = "https://quanlydoanvien.doanthanhnien.vn/bctk/bao-cao-yum";
                        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 }); // Ensures navigation is complete
                        await new Promise(resolve => setTimeout(resolve, 2000));



                        // Wait and click the div
                        await page.locator('div[role="tab"][id="mat-tab-label-0-1"]').click();

                        console.log('Clicked the "Số liệu đoàn viên" tab.');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        // Đợi dropdown xuất hiện và click vào
                        await page.waitForSelector('button.bdb-dropdown', { visible: true });
                        await page.click('button.bdb-dropdown');

                        // Đợi menu dropdown mở và lấy dữ liệu từ các mục trong menu
                        await page.waitForSelector('.dropdown-menu', { visible: true });

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

                        await processDropdown(page, parentElementLi,"TB",record.parentId);


                    }

                    await new Promise(resolve => setTimeout(resolve, 1000));
                    console.log("===============> wait for loading data!")
                    await page.waitForSelector('i.fa-refresh.fa-spin', { hidden: true, timeout: 30000 });
                    await new Promise(resolve => setTimeout(resolve, 10000));

                    // const tableDataName = await extractTableData(page)
                    // Gọi hàm để lấy dữ liệu từ bảng
                    const tableData = await extractBodyTableData(page);

                    // Chuyển đổi thành JSON
                    const jsonData = tableData.map((row) => ({
                        col1: row[0],   // Cột 1
                        col2: row[1],   // Cột 2
                        col3: row[2],   // Cột 3 (thường là cột phần trăm)
                        col4: row[3],   // Cột 4
                        col5: row[4],   // Cột 5
                        col6: row[5],   // Cột 6
                        col7: row[6],   // Cột 7

                    }));
                    // console.log("Extracted tableDataName:", tableDataName);
                    // console.log("Extracted size:", tableDataName.length);
                    //
                    console.log("Extracted JSON Data:", JSON.stringify(jsonData, null, 2));
                    // console.log("Extracted JSON Data length:", jsonData.length);

                    for (let i = 0; i < jsonData.length-1; i++) {
                        const data = jsonData[i]; // Extract the data for that name


                        if (i === 0) {

                            // Update query using `name` instead of `id`
                            const updateQuery = `
                                UPDATE ToChucDoanVien
                                SET column1  = ?,
                                    column2  = ?,
                                    column3  = ?,
                                    column4  = ?,
                                    column5  = ?,
                                    column6  = ?,
                                    isfilled = ?,
                                    ngay = NOW() 
                                WHERE parentId = ? And isfilled =1`;  // Update based on the `name` column

                            console.log("===========> Updating record for : " + data.col2);

                            // Execute the query to update the record
                            await new Promise((resolve, reject) => {
                                db.query(updateQuery, [
                                     data.col2, data.col3, data.col4, data.col5, data.col6, data.col7, 2,
                                    record.parentId // Use `name` to match the record to be updated
                                ], (updateErr) => {
                                    if (updateErr) {
                                        console.log("Error updating record: ", updateErr);
                                        return reject(updateErr); // Reject if there's an error
                                    }
                                    console.log("Record updated successfully for: " +  data.col2);
                                    resolve(); // Resolve once the update is successful
                                });
                            });
                        }
                        else {
                            // Insert new record for subsequent iterations
                            const insertQuery = `
            INSERT INTO ToChucDoanVien (column1, column2, column3, column4, column5, column6, parentId, isfilled,name,ngay)
            VALUES (?, ?, ?, ?, ?, ?,?, 2,?,  NOW())`; // Default `isFilled` to 1

                            console.log("===========> Inserting new record for name:", data.col2);

                            // Execute the insert query
                            await new Promise((resolve, reject) => {
                                db.query(insertQuery, [
                                    data.col2, data.col3, data.col4, data.col5, data.col6, data.col7,
                                     record.parentId, record.name // Use `name` and `parentId` for the new record
                                ], (insertErr) => {
                                    if (insertErr) {
                                        console.error("Error inserting record:", insertErr);
                                        return reject(insertErr);
                                    }
                                    console.log("New record inserted successfully!");
                                    resolve();
                                });
                            });
                        }


                    }


                    recordsProcessed++;
                    i++;


                } catch (recordError) {
                    hasError = true
                    console.error(`Error processing record with ID ${record.parentId}:`, recordError);
                    // Take a screenshot of the error state
                    // const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    // const screenshotPath = `error-screenshot-${timestamp}.png`;
                    // await page.screenshot({ path: screenshotPath, fullPage: true });
                    //
                    // console.log(`Screenshot saved: ${screenshotPath}`);


                    // reopen
                    await browser.close();
                    browser = await puppeteer.launch({
                        headless: true,
                        args: ['--start-maximized'],
                        defaultViewport: {
                            width: 1920,
                            height: 1080,
                        },
                    });

                     page = await browser.newPage();
                    const url = "https://quanlydoanvien.doanthanhnien.vn/home";
                    console.log("Navigating to:", url);

                    // Navigate to the login page
                    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 }); // Ensures navigation is complete
                    await new Promise(resolve => setTimeout(resolve, 2000));

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




                }
            }

            // Increment the offset for the next batch
            if (!hasError){
                offset += batchSize;

            }
        }

        console.log(`Finished processing ${recordsProcessed} records.`);
    } catch (error) {
        console.error("Error during batch processing:", error);
    }
}




async function scrapeInfor() {



    // Launch Puppeteer
    const browser = await puppeteer.launch({
        headless: true,
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
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 }); // Ensures navigation is complete
        await new Promise(resolve => setTimeout(resolve, 2000));

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
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 }); // Ensures navigation is complete
        await new Promise(resolve => setTimeout(resolve, 2000));



        // Wait and click the div
        await page.locator('div[role="tab"][id="mat-tab-label-0-1"]').click();

        console.log('Clicked the "Số liệu đoàn viên" tab.');
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Đợi dropdown xuất hiện và click vào
        await page.waitForSelector('button.bdb-dropdown', { visible: true });
        await page.click('button.bdb-dropdown');

        // Đợi menu dropdown mở và lấy dữ liệu từ các mục trong menu
        await page.waitForSelector('.dropdown-menu', { visible: true });

        await page.waitForSelector('i.fa-refresh.fa-spin', { hidden: true, timeout: 30000 });

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
        // await processDropdown(page, parentElementLi,"TB");
        await processFilledRecordsInBatches(100,page, parentElementLi,"TB",browser);


        await new Promise(resolve => setTimeout(resolve, 2000));

        // Sau khi click, có thể thực hiện các hành động tiếp theo, ví dụ lấy dữ liệu hoặc kiểm tra kết quả.

    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        await browser.close();
    }




}

module.exports = scrapeInfor;
