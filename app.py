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
from services.ticket_email_service import TicketEmailService 
from datetime import timedelta

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)
app.config.from_object(Config)

# Añadir la configuración de Azure a app.config
app.config['AZURE_CONNECTION_STRING'] = os.environ.get('AZURE_CONNECTION_STRING', '')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@micelu.com')

client_id = os.environ.get("CLIENT_ID")
client_secret = os.environ.get("CLIENT_SECRET")
redirect_uri = os.environ.get("REDIRECT_URI")

db.init_app(app)

# Update these settings to ensure session persistence
app.config['SESSION_TYPE'] = 'filesystem'  # Use filesystem sessions
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=1)  # Session lasts 1 hour
app.config['SESSION_COOKIE_SECURE'] = False  # Change to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Inicializa extensiones
bcrypt.init_app(app)
migrate = Migrate(app, db)

# Inicializa LoginManager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "auth.login"

@login_manager.user_loader
def load_user(user_id):
    return Empleados.query.get(user_id)

# Configuración del servicio de correo
azure_connection_string = app.config['AZURE_CONNECTION_STRING']
sender_address = app.config['MAIL_DEFAULT_SENDER']

# Verificar si tenemos la configuración necesaria
if not azure_connection_string:
    app.logger.warning("AZURE_CONNECTION_STRING no está configurado. El servicio de correo no funcionará correctamente.")

# Inicializar el servicio de correo
app.ticket_email_service = TicketEmailService(azure_connection_string, sender_address)

# Registra los blueprints
register_blueprints(app)

if __name__ == "__main__":
    app.run(debug=True)
