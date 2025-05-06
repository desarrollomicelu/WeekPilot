# routes/warranty.py
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, current_app, session
from flask_login import login_required
from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm.attributes import flag_modified
import json
# Importa las funciones desde el módulo de servicios
from models.problemsTickets import Problems_tickets
from services.queries import get_product_information, get_sertec, get_spare_name, get_technicians, get_spare_parts, get_client_by_document, get_client_invoices, format_document, execute_query
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

warranty_bp = Blueprint(
    "warranty", __name__, template_folder="templates")


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


@warranty_bp.route("/create_warranty", methods=["GET", "POST"])
@login_required
@role_required("Admin")
def create_warranty():
    # Obtener datos comunes
    common_data = get_common_data()
    current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if request.method == "POST":
        # Función para limpiar los valores de los campos
        def clean_value(value):
            if value is None:
                return None
            return str(value).strip()
            
        # Datos del cliente
        client_names = clean_value(request.form.get("client_names"))
        client_lastnames = clean_value(request.form.get("client_lastnames"))
        document = clean_value(request.form.get("document"))
        
        # Formatear el documento (solo primeros 10 dígitos)
        formatted_document = format_document(document) if document else None
        print(f"Documento formateado para guardar: {document} -> {formatted_document}")
        
        mail = clean_value(request.form.get("mail"))
        phone = clean_value(request.form.get("phone"))

        # Datos del ticket
        technical_name = clean_value(request.form.get("technical_name"))
        technical_document = clean_value(request.form.get("technical_document"))
        state = clean_value(request.form.get("state"))
        priority = clean_value(request.form.get("priority"))
        city = clean_value(request.form.get("city"))
        type_of_service = clean_value(request.form.get("type_of_service")) or "2"
        IMEI = clean_value(request.form.get("IMEI"))
        reference = clean_value(request.form.get("reference"))
        product_code = clean_value(request.form.get("product_code"))
        invoice_number = clean_value(request.form.get("invoice_number"))
        comment = clean_value(request.form.get("comment"))
        selected_problem_ids = request.form.getlist("device_problems[]")

        # Valores financieros
        try:
            # Limpiar separadores de miles (puntos) antes de convertir a float
            service_value_str = request.form.get("service_value_raw", request.form.get("service_value", "0"))
            spare_value_str = request.form.get("spare_value_raw", request.form.get("spare_value", "0"))
            
            # Limpiar posibles separadores
            service_value_str = str(service_value_str).replace(".", "").replace(",", ".")
            spare_value_str = str(spare_value_str).replace(".", "").replace(",", ".")
            
            # Convertir a Decimal para mayor precisión
            service_value = Decimal(service_value_str or "0")
            spare_value = Decimal(spare_value_str or "0")
            total = service_value + spare_value
        except ValueError:
            flash(
                "Error: Los valores de la garantía y repuestos deben ser numéricos.", "danger")
            return redirect(url_for("warranty.create_warranty"))

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
            return redirect(url_for("warranty.create_warranty"))
        if not client_names or not client_lastnames:
            flash("El nombre y apellido del cliente son obligatorios", "danger")
            return redirect(url_for("warranty.create_warranty"))
        if mail and '@' not in mail:
            flash("El formato del correo electrónico no es válido", "danger")
            return redirect(url_for("warranty.create_warranty"))
        if phone and not phone.isdigit():
            flash("El teléfono debe contener solo números", "danger")
            return redirect(url_for("warranty.create_warranty"))

        # Validar datos del ticket - ya no requiere técnico
        if not state:
            flash("El estado del ticket es obligatorio", "danger")
            return redirect(url_for("warranty.create_warranty"))
        if not priority:
            flash("La prioridad del ticket es obligatoria", "danger")
            return redirect(url_for("warranty.create_warranty"))
        if not city:
            flash("La ciudad es obligatoria", "danger")
            return redirect(url_for("warranty.create_warranty"))
        # Referencia ya no es obligatoria
        # Validar IMEI (si está presente)
        if IMEI and (not IMEI.isdigit() or len(IMEI) != 15):
            flash("El IMEI debe ser un número de 15 dígitos", "danger")
            return redirect(url_for("warranty.create_warranty"))
        # Validar valores financieros
        if service_value < 0 or spare_value < 0:
            flash("Los valores no pueden ser negativos", "danger")
            return redirect(url_for("warranty.create_warranty"))
        # Validar que se haya seleccionado al menos un problema
        if not selected_problem_ids:
            flash("Debe seleccionar al menos un problema", "danger")
            return redirect(url_for("warranty.create_warranty"))

        if comment and len(comment) > 500:
            flash("El comentario no puede tener más de 250 caracteres", "danger")
            return redirect(url_for("warranty.create_warranty"))

        # Buscar o crear el cliente
        client = Clients_tickets.query.filter_by(document=formatted_document).first()
        if not client:
            client = Clients_tickets(
                document=formatted_document,
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
            invoice_number=invoice_number,
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

        # Procesar repuestos - solo procesarlos si hay alguno
        spare_codes = request.form.getlist("spare_part_code[]")
        quantities = request.form.getlist("part_quantity[]")
        unit_prices = request.form.getlist("part_unit_value[]")
        total_prices = request.form.getlist("part_total_value[]")
        
        # Usar Decimal para evitar errores de tipos
        total_spare_value = Decimal("0")  # Valor por defecto si no hay repuestos

        # Solo procesar repuestos si hay códigos de repuestos enviados
        if spare_codes and any(code.strip() for code in spare_codes):
            for i in range(len(spare_codes)):
                if spare_codes[i]:  # Solo procesar si hay código de repuesto
                    try:
                        # Limpiar formatos y convertir a números
                        quantity = int(quantities[i]) if i < len(quantities) and quantities[i] else 1
                        if quantity <= 0:
                            quantity = 1  # Valor por defecto si es negativo o cero
                        
                        # Obtener valores sin formato de los campos ocultos si existen
                        unit_price_raw = request.form.getlist("part_unit_value_raw[]")
                        total_price_raw = request.form.getlist("part_total_value_raw[]")
                        
                        if i < len(unit_price_raw) and unit_price_raw[i]:
                            # Usar el valor sin formato si está disponible
                            unit_price_val = Decimal(str(unit_price_raw[i] or "0"))
                        else:
                            # Limpiar separadores de miles del valor unitario como respaldo
                            unit_price_str = unit_prices[i].replace(".", "") if i < len(unit_prices) and unit_prices[i] else "0"
                            unit_price_str = unit_price_str.replace(",", ".")
                            unit_price_val = Decimal(unit_price_str or "0")
                        
                        if unit_price_val < 0:
                            unit_price_val = Decimal("0")  # No permitir valores negativos
                        
                        if i < len(total_price_raw) and total_price_raw[i]:
                            # Usar el valor sin formato si está disponible
                            total_price_val = Decimal(str(total_price_raw[i] or "0"))
                        else:
                            # Limpiar separadores de miles del valor total como respaldo
                            total_price_str = total_prices[i].replace(".", "") if i < len(total_prices) and total_prices[i] else "0"
                            total_price_str = total_price_str.replace(",", ".")
                            total_price_val = Decimal(total_price_str or "0")
                        
                        if not total_price_val:
                            total_price_val = Decimal(str(quantity)) * unit_price_val

                        spare_ticket = Spares_tickets(
                            id_ticket=new_ticket.id_ticket,
                            spare_code=spare_codes[i],
                            quantity=quantity,
                            unit_price=unit_price_val,
                            total_price=total_price_val
                        )
                        db.session.add(spare_ticket)
                        
                        # Sumar al total de repuestos
                        total_spare_value += total_price_val
                        
                    except (ValueError, IndexError) as e:
                        # En lugar de mostrar error, simplemente continuar con el siguiente repuesto
                        print(f"Error procesando repuesto {i}: {e}")
                        continue

        # Actualizar totales
        new_ticket.spare_value = total_spare_value
        new_ticket.total = new_ticket.service_value + total_spare_value
        db.session.commit()

        flash("Ticket creado correctamente", "success")
        return redirect(url_for("warranty.list_warranties") + "?ticket_created=success")

    # Método GET: mostrar formulario
    return render_template(
        "create_warranty.html",
        current_date=current_date,
        **common_data
    )


# Listar Tickets

@warranty_bp.route("/warranty")
@login_required
@role_required("Admin")
def list_warranties():
    clients = Clients_tickets.query.all()
    tickets = Tickets.query.filter_by(type_of_service="2").order_by(
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
        "warranty.html",
        tickets=tickets,
        technicians=technicians,
        clients=clients
    )

# Editar Ticket


@warranty_bp.route("/edit_warranty/<int:ticket_id>", methods=["GET", "POST"])
@login_required
@role_required("Admin")
def edit_warranty(ticket_id):
    ms_authenticated = "ms_token" in session and refresh_token()

    # Obtener el ticket y cliente
    ticket = Tickets.query.get_or_404(ticket_id)

    # No permitir editar tickets en estado "Terminado"
    if ticket.state == "Terminado":
        flash("No se puede editar un ticket en estado Terminado", "warning")
        return redirect(url_for("warranty.view_detail_warranty", ticket_id=ticket_id))

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
        # Función para limpiar los valores de los campos
        def clean_value(value):
            if value is None:
                return None
            return str(value).strip()
            
        # Actualizamos los datos del cliente
        client.name = clean_value(request.form.get("client_names"))
        client.lastname = clean_value(request.form.get("client_lastnames"))
        
        # Formatear el documento antes de guardarlo
        document = clean_value(request.form.get("document"))
        formatted_document = format_document(document) if document else None
        print(f"Documento formateado en edición: {document} -> {formatted_document}")
        client.document = formatted_document
        
        client.mail = clean_value(request.form.get("mail"))
        client.phone = clean_value(request.form.get("phone"))

        # Actualizamos los datos del ticket
        ticket.technical_name = clean_value(request.form.get("technical_name"))
        ticket.technical_document = clean_value(request.form.get("technical_document"))
        ticket.state = clean_value(request.form.get("state"))
        ticket.priority = clean_value(request.form.get("priority"))
        ticket.city = clean_value(request.form.get("city"))

        ticket.type_of_service = clean_value(request.form.get("type_of_service")) or "2"
        ticket.IMEI = clean_value(request.form.get("IMEI"))
        ticket.reference = clean_value(request.form.get("reference"))
        ticket.product_code = clean_value(request.form.get("product_code"))
        ticket.invoice_number = clean_value(request.form.get("invoice_number"))

        # Actualizar el comentario
        ticket.comment = clean_value(request.form.get("comment"))

        try:
            # Limpiar separadores de miles (puntos) antes de convertir a float
            service_value_str = request.form.get("service_value_raw", request.form.get("service_value", "0"))
            spare_value_str = request.form.get("spare_value_raw", request.form.get("spare_value", "0"))
            
            # Limpiar posibles separadores
            service_value_str = str(service_value_str).replace(".", "").replace(",", ".")
            spare_value_str = str(spare_value_str).replace(".", "").replace(",", ".")
            
            # Convertir a Decimal para mayor precisión
            service_value = Decimal(service_value_str or "0")
            spare_value = Decimal(spare_value_str or "0")
            
            ticket.service_value = service_value
            ticket.spare_value = spare_value
            ticket.total = service_value + spare_value
        except ValueError:
            flash(
                "Error: Los valores de la garantía y repuestos deben ser numéricos.", "danger")
            return redirect(url_for("warranty.edit_warranty", ticket_id=ticket_id))

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

        # Procesar repuestos - solo procesarlos si hay alguno
        spare_codes = request.form.getlist("spare_part_code[]")
        quantities = request.form.getlist("part_quantity[]")
        unit_prices = request.form.getlist("part_unit_value[]")
        total_prices = request.form.getlist("part_total_value[]")
        
        # Usar Decimal para evitar errores de tipos
        total_spare_value = Decimal("0")  # Valor por defecto si no hay repuestos

        # Solo procesar repuestos si hay códigos de repuestos enviados
        if spare_codes and any(code.strip() for code in spare_codes):
            for i in range(len(spare_codes)):
                if spare_codes[i]:  # Solo procesar si hay código de repuesto
                    try:
                        # Limpiar formatos y convertir a números
                        quantity = int(quantities[i]) if i < len(quantities) and quantities[i] else 1
                        if quantity <= 0:
                            quantity = 1  # Valor por defecto si es negativo o cero
                        
                        # Obtener valores sin formato de los campos ocultos si existen
                        unit_price_raw = request.form.getlist("part_unit_value_raw[]")
                        total_price_raw = request.form.getlist("part_total_value_raw[]")
                        
                        if i < len(unit_price_raw) and unit_price_raw[i]:
                            # Usar el valor sin formato si está disponible
                            unit_price_val = Decimal(str(unit_price_raw[i] or "0"))
                        else:
                            # Limpiar separadores de miles del valor unitario como respaldo
                            unit_price_str = unit_prices[i].replace(".", "") if i < len(unit_prices) and unit_prices[i] else "0"
                            unit_price_str = unit_price_str.replace(",", ".")
                            unit_price_val = Decimal(unit_price_str or "0")
                        
                        if unit_price_val < 0:
                            unit_price_val = Decimal("0")  # No permitir valores negativos
                        
                        if i < len(total_price_raw) and total_price_raw[i]:
                            # Usar el valor sin formato si está disponible
                            total_price_val = Decimal(str(total_price_raw[i] or "0"))
                        else:
                            # Limpiar separadores de miles del valor total como respaldo
                            total_price_str = total_prices[i].replace(".", "") if i < len(total_prices) and total_prices[i] else "0"
                            total_price_str = total_price_str.replace(",", ".")
                            total_price_val = Decimal(total_price_str or "0")
                        
                        if not total_price_val:
                            total_price_val = Decimal(str(quantity)) * unit_price_val

                        spare_ticket = Spares_tickets(
                            id_ticket=ticket.id_ticket,
                            spare_code=spare_codes[i],
                            quantity=quantity,
                            unit_price=unit_price_val,
                            total_price=total_price_val
                        )
                        db.session.add(spare_ticket)
                        
                        # Sumar al total de repuestos
                        total_spare_value += total_price_val
                        
                    except (ValueError, IndexError) as e:
                        # En lugar de mostrar error, simplemente continuar con el siguiente repuesto
                        print(f"Error procesando repuesto {i}: {e}")
                        continue

        # Actualizar totales
        ticket.spare_value = total_spare_value
        ticket.total = ticket.service_value + total_spare_value
        db.session.commit()

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
        return redirect(url_for("warranty.list_warranties") + "?ticket_updated=success")

    # Obtener imágenes del ticket desde OneDrive
    ticket_images = []
    if ms_authenticated:
        ticket_images = get_ticket_images(ticket_id) or []

    # Convertir las imágenes a JSON para pasarlas al template
    ticket_images_json = json.dumps(ticket_images)

    # Renderizar la plantilla con los datos
    return render_template(
        "edit_warranty.html",
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
@warranty_bp.route("/view_detail_warranty/<int:ticket_id>", methods=["GET"])
@login_required
@role_required("Admin")
def view_detail_warranty(ticket_id):
    # Obtenemos el ticket o devolvemos 404 si no existe
    ticket = Tickets.query.get_or_404(ticket_id)

    # Obtenemos el cliente asociado al ticket
    client = Clients_tickets.query.filter_by(id_client=ticket.client).first()

    # Renderizamos el template de detalle, pasándole toda la información necesaria
    return render_template(
        "view_detail_warranty.html",
        ticket=ticket,
        client=client,
        upload_images_url=url_for('upload_images.upload', ticket_id=ticket_id)

    )


# Actualizar Estado de Ticket (AJAX)
@warranty_bp.route("/update_ticket_status_ajax", methods=["POST"])
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


@warranty_bp.route('/send_email_notification/<int:ticket_id>', methods=['POST'])
@login_required
@role_required("Admin")
def send_email_notification(ticket_id):
    """Envía una notificación por correo electrónico al cliente sobre el ticket Terminado"""
    ticket = Tickets.query.get_or_404(ticket_id)

    # Verificar que el ticket esté Terminado
    if ticket.state != "Terminado" and ticket.state != "Terminado":
        flash("El ticket debe estar Terminado para enviar la notificación", "warning")
        return redirect(url_for('warranty.view_detail_warranty', ticket_id=ticket_id))

    # Obtener información necesaria
    cliente = Clients_tickets.query.get(ticket.client)
    tecnico = Empleados.query.filter_by(
        cedula=ticket.technical_document).first()
    problemas = ticket.problems

    # Verificar que el cliente tenga correo
    if not cliente.mail:
        flash(
            "El cliente no tiene una dirección de correo electrónico registrada", "warning")
        return redirect(url_for('warranty.view_detail_warranty', ticket_id=ticket_id))

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
        return redirect(url_for('warranty.view_detail_warranty', ticket_id=ticket_id, email_sent='success'))
    else:
        # Redirigir con parámetro de error
        current_app.logger.error(f"Error al enviar el correo: {error}")
        return redirect(url_for('warranty.view_detail_warranty', ticket_id=ticket_id, email_sent='error'))

@warranty_bp.route("/")
def index():
    return redirect(url_for("warranty.list_warranties"))

# Ruta para buscar cliente por documento
@warranty_bp.route("/search_client", methods=["POST"])
@login_required
@role_required("Admin")
def search_client():
    document = request.form.get("document")
    if not document:
        return jsonify({"success": False, "message": "Documento requerido"}), 400
    
    print(f"Buscando cliente con documento: {document}")
    
    try:
        # Buscar cliente en SQL Server
        client_data = get_client_by_document(document)
        
        print(f"Resultado búsqueda cliente: {client_data}")
        
        if not client_data:
            return jsonify({"success": False, "message": "Cliente no encontrado"})
        
        # Obtener facturas del cliente
        invoices = get_client_invoices(document)
        
        print(f"Facturas encontradas: {len(invoices)}")
        
        # Log detallado de las facturas
        if invoices:
            print("Detalle de la primera factura:")
            for key, value in invoices[0].items():
                print(f"  - {key}: {value}")
        
        return jsonify({
            "success": True,
            "client": client_data,
            "invoices": invoices
        })
    except Exception as e:
        print(f"Error al buscar cliente: {str(e)}")
        return jsonify({"success": False, "message": f"Error al buscar cliente: {str(e)}"}), 500

# Ruta para buscar repuestos dinámicamente
@warranty_bp.route("/api/search_spare_parts", methods=["GET", "POST"])
@login_required
@role_required("Admin")
def search_spare_parts():
    """
    Busca repuestos según un término de búsqueda,
    retornando sólo los resultados coincidentes, no todos los repuestos.
    """
    # Obtener término de búsqueda según método de la solicitud
    if request.method == "POST":
        search_term = request.form.get("search", "").strip().lower()
    else:  # GET
        search_term = request.args.get("term", "").strip().lower()
    
    if not search_term or len(search_term) < 3:
        return jsonify({
            "success": False,
            "message": "Ingrese al menos 3 caracteres para buscar"
        }), 400
    
    try:
        # Obtener los repuestos directamente de la fuente (base de datos)
        # Esta función ahora solo traerá los resultados que coincidan con la búsqueda
        # en lugar de traer todos los repuestos y filtrarlos después
        query = f'''
        SELECT CODIGO, DESCRIPCIO, P_DESVENTA, EXISTENCIA
        FROM MTMERCIA
        WHERE CODLINEA = 'ST' AND 
        (LOWER(CODIGO) LIKE '%{search_term}%' OR LOWER(DESCRIPCIO) LIKE '%{search_term}%')
        ORDER BY 
            CASE 
                WHEN LOWER(CODIGO) = '{search_term}' THEN 1
                WHEN LOWER(CODIGO) LIKE '{search_term}%' THEN 2
                WHEN LOWER(DESCRIPCIO) = '{search_term}' THEN 3
                WHEN LOWER(DESCRIPCIO) LIKE '{search_term}%' THEN 4
                ELSE 5
            END
        '''
        
        # Ejecutar la consulta usando la función execute_query importada
        results = execute_query(query)
        
        # Procesar resultados
        spare_parts = []
        for row in results:
            if len(spare_parts) >= 30:  # Limitar a 30 resultados
                break
                
            # Convertir a Decimal para precisión
            price = Decimal(str(row[2])) if row[2] is not None else Decimal('0')
            stock = Decimal(str(row[3])) if row[3] is not None else Decimal('0')
            
            spare_parts.append({
                "code": row[0].strip() if row[0] else "",
                "description": row[1].strip() if row[1] else "",
                "price": float(price),  # Convertir a float para JSON
                "stock": int(stock)     # Convertir a int para JSON
            })
        
        # Verificar si hay resultados
        if not spare_parts:
            return jsonify({
                "success": True,
                "parts": [],
                "count": 0,
                "message": "No se encontraron repuestos con ese criterio"
            })
            
        return jsonify({
            "success": True,
            "parts": spare_parts,
            "count": len(spare_parts)
        })
    
    except Exception as e:
        print(f"Error al buscar repuestos: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al buscar repuestos: {str(e)}"
        }), 500

# Ruta original para búsqueda de repuestos (para compatibilidad)
@warranty_bp.route("/search_spare_parts", methods=["POST"])
@login_required
@role_required("Admin")
def search_spare_parts_original():
    """
    Ruta original para búsqueda de repuestos.
    Mantiene compatibilidad con código antiguo.
    """
    # Redirigir a la nueva implementación
    search_term = request.form.get("search", "").strip().lower()
    
    if not search_term or len(search_term) < 3:
        return jsonify({
            "success": False,
            "message": "Ingrese al menos 3 caracteres para buscar"
        }), 400
    
    try:
        # Usar la misma lógica que en la nueva implementación
        query = f'''
        SELECT CODIGO, DESCRIPCIO
        FROM MTMERCIA
        WHERE CODLINEA = 'ST' AND 
        (LOWER(CODIGO) LIKE '%{search_term}%' OR LOWER(DESCRIPCIO) LIKE '%{search_term}%')
        ORDER BY 
            CASE 
                WHEN LOWER(CODIGO) = '{search_term}' THEN 1
                WHEN LOWER(CODIGO) LIKE '{search_term}%' THEN 2
                WHEN LOWER(DESCRIPCIO) = '{search_term}' THEN 3
                WHEN LOWER(DESCRIPCIO) LIKE '{search_term}%' THEN 4
                ELSE 5
            END
        '''
        
        results = execute_query(query)
        
        spare_parts = []
        for row in results:
            if len(spare_parts) >= 30:
                break
                
            spare_parts.append({
                "code": row[0].strip() if row[0] else "",
                "description": row[1].strip() if row[1] else ""
            })
        
        if not spare_parts:
            return jsonify({
                "success": True,
                "parts": [],
                "count": 0,
                "message": "No se encontraron repuestos con ese criterio"
            })
            
        return jsonify({
            "success": True,
            "parts": spare_parts,
            "count": len(spare_parts)
        })
    
    except Exception as e:
        print(f"Error al buscar repuestos: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al buscar repuestos: {str(e)}"
        }), 500
