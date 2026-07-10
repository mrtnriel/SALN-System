-- Disable foreign key checks to prevent relationship errors
SET FOREIGN_KEY_CHECKS = 0;

-- Wipe all data and reset auto-increment IDs to 1
TRUNCATE TABLE agency;
TRUNCATE TABLE declarant;
TRUNCATE TABLE filing;
TRUNCATE TABLE liabilities;
TRUNCATE TABLE other_spouses;
TRUNCATE TABLE pending_submissions;
TRUNCATE TABLE personal_properties;
TRUNCATE TABLE real_properties;
TRUNCATE TABLE spouse;
TRUNCATE TABLE unmarried_children;

-- Re-enable foreign key checks (CRITICAL STEP)
SET FOREIGN_KEY_CHECKS = 1;