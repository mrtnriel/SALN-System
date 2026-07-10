-- ==========================================
-- Fixing empty strings for table: agency
-- ==========================================
UPDATE `old_saln`.`agency` SET `AGENCY_ID` = NULL WHERE `AGENCY_ID` = '';
UPDATE `old_saln`.`agency` SET `AGENCY_NAME` = NULL WHERE `AGENCY_NAME` = '';
UPDATE `old_saln`.`agency` SET `OFFICE_ADDRESS` = NULL WHERE `OFFICE_ADDRESS` = '';

-- ==========================================
-- Fixing empty strings for table: declarant
-- ==========================================
UPDATE `old_saln`.`declarant` SET `DECLARANT_ID` = NULL WHERE `DECLARANT_ID` = '';
UPDATE `old_saln`.`declarant` SET `DECLARANT_NAME` = NULL WHERE `DECLARANT_NAME` = '';
UPDATE `old_saln`.`declarant` SET `DECLARANT_GOV_ISSUED_ID` = NULL WHERE `DECLARANT_GOV_ISSUED_ID` = '';
UPDATE `old_saln`.`declarant` SET `DECLARANT_GOV_ID_NO` = NULL WHERE `DECLARANT_GOV_ID_NO` = '';
UPDATE `old_saln`.`declarant` SET `DECLARANT_GOV_ID_ISSUED_DATE` = NULL WHERE `DECLARANT_GOV_ID_ISSUED_DATE` = '';
UPDATE `old_saln`.`declarant` SET `SPOUSE_ID` = NULL WHERE `SPOUSE_ID` = '';

-- ==========================================
-- Fixing empty strings for table: filing_table
-- ==========================================
UPDATE `old_saln`.`filing_table` SET `FILING_ID` = NULL WHERE `FILING_ID` = '';
UPDATE `old_saln`.`filing_table` SET `DECLARANT_ID` = NULL WHERE `DECLARANT_ID` = '';
UPDATE `old_saln`.`filing_table` SET `COMPLIANCE_FOR` = NULL WHERE `COMPLIANCE_FOR` = '';
UPDATE `old_saln`.`filing_table` SET `FILING_DATE` = NULL WHERE `FILING_DATE` = '';
UPDATE `old_saln`.`filing_table` SET `FILING_YEAR` = NULL WHERE `FILING_YEAR` = '';
UPDATE `old_saln`.`filing_table` SET `FILING_TYPE` = NULL WHERE `FILING_TYPE` = '';
UPDATE `old_saln`.`filing_table` SET `DECLARANT_POSITION` = NULL WHERE `DECLARANT_POSITION` = '';
UPDATE `old_saln`.`filing_table` SET `DECLARANT_AGENCY_ID` = NULL WHERE `DECLARANT_AGENCY_ID` = '';
UPDATE `old_saln`.`filing_table` SET `SPOUSE_POSITION` = NULL WHERE `SPOUSE_POSITION` = '';
UPDATE `old_saln`.`filing_table` SET `SPOUSE_AGENCY_ID` = NULL WHERE `SPOUSE_AGENCY_ID` = '';

-- ==========================================
-- Fixing empty strings for table: liabilities
-- ==========================================
UPDATE `old_saln`.`liabilities` SET `CREDITORS_ID` = NULL WHERE `CREDITORS_ID` = '';
UPDATE `old_saln`.`liabilities` SET `FILING_ID` = NULL WHERE `FILING_ID` = '';
UPDATE `old_saln`.`liabilities` SET `NAME_OF_CREDITORS` = NULL WHERE `NAME_OF_CREDITORS` = '';
UPDATE `old_saln`.`liabilities` SET `NATURE` = NULL WHERE `NATURE` = '';
UPDATE `old_saln`.`liabilities` SET `OUTSTANDING_BALANCE` = NULL WHERE `OUTSTANDING_BALANCE` = '';

-- ==========================================
-- Fixing empty strings for table: other_spouses
-- ==========================================
UPDATE `old_saln`.`other_spouses` SET `OTHER_SPOUSES_ID` = NULL WHERE `OTHER_SPOUSES_ID` = '';
UPDATE `old_saln`.`other_spouses` SET `DECLARANT_ID` = NULL WHERE `DECLARANT_ID` = '';
UPDATE `old_saln`.`other_spouses` SET `OTHER_SPOUSES` = NULL WHERE `OTHER_SPOUSES` = '';

