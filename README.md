# The SALN Digital Filing System

We developed a comprehensive, full-stack web application designed to digitize the Philippine Statement of Assets, Liabilities, and Net Worth (SALN) form. Developed as a school project, the application is built for offline use and is hosted strictly in a local environment.

**Core Architecture**

- Frontend (User Interface): A Single Page Application (SPA) built with vanilla HTML, JavaScript, and Bootstrap 5. It transforms the complex physical SALN document into an accessible, interactive multi-step form.
- Backend (Server & API): Powered by Python and the Flask framework, providing lightweight RESTful APIs to handle form submissions, user authentication, and data routing.
- Database (Data Storage): Uses a highly relational MySQL database structured following Third Normal Form (3NF) principles to ensure data integrity. It utilizes a sequential auto-incrementing ID system starting at 1000000001.

**Key Features**

- Interactive User Portal: A multi-step form capturing data for the Declarant, Spouse, Unmarried Children, Properties, Liabilities, and Business Interests. It features live math validation that instantly calculates net worth as the user types.
- Dual-Role Authentication: Secure login routing that differentiates between standard users submitting forms and administrators managing the system.
- Staging Workflow: To protect the main database, user submissions are temporarily held in a Pending_Submissions staging table as raw JSON payloads.
- Admin Dashboard: A dedicated interface for administrators to view real-time statistics, search through records, and review pending submissions. Admins can securely approve records—which unpacks the JSON and distributes it relationally across the main database tables—or delete them.


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
