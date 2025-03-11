import datetime
from flask_login import UserMixin
from . import db

class Tickets(db.Model, UserMixin):
    __bind_key__ = "db3"
    __tablename__ = "Tickets"
    __table_args__ = {"schema": "plan_beneficios"}

    id_ticket = db.Column(db.Integer, primary_key=True, autoincrement=True)
    state = db.Column(db.String(50), nullable=False, default="received")
    priority = db.Column(db.String(50), nullable=False)
    technical_name = db.Column(db.String(33), nullable=False)
    product_code = db.Column(db.String(50), nullable=False)
    spare_parts = db.Column(db.String(50), nullable=False)
    IMEI = db.Column(db.String(20), nullable=False)
    reference = db.Column(db.String(100), nullable=False)
    assigned = db.Column(db.DateTime, nullable=True, default=datetime.utcnow)
    received = db.Column(db.DateTime, nullable=True)
    in_progress = db.Column(db.DateTime, nullable=True)
    finished = db.Column(db.DateTime, nullable=True)
    spare_value = db.Column(db.Numeric(7, 1), nullable=True, default=0.0)
    product_value = db.Column(db.Numeric(7, 1), nullable=True, default=0.0)
    service_value = db.Column(db.Numeric(7, 1), nullable=True, default=0.0)
    total = db.Column(db.Numeric(7, 1), nullable=True, default=0.0)
    client = db.Column(db.Integer, db.ForeignKey(
        "plan_beneficios.Clients_tickets.id_client"), nullable=False)
