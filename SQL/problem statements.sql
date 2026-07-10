-- PROBLEM 1: Display the Declarant’s Name, Government Issued ID, Government ID Number, and Government ID Issued Date. Order by declarant’s name.

SELECT DECLARANT_NAME, 
       DECLARANT_GOV_ISSUED_ID, 
       DECLARANT_GOV_ID_NO, 
       DECLARANT_GOV_ID_ISSUED_DATE
FROM declarant
ORDER BY DECLARANT_NAME;

-- PROBLEM 2: Displays the Real Property Description, Acquisition Mode & Acquisition Cost to isolate real property records lacking a declared financial acquisition value, 
-- specifically triggering when the REAL_ACQUISITION_COST is exactly 0 or recorded as a database NULL.

SELECT REAL_PROPERTY_DESCRIPTION, 
       REAL_ACQUISITION_MODE, 
       REAL_ACQUISITION_COST 
FROM real_properties 
WHERE REAL_ACQUISITION_COST= 0 
    OR REAL_ACQUISITION_COST IS NULL;
    
-- PROBLEM 3: Displays the property description, acquisition year and acquisition cost to isolate high-value movable
-- assets, such as luxury vehicles, artwork, or jewelry, specifically triggering when the PERSONAL_ACQUISITION_COST is greater than or equal to 500,000.

SELECT PERSONAL_PROPERTY_DESCRIPTION, 
       PERSONAL_ACQUISITION_YEAR, 
       PERSONAL_ACQUISITION_COST 
FROM personal_properties 
WHERE PERSONAL_ACQUISITION_COST >= 500000;

-- PROBLEM 4: Display the name of private creditors and calculate the total outstanding balance for each creditor. To isolate "private loans," filter out 
-- standard government loans and state-backed financial institutions by excluding any creditor names containing 'GSIS', 'Pag-IBIG', 'Landbank', or 'DBP'. 
-- Also, exclude blank creditors ('\N'). Display the results only if the total outstanding balance is greater than 1,000,000 in descending order.

SELECT NAME_OF_CREDITORS AS Private_Creditors,
       SUM(OUTSTANDING_BALANCE) AS Total_Private_Debt
FROM liabilities
WHERE NAME_OF_CREDITORS NOT LIKE '%GSIS%' 
  AND NAME_OF_CREDITORS NOT LIKE '%Pag-IBIG%'
  AND NAME_OF_CREDITORS NOT LIKE '%Landbank%'
  AND NAME_OF_CREDITORS NOT LIKE '%DBP%'
  AND NAME_OF_CREDITORS != '\N'
GROUP BY NAME_OF_CREDITORS
HAVING SUM(OUTSTANDING_BALANCE) > 1000000
ORDER BY Total_Private_Debt DESC;


-- PROBLEM 6: Display the commonly used government ID types among SALN declarants whose IDs were issued within the last five years (2021 to present). 
-- The qualified ID types used by more than one declarant should show the total number of declarants using that type of ID, the earliest issuance date, 
-- and the latest issuance date within the five-year period. Sort by government ID type.

SELECT DECLARANT_GOV_ISSUED_ID,
       COUNT(DECLARANT_ID) AS NO_OF_DECLARANTS,
       MIN(DECLARANT_GOV_ID_ISSUED_DATE) AS EARLIEST_ISSUANCE,
       MAX(DECLARANT_GOV_ID_ISSUED_DATE) AS LATEST_ISSUANCE
FROM declarant
WHERE YEAR(DECLARANT_GOV_ID_ISSUED_DATE) >= "2021"
GROUP BY DECLARANT_GOV_ISSUED_ID
HAVING COUNT(DECLARANT_ID) > 1
ORDER BY DECLARANT_GOV_ISSUED_ID;

-- PROBLEM 8: Display the declarant name along with the total number of declared eligible minor children, oldest child age, youngest child age, and average child age. 
-- Group the results by the name, and isolate households where the oldest child is 17 years old to identify dependents nearing the legal threshold.

SELECT 
    D.DECLARANT_NAME,
    COUNT(U.UNMARRIED_CHILDREN_ID) AS TOTAL_DECLARED_CHILDREN,
    MAX(U.CHILD_AGE) AS OLDEST_CHILD_AGE,
    MIN(U.CHILD_AGE) AS YOUNGEST_CHILD_AGE,
    AVG(U.CHILD_AGE) AS AVERAGE_CHILD_AGE
