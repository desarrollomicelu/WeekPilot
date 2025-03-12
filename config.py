# config.py
import os
import pyodbc
from dotenv import load_dotenv

load_dotenv()  # Carga las variables de .env

# Variables de conexión a PostgreSQL
BASE_TICKETS = os.getenv("POSTGRES_CONST_BASE_TICKETS")
BASE_EMPLOYEES = os.getenv("POSTGRES_CONST_BASE_EMPLOYEES")

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "clave_secreta_por_defecto")
    # Base de datos principal (para SQLAlchemy)
    SQLALCHEMY_DATABASE_URI = BASE_TICKETS
    # Múltiples binds: "db1" para empleados, "db3" para tickets (ajusta según lo necesites)
    SQLALCHEMY_BINDS = {
        "db1": BASE_EMPLOYEES,
        "db3": BASE_TICKETS,
    }
    SQLALCHEMY_TRACK_MODIFICATIONS = False

def execute_query(query):
    """
    Ejecuta una consulta en SQL Server utilizando pyodbc.
    Lee los datos de conexión desde las variables de entorno.
    """
    driver = os.environ.get('DB_DRIVER')
    server = os.environ.get('DB_SERVER')
    database = os.environ.get('DB_NAME')
    uid = os.environ.get('DB_UID')
    pwd = os.environ.get('DB_PWD')
    trust_cert = os.environ.get('DB_TRUST_CERT', 'yes')
    
    connection_string = (
        f"DRIVER={{{driver}}};"
        f"SERVER={server};"
        f"DATABASE={database};"
        f"UID={uid};"
        f"PWD={pwd};"
        f"TrustServerCertificate={trust_cert}"
    )
    
    conn = pyodbc.connect(connection_string)
    cursor = conn.cursor()
    cursor.execute(query)
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results
