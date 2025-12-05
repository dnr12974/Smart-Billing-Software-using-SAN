PRAGMA foreign_keys = ON;

-- Employee table 
CREATE TABLE IF NOT EXISTS employee (
  eid INTEGER PRIMARY KEY AUTOINCREMENT,
  name    TEXT,
  email   TEXT,
  gender  TEXT,
  contact TEXT,
  dob     TEXT,
  doj     TEXT,
  pass    TEXT,
  utype   TEXT,
  address TEXT,
  salary  TEXT
);

-- Supplier table
CREATE TABLE IF NOT EXISTS supplier (
  invoice INTEGER PRIMARY KEY AUTOINCREMENT,
  name    TEXT,
  contact TEXT,
  desc    TEXT
);

-- Category table
CREATE TABLE IF NOT EXISTS category (
  cid  INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE
);

-- Product table
CREATE TABLE IF NOT EXISTS product (
  pid      INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT,
  supplier TEXT,
  name     TEXT,
  price    REAL,
  qty      INTEGER,
  status   TEXT
);

-- Sales (bills header)
CREATE TABLE IF NOT EXISTS sales (
  sid              INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_no       TEXT UNIQUE,
  customer_name    TEXT,
  customer_contact TEXT,
  bill_date        TEXT,
  total_amt        REAL,
  discount         REAL,
  net_total        REAL,
  bill_file        TEXT
);

-- Sales items (line items for each invoice)
CREATE TABLE IF NOT EXISTS sales_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_no   TEXT,
  product_id   INTEGER,
  product_name TEXT,
  qty          INTEGER,
  price        REAL,
  line_total   REAL,
  FOREIGN KEY (invoice_no) REFERENCES sales(invoice_no) ON DELETE CASCADE
);
