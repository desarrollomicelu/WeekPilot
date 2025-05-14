from flask_login import UserMixin
from datetime import datetime
from models.problemsTickets import Problems_tickets
from . import db


class Tickets(db.Model, UserMixin):
    __bind_key__ = "db3"
    __tablename__ = "Tickets"
    __table_args__ = {"schema": "plan_beneficios"}
 
    id_ticket = db.Column(db.Integer, primary_key=True, autoincrement=True)
    state = db.Column(db.String(50), nullable=False)
    priority = db.Column(db.String(50), nullable=False)
    technical_name = db.Column(db.String(33), nullable=False)
    technical_document = db.Column(db.String(11), nullable=False)
    product_code = db.Column(db.String(50), nullable=False)
    IMEI = db.Column(db.String(20), nullable=False)
    reference = db.Column(db.String(100), nullable=False)
    type_of_service = db.Column(db.String(100), nullable=False)
    city = db.Column(db.String(15), nullable=False)
    creation_date = db.Column(db.DateTime, nullable=True, default=datetime.utcnow)
    assigned = db.Column(db.DateTime, nullable=True)
    received = db.Column(db.DateTime, nullable=True)
    in_progress = db.Column(db.DateTime, nullable=True)
    finished = db.Column(db.DateTime, nullable=True)
    spare_value = db.Column(db.Numeric(7, 1), nullable=True, default=0.0)
    service_value = db.Column(db.Numeric(7, 1), nullable=True, default=0.0)
    discounted_value = db.Column(db.Numeric(7, 1), nullable=True, default=0.0)
    total = db.Column(db.Numeric(7, 1), nullable=True, default=0.0)
    client = db.Column(db.Integer, db.ForeignKey(
        "plan_beneficios.Clients_tickets.id_client"), nullable=False)
    client_info = db.relationship("Clients_tickets", foreign_keys=[client], backref="tickets")
 
    # Usar la tabla directamente
    problems = db.relationship("Problems",
                               secondary=Problems_tickets.__table__,
                               backref=db.backref("tickets", lazy="dynamic"),
                               lazy="dynamic")
 
    