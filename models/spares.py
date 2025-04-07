from flask_login import UserMixin
from . import db


class Spares(db.Model, UserMixin):
    __bind_key__ = "db3"
    __tablename__ = "Spares"
    __table_args__ = {"schema": "plan_beneficios"}

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(50), nullable=False)
