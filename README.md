# The SALN Digital Filing System

We developed a comprehensive, full-stack web application designed to digitize the Philippine Statement of Assets, Liabilities, and Net Worth (SALN) form. Developed as a school project, the application is built for offline use and is hosted strictly in a local environment.

## Core Architecture

- **Frontend (User Interface):** A Single Page Application (SPA) built with vanilla HTML, JavaScript, and Bootstrap 5. It transforms the complex physical SALN document into an accessible, interactive multi-step form.
- **Backend (Server & API):** Powered by Python and the Flask framework, providing lightweight RESTful APIs to handle form submissions, user authentication, and data routing.
- **Database (Data Storage):** Uses a highly relational MySQL database structured following Third Normal Form (3NF) principles to ensure data integrity. It utilizes a sequential auto-incrementing ID system starting at **1000000001**.

## Key Features

- **Interactive User Portal:** A multi-step form capturing data for the Declarant, Spouse, Unmarried Children, Properties, Liabilities, and Business Interests. It features live calculations that automatically compute total assets, liabilities, and net worth as users enter their information.
- **Dual-Role Authentication:** Secure login system that distinguishes between standard users submitting SALNs and administrators managing submissions.
- **Staging Workflow:** User submissions are temporarily stored as JSON payloads in a `Pending_Submissions` staging table, protecting the main database until reviewed.
- **Admin Dashboard:** A dedicated administrator interface that displays real-time statistics, allows searching through submissions, and provides the ability to approve or delete pending SALNs. Approved submissions are automatically parsed from JSON and distributed across the normalized database tables.

---

## Project Structure

```text
saln-system/
├── backend/
│   ├── app.py
│   ├── db_config.py
│   └── requirements.txt
│
├── frontend/
│   ├── index.html
│   ├── admin.html
│   ├── login.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       ├── admin.js
│       └── login.js
│
└── sql/
    ├── clear_tables.sql
    └── schema.sql
```

---

# 🚀 Running the Project Locally

Follow the steps below to set up and run the SALN Digital Filing System on your local machine.

The application consists of three components:

- **MySQL Database**
- **Python Flask Backend**
- **HTML, CSS, and JavaScript Frontend**

---

## Prerequisites

Before running the project, make sure you have the following installed:

- Python **3.8** or later
- MySQL Server
  - MySQL Workbench
- Visual Studio Code (Recommended)
- Live Server extension for Visual Studio Code (Recommended)

---

## 1. Set Up the Database

### Create the Database

1. Open your preferred MySQL client (e.g., MySQL Workbench or phpMyAdmin).
2. Open the SQL script located at:

```text
sql/schema.sql
```

3. Execute the script.

This will automatically create:

- `saln_db`
- All required database tables

or you can upload the tables manually (you can find the normalized tables in the SQL folder)

### Configure the Database Connection

Open the following file:

```text
backend/db_config.py
```

Update the database credentials to match your local MySQL configuration.

Example:

```python
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "saln_db"
}
```

> **Note:** If you're using XAMPP, the default credentials are usually:
>
> - **Username:** `root`
> - **Password:** *(leave blank)*

---

## 2. Start the Flask Backend

Open a terminal and navigate to the backend directory.

```bash
cd path/to/saln-system/backend
```

### (Optional) Create a Virtual Environment

**Windows**

```bash
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux**

```bash
python3 -m venv venv
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run the Backend

```bash
python app.py
```

If successful, Flask will display a message similar to:

```text
Running on http://127.0.0.1:5000
```

> Keep this terminal window open while using the application.

---

## 3. Run the Frontend

Since the frontend is built using vanilla HTML, CSS, and JavaScript, it should be served through a local web server. Opening the HTML files directly (`file:///`) may prevent API requests from working due to browser security restrictions.

### Option A — Live Server (Recommended)

1. Open the project folder in Visual Studio Code.
2. Install the **Live Server** extension by **Ritwick Dey**.
3. Navigate to the `frontend` folder.
4. Right-click `login.html`.
5. Select **Open with Live Server**.

Your browser will automatically launch the application.

### Option B — Python HTTP Server

Open another terminal.

Navigate to the frontend directory:

```bash
cd path/to/saln-system/frontend
```

Start a simple HTTP server:

```bash
python -m http.server 8000
```

Then open your browser and visit:

```text
http://localhost:8000/login.html
```

---

## 4. Test the System

Once the database, backend, and frontend are running, verify that everything is working correctly using the sample accounts below.

### User Account

| Username | Password |
|----------|----------|
| `user` | `user` |

1. Log in using the user account.
2. Complete the SALN form with sample information.
3. Navigate to the **Review** section.
4. Click **Submit SALN**.

A confirmation message should indicate that the SALN has been successfully submitted for administrator review.

### Administrator Account

| Username | Password |
|----------|----------|
| `admin` | `admin` |

1. Log out of the user account.
2. Log in as the administrator.
3. Open the **Admin Dashboard**.

The submitted SALN should appear with a **Pending** status.

Click **Approve** to validate the submission and transfer the data from the staging table into the normalized MySQL database.

---

## ✅ Startup Checklist

Before using the application, ensure that:

- Database has been created using `schema.sql`.
- MySQL credentials in `backend/db_config.py` are correct.
- Flask backend is running (`python app.py`).
- Frontend is being served using Live Server or Python HTTP Server.
- Access the application through:
  - `http://localhost:5500/login.html` *(Live Server)*, or
  - `http://localhost:8000/login.html` *(Python HTTP Server)*.
