# routes/technical_service.py

from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required
from decimal import Decimal
from datetime import datetime
# Importa las funciones desde el módulo de servicios para romper el ciclo
from models.problemsTickets import Problems_tickets
from services.queries import get_product_code, get_product_reference, get_sertec, get_spare_name, get_technicians
# Importa los modelos
from models.employees import Empleados
from models.clients import Clients_tickets
from models.tickets import Tickets
from extensions import  db 
from models.problems import Problems 
from models.sparesTickets import Spares_tickets
from services.queries import get_spare_parts


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
    spare_name = get_spare_name()
    service_value = get_sertec()

    problems_list = Problems.query.order_by(Problems.name).all()
    spare_parts = get_spare_parts()

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
        spare_name = request.form.get("spare_name")
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
            spare_name=spare_name,
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

        spare_codes = request.form.getlist("spare_part_code[]")
        print("DEBUG - SPARE CODES RECIBIDOS:", spare_codes)
        quantities = request.form.getlist("part_quantity[]")
        unit_prices = request.form.getlist("part_unit_value[]")
        total_prices = request.form.getlist("part_total_value[]")

        for i in range(len(spare_codes)):
            if i < len(quantities) and i < len(unit_prices) and i < len(total_prices):
                spare_code = spare_codes[i]
                quantity = int(quantities[i])
                unit_price = float(unit_prices[i])
                total_price = float(total_prices[i])
                
                spare_ticket = Spares_tickets(
                    id_ticket=new_ticket.id_ticket,
                    spare_code=spare_code,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=total_price
                )
                db.session.add(spare_ticket)

        new_ticket.spare_value = sum(float(price) for price in total_prices) if total_prices else 0
        new_ticket.total = new_ticket.service_value + Decimal(str(new_ticket.spare_value))

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
        service_value=service_value,
        spare_parts=spare_parts
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
    spare_name = get_spare_name()
    service_value_default = get_sertec()
    problems_list = Problems.query.order_by(Problems.name).all()

    spare_parts = get_spare_parts()
    
    current_spare_tickets = Spares_tickets.query.filter_by(id_ticket=ticket_id).all()
    
    for spare_ticket in current_spare_tickets:
        for spare_part in spare_parts:
            if spare_part['code'] == spare_ticket.spare_code:
                spare_ticket.spare_description = spare_part['description']
                break
        else:
            spare_ticket.spare_description = spare_ticket.spare_code

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
        ticket.spare_name = request.form.get("spare_name")
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

        # Get all spare part data from the form
        spare_codes = request.form.getlist("spare_part_code[]")
        quantities = request.form.getlist("part_quantity[]")
        unit_prices = request.form.getlist("part_unit_value[]")
        total_prices = request.form.getlist("part_total_value[]")
        
        # First, delete all existing spare tickets for this ticket
        Spares_tickets.query.filter_by(id_ticket=ticket_id).delete()
        
        # Then add the new spare parts configuration
        total_spare_value = 0
        for i in range(len(spare_codes)):
            if i < len(quantities) and i < len(unit_prices) and i < len(total_prices):
                spare_code = spare_codes[i]
                quantity = int(quantities[i])
                unit_price = float(unit_prices[i])
                total_price = float(total_prices[i])
                
                spare_ticket = Spares_tickets(
                    id_ticket=ticket_id,
                    spare_code=spare_code,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=total_price
                )
                db.session.add(spare_ticket)
                total_spare_value += total_price
        
        # Update the spare value and total on the ticket
        ticket.spare_value = total_spare_value
        ticket.total = ticket.service_value + ticket.spare_value
        
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
        spare_parts=spare_parts,  # Pass the complete spare_parts list
        current_spare_tickets=current_spare_tickets,
        service_value=service_value_default,
        problems=problems_list,
        spare_name=spare_name
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
    spare_name = get_spare_name()
    service_value = get_sertec()
    problems_list = Problems.query.order_by(Problems.name).all()
    spare_tickets = Spares_tickets.query.filter_by(id_ticket=ticket_id).all()
    
    # Renderizamos el template de detalle, pasándole toda la información necesaria
    return render_template(
        "view_detail_ticket.html",
        ticket=ticket,
        client=client,
        technicians=technicians,
        reference=reference,
        product_code=product_code,
        spare_name=spare_name,
        service_value=service_value,
        problems=problems_list,
        spare_tickets=spare_tickets
    )
