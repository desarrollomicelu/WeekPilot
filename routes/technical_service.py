# routes/technical_service.py

from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required
from datetime import datetime
# Importa las funciones desde el módulo de servicios para romper el ciclo
from models.problemsTickets import Problems_tickets
from services.queries import get_product_code, get_product_reference, get_sertec, get_technicians
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
    service_value = get_sertec()

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
        technical_document = request.form.get("technical_document")
        state = request.form.get("state")
        priority = request.form.get("priority")
        city  = request.form.get("city")
        type_of_service = request.form.get("type_of_service") or "Servicio Técnico"
        IMEI = request.form.get("IMEI")
        reference = request.form.get("reference")
        product_code = request.form.get("product_code")
        service_value = request.form.get("service_value")
        spare_value = request.form.get("spare_value")
        assigned = request.form.get("assigned")
        creation_date = request.form.get("creation_date")
        if creation_date:
            creation_date = datetime.strptime(creation_date, "%Y-%m-%d %H:%M:%S")
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
            technical_document=technical_document,
            state=state,
            priority=priority,
            IMEI=IMEI,
            city=city,
            type_of_service=type_of_service,
            reference=reference,
            product_code=product_code,
            service_value=service_value,
            spare_value=spare_value,
            total=total,
            client=client.id_client,
            creation_date=creation_date,
            assigned=assigned,
            received=received,
            in_progress=in_progress,
            finished=finished,
            problems=selected_problems,
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
        service_value=service_value
    )

# Listar Tickets
@technical_service_bp.route("/technical_service")
@login_required
def list_tickets():
    clients = Clients_tickets.query.all()
    tickets = Tickets.query.filter_by(type_of_service="Servicio Técnico").all()
    technicians = Empleados.query.filter_by(cargo="servicioTecnico").all()
    return render_template("technical_service.html", tickets=tickets, technicians=technicians, clients=clients)

@technical_service_bp.route("/edit_ticket/<int:ticket_id>", methods=["GET", "POST"])
@login_required
def edit_ticket(ticket_id):
    # Consultamos el ticket a editar o devolvemos 404 si no existe
    ticket = Tickets.query.get_or_404(ticket_id)
    # Obtenemos el cliente relacionado al ticket
    client = Clients_tickets.query.filter_by(id_client=ticket.client).first()

    # Datos auxiliares para el formulario (igual que en create_ticket)
    technicians = get_technicians()
    reference = get_product_reference()
    product_code = get_product_code()
    service_value_default = get_sertec()
    problems_list = Problems.query.order_by(Problems.name).all()

    if request.method == "POST":
        # Actualizamos los datos del cliente
        client.name = request.form.get("client_names")
        client.lastname = request.form.get("client_lastnames")
        client.document = request.form.get("document")
        client.mail = request.form.get("mail")
        client.phone = request.form.get("phone")
        # Es posible hacer un commit parcial, o esperar para actualizar todo junto

        # Actualizamos los datos del ticket
        ticket.technical_name = request.form.get("technical_name")
        ticket.technical_document = request.form.get("technical_document")
        ticket.state = request.form.get("state")
        ticket.priority = request.form.get("priority")
        ticket.city = request.form.get("city")
        ticket.type_of_service = request.form.get("type_of_service") or "Servicio Técnico"
        ticket.IMEI = request.form.get("IMEI")
        ticket.reference = request.form.get("reference")
        ticket.product_code = request.form.get("product_code")
        try:
            ticket.service_value = float(request.form.get("service_value") or 0)
            ticket.spare_value = float(request.form.get("spare_value") or 0)
            ticket.total = ticket.service_value + ticket.spare_value
        except ValueError:
            flash("Error: Los valores del servicio técnico y repuestos deben ser numéricos.", "danger")
            return redirect(url_for("technical_service.edit_ticket", ticket_id=ticket_id))
        
        ticket.assigned = request.form.get("assigned")
        creation_date = request.form.get("creation_date")
        if creation_date:
            ticket.creation_date = datetime.strptime(creation_date, "%Y-%m-%d %H:%M:%S")
        ticket.received = request.form.get("received")
        ticket.in_progress = request.form.get("in_progress")
        ticket.finished = request.form.get("finished")
        
        # Actualizamos los problemas asociados
        selected_problem_ids = request.form.getlist("device_problems[]")
        try:
            selected_problem_ids = [int(pid) for pid in selected_problem_ids]
        except ValueError:
            selected_problem_ids = []
        selected_problems = Problems.query.filter(Problems.id.in_(selected_problem_ids)).all()
        ticket.problems = selected_problems

        db.session.commit()
        flash("Ticket actualizado correctamente", "success")
        return redirect(url_for("technical_service.list_tickets"))

    # GET: pasamos los datos existentes para que se pre-carguen en el formulario.
    # Se debe crear un template (por ejemplo, edit_ticket.html) similar al de creación,
    # pero con los atributos value establecidos según ticket y client.
    return render_template(
        "edit_ticket.html",
        ticket=ticket,
        client=client,
        technicians=technicians,
        reference=reference,
        product_code=product_code,
        service_value=service_value_default,
        problems=problems_list
    )

@technical_service_bp.route("/view_detail_ticket/<int:ticket_id>", methods=["GET"])
@login_required
def view_detail_ticket(ticket_id):
    # Obtenemos el ticket o devolvemos 404 si no existe
    ticket = Tickets.query.get_or_404(ticket_id)
    
    # Obtenemos el cliente asociado al ticket (suponiendo que 'ticket.client' guarda el id del cliente)
    client = Clients_tickets.query.filter_by(id_client=ticket.client).first()
    
    # Datos auxiliares para mostrar información adicional (si los necesitas en el template)
    technicians = get_technicians()
    reference = get_product_reference()
    product_code = get_product_code()
    service_value = get_sertec()
    problems_list = Problems.query.order_by(Problems.name).all()
    
    # Renderizamos el template de detalle, pasándole toda la información necesaria
    return render_template(
        "view_detail_ticket.html",
        ticket=ticket,
        client=client,
        technicians=technicians,
        reference=reference,
        product_code=product_code,
        service_value=service_value,
        problems=problems_list
    )


@technical_service_bp.route('/update_ticket_status', methods=['POST'])
@login_required
def update_ticket_status():
    ticket_id = request.form.get('ticket_id')
    new_status = request.form.get('status')
    
    if not ticket_id or not new_status:
        flash('No se pudo actualizar el estado: datos incompletos', 'danger')
        return redirect(url_for('technical_service.list_tickets'))
    
    try:
        # Buscar el ticket
        ticket = Tickets.query.get(ticket_id)
        if not ticket:
            flash('No se encontró el ticket', 'danger')
            return redirect(url_for('technical_service.list_tickets'))
        
        # Actualizar el estado
        ticket.status = new_status
        db.session.commit()
        
        flash('Estado actualizado correctamente', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error al actualizar el estado: {str(e)}', 'danger')
    
    return redirect(url_for('technical_service.list_tickets'))