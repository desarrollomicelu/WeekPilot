# routes/internal_repair.py

from flask import Blueprint, current_app, render_template, request, url_for, flash, redirect, jsonify
from models.tickets import Tickets
from flask_login import login_required
from datetime import datetime
from utils.access_control import role_required

# Importa las funciones desde el módulo de servicios para romper el ciclo
from models.problemsTickets import Problems_tickets
from services.queries import get_spare_name, get_product_information, get_sertec, get_technicians, execute_query
# Importa los modelos
from models.employees import Empleados
from models.clients import Clients_tickets
from models.tickets import Tickets
from extensions import db
from models.problems import Problems
from models.sparesTickets import Spares_tickets
from decimal import Decimal
from services.queries import get_spare_parts

internal_repair_bp = Blueprint('internal_repair', __name__, url_prefix='/internal_repair')


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


@internal_repair_bp.route("/internal_repair", endpoint="internal_repair")
@login_required
@role_required("Admin")
def internal_repair():
    """
    Ruta principal que muestra los datos de reparaciones internas en tablas.
    """
    # Obtener todos los tickets de reparación interna ordenados por fecha de creación (más recientes primero)
    tickets = Tickets.query.filter_by(type_of_service="1").order_by(
        Tickets.creation_date.desc()).all()

    # Obtener datos adicionales que puedan ser necesarios para mostrar en la vista
    technicians = get_technicians()
    sertec = get_sertec()

    return render_template(
        "internal_repair.html",
        repairs=tickets,  # Usar la misma lista para consistencia
        technicians=technicians,
        sertec=sertec,
        tickets=tickets
    )


