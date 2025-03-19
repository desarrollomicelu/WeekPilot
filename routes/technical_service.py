# routes/technical_service.py

from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required
from datetime import datetime
# Importa las funciones desde el módulo de servicios para romper el ciclo
from models.problemsTickets import Problems_tickets
from services.queries import get_product_code, get_product_reference, get_sertec, get_spare_value, get_technicians
# Importa los modelos
from models.employees import Empleados
from models.clients import Clients_tickets
from models.tickets import Tickets
from extensions import  db 
from models.problems import Problems 



technical_service_bp = Blueprint("technical_service", __name__, template_folder="templates")

# Crear Ticket
@technical_service_bp.route("/create_ticket", methods=["GET", "POST"])
@login_required
def create_ticket():
    # Datos auxiliares para el formulario
    technicians = get_technicians()
    current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    reference = get_product_reference()
    product_code = get_product_code()
    spare_value = get_spare_value()
    sertec = get_sertec()

    problems_list = Problems.query.order_by(Problems.name).all()

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
        spare_value = request.form.get("spare_parts")
        sertec = request.form.get("sertec")
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

        # Buscar o crear el cliente
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

        # Aquí obtenemos los problemas seleccionados en el formulario.
        # Se usa el campo "device_problems[]" que ahora debe contener los IDs de los problemas.
        selected_problem_ids = request.form.getlist("device_problems[]")
        try:
            selected_problem_ids = [int(pid) for pid in selected_problem_ids]
        except ValueError:
            selected_problem_ids = []

        # Consultar los objetos Problems que correspondan a los IDs seleccionados
        selected_problems = Problems.query.filter(Problems.id.in_(selected_problem_ids)).all()

        # Crear el nuevo ticket, asignando la lista de problemas seleccionados
        new_ticket = Tickets(
            technical_name=technical_name,
            state=state,
            priority=priority,
            sertec=sertec,
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
            finished=finished,
            problems=selected_problems  
        )
        db.session.add(new_ticket)
        db.session.commit()
        flash("Ticket creado correctamente", "success")
        return redirect(url_for("technical_service.list_tickets"))

    # Método GET: se pasan los datos auxiliares y la lista de problemas reales al template
    return render_template(
        "create_ticket.html",
        technicians=technicians,
        current_date=current_date,
        reference=reference,
        product_code=product_code,
        problems=problems_list,
        sertec=sertec,
        spare_value  = spare_value
    )


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
    problems = Problems.query.join(Problems_tickets).filter(
        Problems_tickets.id_ticket == ticket_id
    ).all()
    if not ticket:
        flash("Ticket no encontrado", "danger")
        return redirect(url_for("technical_service.list_tickets"))
    return render_template("view_detail_ticket.html", ticket=ticket, problems=problems, now=datetime.utcnow())
    
@technical_service_bp.route("/view_technical.html")
@login_required
def view_technical():
    return render_template("view_technical.html")

