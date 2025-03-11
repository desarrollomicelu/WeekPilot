# models/__init__.py
from flask_sqlalchemy import SQLAlchemy

# 1. Crear la instancia de SQLAlchemy (sin pasar "app" aquí)
db = SQLAlchemy()

# 2. Importar los modelos para que Flask-Migrate los reconozca
from .employees import Empleados
from .clients import Clients_tickets
from .tickets import Tickets
# ... (otros archivos de modelos)
