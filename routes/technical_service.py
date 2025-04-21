# routes/technical_service.py
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, current_app, session
from flask_login import login_required
from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm.attributes import flag_modified
import json
# Importa las funciones desde el módulo de servicios
from models.problemsTickets import Problems_tickets
from services.queries import get_product_information, get_sertec, get_spare_name, get_technicians, get_spare_parts
from services.ticket_email_service import TicketEmailService
# Importa los modelos
from models.employees import Empleados
from models.clients import Clients_tickets
from models.tickets import Tickets
from extensions import db
from models.problems import Problems
from models.sparesTickets import Spares_tickets
from utils.access_control import role_required
from routes.onedrive import refresh_token, get_ticket_images, delete_onedrive_images

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
@role_required("Admin")
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
        type_of_service = request.form.get("type_of_service") or "0"
        IMEI = request.form.get("IMEI")
        reference = request.form.get("reference")
        product_code = request.form.get("product_code")
        comment = request.form.get("comment")
        selected_problem_ids = request.form.getlist("device_problems[]")

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
        in_revision = None
        finished = None

        # Si el estado es "Asignado", registrar la fecha de asignación
        if state == "Asignado":
            assigned = datetime.now()

        if state == "Recibido":
            received = datetime.now()

        if state == "En Proceso":
            in_progress = datetime.now()

        if state == "En Revision":
            in_revision = datetime.now()

        if state == "Terminado":
            finished = datetime.now()

        # Validar datos del cliente
        if not document:
            flash("El documento del cliente es obligatorio", "danger")
            return redirect(url_for("technical_service.create_ticket"))
        if not client_names or not client_lastnames:
            flash("El nombre y apellido del cliente son obligatorios", "danger")
            return redirect(url_for("technical_service.create_ticket"))
        if mail and '@' not in mail:
            flash("El formato del correo electrónico no es válido", "danger")
            return redirect(url_for("technical_service.create_ticket"))
        if phone and not phone.isdigit():
            flash("El teléfono debe contener solo números", "danger")
            return redirect(url_for("technical_service.create_ticket"))

        # Validar datos del ticket
        if not technical_name or not technical_document:
            flash("El nombre y documento del técnico son obligatorios", "danger")
            return redirect(url_for("technical_service.create_ticket"))
        if not state:
            flash("El estado del ticket es obligatorio", "danger")
            return redirect(url_for("technical_service.create_ticket"))
        if not priority:
            flash("La prioridad del ticket es obligatoria", "danger")
            return redirect(url_for("technical_service.create_ticket"))
        if not city:
            flash("La ciudad es obligatoria", "danger")
            return redirect(url_for("technical_service.create_ticket"))
        if not reference:
            flash("La referencia del producto es obligatoria", "danger")
            return redirect(url_for("technical_service.create_ticket"))
        # Validar IMEI (si está presente)
        if IMEI and (not IMEI.isdigit() or len(IMEI) != 15):
            flash("El IMEI debe ser un número de 15 dígitos", "danger")
            return redirect(url_for("technical_service.create_ticket"))
        # Validar valores financieros
        if service_value < 0 or spare_value < 0:
            flash("Los valores no pueden ser negativos", "danger")
            return redirect(url_for("technical_service.create_ticket"))
        # Validar que se haya seleccionado al menos un problema
        if not selected_problem_ids:
            flash("Debe seleccionar al menos un problema", "danger")
            return redirect(url_for("technical_service.create_ticket"))

        if comment and len(comment) > 500:
            flash("El comentario no puede tener más de 250 caracteres", "danger")
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

        # Obtener problemas seleccionados
        selected_problems = Problems.query.filter(
            Problems.id.in_(selected_problem_ids)).all()

        # Crear el nuevo ticket
        new_ticket = Tickets(
            technical_name=technical_name,
            technical_document=technical_document,
            state=state,
            priority=priority,
            IMEI=IMEI,
            comment=comment,
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
            in_revision=in_revision,
            finished=finished,
        )

        # Asociar problemas al ticket
        for problem in selected_problems:
            new_ticket.problems.append(problem)

        db.session.add(new_ticket)
        db.session.commit()

        # Procesar repuestos
        spare_codes = request.form.getlist("spare_part_code[]")
        quantities = request.form.getlist("part_quantity[]")
        unit_prices = request.form.getlist("part_unit_value[]")
        total_prices = request.form.getlist("part_total_value[]")

        for i in range(len(spare_codes)):
            if spare_codes[i]:  # Solo procesar si hay código de repuesto
                # Verificar que haya cantidad
                if i >= len(quantities) or not quantities[i]:
                    flash(
                        f"Falta la cantidad para el repuesto {spare_codes[i]}", "danger")
                    return redirect(url_for("technical_service.create_ticket"))

                try:
                    quantity = int(quantities[i])
                    if quantity <= 0:
                        flash(
                            f"La cantidad del repuesto {spare_codes[i]} debe ser mayor a cero", "danger")
                        return redirect(url_for("technical_service.create_ticket"))
                except ValueError:
                    flash(
                        f"La cantidad del repuesto {spare_codes[i]} debe ser un número", "danger")
                    return redirect(url_for("technical_service.create_ticket"))

                # Verificar precio unitario
                try:
                    unit_price_val = float(unit_prices[i])
                    if unit_price_val < 0:
                        flash(
                            f"El precio unitario del repuesto {spare_codes[i]} no puede ser negativo", "danger")
                        return redirect(url_for("technical_service.create_ticket"))
                except (ValueError, IndexError):
                    flash(
                        f"El precio unitario del repuesto {spare_codes[i]} debe ser un número válido", "danger")
                    return redirect(url_for("technical_service.create_ticket"))

                try:
                    total_price_val = float(total_prices[i])
                except (ValueError, IndexError):
                    flash(
                        f"Error al procesar el total del repuesto {spare_codes[i]}", "warning")
                    return redirect(url_for("technical_service.create_ticket"))

                spare_ticket = Spares_tickets(
                    id_ticket=new_ticket.id_ticket,
                    spare_code=spare_codes[i],
                    quantity=quantity,
                    unit_price=unit_price_val,
                    total_price=total_price_val
                )
                db.session.add(spare_ticket)

        # Actualizar totales si es necesario
        total_spare_value = sum(float(price)
                                for price in total_prices if price)
        new_ticket.spare_value = total_spare_value
        new_ticket.total = new_ticket.service_value + \
            Decimal(str(total_spare_value))
        db.session.commit()

        flash("Ticket creado correctamente", "success")
        return redirect(url_for("technical_service.list_tickets") + "?ticket_created=success")

    # Método GET: mostrar formulario
    return render_template(
        "create_ticket.html",
        current_date=current_date,
        **common_data
    )


