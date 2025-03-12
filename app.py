from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, login_required, logout_user, UserMixin
from flask_bcrypt import Bcrypt

app = Flask(__name__)

app.config['SQLALCHEMY_BINDS'] = {
    'db1': 'postgresql://postgres:japrWZtfUvaBYEyfGtYKwmleuIYvKWMs@viaduct.proxy.rlwy.net:43934/railway',
    'db2': 'postgresql://postgres:aAB2Be35CBAd2GgA5*DdC45FaCf26G44@viaduct.proxy.rlwy.net:58920/railway'
}

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['SECRET_KEY'] = 'aAB2Be35CBAd2GgA5*DdC45FaCf26G44'

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.needs_login_message = ("Acceso denegado. Por favor, inicie sesión para acceder a esta página.")
login_manager.login_view = 'login'

# Creación de la clase Empleados
class Empleados(db.Model, UserMixin):
    __bind_key__ = 'db2'
    __tablename__ = 'empleados'
    id = db.Column(db.String(200), primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    sede = db.Column(db.String(100), nullable=False)
    password = db.Column(db.String(100), nullable=False)
    isAdmin = db.Column(db.Boolean, default=False)
    jefeTienda = db.Column(db.String(100), nullable=False)
    isSede = db.Column(db.Boolean, default=False)
    isTV = db.Column(db.Boolean, default=False)



#------------------Rutas------------------#
@login_manager.user_loader
def load_user(user_id):
    return Empleados.query.filter_by(id=user_id).first()

@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        nombre = request.form.get('nombre') 
        password = request.form.get('password')

        if not nombre or not password:
            flash('Debe ingresar un nombre y una contraseña', 'error')
            return redirect(url_for('login'))

        try:
            empleado = Empleados.query.filter_by(nombre=nombre).first()
            if empleado and bcrypt.check_password_hash(empleado.password, password):
                login_user(empleado)
                return redirect(url_for('dashboard'))
            else:
                flash('Nombre o contraseña incorrectos', 'error')
        except Exception as e:
            flash(f'Error al intentar iniciar sesión: {str(e)}', 'error')

    return render_template("login.html")

# Ruta de perfil
@app.route('/profile')
@login_required
def profile():
    return render_template('profile.html')

# Ruta de logout
@app.route('/logout')

def logout():
    logout_user()
    return redirect(url_for('login'))

#ruta index
@app.route('/index')
@login_required
def index():
    return render_template("index.html")

#ruta dashboard
@app.route('/dashboard')
@login_required
def dashboard():
    return render_template("dashboard.html")

#ruta servicio tecnico
@app.route('/technical_service')
@login_required
def technical_service():
    return render_template("technical_service.html")

#ruta garantia
@app.route('/warranty')
@login_required
def warranty():
    return render_template("warranty.html")

#ruta reparacion interna
@app.route('/internal_repair')
@login_required
def internal_repair():
    return render_template("internal_repair.html")


if __name__ == '__main__':
    app.run(debug=True)
