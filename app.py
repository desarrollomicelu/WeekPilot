# app.py
from routes import register_blueprints
from models.tickets import Tickets
from models.problemsTickets import Problems_tickets
from models.problems import Problems
from models.clients import Clients_tickets
from models.sparesTickets import Spares_tickets
from models.employees import Empleados
from extensions import db, bcrypt
from config import Config
import os
from dotenv import load_dotenv
from flask import Flask, request, redirect, url_for, flash
from flask_migrate import Migrate
from flask_login import LoginManager, current_user



"""
flask_env = os.getenv('FLASK_ENV', 'production')
if flask_env == 'development':
    load_dotenv('.env.development')
    print("Cargando configuración de desarrollo...")
else:
    load_dotenv('.env')
    print("Cargando configuración de producción...")
    
"""

load_dotenv()
    
app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)


# Inicializa extensiones
bcrypt.init_app(app)
migrate = Migrate(app, db)

# Inicializa LoginManager
login_manager = LoginManager()
login_manager.init_app(app)
# Asegúrate de que el endpoint de login esté definido
login_manager.login_view = "auth.login"


@login_manager.user_loader
def load_user(user_id):
    # Si el ID es una cadena (UUID), no lo conviertas a entero
    return Empleados.query.get(user_id)
'''
@app.before_request
def restrict_routes():
    # Si el usuario es un técnico, restringir a rutas específicas
    if current_user.is_authenticated and current_user.cargo == "servicioTecnico":
        allowed_routes = [
            'auth.logout', 
            'view_technical.view_technical',
            'view_technical.view_detail_ticket',
            'view_technical.update_ticket_status_ajax',
            # Agrega aquí más rutas permitidas para técnicos
            'static'
        ]
        if request.endpoint and request.endpoint not in allowed_routes and not request.endpoint.startswith('static'):
            flash("No tienes permiso para acceder a esta página", "warning")
            return redirect(url_for('view_technical.view_technical'))
    # Si el usuario no está autenticado, permitir solo rutas públicas
    if not current_user.is_authenticated:
        allowed_routes = ['auth.login', 'auth.logout', 'static']
        if request.endpoint and request.endpoint not in allowed_routes and not request.endpoint.startswith('static'):
            flash("Debes iniciar sesión para acceder a esta página", "warning")
            return redirect(url_for('auth.login'))'''


# Registra los blueprints
register_blueprints(app)

"""with app.app_context():
    db.create_all()"""

if __name__ == "__main__":
    app.run(debug=True)
