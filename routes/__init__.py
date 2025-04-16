# routes/__init__.py

from .auth import auth_bp
from .dashboard import dashboard_bp  
from .internal_repair import internal_repair_bp
from .technical_service import technical_service_bp
from .upload_images import upload_images_bp
from .warranty import warranty_bp
from .view_technical import view_technical_bp
from .onedrive import onedrive_bp

def register_blueprints(app):
    """
    Registra todos los Blueprints de la aplicación.
    """
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(internal_repair_bp)
    app.register_blueprint(technical_service_bp)
    app.register_blueprint(upload_images_bp)
    app.register_blueprint(warranty_bp)
    app.register_blueprint(view_technical_bp)
    app.register_blueprint(onedrive_bp)
    