# Listar Tickets

@technical_service_bp.route("/technical_service")
@login_required
@role_required("Admin")
def list_tickets():
    clients = Clients_tickets.query.all()
    tickets = Tickets.query.filter_by(type_of_service="0").order_by(
        Tickets.creation_date.asc()).all()
    technicians = Empleados.query.filter_by(cargo="servicioTecnico").all()

    # Datos auxiliares para el formulario
    technicians = get_technicians()

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
@role_required("Admin")
def edit_ticket(ticket_id):
    ms_authenticated = "ms_token" in session and refresh_token()

    # Obtener el ticket y cliente
    ticket = Tickets.query.get_or_404(ticket_id)

    # No permitir editar tickets en estado "Terminado"
    if ticket.state == "Terminado":
        flash("No se puede editar un ticket en estado Terminado", "warning")
        return redirect(url_for("technical_service.view_detail_ticket", ticket_id=ticket_id))

    client = Clients_tickets.query.filter_by(id_client=ticket.client).first()

    # Obtener repuestos del ticket
    current_spare_tickets = Spares_tickets.query.filter_by(
        id_ticket=ticket_id).all()

    # Obtener datos auxiliares
    technicians = get_technicians()
    product_info = get_product_information()
    spare_parts = get_spare_parts()
    problems_list = Problems.query.order_by(Problems.name).all()

    # Procesamiento del formulario POST
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

        ticket.type_of_service = request.form.get("type_of_service") or "0"
        ticket.IMEI = request.form.get("IMEI")
        ticket.reference = request.form.get("reference")
        ticket.product_code = request.form.get("product_code")

        # Actualizar el comentario
        ticket.comment = request.form.get("comment")

        try:
            ticket.service_value = float(
                request.form.get("service_value") or 0)
            ticket.spare_value = float(request.form.get("spare_value") or 0)
            ticket.total = ticket.service_value + ticket.spare_value
        except ValueError:
            flash(
                "Error: Los valores del servicio técnico y repuestos deben ser numéricos.", "danger")
            return redirect(url_for("technical_service.edit_ticket", ticket_id=ticket_id))

        # Actualizamos los problemas asociados
        selected_problem_ids = request.form.getlist("device_problems[]")
        try:
            selected_problem_ids = [int(pid) for pid in selected_problem_ids]
        except ValueError:
            selected_problem_ids = []
        selected_problems = Problems.query.filter(
            Problems.id.in_(selected_problem_ids)).all()
        ticket.problems = selected_problems

        # Actualizar repuestos
        # Primero eliminamos los repuestos existentes
        Spares_tickets.query.filter_by(id_ticket=ticket.id_ticket).delete()

        # Procesar repuestos
        spare_codes = request.form.getlist("spare_part_code[]")
        quantities = request.form.getlist("part_quantity[]")
        unit_prices = request.form.getlist("part_unit_value[]")
        total_prices = request.form.getlist("part_total_value[]")

        # Validar datos de repuestos
        for i in range(len(spare_codes)):
            if spare_codes[i]:  # Solo validar si hay código de repuesto
                # Verificar cantidad, precio, etc...
                try:
                    quantity = int(quantities[i])
                    unit_price = float(unit_prices[i])
                    total_price = float(total_prices[i])

                    spare_ticket = Spares_tickets(
                        id_ticket=ticket.id_ticket,
                        spare_code=spare_codes[i],
                        quantity=quantity,
                        unit_price=unit_price,
                        total_price=total_price
                    )
                    db.session.add(spare_ticket)
                except (ValueError, IndexError) as e:
                    db.session.rollback()  # Revertir cambios parciales
                    flash(f"Error al procesar repuesto: {str(e)}", "danger")
                    print(f"Error procesando repuesto {i}: {str(e)}")
                    return redirect(url_for("technical_service.edit_ticket", ticket_id=ticket.id_ticket))

        # Procesar imágenes a eliminar
        images_to_delete = request.form.get("images_to_delete", "[]")
        try:
            image_ids = json.loads(images_to_delete)
            if image_ids:
                success, message = delete_onedrive_images(image_ids)
                if not success:
                    flash(message, "warning")
        except Exception as e:
            flash(f"Error procesando eliminación de imágenes: {str(e)}", "danger")

        db.session.commit()
        # Una vez procesados todos los repuestos
        flash("Ticket actualizado correctamente", "success")
        return redirect(url_for("technical_service.list_tickets") + "?ticket_updated=success")

    # Obtener imágenes del ticket desde OneDrive
    ticket_images = []
    if ms_authenticated:
        ticket_images = get_ticket_images(ticket_id) or []

    # Convertir las imágenes a JSON para pasarlas al template
    ticket_images_json = json.dumps(ticket_images)

    # Renderizar la plantilla con los datos
    return render_template(
        "edit_ticket.html",
        ticket=ticket,
        client=client,
        technicians=technicians,
        product_info=product_info,
        spare_parts=spare_parts,
        problems=problems_list,
        current_spare_tickets=current_spare_tickets,
        ms_authenticated=ms_authenticated,
        ticket_images=ticket_images,
        ticket_images_json=ticket_images_json
    )


