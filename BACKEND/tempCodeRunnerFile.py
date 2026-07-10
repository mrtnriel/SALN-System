from flask import Flask, jsonify, request
from flask_cors import CORS
from db_config import get_db_connection, close_db_connection
import random
import json
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)
app.teardown_appcontext(close_db_connection)

def generate_id():
    # Generates a random 9-digit ID
    return random.randint(100000000, 999999999)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if username == 'admin' and password == 'admin':
        return jsonify({"message": "Login successful", "role": "admin"}), 200
    elif username == 'user' and password == 'user':
        return jsonify({"message": "Login successful", "role": "user"}), 200
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/agencies', methods=['GET'])
def get_agencies():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT AGENCY_NAME FROM agency")
    agencies = [row['AGENCY_NAME'] for row in cursor.fetchall()]
    cursor.close()
    return jsonify(agencies)

@app.route('/api/admin/agencies', methods=['GET'])
def get_admin_agencies():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT AGENCY_NAME, OFFICE_ADDRESS FROM agency")
        agencies = cursor.fetchall()
        return jsonify(agencies), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()

@app.route('/api/submit_saln', methods=['POST'])
def submit_saln():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        dec = data.get('declarant', {})
        # Safely parse names to avoid converting JSON null to literal string "None"
        first_name = dec.get('first_name') or ''
        family_name = dec.get('family_name') or ''
        declarant_name = f"{first_name} {family_name}".strip()
        
        cursor.execute(
            "INSERT INTO Pending_Submissions (declarant_name, payload) VALUES (%s, %s)", 
            (declarant_name, json.dumps(data))
        )
        conn.commit()
        return jsonify({"message": "SALN submitted for admin review!"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()

@app.route('/api/admin/pending', methods=['GET'])
def get_pending():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT pending_id, declarant_name, submission_date FROM Pending_Submissions WHERE status = 'Pending' ORDER BY submission_date DESC")
    results = cursor.fetchall()
    cursor.close()
    return jsonify(results)

@app.route('/api/admin/pending/<int:pending_id>', methods=['GET'])
def get_pending_record(pending_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT payload FROM Pending_Submissions WHERE pending_id = %s", (pending_id,))
        row = cursor.fetchone()
        if not row: return jsonify({"error": "Not found"}), 404
        
        data = json.loads(row['payload'])
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()

@app.route('/api/admin/delete/<int:pending_id>', methods=['DELETE'])
def delete_pending(pending_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Pending_Submissions WHERE pending_id = %s", (pending_id,))
    conn.commit()
    cursor.close()
    return jsonify({"message": "Deleted successfully"})

def get_or_create_agency(cursor, agency_name, address=""):
    if not agency_name: return None
    cursor.execute("SELECT AGENCY_ID FROM agency WHERE AGENCY_NAME = %s", (agency_name,))
    row = cursor.fetchone()
    if row: return row['AGENCY_ID']
    new_id = generate_id()
    cursor.execute(
        "INSERT INTO agency (AGENCY_ID, AGENCY_NAME, OFFICE_ADDRESS) VALUES (%s, %s, %s)", 
        (new_id, agency_name, address)
    )
    return new_id

@app.route('/api/admin/approve/<int:pending_id>', methods=['POST'])
def approve_pending(pending_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT payload FROM Pending_Submissions WHERE pending_id = %s", (pending_id,))
        row = cursor.fetchone()
        if not row: return jsonify({"error": "Not found"}), 404
        data = json.loads(row['payload'])

        cursor.execute("SET FOREIGN_KEY_CHECKS=0;")
        
        declarant_id = generate_id()
        filing_id = generate_id()
        spouse_id = None
        
        dec = data.get('declarant', {})
        sp = data.get('spouse', {})
        
        dec_agency_id = get_or_create_agency(cursor, dec.get('agency'), dec.get('address'))
        sp_agency_id = get_or_create_agency(cursor, sp.get('agency'), sp.get('address'))

        # Using filter(None) prevents adding the word "None" into the concatenated string
        dec_name = " ".join(filter(None, [dec.get('first_name'), dec.get('mi'), dec.get('family_name')]))
        sp_name = " ".join(filter(None, [sp.get('first_name'), sp.get('mi'), sp.get('family_name')]))

        # Ensure we evaluate for truthiness safely 
        if sp_name and sp.get('first_name'):
            spouse_id = generate_id()
            cursor.execute(
                "INSERT INTO spouses (SPOUSE_ID, SPOUSE_NAME, SPOUSE_GOV_ISSUED_ID, SPOUSE_GOV_ID_NO, SPOUSE_GOV_ID_ISSUED_DATE) VALUES (%s, %s, %s, %s, %s)", 
                (spouse_id, sp_name, sp.get('id_type'), sp.get('id_no'), sp.get('id_date'))
            )

        cursor.execute(
            "INSERT INTO declarant (DECLARANT_ID, DECLARANT_NAME, DECLARANT_GOV_ISSUED_ID, DECLARANT_GOV_ID_NO, DECLARANT_GOV_ID_ISSUED_DATE, SPOUSE_ID) VALUES (%s, %s, %s, %s, %s, %s)", 
            (declarant_id, dec_name, dec.get('id_type'), dec.get('id_no'), dec.get('id_date'), spouse_id)
        )

        for os_name in data.get('other_spouses', []):
            if len(os_name) >= 1 and os_name[0]:
                cursor.execute(
                    "INSERT INTO other_spouses (OTHER_SPOUSES_ID, DECLARANT_ID, OTHER_SPOUSES) VALUES (%s, %s, %s)", 
                    (generate_id(), declarant_id, os_name[0])
                )

        f_date = data.get('filing_date', '')
        f_yr = f_date.split('-')[0] if f_date and f_date != "Not Specified" else None
        
        cursor.execute("""
            INSERT INTO filing_table 
            (FILING_ID, DECLARANT_ID, COMPLIANCE_FOR, FILING_DATE, FILING_YEAR, FILING_TYPE, DECLARANT_POSITION, DECLARANT_AGENCY_ID, SPOUSE_POSITION, SPOUSE_AGENCY_ID) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (filing_id, declarant_id, data.get('compliance_for'), f_date, f_yr, data.get('filing_type'), dec.get('position'), dec_agency_id, sp.get('position'), sp_agency_id))

        for child in data.get('children', []):
            # Only insert if child[0] has a valid name (not None)
            if len(child) >= 2 and child[0]: 
                cursor.execute(
                    "INSERT INTO unmarried_children (UNMARRIED_CHILDREN_ID, DECLARANT_ID, UNMARRIED_CHILDREN_NAME, CHILD_AGE) VALUES (%s, %s, %s, %s)", 
                    (generate_id(), declarant_id, child[0], child[1] or 0)
                )
                
        for p in data.get('real_properties', []):
            if len(p) >= 8 and p[0]: 
                cursor.execute(
                    "INSERT INTO real_properties (REAL_PROPERTIES_ID, FILING_ID, REAL_PROPERTY_DESCRIPTION, REAL_KIND, REAL_EXACT_LOCATION, REAL_ASSESSED_VALUE, REAL_CURRENT_FAIR_MARKET_VALUE, REAL_ACQUISITION_YEAR, REAL_ACQUISITION_MODE, REAL_ACQUISITION_COST) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)", 
                    (generate_id(), filing_id, p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7])
                )
                
        for p in data.get('personal_properties', []):
            if len(p) >= 3 and p[0]: 
                cursor.execute(
                    "INSERT INTO personal_properties (PERSONAL_PROPERTIES_ID, FILING_ID, PERSONAL_PROPERTY_DESCRIPTION, PERSONAL_ACQUISITION_YEAR, PERSONAL_ACQUISITION_COST) VALUES (%s, %s, %s, %s, %s)", 
                    (generate_id(), filing_id, p[0], p[1], p[2])
                )
                
        for l in data.get('liabilities', []):
            if len(l) >= 3 and l[0]: 
                cursor.execute(
                    "INSERT INTO liabilities (CREDITORS_ID, FILING_ID, NAME_OF_CREDITORS, NATURE, OUTSTANDING_BALANCE) VALUES (%s, %s, %s, %s, %s)", 
                    (generate_id(), filing_id, l[1], l[0], l[2])
                )

        cursor.execute("DELETE FROM Pending_Submissions WHERE pending_id = %s", (pending_id,))
        cursor.execute("SET FOREIGN_KEY_CHECKS=1;")
        conn.commit()
        return jsonify({"message": "Approved & Synced!"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()

@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1. Pending Count
        cursor.execute("SELECT COUNT(*) as total FROM Pending_Submissions WHERE status='Pending'")
        pending = cursor.fetchone()['total']

        # 2. Approved Count
        cursor.execute("SELECT COUNT(*) as total FROM filing_table")
        approved = cursor.fetchone()['total']

        # 3. Today Count
        cursor.execute("SELECT COUNT(*) as total FROM Pending_Submissions WHERE DATE(submission_date) = CURDATE()")
        today = cursor.fetchone()['total']

        # 4. Chart Data
        cursor.execute("""
            SELECT DATE(submission_date) as date, COUNT(*) as count
            FROM Pending_Submissions
            WHERE submission_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(submission_date)
            ORDER BY date ASC
        """)
        chart_rows = cursor.fetchall()
        
        labels = []
        values = []
        today_date = datetime.today()
        
        for i in range(6, -1, -1):
            d = today_date - timedelta(days=i)
            date_str = d.strftime('%Y-%m-%d')
            labels.append(d.strftime('%a'))
            day_count = next((row['count'] for row in chart_rows if str(row['date']) == date_str), 0)
            values.append(day_count)

        # 5. Recent Activity (Get the 3 most recent pending submissions)
        cursor.execute("""
            SELECT declarant_name, submission_date 
            FROM Pending_Submissions 
            ORDER BY submission_date DESC 
            LIMIT 3
        """)
        recent_rows = cursor.fetchall()
        recent_activity = []
        for row in recent_rows:
            date_val = row['submission_date']
            if isinstance(date_val, datetime):
                date_str = date_val.strftime('%Y-%m-%d %H:%M:%S')
            else:
                date_str = str(date_val)
                
            recent_activity.append({
                "type": "New Submission",
                "name": row['declarant_name'],
                "date": date_str
            })

        stats = {
            "counters": {
                "pending": pending,
                "approved": approved,
                "today": today,
                "total": pending + approved
            },
            "chartData": {
                "labels": labels,
                "values": values
            },
            "recentActivity": recent_activity
        }

        return jsonify(stats), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()

@app.route('/api/admin/approved', methods=['GET'])
def get_approved_records():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        query = """
            SELECT 
                d.DECLARANT_ID AS saln_id,
                d.DECLARANT_NAME AS declarant_name,
                f.FILING_DATE AS filing_date
            FROM declarant d
            LEFT JOIN filing_table f ON d.DECLARANT_ID = f.DECLARANT_ID
            ORDER BY f.FILING_DATE DESC
        """
        cursor.execute(query)
        results = cursor.fetchall()
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()

@app.route('/api/admin/search', methods=['GET'])
def search_records():
    keyword = request.args.get('q', '')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT 
            d.DECLARANT_ID AS saln_id,
            d.DECLARANT_NAME AS declarant_name,
            a.AGENCY_NAME AS agency_name,
            f.FILING_YEAR AS saln_year,
            f.FILING_TYPE AS filing_type,
            f.FILING_DATE AS filing_date
        FROM declarant d
        LEFT JOIN filing_table f ON d.DECLARANT_ID = f.DECLARANT_ID
        LEFT JOIN agency a ON f.DECLARANT_AGENCY_ID = a.AGENCY_ID
        WHERE d.DECLARANT_NAME LIKE %s OR a.AGENCY_NAME LIKE %s OR f.FILING_YEAR LIKE %s
        ORDER BY f.FILING_DATE DESC
    """
    
    search = f"%{keyword}%"
    cursor.execute(query, (search, search, search))
    results = cursor.fetchall()
    cursor.close()
    
    return jsonify(results)

@app.route('/api/admin/record/<int:declarant_id>', methods=['GET'])
def get_saln_record(declarant_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT d.*, f.FILING_YEAR, f.COMPLIANCE_FOR, f.FILING_TYPE, a.AGENCY_NAME
            FROM declarant d
            LEFT JOIN filing_table f ON d.DECLARANT_ID = f.DECLARANT_ID
            LEFT JOIN agency a ON f.DECLARANT_AGENCY_ID = a.AGENCY_ID
            WHERE d.DECLARANT_ID = %s
        """, (declarant_id,))
        declarant = cursor.fetchone()

        if not declarant:
            return jsonify({"error": "Record not found"}), 404

        cursor.execute("SELECT FILING_ID FROM filing_table WHERE DECLARANT_ID = %s LIMIT 1", (declarant_id,))
        filing = cursor.fetchone()
        filing_id = filing['FILING_ID'] if filing else None

        cursor.execute("SELECT * FROM spouses WHERE SPOUSE_ID = %s", (declarant.get('SPOUSE_ID'),))
        spouse = cursor.fetchone()

        cursor.execute("SELECT UNMARRIED_CHILDREN_NAME, CHILD_AGE FROM unmarried_children WHERE DECLARANT_ID = %s", (declarant_id,))
        children = cursor.fetchall()

        real_props, personal_props, liabilities = [], [], []
        if filing_id:
            cursor.execute("SELECT * FROM real_properties WHERE FILING_ID = %s", (filing_id,))
            real_props = cursor.fetchall()
            
            cursor.execute("SELECT * FROM personal_properties WHERE FILING_ID = %s", (filing_id,))
            personal_props = cursor.fetchall()
            
            cursor.execute("SELECT * FROM liabilities WHERE FILING_ID = %s", (filing_id,))
            liabilities = cursor.fetchall()

        return jsonify({
            "declarant": declarant,
            "spouse": spouse,
            "children": children,
            "real_properties": real_props,
            "personal_properties": personal_props,
            "liabilities": liabilities
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()

@app.route('/api/admin/filters/<filter_name>', methods=['GET'])
def get_filter_data(filter_name):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if filter_name == 'declarants':
            query = """
                SELECT DECLARANT_NAME, DECLARANT_GOV_ISSUED_ID, 
                       DECLARANT_GOV_ID_NO, DECLARANT_GOV_ID_ISSUED_DATE
                FROM declarant ORDER BY DECLARANT_NAME;
            """
        elif filter_name == 'missing-real':
            query = """
                SELECT REAL_PROPERTY_DESCRIPTION, REAL_ACQUISITION_MODE, REAL_ACQUISITION_COST 
                FROM real_properties 
                WHERE REAL_ACQUISITION_COST = 0 OR REAL_ACQUISITION_COST IS NULL;
            """
        elif filter_name == 'high-personal':
            query = """
                SELECT PERSONAL_PROPERTY_DESCRIPTION, PERSONAL_ACQUISITION_YEAR, PERSONAL_ACQUISITION_COST 
                FROM personal_properties 
                WHERE PERSONAL_ACQUISITION_COST >= 500000;
            """
        elif filter_name == 'major-creditors':
            # Changed from != '\N' to IS NOT NULL
            query = """
                SELECT NAME_OF_CREDITORS AS Private_Creditors, SUM(OUTSTANDING_BALANCE) AS Total_Private_Debt
                FROM liabilities
                WHERE NAME_OF_CREDITORS NOT LIKE '%GSIS%' 
                  AND NAME_OF_CREDITORS NOT LIKE '%Pag-IBIG%'
                  AND NAME_OF_CREDITORS NOT LIKE '%Landbank%'
                  AND NAME_OF_CREDITORS NOT LIKE '%DBP%'
                  AND NAME_OF_CREDITORS IS NOT NULL
                GROUP BY NAME_OF_CREDITORS
                HAVING SUM(OUTSTANDING_BALANCE) > 1000000
                ORDER BY Total_Private_Debt DESC;
            """
        elif filter_name == 'recent-ids':
            query = """
                SELECT DECLARANT_GOV_ISSUED_ID, COUNT(DECLARANT_ID) AS NO_OF_DECLARANTS,
                       MIN(DECLARANT_GOV_ID_ISSUED_DATE) AS EARLIEST_ISSUANCE,
                       MAX(DECLARANT_GOV_ID_ISSUED_DATE) AS LATEST_ISSUANCE
                FROM declarant
                WHERE YEAR(DECLARANT_GOV_ID_ISSUED_DATE) >= 2021
                GROUP BY DECLARANT_GOV_ISSUED_ID
                HAVING COUNT(DECLARANT_ID) > 1
                ORDER BY DECLARANT_GOV_ISSUED_ID;
            """
        elif filter_name == 'dependents':
            query = """
                SELECT D.DECLARANT_NAME, COUNT(U.UNMARRIED_CHILDREN_ID) AS TOTAL_DECLARED_CHILDREN,
                       MAX(U.CHILD_AGE) AS OLDEST_CHILD_AGE, MIN(U.CHILD_AGE) AS YOUNGEST_CHILD_AGE,
                       AVG(U.CHILD_AGE) AS AVERAGE_CHILD_AGE
                FROM declarant AS D, unmarried_children AS U, filing_table AS F 
                WHERE D.DECLARANT_ID = U.DECLARANT_ID AND D.DECLARANT_ID = F.DECLARANT_ID
                GROUP BY D.DECLARANT_NAME
                HAVING MAX(U.CHILD_AGE) = 17;
            """
        elif filter_name == 'high-real':
            query = """
                SELECT F.COMPLIANCE_FOR, F.FILING_YEAR, F.FILING_DATE, D.DECLARANT_NAME, 
                       R.REAL_PROPERTY_DESCRIPTION, R.REAL_KIND, R.REAL_EXACT_LOCATION, R.REAL_ACQUISITION_COST
                FROM real_properties AS R, filing_table AS F, declarant AS D
                WHERE R.FILING_ID = F.FILING_ID AND F.DECLARANT_ID = D.DECLARANT_ID
                  AND R.REAL_ACQUISITION_COST >= 5000000;
            """
        elif filter_name == 'agency-demographics':
            query = """
                SELECT A.AGENCY_NAME, COUNT(DISTINCT D.DECLARANT_ID) AS ACTIVE_EMPLOYEE_FILERS,
                       COUNT(U.UNMARRIED_CHILDREN_ID) AS TOTAL_DEPENDENTS_TO_COVER,
                       AVG(U.CHILD_AGE) AS AVERAGE_DEPENDENT_AGE
                FROM declarant AS D, filing_table AS F, agency AS A, unmarried_children AS U
                WHERE D.DECLARANT_ID = F.DECLARANT_ID AND F.DECLARANT_AGENCY_ID = A.AGENCY_ID
                  AND D.DECLARANT_ID = U.DECLARANT_ID
                GROUP BY A.AGENCY_NAME
                HAVING COUNT(U.UNMARRIED_CHILDREN_ID) >= 2
                ORDER BY TOTAL_DEPENDENTS_TO_COVER DESC;
            """
        elif filter_name == 'high-spending-years':
            query = """
                SELECT PERSONAL_ACQUISITION_YEAR AS Acquisition_Year,
                       COUNT(PERSONAL_PROPERTIES_ID) AS Total_Items_Bought,
                       SUM(PERSONAL_ACQUISITION_COST) AS Total_Amount_Spent
                FROM personal_properties
                WHERE PERSONAL_ACQUISITION_YEAR IS NOT NULL 
                  AND PERSONAL_ACQUISITION_YEAR != ''
                GROUP BY PERSONAL_ACQUISITION_YEAR
                HAVING SUM(PERSONAL_ACQUISITION_COST) > 1000000
                ORDER BY Total_Amount_Spent DESC;
            """
        elif filter_name == 'appreciating-real-estate':
            query = """
                SELECT REAL_KIND AS Property_Kind,
                       COUNT(REAL_PROPERTIES_ID) AS Total_Properties,
                       SUM(REAL_ACQUISITION_COST) AS Total_Purchase_Price,
                       MAX(REAL_CURRENT_FAIR_MARKET_VALUE) AS Peak_Market_Value
                FROM real_properties
                WHERE REAL_KIND NOT LIKE '%Residential%'
                  AND REAL_ACQUISITION_COST > 0
                GROUP BY REAL_KIND
                HAVING MAX(REAL_CURRENT_FAIR_MARKET_VALUE) >= (3 * SUM(REAL_ACQUISITION_COST))
                ORDER BY Peak_Market_Value DESC;
            """
        else:
            return jsonify({"error": "Invalid filter parameter"}), 400

        cursor.execute(query)
        results = cursor.fetchall()
        return jsonify(results), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)