from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from flask_bcrypt import Bcrypt
from sqlalchemy import text  # Importa 'text' de SQLAlchemy
import os

app = Flask(__name__)

#Configurar la base de datos y la clave secreta
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:vWUiwzFrdvcyroebskuHXMlBoAiTfgzP@junction.proxy.rlwy.net:47834/railway'
app.config['SECRET_KEY'] = 'clave_secreta'

# Inicialización de las extensiones
db=SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Definición del modelo de Empleados con SQLAlchemy
class Empleados(db.Model):
    __bind_key__ = 'db3'

    # Campos de la tabla Empleados
    id = db.Column(db.String(100), primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    sede = db.Column(db.String(100), nullable=False)
    password = db.Column(db.String(60), nullable=False)
    isAdmin = db.Column(db.Boolean, default=False)
    jefeTienda = db.Column(db.Boolean, default=False)
    isSede = db.Column(db.Boolean, default=False)
    isTV = db.Column(db.Boolean, default=False)
    password_secret=db.Column(db.String(60))
    cargo=db.Column(db.Enum('Admin', 'jefeTienda', 'Sede','TV','servicioTecnico','vendedorMedellin','vendedorBogota','encargadoBodega','domiciliario',name='cargo'))



@login_manager.user_loader
def load_user(user_id):
    return Empleados.query.get(int(user_id))

@app.route('/home')
def home ():
     return render_template("login.html")
 
@app.route('/' , methods=['GET', 'POST'])
def login ():
    if request.method == 'POST':
        id_empleado = request.form['id_empleado']
        password = request.form['password']
        
        empleado = Empleados.query.filter_by(id=id_empleado).first()
        
        if empleado and bcrypt.check_password_hash(empleado.password, password):
            login_user(empleado)
            return redirect(url_for('index'))
        else:
            flash('Usuario o contraseña incorrectos', 'error')
    return render_template("login.html")

@app.route('/index')
def index ():
     return render_template("index.html")
 
@app.route('/dashboard')
def dashboard ():
     return render_template("dashboard.html")

@app.route('/technical_service')
def technical_service():
    return render_template('technical_service.html')

@app.route('/warranty')
def warranty():
    return render_template('warranty.html')

@app.route('/internal_repair')
def internal_repair():
    return render_template('internal_repair.html')

@app.route('/sidebar')
def sidebar():
    return render_template('sidebar.html')

@app.route('/detail')
def detail():
    datos_detail = {
        "fecha_ingreso": "2023-10-01",
        "fecha_salida": "2023-10-05",
        "valor_servicio": "150,000 COP",
        "valor_repuesto": "200,000 COP"
    }
    return render_template('detail_modal.html', detail=datos_detail)





if __name__ == '__main__':
    app.run(debug=True)

