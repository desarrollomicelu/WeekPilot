from flask_login import UserMixin
from . import db

class Empleados(db.Model, UserMixin):
    __bind_key__ = "db1"
    __tablename__ = "empleados"
    id = db.Column(db.String(100), primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    sede = db.Column(db.String(100), nullable=False)
    password = db.Column(db.String(60), nullable=False)
    isAdmin = db.Column(db.Boolean, default=False)
    jefeTienda = db.Column(db.Boolean, default=False)
    isSede = db.Column(db.Boolean, default=False)
    isTV = db.Column(db.Boolean, default=False)
    password_secret = db.Column(db.String(60))
    cedula = db.Column(db.String(100))
    estado = db.Column(db.Boolean, default=True)
    cargo = db.Column(
        db.Enum(
            "Admin",
            "jefeTienda",
            "Sede",
            "TV",
            "servicioTecnico",
            "vendedorMedellin",
            "vendedorBogota",
            "encargadoBodega",
            "domiciliario",
            "RH",
            name="cargo",
        )
    )
    pass_encrip = db.Column(db.String(400))
