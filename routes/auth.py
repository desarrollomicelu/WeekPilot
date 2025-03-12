# routes/auth.py

from flask import request, Blueprint, render_template, redirect, url_for, flash
from flask_login import login_user, logout_user
from extensions import bcrypt
from models.employees import Empleados

auth_bp = Blueprint("auth", __name__, template_folder="templates")

@auth_bp.route("/", methods=["GET", "POST"])
@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        nombre = request.form.get("nombre")
        password = request.form.get("password")
        try:
            empleado = Empleados.query.filter_by(nombre=nombre).first()
            # Usa la instancia 'bcrypt' para verificar la contraseña
            if empleado and bcrypt.check_password_hash(empleado.password, password):
                login_user(empleado)
                if empleado.cargo == "Admin":
                    # Suponiendo que en routes/dashboard.py el endpoint se define como "dashboard"
                    return redirect(url_for("dashboard.dashboard"))
                elif empleado.cargo == "servicioTecnico":
                    # Suponiendo que en routes/technical_service.py el endpoint de la vista técnica se define como "view_technical"
                    return redirect(url_for("technical_service.view_technical"))
                else:
                    flash("Acceso denegado. No tienes permisos para acceder a esta página.", "error")
                    return redirect(url_for("auth.login"))
            else:
                flash("Nombre o contraseña incorrectos", "error")
        except Exception as e:
            flash(f"Error al intentar iniciar sesión: {str(e)}", "error")
    return render_template("login.html")

@auth_bp.route("/logout")
def logout():
    logout_user()
    return redirect(url_for("auth.login"))
