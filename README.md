# Smart Billing Software using SAN (Storage Area Network)

## 1. Problem Statement

Small shops and retail businesses usually depend on **local computer storage** to maintain billing records, invoices, and transaction history. These traditional systems suffer from several drawbacks such as:

- High risk of **data loss during system crashes or hardware failures**
- **No centralized storage**, making data management difficult
- **Unreliable backups**, as backups are often stored on the same local machine
- **Limited storage scalability**
- **No fault tolerance** for business-critical data

In addition to these limitations, **cloud services and enterprise SAN servers are often too expensive for small businesses**, as they involve high infrastructure cost, recurring subscription charges, and dependence on third-party service providers. 

Since billing data directly affects business operations, these limitations pose a serious risk. Hence, a **secure, centralized, scalable, reliable, and cost-effective storage solution** is required.


---

## 2. How SAN Is Used in This Project to Solve the Problem

This project implements a **real IP-based Storage Area Network (IP-SAN)** using the **iSCSI protocol over TCP/IP and Ethernet** to replace traditional local storage used in billing systems.

Instead of storing billing data on the local disk, **all billing records, invoices, logs, and backups are stored on a SAN-mounted storage volume**. The SAN appears as a local disk to the billing software but is physically a **remote network-based block storage device**.

All disk I/O operations are transmitted as **SCSI commands encapsulated inside TCP/IP packets** and transported over a standard Ethernet LAN, thereby achieving **true network-based block storage**.

SAN integration ensures:

- Data is **independent of the billing PC**
- Data remains **safe even if the billing system crashes**
- Storage can be **expanded without modifying the application**
- Backups happen **directly to SAN**

Thus, SAN converts the billing system into a **secure, enterprise-grade storage solution** suitable even for small businesses.

---

## 3. Project Features

- Smart invoice and bill generation  
- Centralized billing data storage using SAN  
- Network-based block storage access  
- Automated SAN backups  
- Manual on-demand backup & prediction  
- SAN usage monitoring  
- Future storage capacity prediction  
- High availability and fault tolerance  
- Secure network-based storage access  
- Storage scalability without downtime  

---

## 4. SAN Features & Concepts Implemented in This Project

These SAN concepts are **practically implemented as real working features** in this project:

---

### 4.1 IP-Based SAN Architecture

The project implements a **fully IP-based SAN architecture** using:

**Ethernet → IP → TCP → iSCSI**

- Linux system → SAN **Target**
- Windows billing system → SAN **Initiator**
- Storage accessed securely over a standard LAN

---

### 4.2 Separation of Compute and Storage

- Billing application runs on one system  
- Storage runs on a separate SAN server  

This ensures **application processing and storage management are completely independent**, improving reliability and performance.

---

### 4.3 Shared Centralized Storage

All business data is stored in a **single centralized SAN volume** instead of on local disks. This enables:

- Central data management
- Consistent data access
- Easy scalability

---

### 4.4 SAN-Based Backup Model

All billing data is:

- **Backed up directly to the SAN**
- Independent of the billing computer’s local disk
- Secure from local hardware failures

This guarantees **safe long-term data retention**.

---

### 4.5 Reliable Storage Transport Using TCP

SAN communication uses **TCP at the transport layer**, ensuring:

- Reliable data delivery
- Correct data ordering
- Automatic retransmission on failure

This maintains **data integrity**.

---

### 4.6 Use of Standard Ethernet Network

The SAN runs entirely on **standard Ethernet & IP networking**:

- No Fibre Channel hardware
- No proprietary equipment
- Low-cost and easily deployable

---

### 4.7 iSCSI as the Storage Protocol

The project uses **iSCSI as the core storage protocol**:

- Billing system → iSCSI Initiator  
- SAN server → iSCSI Target  
- Storage accessed using SCSI commands over IP

---

### 4.8 Cost-Effective Alternative to Fibre Channel

This SAN implementation is **completely Fibre-Channel free** and is built only using:

- Ethernet  
- TCP/IP  
- iSCSI  

