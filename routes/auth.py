
from flask import request, Blueprint, render_template, redirect, url_for, flash
from flask_login import login_user, logout_user
import bcrypt
from models.employees import Empleados

auth = Blueprint("auth", __name__)
@auth.route("/", methods=["GET", "POST"])
@auth.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        nombre = request.form.get("nombre")
        password = request.form.get("password")
        try:
            empleado = Empleados.query.filter_by(nombre=nombre).first()
            if empleado and bcrypt.check_password_hash(empleado.password, password):
                login_user(empleado)
                if empleado.cargo == "Admin":
                    return redirect(url_for("dashboard"))
                elif empleado.cargo == "servicioTecnico":
                    return redirect(url_for("view_technical"))
                else:
                    flash("Acceso denegado. No tienes permisos para acceder a esta página.", "error")
                    return redirect(url_for("auth.login"))
            else:
                flash("Nombre o contraseña incorrectos", "error")
        except Exception as e:
            flash(f"Error al intentar iniciar sesión: {str(e)}", "error")
    return render_template("login.html")

@auth.route("/logout")
def logout():
    logout_user()
    return redirect(url_for("auth.login"))
