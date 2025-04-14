from functools import wraps
from flask import flash, redirect, url_for
from flask_login import current_user

def role_required(*roles):
    """
    Decorador para restringir el acceso a rutas basado en roles de usuario.
    Recibe una lista de roles que tienen permiso para acceder a la ruta.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Verificar si el usuario está autenticado
            if not current_user.is_authenticated:
                flash("Por favor inicia sesión para acceder a esta página", "warning")
                return redirect(url_for('auth.login'))
            
            # Verificar si el usuario tiene un rol permitido
            if current_user.cargo not in roles:
                flash("No tienes permisos para acceder a esta sección", "error")
                
                # Redirigir según el rol del usuario
                if current_user.cargo == "servicioTecnico":
                    return redirect(url_for('view_technical.view_technical'))
                else:
                    return redirect(url_for('dashboard.dashboard'))
                
            # Si el usuario tiene el rol adecuado, permitir acceso
            return f(*args, **kwargs)
        
        return decorated_function
    
    return decorator

def admin_required(f):
    """
    Decorador para restringir el acceso solo a administradores
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            flash("Por favor inicia sesión para acceder a esta página", "warning")
            return redirect(url_for('auth.login'))
        
        if current_user.cargo != "Admin":
            flash("Esta sección está reservada para administradores", "error")
            
            # Redirigir según el rol
            if current_user.cargo == "servicioTecnico":
                return redirect(url_for('view_technical.view_technical'))
            else:
                return redirect(url_for('dashboard.dashboard'))
        
        return f(*args, **kwargs)
    
    return decorated_function

def technician_required(f):
    """
    Decorador para restringir el acceso solo a técnicos de servicio
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            flash("Por favor inicia sesión para acceder a esta página", "warning")
            return redirect(url_for('auth.login'))
        
        if current_user.cargo != "servicioTecnico":
            flash("Esta sección está reservada para técnicos de servicio", "error")
            return redirect(url_for('dashboard.dashboard'))
        
        return f(*args, **kwargs)
    
    return decorated_function 