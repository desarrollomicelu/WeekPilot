from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from models.tickets import Tickets
from models.clients import Clients_tickets
from extensions import db
from utils.decorators import technician_access, admin_or_technician_access

view_technical_bp = Blueprint("view_technical", __name__, template_folder="templates") 

@view_technical_bp.route("/view_technical")
@login_required
@technician_access()
def view_technical():

    # Normalizar la cédula del usuario actual
    normalized_cedula = ''.join(c for c in current_user.cedula if c.isalnum())

    # Buscar tickets donde el documento del técnico coincida con la cédula normalizada
    tickets = []
    for ticket in Tickets.query.all():
        if ticket.technical_document:
            normalized_ticket_doc = ''.join(c for c in ticket.technical_document if c.isalnum())
            if normalized_ticket_doc == normalized_cedula:
                tickets.append(ticket)

    for ticket in tickets:
        print(f"Ticket ID: {ticket.id_ticket}, Cliente: {ticket.client}, Técnico: {ticket.technical_document}")


    # Cargar información adicional para cada ticket
    for ticket in tickets:
        if not hasattr(ticket, 'client_info') or ticket.client_info is None:
            ticket.client_info = Clients_tickets.query.get(ticket.client)
    
    return render_template(
        "view_technical.html",
        tickets=tickets
    )

# Actualizar Estado de Ticket (AJAX)
@view_technical_bp.route('/update_ticket_status_ajax', methods=['POST'])
@login_required
@admin_or_technician_access()
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
