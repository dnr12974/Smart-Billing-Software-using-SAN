const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process"); // <-- for running PS + Python

const app = express();
const PORT = 4000;

// ---------- PATHS ----------
const DB_PATH = path.join(__dirname, "..", "ims.db");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");
const backupDir = path.join(__dirname, "..", "backup");

// ---------- DB SETUP ----------
if (!fs.existsSync(DB_PATH)) {
  console.log("ims.db not found, will be created with schema");
}

const db = new sqlite3.Database(DB_PATH);
const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
db.exec(schema, (err) => {
  if (err) console.error("Error applying schema:", err.message);
  else console.log("Database ready (ims.db).");
});

app.use(cors());
app.use(bodyParser.json());

// Serve frontend
app.use("/", express.static(path.join(__dirname, "..", "frontend")));

// ---------- DASHBOARD SUMMARY ----------
app.get("/api/summary", (req, res) => {
  const queries = {
    employees: "SELECT COUNT(*) AS c FROM employee",
    suppliers: "SELECT COUNT(*) AS c FROM supplier",
    categories: "SELECT COUNT(*) AS c FROM category",
    products: "SELECT COUNT(*) AS c FROM product",
    sales: "SELECT COUNT(*) AS c FROM sales",
  };

  const result = {};
  let pending = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, sql]) => {
    db.get(sql, (err, row) => {
      result[key] = err ? 0 : row.c;
      if (--pending === 0) res.json(result);
    });
  });
});

// =============== EMPLOYEES ===============
app.get("/api/employees", (req, res) => {
  const { q } = req.query;
  let sql = "SELECT * FROM employee";
  const params = [];

  if (q) {
    sql += " WHERE name LIKE ? OR email LIKE ? OR contact LIKE ?";
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/employees", (req, res) => {
  const {
    name,
    email,
    gender,
    contact,
    dob,
    doj,
    pass,
    utype,
    address,
    salary,
  } = req.body;

  const sql = `
    INSERT INTO employee
    (name, email, gender, contact, dob, doj, pass, utype, address, salary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [name, email, gender, contact, dob, doj, pass, utype, address, salary],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ eid: this.lastID });
    }
  );
});

app.put("/api/employees/:eid", (req, res) => {
  const { eid } = req.params;
  const {
    name,
    email,
    gender,
    contact,
    dob,
    doj,
    pass,
    utype,
    address,
    salary,
  } = req.body;

  const sql = `
    UPDATE employee
    SET name=?, email=?, gender=?, contact=?, dob=?, doj=?,
        pass=?, utype=?, address=?, salary=?
    WHERE eid=?
  `;

  db.run(
    sql,
    [name, email, gender, contact, dob, doj, pass, utype, address, salary, eid],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    }
  );
});

app.delete("/api/employees/:eid", (req, res) => {
  const { eid } = req.params;
  db.run("DELETE FROM employee WHERE eid=?", [eid], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// =============== SUPPLIERS ===============
app.get("/api/suppliers", (req, res) => {
  const { invoice } = req.query;
  let sql = "SELECT * FROM supplier";
  const params = [];

  if (invoice) {
    sql += " WHERE invoice = ?";
    params.push(invoice);
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/suppliers", (req, res) => {
  const { name, contact, desc } = req.body;
  const sql = `
    INSERT INTO supplier (name, contact, desc)
    VALUES (?, ?, ?)
  `;
  db.run(sql, [name, contact, desc], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ invoice: this.lastID });
  });
});

app.put("/api/suppliers/:invoice", (req, res) => {
  const { invoice } = req.params;
  const { name, contact, desc } = req.body;
  const sql = `
    UPDATE supplier
    SET name=?, contact=?, desc=?
    WHERE invoice=?
  `;
  db.run(sql, [name, contact, desc, invoice], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

app.delete("/api/suppliers/:invoice", (req, res) => {
  const { invoice } = req.params;
  db.run("DELETE FROM supplier WHERE invoice=?", [invoice], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// =============== CATEGORIES ===============
app.get("/api/categories", (req, res) => {
  db.all("SELECT * FROM category ORDER BY name", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/categories", (req, res) => {
  const { name } = req.body;
  db.run("INSERT INTO category (name) VALUES (?)", [name], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ cid: this.lastID });
  });
});

app.delete("/api/categories/:cid", (req, res) => {
  const { cid } = req.params;
  db.run("DELETE FROM category WHERE cid=?", [cid], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// =============== PRODUCTS ===============
app.get("/api/products", (req, res) => {
  const { category, supplier, name } = req.query;
  const where = [];
  const params = [];

  if (category) {
    where.push("category LIKE ?");
    params.push(`%${category}%`);
  }
  if (supplier) {
    where.push("supplier LIKE ?");
    params.push(`%${supplier}%`);
  }
  if (name) {
    where.push("name LIKE ?");
    params.push(`%${name}%`);
  }

  const sql =
    "SELECT * FROM product" +
    (where.length ? " WHERE " + where.join(" AND ") : "");

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/products", (req, res) => {
  const { category, supplier, name, price, qty, status } = req.body;
  const sql = `
    INSERT INTO product (category, supplier, name, price, qty, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.run(sql, [category, supplier, name, price, qty, status], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ pid: this.lastID });
  });
});

