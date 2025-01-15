const puppeteer = require("puppeteer");
const db = require("./database");
const axios = require("axios");



async function extractTableData(page) {
    // Xác định bảng theo ID
    const tableSelector = '#headerlefttable';

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
    const tableSelector = '#bodytable';

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
            await new Promise(resolve => setTimeout(resolve, 10000));

            break;
        }
        console.log(`=================> not return  `);

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




async function processFilledRecordsInBatches(batchSize = 100,page, parentElement,parentIndex = '') {
    try {
        let offset = 0;
        let recordsProcessed = 0;

        while (true) {
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

            let i=0
            // Process each record in the batch
            for (const record of records) {
                console.log(`Processing record with ID: ${record.parentId}, Name: ${record.name}`);
                await new Promise(resolve => setTimeout(resolve, 10000));

                try {
                    // Your logic for processing the record


                    if(i==0){
                        await processDropdown(page, parentElement,"TB",record.parentId);

                    }else {

                        const tableDataName = await extractTableData(page)
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
                            col8: row[7],   // Cột 8
                            col9: row[8],   // Cột 9
                            col10: row[9],  // Cột 10
                            col11: row[10], // Cột 11
                            col12: row[11], // Cột 12
                            col13: row[12], // Cột 13
                            col14: row[13], // Cột 14
                            col15: row[14], // Cột 15
                            col16: row[15], // Cột 16
                            col17: row[16], // Cột 17
                            col18: row[17], // Cột 18
                        }));
                        console.log("Extracted tableDataName:", tableDataName);
                        console.log("Extracted size:", tableDataName.length);

                        console.log("Extracted JSON Data:", JSON.stringify(jsonData, null, 2));
                        console.log("Extracted JSON Data length:", jsonData.length);

                        for (let i = 0; i < tableDataName.length; i++) {
                            const name = tableDataName[i][1]; // Extract the Name
                            const data = jsonData[i]; // Extract the data for that name

                            // Update query using `name` instead of `id`
                            const updateQuery = `
    UPDATE ToChucDoanVien
    SET 
        column1 = ?, column2 = ?, column3 = ?, column4 = ?, column5 = ?, column6 = ?,
        column7 = ?, column8 = ?, column9 = ?, column10 = ?, column11 = ?, column12 = ?,
        column13 = ?, column14 = ?, column15 = ?, column16 = ?, column17 = ?, column18 = ?
    WHERE parentId = ?`;  // Update based on the `name` column

                            console.log("===========> Updating record for Name: " + name);

                            // Execute the query to update the record
                            await new Promise((resolve, reject) => {
                                db.query(updateQuery, [
                                    data.col1, data.col2, data.col3, data.col4, data.col5, data.col6,
                                    data.col7, data.col8, data.col9, data.col10, data.col11, data.col12,
                                    data.col13, data.col14, data.col15, data.col16, data.col17, data.col18,
                                    record.parentId // Use `name` to match the record to be updated
                                ], (updateErr) => {
                                    if (updateErr) {
                                        console.log("Error updating record: ", updateErr);
                                        return reject(updateErr); // Reject if there's an error
                                    }
                                    console.log("Record updated successfully for: " + name);
                                    resolve(); // Resolve once the update is successful
                                });
                            });
                        }


                        await new Promise(resolve => setTimeout(resolve, 5000));

                        await page.reload()
                        await page.waitForSelector('button.bdb-dropdown')
                        await page.click('button.bdb-dropdown');


                        // Đợi menu dropdown mở và lấy dữ liệu từ các mục trong menu
                        await page.waitForSelector('.dropdown-menu', { visible: true });

                        // Bắt đầu từ danh sách cha
                        // Tìm và chọn nút chứa "Tỉnh/Thành phố Tỉnh Thái Bình"
                        // Tìm node "Tỉnh/Thành phố Tỉnh Thái Bình"

                        const parentElement1 = await page.evaluateHandle(() => {
                            const spans = document.querySelectorAll('span.haschild');
                            for (let i = 0; i < spans.length; i++) {
                                if (spans[i].textContent.trim() === "Tỉnh/Thành phố Tỉnh Thái Bình") {
                                    const parentLi = spans[i].closest('li'); // Get the closest parent <li>
                                    if (parentLi) {
                                        const firstSpan = parentLi.querySelector('span.expand-button'); // Get the first span
                                        return firstSpan; // Return the first span
                                    }
                                }
                            }
                            return null;
                        });

// Check if the parentElement was found
                        if (parentElement1) {
                            console.log("Found the target element. Clicking the first span...");

                            // Log the HTML content of the parent element
                            const parentHTML = await page.evaluate((el) => el.outerHTML, parentElement1);
                            console.log("HTML of parentElement1:\n", parentHTML);
                            await new Promise(resolve => setTimeout(resolve, 5000));

                            // Click the first span
                            await page.evaluate((el) => el.click(), parentElement1);
                        } else {
                            console.log("The target element was not found.");
                        }
                        if (!parentElement) {
                            console.error("Could not find the specified node.");
                            await browser.close();
                            return;
                        }
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

                        await processDropdown(page, parentElementLi,"TB",record.parentId);


                    }


                    // Example: Update `isFilled` to 2 after processing
                    const updateQuery = `UPDATE ToChucDoanVien SET isFilled = 1 WHERE parentId = ?`;
                    await new Promise((resolve, reject) => {
                        db.query(updateQuery, [record.parentId], (updateErr) => {
                            if (updateErr) return reject(updateErr);
                            resolve();
                        });
                    });

                    console.log(`Record with ID ${record.parentId} marked as processed (isFilled = 2).`);
                    recordsProcessed++;
                    i++;


                } catch (recordError) {
                    console.error(`Error processing record with ID ${record.parentId}:`, recordError);
                }
            }

            // Increment the offset for the next batch
            offset += batchSize;
        }

        console.log(`Finished processing ${recordsProcessed} records.`);
    } catch (error) {
        console.error("Error during batch processing:", error);
    }
}




