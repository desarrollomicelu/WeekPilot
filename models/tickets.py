from datetime import datetime
from flask_login import UserMixin
from . import db
from models.problemsTickets import Problems_tickets
from models.sparesTickets import Spares_tickets


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
    comment = db.Column(db.String(250), nullable=True)
    reference = db.Column(db.String(100), nullable=False)
    type_of_service = db.Column(db.String(100), nullable=False)
    city = db.Column(db.String(15), nullable=False)
    creation_date = db.Column(
        db.DateTime, nullable=True, default=datetime.utcnow)
    assigned = db.Column(db.DateTime, nullable=True)
    received = db.Column(db.DateTime, nullable=True)
    in_progress = db.Column(db.DateTime, nullable=True)
    under_review = db.Column(db.DateTime, nullable=True)
    finished = db.Column(db.DateTime, nullable=True)
    spare_value = db.Column(db.Numeric(7, 1), nullable=True, default=0.0)
    service_value = db.Column(db.Numeric(7, 1), nullable=True, default=0.0)
    total = db.Column(db.Numeric(7, 1), nullable=True, default=0.0)
    client = db.Column(db.Integer, db.ForeignKey(
        "plan_beneficios.Clients_tickets.id_client"), nullable=False)

    # Usar la tabla directamente
    problems = db.relationship("Problems",
                               secondary=Problems_tickets.__table__,
                               backref=db.backref("tickets", lazy="dynamic"),
                               lazy="dynamic")

    def get_spare_parts(self):
        spare_tickets = Spares_tickets.query.filter_by(
            id_ticket=self.id_ticket).all()
        return spare_tickets

    def update_state(self, new_state):
        """Actualiza el estado del ticket y registra la hora del cambio"""
        # Normalización del estado para evitar problemas con mayúsculas/minúsculas
        self.state = new_state

        # Registrar la hora según el estado
        now = datetime.utcnow()
        if new_state == "Asignado":
            self.assigned = now
        elif new_state == "En proceso":
            self.in_progress = now
        elif new_state == "Terminado":
            self.finished = now
        elif new_state == "Recibido":
            self.received = now
        elif new_state == "En Revision":
            print(f"Actualizando under_review con timestamp: {now}")
            self.under_review = now
            # Para debugging
            from sqlalchemy import inspect
            state = inspect(self)
            print(f"Estado de la instancia: {'transient' if state.transient else 'persistent' if state.persistent else 'detached'}")
            print(f"Under_review después de asignar: {self.under_review}")

        return now  # Devolver la hora para usarla en la respuesta