@internal_repair_bp.route("/create_ticketsRI", methods=["GET", "POST"], endpoint="create_ticketsRI")
@login_required
@role_required("Admin")
def create_ticketsRI():
    """
    Ruta para la creación de tickets de reparación interna.
    """
    # Datos auxiliares para el formulario
    common_data = get_common_data()
    current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    technicians = get_technicians()
    reference = get_product_information()
    product_code = get_product_information()
    sertec = get_sertec()

    problems_list = Problems.query.order_by(Problems.name).all()
    spare_parts = get_spare_parts()

    if request.method == "POST":
        try:
            # Obtener datos del formulario
            city = request.form.get("city")
            technical_name = request.form.get("technical_name")
            technical_document = request.form.get("documento")
            state = request.form.get("state")
            priority = request.form.get("priority")
            assigned = request.form.get("assigned")
            reference_selected = request.form.get("reference")
            product_code_selected = request.form.get("product_code")
            # Valor por defecto si es None
            IMEI = request.form.get("IMEI") or ""
            service_value = request.form.get("service_value") or 0
            total = request.form.get("total") or 0
            spare_value = request.form.get("spare_value") or 0

            if IMEI:
                if not IMEI.isdigit():
                    flash("Error: El IMEI solo puede contener números.", "danger")
                    return redirect(url_for("internal_repair.create_ticketsRI"))

                if len(IMEI) != 15:
                    flash(
                        "Error: El IMEI debe contener exactamente 15 caracteres.", "danger")
                    return redirect(url_for("internal_repair.create_ticketsRI"))

            # Convertir valores a formato correcto
            try:
                # Limpiar valores antes de convertir
                service_value = service_value.replace('.', '').replace(
                    ',', '.') if isinstance(service_value, str) else service_value
                total = total.replace('.', '').replace(
                    ',', '.') if isinstance(total, str) else total
                spare_value = spare_value.replace('.', '').replace(
                    ',', '.') if isinstance(spare_value, str) else spare_value

                service_value = float(service_value)
                total = float(total)
                spare_value = float(spare_value)
            except ValueError:
                flash("Error: Los valores numéricos deben ser válidos.", "danger")
                return redirect(url_for("internal_repair.create_ticketsRI"))

            # Convertir fecha si está presente
            if assigned and state == "Asignado":
                try:
                    assigned = datetime.strptime(assigned, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    assigned = datetime.now()
            else:
                assigned = None

            # Obtener problemas seleccionados
            selected_problem_ids = request.form.getlist("device_problems[]")
            if not selected_problem_ids:
                flash("Error: Debe seleccionar al menos un problema.", "danger")
                return redirect(url_for("internal_repair.create_ticketsRI"))

            try:
                selected_problem_ids = [int(pid)
                                        for pid in selected_problem_ids]
            except ValueError:
                flash("Error: ID de problema inválido.", "danger")
                return redirect(url_for("internal_repair.create_ticketsRI"))

            selected_problems = Problems.query.filter(
                Problems.id.in_(selected_problem_ids)).all()

            if not selected_problems:
                flash("Error: No se encontraron los problemas seleccionados.", "danger")
                return redirect(url_for("internal_repair.create_ticketsRI"))

            creation_date = datetime.now()
            assigned = None
            received = None
            in_progress = None
            finished = None

            if state == "Asignado":
                assigned = datetime.now()
            elif state == "Recibido":
                received = datetime.now()
            elif state == "En proceso":
                in_progress = datetime.now()
            elif state == "Terminado":
                finished = datetime.now()

            # Crear nuevo ticket
            new_ticket = Tickets(
                state=state,
                priority=priority,
                technical_name=technical_name,
                technical_document=technical_document,
                product_code=product_code_selected,
                IMEI=IMEI,
                reference=reference_selected,
                type_of_service="1",
                city=city,
                creation_date=creation_date,
                assigned=assigned,
                received=received,
                in_progress=in_progress,
                finished=finished,
                spare_value=spare_value,
                service_value=service_value,
                total=total,
                client=None
            )

            # Agregar problemas al ticket
            for problem in selected_problems:
                new_ticket.problems.append(problem)

            # Guardar en la base de datos para obtener el id_ticket
            db.session.add(new_ticket)
            db.session.flush()  # Ejecuta la operación sin commit para obtener el id

            spare_codes = request.form.getlist("spare_part_code[]")
            quantities = request.form.getlist("part_quantity[]")
            unit_prices = request.form.getlist("part_unit_value[]")
            total_prices = request.form.getlist("part_total_value[]")

            for i in range(len(spare_codes)):
                if i < len(quantities) and i < len(unit_prices) and i < len(total_prices):
                    spare_code = spare_codes[i]
                    quantity = int(quantities[i])

                    # Limpiar valores antes de convertir
                    unit_price_str = unit_prices[i].replace('.', '').replace(
                        ',', '.') if isinstance(unit_prices[i], str) else unit_prices[i]
                    total_price_str = total_prices[i].replace('.', '').replace(
                        ',', '.') if isinstance(total_prices[i], str) else total_prices[i]

                    unit_price = float(unit_price_str)
                    total_price = float(total_price_str)

                    spare_ticket = Spares_tickets(
                        id_ticket=new_ticket.id_ticket,
                        spare_code=spare_code,
                        quantity=quantity,
                        unit_price=unit_price,
                        total_price=total_price
                    )
                    # Corregir la indentación aquí
                    db.session.add(spare_ticket)

            # Recalcular el valor total de repuestos y el total general
            total_spare_value = sum(float(price.replace('.', '').replace(',', '.')) if isinstance(
                price, str) else float(price) for price in total_prices) if total_prices else 0
            new_ticket.spare_value = total_spare_value
            new_ticket.total = new_ticket.service_value + new_ticket.spare_value

            # Confirmar todas las operaciones
            db.session.commit()

            flash("Ticket de reparación interna creado correctamente", "success")
            # Redirigir a la página principal de reparaciones internas
            return redirect(url_for("internal_repair.internal_repair"))

        except Exception as e:
            db.session.rollback()
            flash(f"Error al crear el ticket: {str(e)}", "danger")
            # Imprime el error en la consola para debug
            import traceback
            traceback.print_exc()
            return redirect(url_for("internal_repair.create_ticketsRI"))

    # Para el método GET, renderizamos el formulario de creación
    return render_template(
        "create_ticketsRI.html",
        current_date=current_date,
        **common_data
    )


# ------editar ticketRI
@internal_repair_bp.route("/edit_tickets_RI/<int:ticket_id>", methods=["GET", "POST"])
@login_required
@role_required("Admin")
def edit_tickets_RI(ticket_id):
    spare_parts = get_spare_parts()
    """
    Ruta para editar tickets de reparación interna existentes.
    """
    # Obtener el ticket a editar
    ticket = Tickets.query.get_or_404(ticket_id)

    # Verificar que el ticket no esté en estado "Terminado" o "Cancelado"
    if ticket.state in ["Terminado", "Cancelado"]:
        flash(
            f"No se puede editar un ticket en estado '{ticket.state}'", "warning")
        return redirect(url_for("internal_repair.detail_RI", ticket_id=ticket_id))

    selected_problem_ids = [problem.id for problem in ticket.problems]
    ticket_spares = Spares_tickets.query.filter_by(id_ticket=ticket_id).all()

    # Verificar que sea un ticket de reparación interna
    if ticket.type_of_service != "1":
        flash("Este ticket no es de reparación interna", "danger")
        return redirect(url_for("internal_repair.internal_repair"))

    # Obtener datos auxiliares para el formulario
    technicians = get_technicians()
    current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    reference = get_product_information()
    product_code = get_product_information()
    sertec = get_sertec()
    problems_list = Problems.query.order_by(Problems.name).all()

    if request.method == "POST":
        try:
            # Obtener datos del formulario
            city = request.form.get("city", ticket.city)
            technical_name = request.form.get(
                "technical_name", ticket.technical_name)
            technical_document = request.form.get(
                "documento", ticket.technical_document)
            state = request.form.get("state", ticket.state)
            priority = request.form.get("priority", ticket.priority)
            reference_selected = request.form.get(
                "reference", ticket.reference)
            product_code_selected = request.form.get(
                "product_code", ticket.product_code)
            IMEI = request.form.get("IMEI", ticket.IMEI) or ""

            # Validar IMEI
            if IMEI and not IMEI.isdigit():
                flash("Error: El IMEI solo puede contener números.", "danger")
                return redirect(url_for("internal_repair.edit_tickets_RI", ticket_id=ticket_id))

            if IMEI and len(IMEI) > 15:
                flash("Error: El IMEI no puede tener más de 15 caracteres.", "danger")
                return redirect(url_for("internal_repair.edit_tickets_RI", ticket_id=ticket_id))

            # Convertir valores numéricos
            try:
                service_value = float(request.form.get(
                    "service_value", ticket.service_value))
                spare_value = float(request.form.get(
                    "spare_value", ticket.spare_value))
                total = float(request.form.get("total", ticket.total))
            except ValueError:
                flash("Error: Los valores numéricos deben ser válidos.", "danger")
                return redirect(url_for("internal_repair.edit_tickets_RI", ticket_id=ticket_id))

            # Obtener problemas seleccionados
            selected_problem_ids = request.form.getlist("device_problems[]")
            if not selected_problem_ids:
                # Si no se selecciona ningún problema, mantener los existentes
                selected_problem_ids = [
                    problem.id for problem in ticket.problems]

            try:
                selected_problem_ids = [int(pid)
                                        for pid in selected_problem_ids]
            except ValueError:
                flash("Error: ID de problema inválido.", "danger")
                return redirect(url_for("internal_repair.edit_tickets_RI", ticket_id=ticket_id))

            selected_problems = Problems.query.filter(
                Problems.id.in_(selected_problem_ids)).all()

            if not selected_problems:
                # Si no se encuentran problemas, usar los existentes
                selected_problems = ticket.problems

            # Actualizar el ticket
            ticket.state = state
            ticket.priority = priority
            ticket.technical_name = technical_name
            ticket.technical_document = technical_document
            ticket.product_code = product_code_selected
            ticket.IMEI = IMEI
            ticket.reference = reference_selected
            ticket.city = city
            ticket.spare_value = spare_value
            ticket.service_value = service_value
            ticket.total = total

            # Actualizar fechas según el estado
            if state == "Asignado" and not ticket.assigned:
                ticket.assigned = datetime.now()
            elif state == "Recibido" and not ticket.received:
                ticket.received = datetime.now()
            elif state == "En proceso" and not ticket.in_progress:
                ticket.in_progress = datetime.now()
            elif state == "Terminado" and not ticket.finished:
                ticket.finished = datetime.now()

            # Actualizar problemas asociados
            ticket.problems = selected_problems

            spare_parts = get_spare_parts()
            current_spare_tickets = Spares_tickets.query.filter_by(
                id_ticket=ticket_id).all()

            for spare_ticket in current_spare_tickets:
                for spare_part in spare_parts:
                    if spare_part['code'] == spare_ticket.spare_code:
                        spare_ticket.spare_description = spare_part['description']
                        break
                else:
                    spare_ticket.spare_description = spare_ticket.spare_code

            spare_codes = request.form.getlist("spare_part_code[]")
            quantities = request.form.getlist("part_quantity[]")
            unit_prices = request.form.getlist("part_unit_value[]")
            total_prices = request.form.getlist("part_total_value[]")

            # Si no se proporcionan repuestos, mantener los existentes
            if not spare_codes:
                db.session.commit()
                flash(
                    "Ticket de reparación interna actualizado correctamente", "success")
                return redirect(url_for("internal_repair.internal_repair"))

            # Eliminar repuestos existentes
            Spares_tickets.query.filter_by(id_ticket=ticket_id).delete()

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

            ticket.spare_value = total_spare_value
            ticket.total = ticket.service_value + ticket.spare_value

            # Guardar cambios
            db.session.commit()
            flash("Ticket de reparación interna actualizado correctamente", "success")
            return redirect(url_for("internal_repair.internal_repair"))

        except Exception as e:
            db.session.rollback()
            flash(f"Error al actualizar el ticket: {str(e)}", "danger")
            import traceback
            traceback.print_exc()

    # Para el método GET, renderizamos el formulario de edición
    return render_template(
        "edit_tickets_RI.html",
        ticket=ticket,
        technicians=technicians,
        current_date=current_date,
        reference=reference,
        product_code=product_code,
        problems=problems_list,
        sertec=sertec,
        selected_problem_ids=selected_problem_ids,
        spare_parts=spare_parts,
        ticket_spares=ticket_spares
    )


@internal_repair_bp.route("/detail_RI/<int:ticket_id>", methods=["GET"], endpoint="detail_RI")
@login_required
@role_required("Admin")
def detalle_RI(ticket_id):
    """
    Ruta para mostrar los detalles de un ticket de reparación interna
    """
    # Obtener el ticket específico
    ticket = Tickets.query.get_or_404(ticket_id)

    # Verificar que sea un ticket de reparación interna
    if ticket.type_of_service != "1":
        flash("Este ticket no es de reparación interna", "danger")
        return redirect(url_for("internal_repair.internal_repair"))

    # Obtener problemas asociados
    problemas_ticket = ticket.problems

    # Obtener repuestos asociados directamente de Spares_tickets
    repuestos_ticket = Spares_tickets.query.filter_by(
        id_ticket=ticket_id).all()

    return render_template(
        "detail_RI.html",
        ticket=ticket,
        problemas_ticket=problemas_ticket,
        repuestos_ticket=repuestos_ticket
    )

# Ruta para actualizar el estado vía AJAX


@internal_repair_bp.route("/update_ticket_status_ajax", methods=["POST"])
@login_required
@role_required("Admin")
def update_ticket_status_ajax():
    """Actualiza el estado de un ticket vía AJAX"""
    try:
        # Aceptar tanto 'ticket_id' como 'id' para compatibilidad
        ticket_id = request.form.get('ticket_id')
        # Aceptar tanto 'state' como 'status' para compatibilidad con todos los módulos
        new_status = request.form.get('state') or request.form.get('status')

        if not ticket_id or not new_status:
            return jsonify({'success': False, 'message': 'Faltan datos requeridos'}), 400

        ticket = Tickets.query.get_or_404(ticket_id)

        # Guardar el estado anterior para el mensaje
        previous_status = ticket.state
        print(
            f"Actualizando ticket #{ticket_id} de estado '{previous_status}' a '{new_status}'")

        # Definir el orden de los estados (de menor a mayor progreso)
        state_order = {
            "Sin asignar": 1,
            "Asignado": 2,
            "Reingreso": 3,
            "En proceso": 4,
            "En Revision": 5,
            "Terminado": 6,
            "Cancelado": 6  # Mismo nivel que Terminado
        }

        # Validar que no sea un retroceso de estado
        if state_order.get(new_status, 0) < state_order.get(previous_status, 0):
            return jsonify({
                'success': False,
                'message': f'No se permite cambiar el estado de "{previous_status}" a "{new_status}". No se permite retroceder en el flujo de estados.'
            }), 400

        # Actualizar estado y obtener timestamp usando el método del modelo
        timestamp = ticket.update_state(new_status)

        # Marcar explícitamente el campo modificado según el estado
        from sqlalchemy.orm.attributes import flag_modified
        if new_status == "Asignado":
            flag_modified(ticket, "assigned")
        elif new_status == "Reingreso":
            flag_modified(ticket, "re_entry")
        elif new_status == "En proceso":
            flag_modified(ticket, "in_progress")
        elif new_status == "En Revision":
            flag_modified(ticket, "in_revision")
            print(
                f"Flagged in_revision as modified. Value: {ticket.in_revision}")
        elif new_status == "Terminado":
            flag_modified(ticket, "finished")
        elif new_status == "Recibido":
            flag_modified(ticket, "received")

        # Guardar cambios en la base de datos
        db.session.commit()

        # Verificar después del commit (para depuración)
        if new_status == "En Revision":
            ticket_verificado = Tickets.query.get(ticket_id)
            print(
                f"Timestamp in_revision después del commit: {ticket_verificado.in_revision}")

        # Formatear la hora para mostrarla en la UI
        formatted_time = timestamp.strftime("%d/%m/%Y %H:%M:%S")

        return jsonify({
            'success': True,
            'message': f'Estado actualizado de "{previous_status}" a "{new_status}"',
            'status': new_status,
            'timestamp': formatted_time
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

# Ruta para la vista del tecnico


@internal_repair_bp.route("/technicianRI_view", methods=["GET"], endpoint="technicianRI_view")
@login_required
@role_required("Admin")
def technician_view():
    """
    Ruta para que los técnicos vean sus tickets asignados.
    """
    # Obtener el nombre del técnico actual (del usuario logueado)
    # current_user_name = current_user.name  # Ajusta esto según tu modelo de usuario

    # Obtener todos los tickets asignados al técnico actual
    assigned_tickets = Tickets.query.filter_by(
        type_of_service="1").order_by(Tickets.creation_date.asc()).all()

    return render_template(
        "view_technicalRI.html",
        assigned_tickets=assigned_tickets,
        is_technician_view=True  # Añadimos esta variable para controlar la vista
    )


@internal_repair_bp.route("/update_ticket_progress", methods=["POST"])
@login_required
@role_required("Admin")
def update_ticket_progress():
    """Actualiza el estado de un ticket de reparación interna desde la vista del técnico"""
    try:
        ticket_id = request.json.get('ticket_id')
        new_status = request.json.get('status')
        notes = request.json.get('notes', '')  # Opcional: notas de progreso

        if not ticket_id or not new_status:
            return jsonify({'success': False, 'message': 'Faltan datos requeridos'}), 400

        ticket = Tickets.query.get_or_404(ticket_id)

        # Verificar que sea un ticket de reparación interna
        if ticket.type_of_service != "1":
            return jsonify({'success': False, 'message': 'Este ticket no es de reparación interna'}), 400

        # Guardar el estado anterior para el mensaje
        previous_status = ticket.state

        # Actualizar estado y obtener timestamp usando el método del modelo
        timestamp = ticket.update_state(new_status)

        # Marcar explícitamente el campo modificado según el estado
        from sqlalchemy.orm.attributes import flag_modified
        if new_status == "Asignado":
            flag_modified(ticket, "assigned")
        elif new_status == "Reingreso":
            flag_modified(ticket, "re_entry")
        elif new_status == "En proceso":
            flag_modified(ticket, "in_progress")
        elif new_status == "En Revision":
            flag_modified(ticket, "in_revision")
            print(
                f"Flagged in_revision as modified. Value: {ticket.in_revision}")
        elif new_status == "Terminado":
            flag_modified(ticket, "finished")
        elif new_status == "Recibido":
            flag_modified(ticket, "received")

        # Aquí podrías guardar las notas en una tabla de historial si lo necesitas

        # Guardar cambios en la base de datos
        db.session.commit()

        # Verificar después del commit (para depuración)
        if new_status == "En Revision":
            ticket_verificado = Tickets.query.get(ticket_id)
            print(
                f"Timestamp in_revision después del commit: {ticket_verificado.in_revision}")

        return jsonify({
            'success': True,
            'message': f'Estado actualizado de "{previous_status}" a "{new_status}"',
            'ticket_id': ticket_id,
            'new_status': new_status
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@internal_repair_bp.route("/search_products", methods=["POST"])
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


@internal_repair_bp.route("/search_spare_parts", methods=["POST"])
@login_required
@role_required("Admin")
def search_spare_parts():
    """
    Ruta para buscar repuestos basados en un término de búsqueda.
    """
    search_term = request.form.get('search', '')

    if not search_term or len(search_term) < 3:
        return jsonify({'parts': []})

    # Obtener todos los repuestos
    all_spare_parts = get_spare_parts()

    # Filtrar repuestos basados en el término de búsqueda
    filtered_parts = []
    search_term = search_term.lower()

    for part in all_spare_parts:
        code = part['code'].lower()
        description = part['description'].lower()

        if search_term in code or search_term in description:
            filtered_parts.append(part)

    # Ordenar resultados para que los más relevantes aparezcan primero
    # (los que comienzan con el término de búsqueda)
    def sort_key(part):
        code = part['code'].lower()
        description = part['description'].lower()

        if code.startswith(search_term):
            return 0
        elif description.startswith(search_term):
            return 1
        else:
            return 2

    filtered_parts.sort(key=sort_key)

    # Limitar a 50 resultados para evitar sobrecarga
    filtered_parts = filtered_parts[:50]

    return jsonify({'parts': filtered_parts})


# Filtrar tickets por ciudad
@internal_repair_bp.route("/filter_by_city", methods=["POST"])
@login_required
@role_required("Admin")
def filter_by_city():
    try:
        # Log para verificar que se está accediendo a la ruta
        current_app.logger.info("Solicitud recibida en /internal_repair/filter_by_city")
        
        # Verificar el formato de la solicitud
        if not request.is_json:
            current_app.logger.error("La solicitud no es JSON")
            return jsonify({'success': False, 'message': "La solicitud debe ser JSON"}), 400
            
        # Obtener datos de la solicitud
        data = request.get_json()
        current_app.logger.info(f"Datos recibidos: {data}")
        
        city = data.get('city')
        current_app.logger.info(f"Ciudad solicitada: {city}")
        
        if not city or city.lower() == 'todas':
            # Si no hay ciudad o es "todas", devolvemos todos los tickets
            current_app.logger.info("Filtrando todos los tickets (todas las ciudades)")
            tickets = Tickets.query.filter_by(type_of_service="1").order_by(
                Tickets.creation_date.desc()).all()
            current_app.logger.info(f"Tickets encontrados: {len(tickets)}")
        else:
            # Filtrar por la ciudad específica
            city_name = "Medellín" if city.lower() == "medellin" else "Bogotá"
            current_app.logger.info(f"Filtrando por ciudad: {city_name}")
            tickets = Tickets.query.filter_by(type_of_service="1", city=city_name).order_by(
                Tickets.creation_date.desc()).all()
            current_app.logger.info(f"Tickets encontrados: {len(tickets)}")
        
        # Convertir tickets a formato JSON
        tickets_data = []
        for ticket in tickets:
            # Crear diccionario con datos del ticket
            ticket_dict = {
                'id_ticket': ticket.id_ticket,
                'reference': ticket.reference or "",
                'state': ticket.state,
                'priority': ticket.priority,
                'city': ticket.city,
                'technical_name': ticket.technical_name,
                'service_value': float(ticket.service_value) if ticket.service_value else 0,
                'spare_value': float(ticket.spare_value) if ticket.spare_value else 0,
                'total': float(ticket.total) if ticket.total else 0
            }
            tickets_data.append(ticket_dict)
        
        # Log de la respuesta
        current_app.logger.info(f"Enviando respuesta con {len(tickets_data)} tickets")
        return jsonify({'success': True, 'tickets': tickets_data})
    except Exception as e:
        current_app.logger.error(f"Error filtrando tickets por ciudad: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'message': f"Error: {str(e)}"}), 500

