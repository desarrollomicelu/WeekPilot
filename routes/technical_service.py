# routes/technical_service.py

from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required
from datetime import datetime
# Importa las funciones desde el módulo de servicios para romper el ciclo
from services.queries import get_product_code, get_product_reference, get_technicians
# Importa los modelos
from models.employees import Empleados
from models.clients import Clients_tickets
from models.tickets import Tickets
from extensions import  db 

technical_service_bp = Blueprint("technical_service", __name__, template_folder="templates")

# Crear Ticket
@technical_service_bp.route("/create_ticket", methods=["GET", "POST"])
@login_required
def create_ticket():
    technicians = get_technicians()
    current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if not technicians:
        flash("No hay técnicos disponibles en este momento.", "warning")
        
    reference = get_product_reference()
    product_code = get_product_code()

    if request.method == "POST":
        # Datos del cliente
        client_names = request.form.get("client_names")
        client_lastnames = request.form.get("client_lastnames")
        document = request.form.get("document")
        mail = request.form.get("mail")
        phone = request.form.get("phone")

        # Datos del ticket
        technical_name = request.form.get("technical_name")
        state = request.form.get("state", "received")
        priority = request.form.get("priority")
        spare_parts = request.form.get("spare_parts")
        IMEI = request.form.get("IMEI")
        reference_selected = request.form.get("reference")
        product_code_selected = request.form.get("product_code")
        service_value = request.form.get("service_value")
        spare_value = request.form.get("spare_value")
        assigned = request.form.get("assigned")
        if assigned:
            assigned = datetime.strptime(assigned, "%Y-%m-%d %H:%M:%S")
        received = request.form.get("received")
        in_progress = request.form.get("in_progress")
        finished = request.form.get("finished")
        total = request.form.get("total")

        try:
            service_value = float(service_value or 0)
            spare_value = float(spare_value or 0)
            total = service_value + spare_value
        except ValueError:
            flash("Error: Los valores del servicio técnico y repuestos deben ser numéricos.", "danger")
            return redirect(url_for("technical_service.create_ticket"))

        client = Clients_tickets.query.filter_by(document=document).first()
        if not client:
            client = Clients_tickets(
                document=document,
                name=client_names,
                lastname=client_lastnames,
                mail=mail,
                phone=phone,
            )
            db.session.add(client)
            db.session.commit()  

        new_ticket = Tickets(
            technical_name=technical_name,
            state=state,
            priority=priority,
            spare_parts=spare_parts,
            IMEI=IMEI,
            reference=reference_selected,
            product_code=product_code_selected,
            service_value=service_value,
            spare_value=spare_value,
            total=total,
            client=client.id_client,
            assigned=assigned,
            received=received,
            in_progress=in_progress,
            finished=finished
        )
        db.session.add(new_ticket)
        db.session.commit()
        flash("Ticket creado correctamente", "success")
        return redirect(url_for("technical_service.list_tickets"))

    return render_template("create_ticket.html", technicians=technicians, current_date=current_date, reference=reference, product_code=product_code)

# Listar Tickets
@technical_service_bp.route("/technical_service")
@login_required
def list_tickets():
    clients = Clients_tickets.query.all()
    tickets = Tickets.query.all()
    technicians = Empleados.query.filter_by(cargo="servicioTecnico").all()
    return render_template("technical_service.html", tickets=tickets, technicians=technicians, clients=clients)

# Editar Ticket
@technical_service_bp.route("/edit_ticket/<int:ticket_id>", methods=["GET", "POST"])
@login_required
def edit_ticket(ticket_id):
    ticket = Tickets.query.get(ticket_id)
    technicians = Empleados.query.filter_by(cargo="servicioTecnico").all()
    if request.method == "POST":
        ticket.technical_name = request.form.get("technical_name")
        ticket.state = request.form.get("state")
        ticket.priority = request.form.get("priority")
        ticket.spare_parts = request.form.get("spare_parts")
        ticket.IMEI = request.form.get("IMEI")
        ticket.reference = request.form.get("reference")
        try:
            ticket.service_value = float(request.form.get("service_value", 0))
            ticket.spare_value = float(request.form.get("spare_value", 0))
            ticket.total = ticket.service_value + ticket.spare_value
        except ValueError:
            flash("Error: Los valores deben ser numéricos.", "danger")
            return redirect(url_for("technical_service.edit_ticket", ticket_id=ticket_id))
        db.session.commit()
        flash("Ticket actualizado correctamente", "success")
        return redirect(url_for("technical_service.list_tickets"))

    return render_template("edit_ticket.html", ticket=ticket, technicians=technicians)

# Ver detalle del Ticket
@technical_service_bp.route("/view_detail_ticket/<int:ticket_id>", methods=["GET", "POST"])
@login_required
def view_detail_ticket(ticket_id):
    ticket = Tickets.query.filter_by(id_ticket=ticket_id).first()
    if not ticket:
        flash("Ticket no encontrado", "danger")
        return redirect(url_for("technical_service.list_tickets"))
    return render_template("view_detail_ticket.html", ticket=ticket, now=datetime.utcnow())
    
@technical_service_bp.route("/view_technical.html")
@login_required
def view_technical():
    return render_template("view_technical.html")