# Ver Detalle de Ticket
@technical_service_bp.route("/view_detail_ticket/<int:ticket_id>", methods=["GET"])
@login_required
@role_required("Admin")
def view_detail_ticket(ticket_id):
    # Obtenemos el ticket o devolvemos 404 si no existe
    ticket = Tickets.query.get_or_404(ticket_id)

    # Obtenemos el cliente asociado al ticket
    client = Clients_tickets.query.filter_by(id_client=ticket.client).first()

    # Renderizamos el template de detalle, pasándole toda la información necesaria
    return render_template(
        "view_detail_ticket.html",
        ticket=ticket,
        client=client,
        upload_images_url=url_for('upload_images.upload', ticket_id=ticket_id)

    )


# Actualizar Estado de Ticket (AJAX)
@technical_service_bp.route("/update_ticket_status_ajax", methods=["POST"])
@login_required
@role_required("Admin")
def update_ticket_status_ajax():
    """Actualiza el estado de un ticket vía AJAX"""
    try:
        ticket_id = request.form.get('ticket_id')
        new_status = request.form.get('state') or request.form.get('status')
        
        if not ticket_id or not new_status:
            return jsonify({'success': False, 'message': 'Faltan datos requeridos'}), 400
            
        ticket = Tickets.query.get_or_404(ticket_id)
        
        previous_status = ticket.state
        print(f"Actualizando ticket #{ticket_id} de estado '{previous_status}' a '{new_status}'")
        
        # Actualizar estado y obtener timestamp
        timestamp = ticket.update_state(new_status) 
        
        # Marcar explícitamente el campo modificado según el estado
        if new_status == "Asignado":
            flag_modified(ticket, "assigned")
        elif new_status == "En proceso":
            flag_modified(ticket, "in_progress")
        elif new_status == "En Revision":
            flag_modified(ticket, "in_revision")
            print(f"Flagged in_revision as modified. Value: {ticket.in_revision}")
        elif new_status == "Terminado":
            flag_modified(ticket, "finished")
        elif new_status == "Recibido":
            flag_modified(ticket, "received")
            
        # Guardar cambios en la base de datos
        db.session.commit()
        
        # Verificar después del commit (para depuración)
        if new_status == "En Revision":
            ticket_verificado = Tickets.query.get(ticket_id)
            print(f"Timestamp in_revision después del commit: {ticket_verificado.in_revision}")
        
        formatted_time = timestamp.strftime("%d/%m/%Y %H:%M:%S")
        
        return jsonify({
            'success': True, 
            'message': f'Estado actualizado de "{previous_status}" a "{new_status}"',
            'status': new_status,
            'timestamp': formatted_time
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error en update_ticket_status_ajax: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'message': f'Error interno al actualizar estado: {str(e)}'}), 500


