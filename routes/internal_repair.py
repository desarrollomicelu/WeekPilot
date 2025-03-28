# routes/internal_repair.py

from flask import Blueprint, render_template, request, url_for, flash, redirect
from models.tickets import Tickets
from flask_login import login_required
from datetime import datetime

# Importa las funciones desde el módulo de servicios para romper el ciclo
from models.problemsTickets import Problems_tickets
from services.queries import get_product_code, get_product_reference, get_sertec, get_technicians
# Importa los modelos
from models.employees import Empleados
from models.clients import Clients_tickets
from models.tickets import Tickets
from extensions import db
from models.problems import Problems
from models.sparesTickets import Spares_tickets
from decimal import Decimal
from services.queries import get_spare_parts

internal_repair_bp = Blueprint("internal_repair", __name__, template_folder="templates")

@internal_repair_bp.route("/internal_repair", endpoint="internal_repair")
def internal_repair():
    """
    Ruta principal que muestra los datos de reparaciones internas en tablas.
    """
    # Obtener todos los tickets de reparación interna ordenados por fecha de creación (más recientes primero)
    repairs = Tickets.query.filter_by(type_of_service="1").order_by(Tickets.creation_date.desc()).all()
    tickets = Tickets.query.filter_by(type_of_service="1").order_by(Tickets.creation_date.desc()).all()

    print("Datos de los tickets:", tickets)
    print("Datos de las reparaciones:", repairs)

    
    # Obtener datos adicionales que puedan ser necesarios para mostrar en la vista
    technicians = get_technicians()
    sertec = get_sertec()
    
    return render_template(
        "internal_repair.html",
        repairs=repairs,
        technicians=technicians,
        sertec=sertec,
        tickets=tickets
    )

