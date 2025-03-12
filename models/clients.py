from flask_login import UserMixin
from models.tickets import Tickets
from . import db
# Modelo para clientes 

class Clients_tickets(db.Model, UserMixin):
    __bind_key__ = "db3"
    __tablename__ = "Clients_tickets"
    __table_args__ = {"schema": "plan_beneficios"}
    id_client = db.Column(db.Integer, primary_key=True, autoincrement=True)
    document = db.Column(db.String(11), nullable=False)
    name = db.Column(db.String(33), nullable=False)
    lastname = db.Column(db.String(33), nullable=False)
    mail = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(11), nullable=False)

    # Usamos lambda para diferir la evaluación hasta que la clase Tickets esté definida
    tickets = db.relationship(
        "Tickets",
        backref="client_info",
        lazy=True,
        primaryjoin=lambda: Clients_tickets.id_client == Tickets.client,
        foreign_keys=lambda: [Tickets.client]
    )