@technical_service_bp.route('/send_email_notification/<int:ticket_id>', methods=['POST'])
@login_required
@role_required("Admin")
def send_email_notification(ticket_id):
    """Envía una notificación por correo electrónico al cliente sobre el ticket Terminado"""
    ticket = Tickets.query.get_or_404(ticket_id)

    # Verificar que el ticket esté Terminado
    if ticket.state != "Terminado" and ticket.state != "Terminado":
        flash("El ticket debe estar Terminado para enviar la notificación", "warning")
        return redirect(url_for('technical_service.view_detail_ticket', ticket_id=ticket_id))

    # Obtener información necesaria
    cliente = Clients_tickets.query.get(ticket.client)
    tecnico = Empleados.query.filter_by(
        cedula=ticket.technical_document).first()
    problemas = ticket.problems

    # Verificar que el cliente tenga correo
    if not cliente.mail:
        flash(
            "El cliente no tiene una dirección de correo electrónico registrada", "warning")
        return redirect(url_for('technical_service.view_detail_ticket', ticket_id=ticket_id))

    # Enviar correo
    email_service = current_app.ticket_email_service
    success, error = email_service.enviar_notificacion_reparacion(
        cliente=cliente,
        ticket=ticket,
        problemas=problemas,
        tecnico=tecnico
    )

    if success:
        # Redirigir a la página de detalle con parámetro de éxito
        return redirect(url_for('technical_service.view_detail_ticket', ticket_id=ticket_id, email_sent='success'))
    else:
        # Redirigir con parámetro de error
        current_app.logger.error(f"Error al enviar el correo: {error}")
        return redirect(url_for('technical_service.view_detail_ticket', ticket_id=ticket_id, email_sent='error'))