app.put("/api/products/:pid", (req, res) => {
  const { pid } = req.params;
  const { category, supplier, name, price, qty, status } = req.body;
  const sql = `
    UPDATE product
    SET category=?, supplier=?, name=?, price=?, qty=?, status=?
    WHERE pid=?
  `;
  db.run(
    sql,
    [category, supplier, name, price, qty, status, pid],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    }
  );
});

app.delete("/api/products/:pid", (req, res) => {
  const { pid } = req.params;
  db.run("DELETE FROM product WHERE pid=?", [pid], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

// =============== BILLS / SALES (Billing + Sales screens) ===============
app.get("/api/bills", (req, res) => {
  db.all(
    "SELECT sid AS id, invoice_no, customer_name, net_total, bill_date FROM sales ORDER BY sid DESC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const mapped = rows.map((r) => ({
        id: r.id,
        customerName: r.customer_name,
        amount: r.net_total,
        date: r.bill_date,
        invoice: r.invoice_no,
      }));
      res.json(mapped);
    }
  );
});

// Create bill (simple + full modes)
app.post("/api/bills", (req, res) => {
  const body = req.body;

  const customerName = body.customerName;
  const customerContact = body.customerContact || "";
  const date = body.date;

  // FULL MODE with items[]
  if (Array.isArray(body.items) && body.items.length > 0) {
    const items = body.items;
    const discount = Number(body.discount || 0);

    let total = 0;
    items.forEach((it) => {
      total += Number(it.qty) * Number(it.price);
    });
    const net_total = total - discount;

    const invoice_no = "INV" + Date.now();

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      const billDir = path.join(__dirname, "..", "bill");
      if (!fs.existsSync(billDir)) fs.mkdirSync(billDir);
      const billFile = path.join(billDir, `${invoice_no}.txt`);

      db.run(
        `
        INSERT INTO sales
          (invoice_no, customer_name, customer_contact, bill_date,
           total_amt, discount, net_total, bill_file)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          invoice_no,
          customerName,
          customerContact,
          date,
          total,
          discount,
          net_total,
          billFile,
        ],
        function (err) {
          if (err) {
            db.run("ROLLBACK");
            return res.status(500).json({ error: err.message });
          }

          const insertItem = db.prepare(`
            INSERT INTO sales_items
              (invoice_no, product_id, product_name, qty, price, line_total)
            VALUES (?, ?, ?, ?, ?, ?)
          `);

          items.forEach((it) => {
            const lineTotal = Number(it.qty) * Number(it.price);
            insertItem.run(
              invoice_no,
              it.product_id || null,
              it.product_name,
              it.qty,
              it.price,
              lineTotal
            );
            if (it.product_id) {
              db.run(
                "UPDATE product SET qty = qty - ? WHERE pid = ?",
                [it.qty, it.product_id]
              );
            }
          });

          insertItem.finalize();

          const billTextLines = [];
          billTextLines.push(`Invoice: ${invoice_no}`);
          billTextLines.push(`Customer: ${customerName}`);
          billTextLines.push(`Contact: ${customerContact || "-"}`);
          billTextLines.push(`Date: ${date}`);
          billTextLines.push("=======================================");
          items.forEach((it) => {
            billTextLines.push(
              `${it.product_name} x ${it.qty} @ ${it.price} = ${
                Number(it.qty) * Number(it.price)
              }`
            );
          });
          billTextLines.push("---------------------------------------");
          billTextLines.push(`Total: ${total.toFixed(2)}`);
          billTextLines.push(`Discount: ${discount.toFixed(2)}`);
          billTextLines.push(`Net Total: ${net_total.toFixed(2)}`);

          fs.writeFileSync(billFile, billTextLines.join("\n"), "utf-8");

          db.run("COMMIT");
          res.status(201).json({ invoice_no, total, net_total });
        }
      );
    });

    return;
  }

  // SIMPLE MODE (current HTML)
  const amount = Number(body.amount || 0);
  const invoice_no = "INV" + Date.now();

  db.run(
    `
      INSERT INTO sales
        (invoice_no, customer_name, customer_contact, bill_date,
         total_amt, discount, net_total, bill_file)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [invoice_no, customerName, "", date, amount, 0, amount, null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // --- INVENTORY REDUCTION PATCH ---
      // If frontend sends cartItems, reduce inventory accordingly
      if (Array.isArray(body.cartItems) && body.cartItems.length > 0) {
        const updateStmt = db.prepare("UPDATE product SET qty = qty - ? WHERE pid = ?");
        body.cartItems.forEach(item => {
          updateStmt.run(item.qty, item.pid);
        });
        updateStmt.finalize();
      }
      // --- END PATCH ---

      res.status(201).json({ invoice_no, total: amount, net_total: amount });
    }
  );
});

app.put("/api/bills/:sid", (req, res) => {
  const { sid } = req.params;
  const { customerName, amount, date } = req.body;

  const sql = `
    UPDATE sales
    SET customer_name=?, net_total=?, total_amt=?, bill_date=?
    WHERE sid=?
  `;
  db.run(sql, [customerName, amount, amount, date, sid], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

app.delete("/api/bills/:sid", (req, res) => {
  const { sid } = req.params;

  db.get("SELECT invoice_no, bill_file FROM sales WHERE sid=?", [sid], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.json({ success: false, error: "Bill not found" });

    const { invoice_no, bill_file } = row;

    db.serialize(() => {
      db.run("DELETE FROM sales_items WHERE invoice_no=?", [invoice_no]);
      db.run("DELETE FROM sales WHERE sid=?", [sid], function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        if (bill_file && fs.existsSync(bill_file)) fs.unlinkSync(bill_file);
        res.json({ success: true });
      });
    });
  });
});

// Full sales list (for Sales tab)
app.get("/api/sales", (req, res) => {
  db.all(
    "SELECT sid, invoice_no, customer_name, bill_date, net_total FROM sales ORDER BY sid DESC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.get("/api/sales/:invoice_no", (req, res) => {
  const { invoice_no } = req.params;

  db.get(
    "SELECT * FROM sales WHERE invoice_no=?",
    [invoice_no],
    (err, header) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!header) return res.status(404).json({ error: "Invoice not found" });

      db.all(
        "SELECT * FROM sales_items WHERE invoice_no=?",
        [invoice_no],
        (err2, items) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ header, items });
        }
      );
    }
  );
});

