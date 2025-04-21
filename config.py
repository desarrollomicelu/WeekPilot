# config.py

import os
from dotenv import load_dotenv

load_dotenv()

BASE_EMPLOYEES = os.getenv("POSTGRES_CONST_BASE_EMPLOYEES")
BASE_TICKETS = os.getenv("POSTGRES_CONST_BASE_TICKETS")

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "clave_secreta_por_defecto")

    # Base principal PostgreSQL
    SQLALCHEMY_DATABASE_URI = BASE_TICKETS

    SQLALCHEMY_BINDS = {
        "db1": BASE_EMPLOYEES,
        "sqlserver": (
            f"mssql+pymssql://{os.getenv('DB_UID')}:{os.getenv('DB_PWD')}"
            f"@{os.getenv('DB_SERVER')}:1433/{os.getenv('DB_NAME')}"
        ),
    }

    SQLALCHEMY_TRACK_MODIFICATIONS = False
