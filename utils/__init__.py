# Este archivo hace que la carpeta utils sea reconocida como un módulo Python 

# Importar únicamente los decoradores de control de acceso
from utils.access_control import (
    role_required,
    admin_required,
    technician_required
)

# Exportar los decoradores para facilitar su importación
__all__ = ['role_required', 'admin_required', 'technician_required'] 