@internal_repair_bp.route("/create_ticketsRI", methods=["GET", "POST"], endpoint="create_ticketsRI")
def create_ticketsRI():
    """
    Ruta para la creación de tickets de reparación interna.
    """
    # Datos auxiliares para el formulario
    technicians = get_technicians()
    current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    reference = get_product_reference()
    product_code = get_product_code()
    sertec = get_sertec()
    
    problems_list = Problems.query.order_by(Problems.name).all()
    spare_parts = get_spare_parts()

    if request.method == "POST":
        try:
            # Obtener datos del formulario
            sede = request.form.get("sede")
            technical_name = request.form.get("technical_name")
            technical_document = request.form.get("documento")
            status = request.form.get("status")
            priority = request.form.get("priority")
            assigned = request.form.get("assigned")
            reference_selected = request.form.get("reference")
            product_code_selected = request.form.get("product_code")
            IMEI = request.form.get("IMEI") or ""  # Valor por defecto si es None
            service_value = request.form.get("service_value") or 0
            total = request.form.get("total") or 0
            spare_value = request.form.get("spare_value") or 0
            
            if not IMEI.isdigit():
                flash("Error: El IMEI solo puede contener números.", "danger")
                return redirect(url_for("internal_repair.create_ticketsRI"))

            if len(IMEI) > 15:
                flash("Error: El IMEI no puede tener más de 15 caracteres.", "danger")
                return redirect(url_for("internal_repair.create_ticketsRI"))
            
            # Validar campos obligatorios
            if not all([sede, technical_name, technical_document, status, priority, 
                        reference_selected, product_code_selected]):
                flash("Error: Todos los campos obligatorios deben ser completados.", "danger")
                return redirect(url_for("internal_repair.create_ticketsRI"))
            
            # Convertir valores a formato correcto
            try:
                service_value = float(service_value)
                total = float(total)
                spare_value = float(spare_value)
            except ValueError:
                flash("Error: Los valores numéricos deben ser válidos.", "danger")
                return redirect(url_for("internal_repair.create_ticketsRI"))
            
            # Convertir fecha si está presente
            if assigned and status == "Asignado":
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
                selected_problem_ids = [int(pid) for pid in selected_problem_ids]
            except ValueError:
                flash("Error: ID de problema inválido.", "danger")
                return redirect(url_for("internal_repair.create_ticketsRI"))
                
            selected_problems = Problems.query.filter(Problems.id.in_(selected_problem_ids)).all()
            
            if not selected_problems:
                flash("Error: No se encontraron los problemas seleccionados.", "danger")
                return redirect(url_for("internal_repair.create_ticketsRI"))
            
            # Crear nuevo ticket
            new_ticket = Tickets(
                state=status,
                priority=priority,
                technical_name=technical_name,
                technical_document=technical_document,
                product_code=product_code_selected,
                IMEI=IMEI,
                reference=reference_selected,
                type_of_service="1",
                city=sede,
                creation_date=datetime.now(),
                assigned=assigned if status == "Asignado" else None,
                received=None,
                in_progress=None,
                finished=None,
                spare_value=spare_value,
                service_value=service_value,
                total=total,
                client=None  # Ajusta según tu lógica de negocio
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
    
    # Para el método GET, renderizamos el formulario de creación
    return render_template(
        "create_ticketsRI.html",
        technicians=technicians,
        current_date=current_date,
        reference=reference,
        product_code=product_code,
        problems=problems_list,
        sertec=sertec,
        spare_parts=spare_parts
    )
    
    
#------editar ticketRI
@internal_repair_bp.route("/edit_tickets_RI/<int:ticket_id>", methods=["GET", "POST"])
@login_required
def edit_tickets_RI(ticket_id):
    spare_parts = get_spare_parts() 
    """
    Ruta para editar tickets de reparación interna existentes.
    """
    # Obtener el ticket a editar
    ticket = Tickets.query.get_or_404(ticket_id)
    selected_problem_ids = [problem.id for problem in ticket.problems]
    ticket_spares = Spares_tickets.query.filter_by(id_ticket=ticket_id).all()
    
    # Verificar que sea un ticket de reparación interna
    if ticket.type_of_service != "1":
        flash("Este ticket no es de reparación interna", "danger")
        return redirect(url_for("internal_repair.internal_repair"))
    
    # Obtener datos auxiliares para el formulario
    technicians = get_technicians()
    current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    reference = get_product_reference()
    product_code = get_product_code()
    sertec = get_sertec()
    problems_list = Problems.query.order_by(Problems.name).all()
    
    # Obtener los IDs de los problemas asociados al ticket
    selected_problem_ids = [problem.id for problem in ticket.problems]
    
    if request.method == "POST":
        try:
            # Obtener datos del formulario
            city = request.form.get("city", ticket.city)
            technical_name = request.form.get("technical_name", ticket.technical_name)
            technical_document = request.form.get("documento", ticket.technical_document)
            status = request.form.get("status", ticket.state)
            priority = request.form.get("priority", ticket.priority)
            reference_selected = request.form.get("reference", ticket.reference)
            product_code_selected = request.form.get("product_code", ticket.product_code)
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
                service_value = float(request.form.get("service_value", ticket.service_value))
                spare_value = float(request.form.get("spare_value", ticket.spare_value))
                total = float(request.form.get("total", ticket.total))
            except ValueError:
                flash("Error: Los valores numéricos deben ser válidos.", "danger")
                return redirect(url_for("internal_repair.edit_tickets_RI", ticket_id=ticket_id))
            
            # Obtener problemas seleccionados
            selected_problem_ids = request.form.getlist("device_problems[]")
            if not selected_problem_ids:
                # Si no se selecciona ningún problema, mantener los existentes
                selected_problem_ids = [problem.id for problem in ticket.problems]
                
            try:
                selected_problem_ids = [int(pid) for pid in selected_problem_ids]
            except ValueError:
                flash("Error: ID de problema inválido.", "danger")
                return redirect(url_for("internal_repair.edit_tickets_RI", ticket_id=ticket_id))
                
            selected_problems = Problems.query.filter(Problems.id.in_(selected_problem_ids)).all()
            
            if not selected_problems:
                # Si no se encuentran problemas, usar los existentes
                selected_problems = ticket.problems
            
            # Actualizar el ticket
            ticket.state = status
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
            if status == "Asignado" and not ticket.assigned:
                ticket.assigned = datetime.now()
            elif status == "Recibido" and not ticket.received:
                ticket.received = datetime.now()
            elif status == "En proceso" and not ticket.in_progress:
                ticket.in_progress = datetime.now()
            elif status == "Finalizado" and not ticket.finished:
                ticket.finished = datetime.now()
            
            # Actualizar problemas asociados
            ticket.problems = selected_problems

            spare_parts = get_spare_parts()
            current_spare_tickets = Spares_tickets.query.filter_by(id_ticket=ticket_id).all()

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
                flash("Ticket de reparación interna actualizado correctamente", "success")
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
    repuestos_ticket = Spares_tickets.query.filter_by(id_ticket=ticket_id).all()
    
    return render_template(
        "detail_RI.html", 
        ticket=ticket, 
        problemas_ticket=problemas_ticket,
        repuestos_ticket=repuestos_ticket
    )