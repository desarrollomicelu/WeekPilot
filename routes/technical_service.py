# routes/technical_service.py

from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required
from decimal import Decimal
from datetime import datetime
# Importa las funciones desde el módulo de servicios
from models.problemsTickets import Problems_tickets
from services.queries import get_product_information, get_sertec, get_spare_name, get_technicians, get_spare_parts
# Importa los modelos
from models.employees import Empleados
from models.clients import Clients_tickets
from models.tickets import Tickets
from extensions import db
from models.problems import Problems
from models.sparesTickets import Spares_tickets

technical_service_bp = Blueprint(
    "technical_service", __name__, template_folder="templates")

# Función auxiliar para obtener todos los datos comunes


def get_common_data():
    """Obtiene todos los datos comunes necesarios para las vistas de tickets"""
    product_info = get_product_information()
    
    reference = []
    product_code = []
    
    for item in product_info:
        reference.append(item["DESCRIPCIO"])
        product_code.append(item["CODIGO"])
    return {
        'technicians': get_technicians(),
        'reference': reference,
        'product_code': product_code,
        'product_info': product_info,
        'spare_name': get_spare_name(),
        'sertec': get_sertec(),
        'problems': Problems.query.order_by(Problems.name).all(),
        'spare_parts': get_spare_parts()
    }

# Crear Ticket


@technical_service_bp.route("/create_ticket", methods=["GET", "POST"])
@login_required
def create_ticket():
    # Obtener datos comunes
    common_data = get_common_data()
    current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

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
        city = request.form.get("city")
        type_of_service = request.form.get(
            "type_of_service") or "Servicio Técnico"
        IMEI = request.form.get("IMEI")
        reference = request.form.get("reference")
        product_code = request.form.get("product_code")

        # Valores financieros
        try:
            service_value = float(request.form.get("service_value") or 0)
            spare_value = float(request.form.get("spare_value") or 0)
            total = service_value + spare_value
        except ValueError:
            flash(
                "Error: Los valores del servicio técnico y repuestos deben ser numéricos.", "danger")
            return redirect(url_for("technical_service.create_ticket"))

        # Fechas
        creation_date = datetime.now()
        assigned = None
        received = None
        in_progress = None
        finished = None

        # Si el estado es "Asignado", registrar la fecha de asignación
        if state == "Asignado":
            assigned = datetime.now()

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

        # Obtener problemas seleccionados
        selected_problem_ids = request.form.getlist("device_problems[]")
        try:
            selected_problem_ids = [int(pid) for pid in selected_problem_ids]
        except ValueError:
            selected_problem_ids = []
        selected_problems = Problems.query.filter(
            Problems.id.in_(selected_problem_ids)).all()

        # Crear el nuevo ticket
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

        # Procesar repuestos
        spare_codes = request.form.getlist("spare_part_code[]")
        quantities = request.form.getlist("part_quantity[]")
        unit_prices = request.form.getlist("part_unit_value[]")
        total_prices = request.form.getlist("part_total_value[]")

        for i in range(len(spare_codes)):
            if i < len(quantities) and i < len(unit_prices) and i < len(total_prices) and spare_codes[i]:
                try:
                    quantity = int(quantities[i])
                    unit_price = float(unit_prices[i])
                    total_price = float(total_prices[i])

                    spare_ticket = Spares_tickets(
                        id_ticket=new_ticket.id_ticket,
                        spare_code=spare_codes[i],
                        quantity=quantity,
                        unit_price=unit_price,
                        total_price=total_price
                    )
                    db.session.add(spare_ticket)
                except (ValueError, IndexError) as e:
                    flash(f"Error al procesar repuesto: {str(e)}", "warning")

        # Actualizar el valor total de repuestos y el total general
        total_spare_value = sum(float(price)
                                for price in total_prices if price)
        new_ticket.spare_value = total_spare_value
        new_ticket.total = new_ticket.service_value + \
            Decimal(str(total_spare_value))
        db.session.commit()

        flash("Ticket creado correctamente", "success")
        return redirect(url_for("technical_service.list_tickets"))

    # Método GET: mostrar formulario
    return render_template(
        "create_ticket.html",
        current_date=current_date,
        **common_data
    )

# Listar Tickets


@technical_service_bp.route("/technical_service")
@login_required
def list_tickets():
    clients = Clients_tickets.query.all()
    tickets = Tickets.query.filter_by(type_of_service="Servicio Técnico").all()
    technicians = Empleados.query.filter_by(cargo="servicioTecnico").all()

    # Cargar información adicional para cada ticket
    for ticket in tickets:
        # Asegurarse de que client_info esté cargado
        if not hasattr(ticket, 'client_info') or ticket.client_info is None:
            ticket.client_info = Clients_tickets.query.get(ticket.client)

    return render_template(
        "technical_service.html",
        tickets=tickets,
        technicians=technicians,
        clients=clients
    )

