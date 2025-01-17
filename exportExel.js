const mysql = require('mysql2');
const XLSX = require('xlsx');
const fs = require('fs');

// Thiết lập kết nối MySQL
const connection = mysql.createConnection({
    host: "localhost",     // Your MySQL host
    user: "root",          // Your MySQL username
    password: "123456",          // Your MySQL password
    database: "scrape_db", // Your MySQL database
});


// Truy vấn để lấy tất cả dữ liệu từ bảng tochucdoanvien
const query = 'SELECT * FROM tochucdoanvien';

connection.query(query, (error, results) => {
    if (error) {
        console.error('Lỗi truy vấn:', error);
        return;
    }

    // Tạo một workbook Excel
    const workbook = XLSX.utils.book_new();

    // Chuyển đổi kết quả truy vấn thành định dạng mà Excel có thể xử lý
    const worksheet = XLSX.utils.json_to_sheet(results);

    // Thêm sheet vào workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'tochucdoanvien');

    // Lưu workbook vào file Excel
    const filePath = './tochucdoanvien_data.xlsx';
    XLSX.writeFile(workbook, filePath);

    console.log(`Dữ liệu đã được lưu vào file ${filePath}`);
});

// Đóng kết nối sau khi xong
connection.end();