-- ==========================================
-- Fixing empty strings for table: personal_properties
-- ==========================================
UPDATE `old_saln`.`personal_properties` SET `PERSONAL_PROPERTIES_ID` = NULL WHERE `PERSONAL_PROPERTIES_ID` = '';
UPDATE `old_saln`.`personal_properties` SET `FILING_ID` = NULL WHERE `FILING_ID` = '';
UPDATE `old_saln`.`personal_properties` SET `PERSONAL_PROPERTY_DESCRIPTION` = NULL WHERE `PERSONAL_PROPERTY_DESCRIPTION` = '';
UPDATE `old_saln`.`personal_properties` SET `PERSONAL_ACQUISITION_YEAR` = NULL WHERE `PERSONAL_ACQUISITION_YEAR` = '';
UPDATE `old_saln`.`personal_properties` SET `PERSONAL_ACQUISITION_COST` = NULL WHERE `PERSONAL_ACQUISITION_COST` = '';

-- ==========================================
-- Fixing empty strings for table: real_properties
-- ==========================================
UPDATE `old_saln`.`real_properties` SET `REAL_PROPERTIES_ID` = NULL WHERE `REAL_PROPERTIES_ID` = '';
UPDATE `old_saln`.`real_properties` SET `FILING_ID` = NULL WHERE `FILING_ID` = '';
UPDATE `old_saln`.`real_properties` SET `REAL_PROPERTY_DESCRIPTION` = NULL WHERE `REAL_PROPERTY_DESCRIPTION` = '';
UPDATE `old_saln`.`real_properties` SET `REAL_KIND` = NULL WHERE `REAL_KIND` = '';
UPDATE `old_saln`.`real_properties` SET `REAL_EXACT _LOCATION` = NULL WHERE `REAL_EXACT _LOCATION` = '';
UPDATE `old_saln`.`real_properties` SET `REAL_ASSESSED _VALUE` = NULL WHERE `REAL_ASSESSED _VALUE` = '';
UPDATE `old_saln`.`real_properties` SET `REAL_CURRENT_FAIR_MARKET_VALUE` = NULL WHERE `REAL_CURRENT_FAIR_MARKET_VALUE` = '';
UPDATE `old_saln`.`real_properties` SET `REAL_ACQUISITION_YEAR` = NULL WHERE `REAL_ACQUISITION_YEAR` = '';
UPDATE `old_saln`.`real_properties` SET `REAL_ACQUISITION_MODE` = NULL WHERE `REAL_ACQUISITION_MODE` = '';
UPDATE `old_saln`.`real_properties` SET `REAL_ACQUISITION_COST` = NULL WHERE `REAL_ACQUISITION_COST` = '';

-- ==========================================
-- Fixing empty strings for table: spouses
-- ==========================================
UPDATE `old_saln`.`spouses` SET `SPOUSE_ID` = NULL WHERE `SPOUSE_ID` = '';
UPDATE `old_saln`.`spouses` SET `SPOUSE_NAME` = NULL WHERE `SPOUSE_NAME` = '';
UPDATE `old_saln`.`spouses` SET `SPOUSE_GOV_ISSUED_ID` = NULL WHERE `SPOUSE_GOV_ISSUED_ID` = '';
UPDATE `old_saln`.`spouses` SET `SPOUSE_GOV_ID_NO` = NULL WHERE `SPOUSE_GOV_ID_NO` = '';
UPDATE `old_saln`.`spouses` SET `SPOUSE_GOV_ID_ISSUED_DATE` = NULL WHERE `SPOUSE_GOV_ID_ISSUED_DATE` = '';

-- ==========================================
-- Fixing empty strings for table: unmarried_children
-- ==========================================
UPDATE `old_saln`.`unmarried_children` SET `UNMARRIED_CHILDREN_ID` = NULL WHERE `UNMARRIED_CHILDREN_ID` = '';
UPDATE `old_saln`.`unmarried_children` SET `DECLARANT_ID` = NULL WHERE `DECLARANT_ID` = '';
UPDATE `old_saln`.`unmarried_children` SET `UNMARRIED_CHILDREN_NAME` = NULL WHERE `UNMARRIED_CHILDREN_NAME` = '';
UPDATE `old_saln`.`unmarried_children` SET `CHILD_AGE` = NULL WHERE `CHILD_AGE` = '';


