# app.py
import os
from dotenv import load_dotenv
from flask import Flask
from flask_migrate import Migrate
from flask_login import LoginManager

load_dotenv()

# Importa la configuración centralizada
from config import Config

# Importa las extensiones (única instancia)
from extensions import db, bcrypt

# Importa el modelo de usuario (asegúrate de que implemente UserMixin)
from models.employees import Empleados

# Importa la función para registrar blueprints
from routes import register_blueprints

app = Flask(__name__)
app.config.from_object(Config)

# Inicializa extensiones
db.init_app(app)
bcrypt.init_app(app)
migrate = Migrate(app, db)

# Inicializa LoginManager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "auth.login"  # Asegúrate de que el endpoint de login esté definido

@login_manager.user_loader
def load_user(user_id):
    # Si el ID es una cadena (UUID), no lo conviertas a entero
    return Empleados.query.get(user_id)

# Registra los blueprints
register_blueprints(app)

if __name__ == "__main__":
    app.run(debug=True)