This proves that a **low-cost IP-SAN can deliver enterprise-style centralized storage** for small business applications like billing systems.

---

## 5. Automated SAN Backup System

To ensure continuous data safety, the project implements a **fully automated SAN backup system**.

### 5.1 Nightly Automated Backup

- A **scheduled job runs every night automatically**
- All billing data is:
  - Copied from the application directory
  - Directly stored on the SAN
- No manual interaction is required
- Ensures:
  - Daily data protection  
  - Zero business data loss  

This provides **enterprise-level unattended backup automation**.

---

### 5.2 Manual Backup + Prediction Button

In addition to automation, the system also provides a **manual control button in the UI**:

- When the **button is clicked**:
  1. Immediate backup is triggered to SAN
  2. Latest SAN usage is calculated
  3. Prediction algorithm is executed
- The user instantly receives:
  - Backup confirmation
  - Updated usage
  - Predicted future storage level

This gives **real-time administrative control along with automation**.

---

## 6. SAN Usage Monitoring & Storage Capacity Prediction

Beyond storage and backup, the project implements an advanced **SAN monitoring and prediction module**.

### 6.1 SAN Usage Monitoring

- After each backup:
  - Used space
  - Total SAN capacity
  - Timestamp  
  are recorded in a **log file (CSV)**.
- This creates a **historical usage dataset**.

---

### 6.2 Storage Capacity Prediction

- A **Python-based prediction engine** analyzes the historical SAN usage data.
- Using **linear regression**, the system:
  - Learns daily storage growth trend
  - Predicts **future SAN usage**
- The system estimates:
  - When the SAN will reach **critical capacity thresholds**
  - How many days remain before storage is exhausted

### Example: 

After every backup, the system logs the **used storage, total SAN capacity (20 GB), last backup status, and last prediction status**. Using this historical data, the prediction module calculates the **exact date on which 95% of the SAN disk (19 GB) will be reached** and also displays the **number of days remaining**. For example, if the current usage is **11.5 GB**, the system predicts that **95% capacity will be reached by 25-Nov-2025 with 20 days remaining**, while showing **“Last Backup: Success”** and **“Last Prediction: Completed”** in the dashboard. This enables administrators to **expand SAN storage in advance and prevent backup or billing data loss**.

---

### 6.3 Proactive Capacity Planning

Using prediction, the system enables:

- **Early warning before storage becomes full**
- Planned storage expansion
- Avoidance of backup failures
- Zero downtime due to storage exhaustion

This transforms the project from a **reactive storage system into a proactive smart storage management system**.

---


## 7. Folder Structure
```
Smart-Billing-Software-using-SAN/
│
├── backend/ → Billing logic
├── frontend/ → User interface
├── backup/ → Automated SAN backup scripts
├── prediction/ → SAN usage prediction scripts
├── san-config/ → SAN setup & configuration
├── logs/ → SAN usage CSV logs
├── README.md
```

---


---

## 9. Advantages of Using SAN with Prediction in This Project

- Eliminates data loss due to local disk failures  
- Enables centralized storage management  
- Provides fault tolerance and fast recovery  
- Supports seamless storage scalability  
- Enables **automated unattended backups**
- Enables **on-demand backup and prediction**
- Allows **future storage capacity planning**
- Prevents unexpected SAN overflow or data loss  
- Converts billing software into a **Smart Storage-Aware System**

---

## 10. Conclusion

The Smart Billing Software using SAN successfully demonstrates how **enterprise Storage Area Network technology can be practically applied to real business applications**.

By combining:
- Real IP-based SAN
- Automated nightly backups
- Manual backup & prediction control
- SAN usage monitoring
- Future storage capacity prediction

This project delivers a **complete, intelligent, secure, scalable, and proactive storage-enabled billing system**. It proves that even small businesses can benefit from **enterprise-grade centralized storage and predictive storage management** using a cost-effective IP-SAN solution.

---

## 11. License

This project is developed for academic and educational purposes.




