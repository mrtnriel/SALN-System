CREATE TABLE Pending_Submissions (
    pending_id INT AUTO_INCREMENT PRIMARY KEY,
    declarant_name VARCHAR(255) NOT NULL,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Pending',
    payload JSON NOT NULL
);