import os
import pyodbc
from dotenv import load_dotenv
load_dotenv()


BASE_TICKETS = os.getenv("POSTGRES_CONST_BASE_TICKETS")
BASE_EMPLOYEES = os.getenv("POSTGRES_CONST_BASE_EMPLOYEES")
SQLALCHEMY_BINDS = {
    "db1": BASE_EMPLOYEES,
    "db3": BASE_TICKETS}


def execute_query(query):
    # Leer los valores sensibles desde las variables de entorno
    driver = os.environ.get('DB_DRIVER')
    server = os.environ.get('DB_SERVER')
    database = os.environ.get('DB_NAME')
    uid = os.environ.get('DB_UID')
    pwd = os.environ.get('DB_PWD')
    trust_cert = os.environ.get('DB_TRUST_CERT', 'yes')  # Valor por defecto si no se encuentra la variable

    # Construir la cadena de conexión dinámicamente
    connection_string = (
        f"DRIVER={{{driver}}};"
        f"SERVER={server};"
        f"DATABASE={database};"
        f"UID={uid};"
        f"PWD={pwd};"
        f"TrustServerCertificate={trust_cert}"
    )
    
    # Conectar a la base de datos
    conn = pyodbc.connect(connection_string)
    cursor = conn.cursor()

    # Ejecutar la consulta
    cursor.execute(query)
    
    # Traer todos los resultados
    results = cursor.fetchall()

    # Cerrar la conexión
    cursor.close()
    conn.close()

    return results