FROM 
    declarant AS D, 
    unmarried_children AS U, 
    filing_table AS F 
WHERE 
    D.DECLARANT_ID = U.DECLARANT_ID
    AND D.DECLARANT_ID = F.DECLARANT_ID
GROUP BY 
    D.DECLARANT_NAME
HAVING 
    MAX(U.CHILD_AGE) = 17;

-- PROBLEM 9: Display the compliance for, filing year, filing date, declarant name, real property description, real property kind, exact location, 
-- and real acquisition cost. Filter the results to only display individual real properties with an acquisition cost of 5,000,000 or higher.

SELECT 
    F.COMPLIANCE_FOR,
    F.FILING_YEAR,
    F.FILING_DATE,
    D.DECLARANT_NAME, 
    R.REAL_PROPERTY_DESCRIPTION, 
    R.REAL_KIND, 
    R.REAL_EXACT_LOCATION, 
    R.REAL_ACQUISITION_COST
FROM 
    real_properties AS R,
    filing_table AS F,
    declarant AS D
WHERE 
    R.FILING_ID = F.FILING_ID
    AND F.DECLARANT_ID = D.DECLARANT_ID
    AND R.REAL_ACQUISITION_COST >= 5000000;


-- PROBLEM 10: Display the agency name along with the total number of declared minor dependents and the average child age. Group the results by the agency 
-- information, and only display agencies with a total dependent count of 2 or higher to isolate departments requiring baseline family welfare allocations 
-- and healthcare premium budgeting.

SELECT 
    A.AGENCY_NAME,
    COUNT(DISTINCT D.DECLARANT_ID) AS ACTIVE_EMPLOYEE_FILERS,
    COUNT(U.UNMARRIED_CHILDREN_ID) AS TOTAL_DEPENDENTS_TO_COVER,
    AVG(U.CHILD_AGE) AS AVERAGE_DEPENDENT_AGE
FROM 
    declarant AS D,
    filing_table AS F,
    agency AS A,
    unmarried_children AS U
WHERE 
    D.DECLARANT_ID = F.DECLARANT_ID
    AND F.DECLARANT_AGENCY_ID = A.AGENCY_ID
    AND D.DECLARANT_ID = U.DECLARANT_ID
GROUP BY 
    A.AGENCY_NAME
HAVING 
    COUNT(U.UNMARRIED_CHILDREN_ID) >= 2
ORDER BY 
    TOTAL_DEPENDENTS_TO_COVER DESC;

-- PROBLEM 7: Display the years where the total acquisition cost of personal properties exceeded 1,000,000. 
-- Only include years with non‑missing acquisition data. 
-- For each qualified year, show the year, the number of properties acquired, and the total acquisition cost.
-- Order the results from the highest total cost to the lowest.

SELECT PERSONAL_ACQUISITION_YEAR,
       COUNT(PERSONAL_PROPERTIES_ID) AS Number_Of_Properties,
       SUM(PERSONAL_ACQUISITION_COST) AS Total_Acquisition_Cost
FROM personal_properties
WHERE PERSONAL_ACQUISITION_YEAR IS NOT NULL
GROUP BY PERSONAL_ACQUISITION_YEAR
HAVING SUM(PERSONAL_ACQUISITION_COST) > 1000000
ORDER BY SUM(PERSONAL_ACQUISITION_COST) DESC;

-- PROBLEM 5: Calculate the number of properties, the sum of the acquisition costs, 
-- and the highest current fair market value for each kind of real property. Exclude 'Residential' 
-- properties and properties with a zero acquisition cost. Display only those where the highest market 
-- value is at least 3 times the total acquisition cost, sorted in descending order of that highest market value.

SQL CODE:

SELECT REAL_KIND,
       COUNT(REAL_PROPERTIES_ID) AS PROPERTY_COUNT,
       SUM(REAL_ACQUISITION_COST) AS TOTAL_PURCHASE_PRICE,
       MAX(REAL_CURRENT_FAIR_MARKET_VALUE) AS PEAK_MARKET_VALUE
FROM real_properties
WHERE REAL_KIND NOT LIKE '%Residential%'
  AND REAL_ACQUISITION_COST > 0
GROUP BY REAL_KIND
HAVING MAX(REAL_CURRENT_FAIR_MARKET_VALUE) >= 
SUM(REAL_ACQUISITION_COST) * 3
ORDER BY PEAK_MARKET_VALUE DESC;

