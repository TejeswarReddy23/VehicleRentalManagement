const express = require("express");
const mysql = require("mysql2");
const path = require("path");

const app = express();
const PORT = 3000;

// Parse JSON request bodies and serve files from the public folder.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// IMPORTANT: Replace the password below with your actual MySQL root password.
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "tejeswar",
    database: "vehicle_rental"
});

db.connect((err) => {
    if (err) {
        console.error("MySQL connection failed:", err.message);
        return;
    }
    console.log("MySQL connected successfully to vehicle_rental.");
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Read all vehicles
app.get("/vehicles", (req, res) => {
    db.query("SELECT * FROM vehicles ORDER BY veh_id", (err, rows) => {
        if (err) {
            console.error("GET /vehicles failed:", err.message);
            return res.status(500).json({ error: "Unable to retrieve vehicles", details: err.message });
        }
        res.json(rows);
    });
});

// Read one vehicle
app.get("/vehicles/:vid", (req, res) => {
    db.query("SELECT * FROM vehicles WHERE veh_id = ?", [req.params.vid], (err, rows) => {
        if (err) {
            console.error("GET /vehicles/:vid failed:", err.message);
            return res.status(500).json({ error: "Unable to retrieve vehicle", details: err.message });
        }
        if (rows.length === 0) {
            return res.status(404).json({ error: "Vehicle ID not found" });
        }
        res.json(rows[0]);
    });
});

// Insert a vehicle
app.post("/vehicles", (req, res) => {
    const { veh_no, veh_type, veh_model, veh_rent_per_day, veh_status } = req.body;

    if (!veh_no || !veh_type || !veh_model || veh_rent_per_day === undefined || veh_rent_per_day === "" || !veh_status) {
        return res.status(400).json({ error: "Please provide all vehicle details." });
    }

    const sql = `INSERT INTO vehicles
        (veh_no, veh_type, veh_model, veh_rent_per_day, veh_status)
        VALUES (?, ?, ?, ?, ?)`;

    db.query(sql, [veh_no, veh_type, veh_model, veh_rent_per_day, veh_status], (err, result) => {
        if (err) {
            console.error("POST /vehicles failed:", err.message);
            return res.status(500).json({ error: "Unable to insert vehicle", details: err.message });
        }
        res.status(201).json({ message: "Vehicle inserted successfully", veh_id: result.insertId });
    });
});

// Update a vehicle
app.put("/vehicles/:vid", (req, res) => {
    const { veh_no, veh_type, veh_model, veh_rent_per_day, veh_status } = req.body;

    if (!veh_no || !veh_type || !veh_model || veh_rent_per_day === undefined || veh_rent_per_day === "" || !veh_status) {
        return res.status(400).json({ error: "Please provide all vehicle details." });
    }

    const sql = `UPDATE vehicles
        SET veh_no = ?, veh_type = ?, veh_model = ?, veh_rent_per_day = ?, veh_status = ?
        WHERE veh_id = ?`;

    db.query(sql, [veh_no, veh_type, veh_model, veh_rent_per_day, veh_status, req.params.vid], (err, result) => {
        if (err) {
            console.error("PUT /vehicles/:vid failed:", err.message);
            return res.status(500).json({ error: "Unable to update vehicle", details: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Vehicle ID not found or no changes were made." });
        }
        res.json({ message: "Vehicle updated successfully" });
    });
});

// Delete a vehicle
app.delete("/vehicles/:vid", (req, res) => {
    db.query("DELETE FROM vehicles WHERE veh_id = ?", [req.params.vid], (err, result) => {
        if (err) {
            console.error("DELETE /vehicles/:vid failed:", err.message);
            return res.status(500).json({ error: "Unable to delete vehicle", details: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Vehicle ID not found" });
        }
        res.json({ message: "Vehicle deleted successfully" });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