async function scrapeInfor() {



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
        const username = "tkkiemdinh_captw"; // Replace with your username
        const password = "Btc@406"; // Replace with your password

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



        // await new Promise(resolve => setTimeout(resolve, 10000));

        // Đợi dropdown xuất hiện và click vào
        await page.waitForSelector('button.bdb-dropdown', { visible: true });
        await page.click('button.bdb-dropdown');

        // Đợi menu dropdown mở và lấy dữ liệu từ các mục trong menu
        await page.waitForSelector('.dropdown-menu', { visible: true });

        // Bắt đầu từ danh sách cha
        // Tìm và chọn nút chứa "Tỉnh/Thành phố Tỉnh Thái Bình"
        // Tìm node "Tỉnh/Thành phố Tỉnh Thái Bình"
        const parentElement = await page.evaluateHandle(() => {
            const spans = document.querySelectorAll('span.haschild');
            for (let i = 0; i < spans.length; i++) {
                if (spans[i].textContent.trim() === "Tỉnh/Thành phố Tỉnh Thái Bình") {
                    const parentLi = spans[i].closest('li'); // Get the closest parent <li>
                    if (parentLi) {
                        const firstSpan = parentLi.querySelector('span.expand-button'); // Get the first span
                        return firstSpan; // Return the first span
                    }
                }
            }
            return null;
        });

// Check if the parentElement was found
        if (parentElement) {
            console.log("Found the target element. Clicking the first span...");
            // Log the HTML content of the parent element
            const parentHTML = await page.evaluate((el) => el.outerHTML, parentElement);
            console.log("HTML of parentElement:\n", parentHTML);
            // Click the first span
            await page.evaluate((el) => el.click(), parentElement);
        } else {
            console.log("The target element was not found.");
        }


        if (!parentElement) {
            console.error("Could not find the specified node.");
            await browser.close();
            return;
        }
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
        await processFilledRecordsInBatches(100,page, parentElementLi,"TB");


        await new Promise(resolve => setTimeout(resolve, 200000));

        // Sau khi click, có thể thực hiện các hành động tiếp theo, ví dụ lấy dữ liệu hoặc kiểm tra kết quả.

    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        await browser.close();
    }




}

module.exports = scrapeInfor;