# Editar Ticket
@technical_service_bp.route("/edit_ticket/<int:ticket_id>", methods=["GET", "POST"])
@login_required
def edit_ticket(ticket_id):
    # Consultamos el ticket a editar o devolvemos 404 si no existe
    ticket = Tickets.query.get_or_404(ticket_id)
    # Obtenemos el cliente relacionado al ticket
    client = Clients_tickets.query.filter_by(id_client=ticket.client).first()
    
    # Obtenemos los repuestos actuales del ticket
    current_spare_tickets = ticket.get_spare_parts()

    # Datos auxiliares para el formulario
    technicians = get_technicians()
    
    # Asegurarse de que los datos tienen el formato esperado
    formatted_technicians = []
    for tech in technicians:
        formatted_technicians.append({
            "NOMBRE": tech[0] if isinstance(tech, tuple) else tech.get("NOMBRE", ""),
            "DOCUMENTO": tech[1] if isinstance(tech, tuple) else tech.get("DOCUMENTO", "")
        })
    
    # Obtenemos información completa de productos (referencia y código)
    product_info = get_product_information()
    
    # Obtenemos información de repuestos
    spare_parts = get_spare_parts()
    
    # Obtenemos la lista de problemas
    problems_list = Problems.query.order_by(Problems.name).all()

    if request.method == "POST":
        # Actualizamos los datos del cliente
        client.name = request.form.get("client_names")
        client.lastname = request.form.get("client_lastnames")
        client.document = request.form.get("document")
        client.mail = request.form.get("mail")
        client.phone = request.form.get("phone")

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
        
        # Actualizamos los problemas asociados
        selected_problem_ids = request.form.getlist("device_problems[]")
        try:
            selected_problem_ids = [int(pid) for pid in selected_problem_ids]
        except ValueError:
            selected_problem_ids = []
        selected_problems = Problems.query.filter(Problems.id.in_(selected_problem_ids)).all()
        ticket.problems = selected_problems
        
        # Actualizar repuestos
        # Primero eliminamos los repuestos existentes
        Spares_tickets.query.filter_by(id_ticket=ticket.id_ticket).delete()
        
        # Luego agregamos los nuevos repuestos
        spare_codes = request.form.getlist("spare_part_code[]")
        quantities = request.form.getlist("part_quantity[]")
        unit_prices = request.form.getlist("part_unit_value[]")
        total_prices = request.form.getlist("part_total_value[]")
        
        for i in range(len(spare_codes)):
            if spare_codes[i]:
                try:
                    quantity = int(quantities[i])
                    unit_price = float(unit_prices[i])
                    total_price = float(total_prices[i])
                    
                    spare = Spares_tickets(
                        id_ticket=ticket.id_ticket,
                        spare_code=spare_codes[i],
                        quantity=quantity,
                        unit_price=unit_price,
                        total_price=total_price
                    )
                    db.session.add(spare)
                except (ValueError, IndexError):
                    flash("Error: Datos de repuestos inválidos.", "danger")
                    return redirect(url_for("technical_service.edit_ticket", ticket_id=ticket_id))

        db.session.commit()
        flash("Ticket actualizado correctamente", "success")
        return redirect(url_for("technical_service.list_tickets"))

    # GET: pasamos los datos existentes para que se pre-carguen en el formulario
    return render_template(
        "edit_ticket.html",
        ticket=ticket,
        client=client,
        technicians=formatted_technicians,
        product_info=product_info,
        spare_parts=spare_parts,
        problems=problems_list,
        current_spare_tickets=current_spare_tickets
    )

# Ver Detalle de Ticket


@technical_service_bp.route("/view_detail_ticket/<int:ticket_id>", methods=["GET"])
@login_required
def view_detail_ticket(ticket_id):
    # Obtenemos el ticket o devolvemos 404 si no existe
    ticket = Tickets.query.get_or_404(ticket_id)
    
    # Obtenemos el cliente asociado al ticket
    client = Clients_tickets.query.filter_by(id_client=ticket.client).first()
    
    # Renderizamos el template de detalle, pasándole toda la información necesaria
    return render_template(
        "view_detail_ticket.html",
        ticket=ticket,
        client=client
    )


# Actualizar Estado de Ticket (formulario tradicional)
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

        # Actualizar el estado y registrar la hora del cambio
        now = ticket.update_state(new_status)

        db.session.commit()
        flash('Estado actualizado correctamente', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error al actualizar el estado: {str(e)}', 'danger')

    return redirect(url_for('technical_service.list_tickets'))

# Actualizar Estado de Ticket (AJAX)


@technical_service_bp.route('/update_ticket_status_ajax', methods=['POST'])
@login_required
def update_ticket_status_ajax():
    ticket_id = request.form.get('ticket_id')
    new_status = request.form.get('status')

    if not ticket_id or not new_status:
        return jsonify({'success': False, 'message': 'Datos incompletos'})

    try:
        # Buscar el ticket
        ticket = Tickets.query.get(ticket_id)
        if not ticket:
            return jsonify({'success': False, 'message': 'Ticket no encontrado'})

        # Actualizar el estado y registrar la hora del cambio
        now = ticket.update_state(new_status)

        db.session.commit()

        # Formatear la hora para mostrarla en la UI
        formatted_time = now.strftime("%d/%m/%Y %H:%M:%S")

        return jsonify({
            'success': True,
            'message': 'Estado actualizado correctamente',
            'status': new_status,
            'timestamp': formatted_time
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})
