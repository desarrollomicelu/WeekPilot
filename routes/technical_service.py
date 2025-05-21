# routes/technical_service.py
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, current_app, session
from flask_login import login_required
from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm.attributes import flag_modified
import json
# Importa las funciones desde el módulo de servicios
from config import execute_query
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
    try:
        common_data = get_common_data()
        current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    except Exception as e:
        current_app.logger.error(f"Error cargando datos comunes: {str(e)}", exc_info=True)
        flash(f"Error al cargar datos necesarios: {str(e)}", "danger")
        return redirect(url_for("technical_service.list_tickets"))

    if request.method == "POST":
        try:
            # Log de datos recibidos
            current_app.logger.info(f"Datos de formulario recibidos: {request.form}")
            
            # Datos del cliente
            client_data = {}
            try:
                client_data["names"] = request.form.get("client_names")
                client_data["lastnames"] = request.form.get("client_lastnames")
                client_data["document"] = request.form.get("document")
                client_data["mail"] = request.form.get("mail")
                client_data["phone"] = request.form.get("phone")
                
                # Validar datos del cliente
                if not client_data["document"]:
                    flash("El documento del cliente es obligatorio", "danger")
                    return redirect(url_for("technical_service.create_ticket", error="validation", error_detail="Documento del cliente obligatorio"))
                if not client_data["names"] or not client_data["lastnames"]:
                    flash("El nombre y apellido del cliente son obligatorios", "danger")
                    return redirect(url_for("technical_service.create_ticket", error="validation", error_detail="Nombre y apellido del cliente obligatorios"))
                if client_data["mail"] and '@' not in client_data["mail"]:
                    flash("El formato del correo electrónico no es válido", "danger")
                    return redirect(url_for("technical_service.create_ticket", error="validation", error_detail="Formato de correo electrónico inválido"))
            except Exception as e:
                current_app.logger.error(f"Error procesando datos del cliente: {str(e)}", exc_info=True)
                flash(f"Error procesando datos del cliente: {str(e)}", "danger")
                return redirect(url_for("technical_service.create_ticket", error="client", error_detail=f"Error en datos del cliente: {str(e)}"))
            
            # Datos del ticket
            ticket_data = {}
            try:
                ticket_data["technical_name"] = request.form.get("technical_name")
                ticket_data["technical_document"] = request.form.get("technical_document")
                ticket_data["state"] = request.form.get("state")
                ticket_data["priority"] = request.form.get("priority")
                ticket_data["city"] = request.form.get("city")
                ticket_data["type_of_service"] = request.form.get("type_of_service") or "0"
                ticket_data["IMEI"] = request.form.get("IMEI")
                ticket_data["reference"] = request.form.get("reference")
                ticket_data["product_code"] = request.form.get("product_code")
                ticket_data["comment"] = request.form.get("comment")
                
                # Validar datos del ticket
                if not ticket_data["state"]:
                    flash("El estado del ticket es obligatorio", "danger")
                    return redirect(url_for("technical_service.create_ticket", error="validation", error_detail="Estado del ticket obligatorio"))
                if not ticket_data["priority"]:
                    flash("La prioridad del ticket es obligatoria", "danger")
                    return redirect(url_for("technical_service.create_ticket", error="validation", error_detail="Prioridad del ticket obligatoria"))
                if not ticket_data["city"]:
                    flash("La ciudad es obligatoria", "danger")
                    return redirect(url_for("technical_service.create_ticket", error="validation", error_detail="Ciudad obligatoria"))
                if not ticket_data["reference"]:
                    flash("La referencia del producto es obligatoria", "danger")
                    return redirect(url_for("technical_service.create_ticket", error="validation", error_detail="Referencia del producto obligatoria"))
                # Validar IMEI (si está presente)
                if ticket_data["IMEI"] and (not ticket_data["IMEI"].isdigit() or len(ticket_data["IMEI"]) != 15):
                    flash("El IMEI debe ser un número de 15 dígitos", "danger")
                    return redirect(url_for("technical_service.create_ticket", error="validation", error_detail="IMEI debe tener 15 dígitos numéricos"))
                if ticket_data["comment"] and len(ticket_data["comment"]) > 500:
                    flash("El comentario no puede tener más de 500 caracteres", "danger")
                    return redirect(url_for("technical_service.create_ticket", error="validation", error_detail="Comentario demasiado largo (máximo 500 caracteres)"))
            except Exception as e:
                current_app.logger.error(f"Error procesando datos del ticket: {str(e)}", exc_info=True)
                flash(f"Error procesando datos del ticket: {str(e)}", "danger")
                return redirect(url_for("technical_service.create_ticket", error="ticket", error_detail=f"Error en datos del ticket: {str(e)}"))
            
            # Valores financieros
            values_data = {}
            try:
                # Eliminar separadores de miles antes de convertir a float
                service_value_str = request.form.get("service_value", "0")
                spare_value_str = request.form.get("spare_value", "0")
                
                # Limpiar los valores de cualquier formato (puntos como separadores de miles)
                service_value_str = service_value_str.replace(".", "").replace(",", ".")
                spare_value_str = spare_value_str.replace(".", "").replace(",", ".")
                
                service_value = float(service_value_str or 0)
                spare_value = float(spare_value_str or 0)
                total = service_value + spare_value
                
                if service_value < 0 or spare_value < 0:
                    flash("Los valores no pueden ser negativos", "danger")
                    return redirect(url_for("technical_service.create_ticket", error="validation", error_detail="Los valores financieros no pueden ser negativos"))
                
                values_data["service_value"] = service_value
                values_data["spare_value"] = spare_value
                values_data["total"] = total
            except ValueError as e:
                current_app.logger.error(f"Error en formato de valores financieros: {str(e)}", exc_info=True)
                flash(f"Error: Los valores del servicio técnico y repuestos deben ser numéricos. Detalle: {str(e)}", "danger")
                return redirect(url_for("technical_service.create_ticket", error="validation", error_detail=f"Error en formato de valores financieros: {str(e)}"))
            except Exception as e:
                current_app.logger.error(f"Error procesando valores financieros: {str(e)}", exc_info=True)
                flash(f"Error procesando valores financieros: {str(e)}", "danger")
                return redirect(url_for("technical_service.create_ticket", error="validation", error_detail=f"Error en valores financieros: {str(e)}"))
            
            # Problemas
            try:
                selected_problem_ids = request.form.getlist("device_problems[]")
                
                # Validar que se haya seleccionado al menos un problema
                if not selected_problem_ids:
                    flash("Debe seleccionar al menos un problema", "danger")
                    return redirect(url_for("technical_service.create_ticket", error="validation", error_detail="Debe seleccionar al menos un problema"))
            except Exception as e:
                current_app.logger.error(f"Error procesando problemas: {str(e)}", exc_info=True)
                flash(f"Error procesando problemas: {str(e)}", "danger")
                return redirect(url_for("technical_service.create_ticket", error="validation", error_detail=f"Error en selección de problemas: {str(e)}"))

            # Fechas
            try:
                creation_date = datetime.now()
                assigned = None
                in_progress = None
                in_revision = None
                finished = None

                # Si el estado es "Asignado", registrar la fecha de asignación
                if ticket_data["state"] == "Asignado":
                    assigned = datetime.now()

                if ticket_data["state"] == "En proceso":
                    in_progress = datetime.now()

                if ticket_data["state"] == "En Revision":
                    in_revision = datetime.now()

                if ticket_data["state"] == "Terminado":
                    finished = datetime.now()
            except Exception as e:
                current_app.logger.error(f"Error procesando fechas: {str(e)}", exc_info=True)
                flash(f"Error procesando fechas: {str(e)}", "danger")
                return redirect(url_for("technical_service.create_ticket"))

            # Crear o buscar cliente
            try:
                client = Clients_tickets.query.filter_by(document=client_data["document"]).first()
                if not client:
                    client = Clients_tickets(
                        document=client_data["document"],
                        name=client_data["names"],
                        lastname=client_data["lastnames"],
                        mail=client_data["mail"],
                        phone=client_data["phone"],
                    )
                    db.session.add(client)
                    db.session.commit()
                    current_app.logger.info(f"Cliente creado: ID {client.id_client}, Documento {client.document}")
            except Exception as e:
                db.session.rollback()
                current_app.logger.error(f"Error creando cliente: {str(e)}", exc_info=True)
                flash(f"Error creando cliente: {str(e)}", "danger")
                return redirect(url_for("technical_service.create_ticket", error="client", error_detail=f"Error al crear o actualizar cliente: {str(e)}"))

            # Obtener problemas seleccionados
            try:
                selected_problems = Problems.query.filter(
                    Problems.id.in_(selected_problem_ids)).all()
                
                if len(selected_problems) != len(selected_problem_ids):
                    current_app.logger.warning(f"Algunos problemas seleccionados no existen en la base de datos")
            except Exception as e:
                current_app.logger.error(f"Error obteniendo problemas: {str(e)}", exc_info=True)
                flash(f"Error al obtener problemas: {str(e)}", "danger")
                return redirect(url_for("technical_service.create_ticket", error="server", error_detail=f"Error al obtener problemas de la base de datos: {str(e)}"))

            # Crear el nuevo ticket
            try:
                new_ticket = Tickets(
                    technical_name=ticket_data["technical_name"],
                    technical_document=ticket_data["technical_document"],
                    state=ticket_data["state"],
                    priority=ticket_data["priority"],
                    IMEI=ticket_data["IMEI"],
                    comment=ticket_data["comment"],
                    city=ticket_data["city"],
                    type_of_service=ticket_data["type_of_service"],
                    reference=ticket_data["reference"],
                    product_code=ticket_data["product_code"],
                    service_value=values_data["service_value"],
                    spare_value=values_data["spare_value"],
                    total=values_data["total"],
                    client=client.id_client,
                    creation_date=creation_date,
                    assigned=assigned,
                    in_progress=in_progress,
                    in_revision=in_revision,
                    finished=finished,
                )

                # Asociar problemas al ticket
                for problem in selected_problems:
                    new_ticket.problems.append(problem)

                db.session.add(new_ticket)
                db.session.commit()
                current_app.logger.info(f"Ticket creado: ID {new_ticket.id_ticket}")
            except Exception as e:
                db.session.rollback()
                current_app.logger.error(f"Error creando ticket: {str(e)}", exc_info=True)
                flash(f"Error creando ticket: {str(e)}", "danger")
                return redirect(url_for("technical_service.create_ticket", error="ticket", error_detail=f"Error al crear ticket en base de datos: {str(e)}"))

            # Procesar repuestos
            try:
                spare_codes = request.form.getlist("spare_part_code[]")
                quantities = request.form.getlist("part_quantity[]")
                unit_prices = request.form.getlist("part_unit_value[]")
                total_prices = request.form.getlist("part_total_value[]")
                
                current_app.logger.info(f"Repuestos recibidos: {len(spare_codes)} items")
                
                total_spare_value = 0
                for i in range(len(spare_codes)):
                    if not spare_codes[i]:  # Saltar si no hay código de repuesto
                        continue
                        
                    # Verificar que haya cantidad
                    if i >= len(quantities) or not quantities[i]:
                        flash(f"Falta la cantidad para el repuesto {spare_codes[i]}", "danger")
                        # Intentar eliminar el ticket creado para evitar problemas
                        try:
                            db.session.delete(new_ticket)
                            db.session.commit()
                        except:
                            db.session.rollback()
                        return redirect(url_for("technical_service.create_ticket", error="spares", error_detail=f"Falta cantidad para repuesto {spare_codes[i]}"))

                    try:
                        quantity = int(quantities[i])
                        if quantity <= 0:
                            flash(f"La cantidad del repuesto {spare_codes[i]} debe ser mayor a cero", "danger")
                            db.session.delete(new_ticket)
                            db.session.commit()
                            return redirect(url_for("technical_service.create_ticket", error="spares", error_detail=f"Cantidad debe ser mayor a cero para repuesto {spare_codes[i]}"))
                    except ValueError:
                        flash(f"La cantidad del repuesto {spare_codes[i]} debe ser un número", "danger")
                        db.session.delete(new_ticket)
                        db.session.commit()
                        return redirect(url_for("technical_service.create_ticket", error="spares", error_detail=f"Cantidad inválida para repuesto {spare_codes[i]}"))

                    # Verificar precio unitario - limpiar separadores de miles
                    try:
                        unit_price_str = unit_prices[i].replace(".", "").replace(",", ".")
                        unit_price_val = float(unit_price_str)
                        if unit_price_val < 0:
                            flash(f"El precio unitario del repuesto {spare_codes[i]} no puede ser negativo", "danger")
                            db.session.delete(new_ticket)
                            db.session.commit()
                            return redirect(url_for("technical_service.create_ticket", error="spares", error_detail=f"Precio no puede ser negativo para repuesto {spare_codes[i]}"))
                    except (ValueError, IndexError):
                        flash(f"El precio unitario del repuesto {spare_codes[i]} debe ser un número válido", "danger")
                        db.session.delete(new_ticket)
                        db.session.commit()
                        return redirect(url_for("technical_service.create_ticket", error="spares", error_detail=f"Precio unitario inválido para repuesto {spare_codes[i]}"))

                    # Verificar precio total
                    try:
                        total_price_str = total_prices[i].replace(".", "").replace(",", ".")
                        total_price_val = float(total_price_str)
                    except (ValueError, IndexError):
                        # Calcular el precio total en lugar de fallar
                        total_price_val = quantity * unit_price_val
                        current_app.logger.warning(f"Precio total recalculado para repuesto {spare_codes[i]}")

                    spare_ticket = Spares_tickets(
                        id_ticket=new_ticket.id_ticket,
                        spare_code=spare_codes[i],
                        quantity=quantity,
                        unit_price=unit_price_val,
                        total_price=total_price_val
                    )
                    db.session.add(spare_ticket)
                    total_spare_value += total_price_val
                
                # Actualizar totales si es necesario
                if abs(total_spare_value - values_data["spare_value"]) > 0.01:  # Pequeño margen por errores de redondeo
                    current_app.logger.warning(f"Valor de repuestos recalculado: {total_spare_value} vs {values_data['spare_value']}")
                    new_ticket.spare_value = total_spare_value
                    new_ticket.total = new_ticket.service_value + Decimal(str(total_spare_value))
                
                db.session.commit()
                current_app.logger.info(f"Repuestos agregados al ticket ID {new_ticket.id_ticket}")
            except Exception as e:
                db.session.rollback()
                # Intentar eliminar el ticket si falló el procesamiento de repuestos
                try:
                    if new_ticket and new_ticket.id_ticket:
                        db.session.delete(new_ticket)
                        db.session.commit()
                except:
                    db.session.rollback()

                current_app.logger.error(f"Error procesando repuestos: {str(e)}", exc_info=True)
                flash(f"Error procesando repuestos: {str(e)}", "danger")
                return redirect(url_for("technical_service.create_ticket", error="spares", error_detail=f"Error procesando repuestos: {str(e)}"))

            flash("Ticket creado correctamente", "success")
            return redirect(url_for("technical_service.list_tickets") + "?ticket_created=success")
            
        except Exception as e:
            # Capturar cualquier excepción no manejada
            db.session.rollback()
            current_app.logger.error(f"Error general creando ticket: {str(e)}", exc_info=True)
            flash(f"Error inesperado: {str(e)}", "danger")
            return redirect(url_for("technical_service.create_ticket"))

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
    ticket_spares = Spares_tickets.query.filter_by(id_ticket=ticket_id).all()
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
        ticket_spares=ticket_spares,
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

