import mysql.connector
from flask import g

# Database connection details
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',               # Update with your MySQL username
    'password': 'Password',       # Update with your MySQL password
    'database': 'old_saln'
}

def get_db_connection():
    if 'db' not in g:
        g.db = mysql.connector.connect(**DB_CONFIG)
    return g.db

def close_db_connection(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()