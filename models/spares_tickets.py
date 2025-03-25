from flask_login import UserMixin
from . import db
 
class Spares_tickets(db.Model, UserMixin):
    __bind_key__ = "db3"
    __tablename__ = "Spares_tickets"
    __table_args__ = {"schema": "plan_beneficios"}
 
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_ticket = db.Column(db.Integer, db.ForeignKey('plan_beneficios.Tickets.id_ticket'), nullable=False)
    id_spares = db.Column(db.Integer, db.ForeignKey('plan_beneficios.Spares.id'), nullable=False)
 