@technical_service_bp.route("/search_products", methods=["POST"])
@login_required
@role_required("Admin")
def search_products():
    """
    Ruta para buscar productos basados en un término de búsqueda.
    Similar a la búsqueda de repuestos pero para productos.
    """
    search_term = request.form.get('search', '')
    
    if not search_term or len(search_term) < 3:
        return jsonify({'products': []})
    
    # Obtener todos los productos
    all_products = get_product_information()
    
    # Filtrar productos basados en el término de búsqueda
    filtered_products = []
    search_term = search_term.lower()
    
    for product in all_products:
        code = product['CODIGO'].lower()
        description = product['DESCRIPCIO'].lower()
        
        if search_term in code or search_term in description:
            filtered_products.append(product)
    
    # Ordenar resultados para que los más relevantes aparezcan primero
    # (los que comienzan con el término de búsqueda)
    def sort_key(product):
        code = product['CODIGO'].lower()
        description = product['DESCRIPCIO'].lower()
        
        if code.startswith(search_term):
            return 0
        elif description.startswith(search_term):
            return 1
        else:
            return 2
    
    filtered_products.sort(key=sort_key)
    
    return jsonify({'products': filtered_products})

# Ruta original para búsqueda de repuestos (para compatibilidad)
@technical_service_bp.route("/search_spare_parts", methods=["POST"])
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