-- Convert empty strings in the date column to true NULLs
UPDATE `old_saln`.`filing_table` 
SET `FILING_DATE` = NULL 
WHERE `FILING_DATE` = '';


-- 1. Convert empty strings to true database NULLs
UPDATE `old_saln`.`filing_table` SET `FILING_ID` = NULL WHERE `FILING_ID` = '';
UPDATE `old_saln`.`filing_table` SET `DECLARANT_ID` = NULL WHERE `DECLARANT_ID` = '';
UPDATE `old_saln`.`filing_table` SET `FILING_YEAR` = NULL WHERE `FILING_YEAR` = '';
UPDATE `old_saln`.`filing_table` SET `SPOUSE_AGENCY_ID` = NULL WHERE `SPOUSE_AGENCY_ID` = '';

-- 2. Remove the '.0' decimal added by Python from numerical columns
UPDATE `old_saln`.`filing_table` SET `FILING_ID` = REPLACE(`FILING_ID`, '.0', '') WHERE `FILING_ID` LIKE '%.0';
UPDATE `old_saln`.`filing_table` SET `DECLARANT_ID` = REPLACE(`DECLARANT_ID`, '.0', '') WHERE `DECLARANT_ID` LIKE '%.0';
UPDATE `old_saln`.`filing_table` SET `FILING_YEAR` = REPLACE(`FILING_YEAR`, '.0', '') WHERE `FILING_YEAR` LIKE '%.0';
UPDATE `old_saln`.`filing_table` SET `SPOUSE_AGENCY_ID` = REPLACE(`SPOUSE_AGENCY_ID`, '.0', '') WHERE `SPOUSE_AGENCY_ID` LIKE '%.0';



-- 1. Remove commas from the monetary columns
UPDATE `old_saln`.`real_properties` SET `REAL_ASSESSED _VALUE` = REPLACE(`REAL_ASSESSED _VALUE`, ',', '');
UPDATE `old_saln`.`real_properties` SET `REAL_CURRENT_FAIR_MARKET_VALUE` = REPLACE(`REAL_CURRENT_FAIR_MARKET_VALUE`, ',', '');
UPDATE `old_saln`.`real_properties` SET `REAL_ACQUISITION_COST` = REPLACE(`REAL_ACQUISITION_COST`, ',', '');

-- 2. Convert any remaining empty strings to true database NULLs
UPDATE `old_saln`.`real_properties` SET `REAL_ASSESSED _VALUE` = NULL WHERE `REAL_ASSESSED _VALUE` = '';
UPDATE `old_saln`.`real_properties` SET `REAL_CURRENT_FAIR_MARKET_VALUE` = NULL WHERE `REAL_CURRENT_FAIR_MARKET_VALUE` = '';
UPDATE `old_saln`.`real_properties` SET `REAL_ACQUISITION_COST` = NULL WHERE `REAL_ACQUISITION_COST` = '';

-- 3. Clean up the Year column (convert blanks to NULL, and remove any Python '.0' decimals)
UPDATE `old_saln`.`real_properties` SET `REAL_ACQUISITION_YEAR` = NULL WHERE `REAL_ACQUISITION_YEAR` = '';
UPDATE `old_saln`.`real_properties` SET `REAL_ACQUISITION_YEAR` = REPLACE(`REAL_ACQUISITION_YEAR`, '.0', '') WHERE `REAL_ACQUISITION_YEAR` LIKE '%.0';

UPDATE `old_saln`.`declarant`
SET `SPOUSE_ID` = NULL
WHERE `SPOUSE_ID` = '';

ALTER TABLE `old_saln`.`declarant` 
CHANGE COLUMN `DECLARANT_ID` `DECLARANT_ID` BIGINT NOT NULL,
CHANGE COLUMN `SPOUSE_ID` `SPOUSE_ID` BIGINT NULL DEFAULT NULL;