// =============== SAN STATUS ===============
app.get("/api/san-status", (req, res) => {
  try {
    const logPath = path.join(backupDir, "san_usage_log.csv");
    if (!fs.existsSync(logPath)) {
      return res.json({ message: "No SAN usage log yet" });
    }

    const lines = fs.readFileSync(logPath, "utf-8").trim().split("\n");
    if (lines.length <= 1) {
      return res.json({ message: "No SAN usage log yet" });
    }

    const last = lines[lines.length - 1].split(",");
    const [timestamp, used_gb, total_gb] = last;

    let prediction_date = null;
    const predPath = path.join(backupDir, "san_prediction.json");
    if (fs.existsSync(predPath)) {
      try {
        const pred = JSON.parse(fs.readFileSync(predPath, "utf-8"));
        prediction_date = pred.prediction_date ;
      } catch {
        prediction_date = null;
      }
    }

    res.json({
      timestamp,
      used_gb: Number(used_gb),
      total_gb: Number(total_gb),
      prediction_date,
    });
  } catch (err) {
    console.error("SAN status error:", err);
    res.status(500).json({ error: "Failed to read SAN status" });
  }
});

// =============== BACKUP LOG API ===============
app.get("/api/backup-log", (req, res) => {
  try {
    const logPath = path.join(backupDir, "san_usage_log.csv");

    if (!fs.existsSync(logPath)) {
      return res.json([]); // no backups yet
    }

    const lines = fs.readFileSync(logPath, "utf-8").trim().split("\n");
    if (lines.length <= 1) {
      return res.json([]); // only header
    }

    const rows = lines.slice(1).map((line) => {
      const [timestamp, used_gb, total_gb] = line.split(",");
      return {
        timestamp,
        used_gb: Number(used_gb),
        total_gb: Number(total_gb),
      };
    });

    // latest first
    rows.reverse();

    res.json(rows);
  } catch (err) {
    console.error("Error reading backup log:", err);
    res.status(500).json({ error: "Failed to read backup log" });
  }
});

