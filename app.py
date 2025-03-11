# app.py

import os
import pyodbc
from routes import register_blueprints
from flask import Flask
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

# Importa la configuración
#from config import Config


# Importa la base de datos (db) desde models/__init__.py
from models import db

app = Flask(__name__)

# ---------------------------------------------------------
# 1. Funciones de consulta a SQL Server 
# ---------------------------------------------------------
def execute_query(query):
    conn = pyodbc.connect('''DRIVER={ODBC Driver 18 for SQL Server};
                             SERVER=20.109.21.246;
                             DATABASE=MICELU;
                             UID=db_read;
                             PWD=mHRL_<='(],#aZ)T"A3QeD;
                             TrustServerCertificate=yes''')
    cursor = conn.cursor()
    cursor.execute(query)
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results

def get_product_reference():
    query = '''
        SELECT DESCRIPCIO, CODLINEA
        FROM MTMERCIA 
        WHERE CODLINEA = 'CEL' OR CODLINEA = 'CYT'
    '''
    results = execute_query(query)
    reference = []
    for row in results:
        reference.append({
            "description": row[0],
            "CODLINEA": row[1]
        })
    return reference

def get_product_code():
    query = '''
        SELECT CODIGO, CODLINEA
        FROM MTMERCIA
        WHERE CODLINEA = 'CEL' OR CODLINEA = 'CYT'
    '''
    results = execute_query(query)
    product_code = []
    for row in results:
        product_code.append({
            "id": row[0],
            "CODLINEA": row[1]
        })
    return product_code

def get_technicians():
    query = """
        SELECT NOMBRE
        FROM Venden
        WHERE COMENTARIO LIKE '%ASESOR SERVICIO TECNICO%'
           OR COMENTARIO LIKE '%TECNICO MEDELLIN%'
           OR COMENTARIO LIKE '%REPARACIÒN%'
    """
    results = execute_query(query)
    return results

# ---------------------------------------------------------
# 2. Configuración de la aplicación
# ---------------------------------------------------------
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://postgres:vWUiwzFrdvcyroebskuHXMlBoAiTfgzP@junction.proxy.rlwy.net:47834/railway"
app.config["SQLALCHEMY_BINDS"] = {
    "db1": "BASE_EMPLOYEES",
    "db2": "postgresql://postgres:japrWZtfUvaBYEyfGtYKwmleuIYvKWMs@viaduct.proxy.rlwy.net:43934/railway",
    "db3": "BASE_TICKETS",
}
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "clave_secreta_por_defecto")

# (Opcional) Si en config.py tienes más parámetros, podrías hacer:
# app.config.from_object(config) 

# ---------------------------------------------------------
# 3. Inicializar Extensiones
# ---------------------------------------------------------
db.init_app(app)  # db es la instancia de SQLAlchemy importada desde models
bcrypt = Bcrypt(app)
migrate = Migrate(app, db)

# ---------------------------------------------------------
# 4. Registrar los Blueprints
# ---------------------------------------------------------
register_blueprints(app)

# ---------------------------------------------------------
# 5. Ejecutar la aplicación
# ---------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True)
