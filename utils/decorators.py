from functools import wraps
from flask import flash, redirect, url_for
from flask_login import current_user

def role_required(role):
    """
    Decorador para verificar si el usuario tiene el rol requerido
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                flash("Debes iniciar sesión para acceder a esta página", "warning")
                return redirect(url_for('auth.login'))
            
            if current_user.cargo != role:
                flash(f"No tienes permisos para acceder a esta página. Se requiere rol: {role}", "danger")
                return redirect(url_for('auth.login'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def technician_access():
    """
    Decorador específico para verificar si el usuario es un técnico
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                flash("Debes iniciar sesión para acceder a esta página", "warning")
                return redirect(url_for('auth.login'))
            
            if current_user.cargo != "servicioTecnico":
                flash("No tienes permisos para acceder a esta página. Se requiere ser técnico.", "danger")
                return redirect(url_for('auth.login'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def technician_ticket_access():
    """
    Decorador para verificar si el técnico tiene acceso a un ticket específico
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from models.tickets import Tickets
            
            if not current_user.is_authenticated:
                flash("Debes iniciar sesión para acceder a esta página", "warning")
                return redirect(url_for('auth.login'))
            
            if current_user.cargo != "servicioTecnico":
                flash("No tienes permisos para acceder a esta página", "danger")
                return redirect(url_for('auth.login'))
            
            # Obtener el ID del ticket de los argumentos
            ticket_id = kwargs.get('ticket_id')
            if not ticket_id:
                flash("ID de ticket no proporcionado", "danger")
                return redirect(url_for('view_technical.view_technical'))
            
            # Verificar si el ticket está asignado al técnico actual
            ticket = Tickets.query.get(ticket_id)
            if not ticket:
                flash("Ticket no encontrado", "danger")
                return redirect(url_for('view_technical.view_technical'))
            
            if ticket.technical_document != current_user.cedula:
                flash("No tienes acceso a este ticket", "danger")
                return redirect(url_for('view_technical.view_technical'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def admin_or_technician_access():
    """
    Decorador para permitir acceso tanto a administradores como a técnicos
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                flash("Debes iniciar sesión para acceder a esta página", "warning")
                return redirect(url_for('auth.login'))
            
            if current_user.cargo not in ["Admin", "servicioTecnico"]:
                flash("No tienes permisos para acceder a esta página.", "danger")
                return redirect(url_for('auth.login'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