// =============== RUN BACKUP + PREDICTION ===============

// helper to run shell commands
function runCommand(cmd, cwdDir) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: cwdDir, windowsHide: true }, (err, stdout, stderr) => {
      if (err) {
        console.error("Command failed:", cmd, stderr || err.message);
        return reject(new Error(stderr || err.message));
      }
      resolve({ stdout, stderr });
    });
  });
}

/**
 * POST /api/run-backup-and-predict
 * - runs PowerShell backup_to_san.ps1
 * - runs Python predict_usage.py
 * - returns latest SAN status
 */
app.post("/api/run-backup-and-predict", async (req, res) => {
  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const psScript = path.join(backupDir, "backup_to_san.ps1");
    const pyScript = path.join(backupDir, "predict_usage.py");

    if (!fs.existsSync(psScript)) {
      return res.status(500).json({
        success: false,
        error: `PowerShell script not found: ${psScript}`,
      });
    }
    if (!fs.existsSync(pyScript)) {
      return res.status(500).json({
        success: false,
        error: `Python script not found: ${pyScript}`,
      });
    }

    // 1) Run backup script
    await runCommand(
      `powershell -ExecutionPolicy Bypass -File "${psScript}"`,
      backupDir
    );

    // 2) Run prediction script
    await runCommand(`python "${pyScript}"`, backupDir);

    // 3) Read latest status from CSV + JSON
    const logPath = path.join(backupDir, "san_usage_log.csv");
    if (!fs.existsSync(logPath)) {
      return res.status(500).json({
        success: false,
        error: "san_usage_log.csv not found after backup",
      });
    }

    const lines = fs.readFileSync(logPath, "utf-8").trim().split("\n");
    if (lines.length <= 1) {
      return res.status(500).json({
        success: false,
        error: "No data rows in san_usage_log.csv",
      });
    }

    const last = lines[lines.length - 1].split(",");
    const [timestamp, used_gb, total_gb] = last;

    let prediction_date = null;
    const predPath = path.join(backupDir, "san_prediction.json");
    if (fs.existsSync(predPath)) {
      try {
        const pred = JSON.parse(fs.readFileSync(predPath, "utf-8"));
        prediction_date = pred.prediction_date || null;
      } catch {
        prediction_date = null;
      }
    }

    return res.json({
      success: true,
      timestamp,
      used_gb: Number(used_gb),
      total_gb: Number(total_gb),
      prediction_date,
    });
  } catch (err) {
    console.error("run-backup-and-predict error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Backup + Prediction failed",
    });
  }
});

// ---------- START ----------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
