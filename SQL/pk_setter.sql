USE old_saln;

-- =======================================================
-- PART 1: SETTING THE PRIMARY KEYS (PK)
-- Run these first so the tables have unique identifiers
-- =======================================================

ALTER TABLE agency ADD PRIMARY KEY (AGENCY_ID);
ALTER TABLE spouses ADD PRIMARY KEY (SPOUSE_ID);
ALTER TABLE declarant ADD PRIMARY KEY (DECLARANT_ID);
ALTER TABLE filing_table ADD PRIMARY KEY (FILING_ID);
ALTER TABLE real_properties ADD PRIMARY KEY (REAL_PROPERTIES_ID);
ALTER TABLE personal_properties ADD PRIMARY KEY (PERSONAL_PROPERTIES_ID);
ALTER TABLE liabilities ADD PRIMARY KEY (CREDITORS_ID);
ALTER TABLE unmarried_children ADD PRIMARY KEY (UNMARRIED_CHILDREN_ID);
ALTER TABLE other_spouses ADD PRIMARY KEY (OTHER_SPOUSES_ID);

-- =======================================================
-- PART 2: CONNECTING THE FOREIGN KEYS (FK)
-- This establishes the relationships between your tables
-- =======================================================

-- 1. Link Declarant to their Spouse
ALTER TABLE declarant 
ADD CONSTRAINT fk_declarant_spouse 
FOREIGN KEY (SPOUSE_ID) REFERENCES spouses(SPOUSE_ID);

-- 2. Link Unmarried Children and Other Spouses back to the Declarant
ALTER TABLE unmarried_children 
ADD CONSTRAINT fk_children_declarant 
FOREIGN KEY (DECLARANT_ID) REFERENCES declarant(DECLARANT_ID) ON DELETE CASCADE;

ALTER TABLE other_spouses 
ADD CONSTRAINT fk_other_spouses_declarant 
FOREIGN KEY (DECLARANT_ID) REFERENCES declarant(DECLARANT_ID) ON DELETE CASCADE;

-- 3. Link the core Filing Table to the Declarant and Agencies
ALTER TABLE filing_table 
ADD CONSTRAINT fk_filing_declarant 
FOREIGN KEY (DECLARANT_ID) REFERENCES declarant(DECLARANT_ID),
ADD CONSTRAINT fk_filing_declarant_agency 
FOREIGN KEY (DECLARANT_AGENCY_ID) REFERENCES agency(AGENCY_ID),
ADD CONSTRAINT fk_filing_spouse_agency 
FOREIGN KEY (SPOUSE_AGENCY_ID) REFERENCES agency(AGENCY_ID);

-- 4. Link the Properties and Liabilities to the specific Filing Record
ALTER TABLE real_properties 
ADD CONSTRAINT fk_real_prop_filing 
FOREIGN KEY (FILING_ID) REFERENCES filing_table(FILING_ID) ON DELETE CASCADE;

ALTER TABLE personal_properties 
ADD CONSTRAINT fk_personal_prop_filing 
FOREIGN KEY (FILING_ID) REFERENCES filing_table(FILING_ID) ON DELETE CASCADE;

ALTER TABLE liabilities 
ADD CONSTRAINT fk_liabilities_filing 
FOREIGN KEY (FILING_ID) REFERENCES filing_table(FILING_ID) ON DELETE CASCADE;