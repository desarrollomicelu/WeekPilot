from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, login_required, logout_user, UserMixin
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from datetime import datetime
import pyodbc

# Si deseas usar alguna librería para PDF, por ejemplo, xhtml2pdf:
# from xhtml2pdf import pisa
# import io

app = Flask(__name__)

def execute_query(query):
    # Conectar a la base de datos
    conn = pyodbc.connect('''DRIVER={ODBC Driver 18 for SQL Server};
                             SERVER=20.109.21.246;
                             DATABASE=MICELU;
                             UID=db_read;
                             PWD=mHRL_<='(],#aZ)T"A3QeD;
                             TrustServerCertificate=yes''')
    cursor = conn.cursor()

    # Ejecutar la consulta
    cursor.execute(query)
    
    # Traer todos los resultados
    results = cursor.fetchall()

    # Cerrar la conexión
    cursor.close()
    conn.close()

    return results
# Función para obtener las descripciones de los productos
def get_product_reference():
    query = '''
    SELECT DESCRIPCIO, CODLINEA
    FROM MTMERCIA 
    WHERE CODLINEA = 'CEL' OR CODLINEA = 'CYT'
    '''
    # Ejecutar la consulta y obtener los resultados
    results = execute_query(query)

    # Convertir los resultados a un formato adecuado
    reference = []
    for row in results:
        reference.append({
            "description": row[0],  # DESCRIPCIO
            "CODLINEA": row[1]      # CODLINEA
        })

    return reference


# Función para obtener los códigos de los productos
def get_product_code():
    query = '''
    SELECT CODIGO, CODLINEA
    FROM MTMERCIA 
    WHERE CODLINEA = 'CEL' OR CODLINEA = 'CYT'
    '''
    # Ejecutar la consulta y obtener los resultados
    results = execute_query(query)

    # Convertir los resultados a un formato adecuado
    product_code = []
    for row in results:
        product_code.append({
            "id": row[0],        # CODIGO
            "CODLINEA": row[1]   # CODLINEA
        })
    
    return product_code



def get_technicians():
    query = """
        SELECT NOMBRE 
        FROM Venden 
        WHERE COMENTARIO LIKE '%ASESOR SERVICIO TECNICO%' 
        OR COMENTARIO LIKE '%TECNICO MEDELLIN%' 
        OR COMENTARIO LIKE '%REPARACIÒN%'
    """
    # Ejecutar la consulta y obtener los resultados
    results = execute_query(query)

    return results




# Definir la URI predeterminada (default bind)
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://postgres:vWUiwzFrdvcyroebskuHXMlBoAiTfgzP@junction.proxy.rlwy.net:47834/railway"

app.config["SQLALCHEMY_BINDS"] = {
    # Base de datos de empleados (db1)
    "db1": "postgresql://postgres:aAB2Be35CBAd2GgA5*DdC45FaCf26G44@viaduct.proxy.rlwy.net:58920/railway",
    # Otra base de datos (db2) según tu configuración
    "db2": "postgresql://postgres:japrWZtfUvaBYEyfGtYKwmleuIYvKWMs@viaduct.proxy.rlwy.net:43934/railway",
    # Base de datos para Tickets y Clients_tickets (db3)
    "db3": "postgresql://postgres:vWUiwzFrdvcyroebskuHXMlBoAiTfgzP@junction.proxy.rlwy.net:47834/railway",
    "db4": 'mssql+pyodbc://db_read:mHRL_<=''(],#aZ)T"A3QeD@20.109.21.246/MICELU?''driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes'
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "aAB2Be35CBAd2GgA5*DdC45FaCf26G44"

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.needs_login_message = "Acceso denegado. Por favor, inicie sesión para acceder a esta página."
login_manager.login_view = "login"

# Inicialización de Flask-Migrate
migrate = Migrate(app, db)

# ------------------ MODELOS DE BASE DE DATOS ------------------#

# Modelo para clientes 
class Clients_tickets(db.Model, UserMixin):
    __bind_key__ = "db3"
    __tablename__ = "Clients_tickets"
    __table_args__ = {"schema": "plan_beneficios"}
    id_client = db.Column(db.Integer, primary_key=True, autoincrement=True)
    document = db.Column(db.String(11), nullable=False)
    name = db.Column(db.String(33), nullable=False)
    lastname = db.Column(db.String(33), nullable=False)
    mail = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(11), nullable=False)

    # Usamos lambda para diferir la evaluación hasta que la clase Tickets esté definida
    tickets = db.relationship(
        "Tickets",
        backref="client_info",
        lazy=True,
        primaryjoin=lambda: Clients_tickets.id_client == Tickets.client,
        foreign_keys=lambda: [Tickets.client]
    )

# Modelo para tickets
class Tickets(db.Model, UserMixin):
    __bind_key__ = "db3"
    __tablename__ = "Tickets"
    __table_args__ = {"schema": "plan_beneficios"}

    id_ticket = db.Column(db.Integer, primary_key=True, autoincrement=True)
    state = db.Column(db.String(50), nullable=False, default="received")
    priority = db.Column(db.String(50), nullable=False)
    technical_name = db.Column(db.String(33), nullable=False)
    product_code = db.Column(db.String(50), nullable=False)
    spare_parts = db.Column(db.String(50), nullable=False)
    IMEI = db.Column(db.String(20), nullable=False)
    reference = db.Column(db.String(100), nullable=False)
    assigned = db.Column(db.DateTime, nullable=True, default=datetime.utcnow)
    received = db.Column(db.DateTime, nullable=True)
    in_progress = db.Column(db.DateTime, nullable=True)
    finished = db.Column(db.DateTime, nullable=True)
    spare_value = db.Column(db.Numeric(7, 1), nullable=True, default=0.0)
    product_value = db.Column(db.Numeric(7, 1), nullable=True, default=0.0)
    service_value = db.Column(db.Numeric(7, 1), nullable=True, default=0.0)
    total = db.Column(db.Numeric(7, 1), nullable=True, default=0.0)
    client = db.Column(db.Integer, db.ForeignKey(
        "plan_beneficios.Clients_tickets.id_client"), nullable=False)

# Modelo para empleados (db1, sin modificar)
class Empleados(db.Model, UserMixin):
    __bind_key__ = "db1"
    __tablename__ = "empleados"
    id = db.Column(db.String(100), primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    sede = db.Column(db.String(100), nullable=False)
    password = db.Column(db.String(60), nullable=False)
    isAdmin = db.Column(db.Boolean, default=False)
    jefeTienda = db.Column(db.Boolean, default=False)
    isSede = db.Column(db.Boolean, default=False)
    isTV = db.Column(db.Boolean, default=False)
    password_secret = db.Column(db.String(60))
    cedula = db.Column(db.String(100))
    estado = db.Column(db.Boolean, default=True)
    cargo = db.Column(
        db.Enum(
            "Admin",
            "jefeTienda",
            "Sede",
            "TV",
            "servicioTecnico",
            "vendedorMedellin",
            "vendedorBogota",
            "encargadoBodega",
            "domiciliario",
            "RH",
            name="cargo",
        )
    )
    pass_encrip = db.Column(db.String(400))


# ------------------ RUTAS ------------------#

@login_manager.user_loader
def load_user(user_id):
    return Empleados.query.filter_by(id=user_id).first()


@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        nombre = request.form.get("nombre")
        password = request.form.get("password")
        try:
            empleado = Empleados.query.filter_by(nombre=nombre).first()
            if empleado and bcrypt.check_password_hash(empleado.password, password):
                login_user(empleado)
                if empleado.cargo == "Admin":
                    return redirect(url_for("dashboard"))
                elif empleado.cargo == "servicioTecnico":
                    return redirect(url_for("view_technical"))
                else:
                    flash(
                        "Acceso denegado. No tienes permisos para acceder a esta página.", "error")
                    return redirect(url_for("login"))
            else:
                flash("Nombre o contraseña incorrectos", "error")
        except Exception as e:
            flash(f"Error al intentar iniciar sesión: {str(e)}", "error")
    return render_template("login.html")

# ------------------ CRUD DE TICKETS ------------------#

# Crear Ticket 
@app.route("/create_ticket", methods=["GET", "POST"])
@login_required
def create_ticket():
    technicians = get_technicians()
    current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if not technicians:
        flash("No hay técnicos disponibles en este momento.", "warning")
        
    # Llamamos a la función global para obtener los códigos de productos y las referencias
    reference = get_product_reference()
    product_code = get_product_code()

    if request.method == "POST":
        # Datos del cliente
        client_names = request.form.get("client_names")
        client_lastnames = request.form.get("client_lastnames")
        document = request.form.get("document")
        mail = request.form.get("mail")
        phone = request.form.get("phone")

        # Datos del ticket
        technical_name = request.form.get("technical_name")
        state = request.form.get("state", "received")
        priority = request.form.get("priority")
        spare_parts = request.form.get("spare_parts")
        IMEI = request.form.get("IMEI")
        reference_selected = request.form.get("reference")
        product_code_selected = request.form.get("product_code")
        service_value = request.form.get("service_value")
        spare_value = request.form.get("spare_value")
        assigned = request.form.get("assigned")
        if assigned:
            assigned = datetime.strptime(assigned, "%Y-%m-%d %H:%M:%S")
        received = request.form.get("received")
        in_progress = request.form.get("in_progress")
        finished = request.form.get("finished")
        total = request.form.get("total")

        try:
            service_value = float(service_value or 0)
            spare_value = float(spare_value or 0)
            total = service_value + spare_value
        except ValueError:
            flash(
                "Error: Los valores del servicio técnico y repuestos deben ser numéricos.", "danger")
            return redirect(url_for("create_ticket"))

        # Buscar el cliente por el campo "document"
        client = Clients_tickets.query.filter_by(document=document).first()
        if not client:
            # Si el cliente no existe, se crea y se confirma primero
            client = Clients_tickets(
                document=document,
                name=client_names,
                lastname=client_lastnames,
                mail=mail,
                phone=phone,
            )
            db.session.add(client)
            db.session.commit()  
            
        

        # Crear el ticket usando el id confirmado del cliente
        new_ticket = Tickets(
            technical_name=technical_name,
            state=state,
            priority=priority,
            spare_parts=spare_parts,
            IMEI=IMEI,
            reference=reference_selected,
            product_code=product_code_selected,
            service_value=service_value,
            spare_value=spare_value,
            total=total,
            client=client.id_client,
            assigned=assigned,
            received=received,
            in_progress=in_progress,
            finished=finished
        )
        db.session.add(new_ticket)
        db.session.commit()
        flash("Ticket creado correctamente", "success")
        return redirect(url_for("technical_service"))

    return render_template("create_ticket.html", technicians=technicians, current_date=current_date, reference=reference, product_code=product_code)


# Listar Tickets
@app.route("/technical_service")
@login_required
def technical_service():
    clients = Clients_tickets.query.all()
    tickets = Tickets.query.all()
    technicians = Empleados.query.filter_by(cargo="servicioTecnico").all()
    return render_template("technical_service.html", tickets=tickets, technicians=technicians, clients=clients)

# Editar Ticket


@app.route("/edit_ticket/<int:ticket_id>", methods=["GET", "POST"])
@login_required
def edit_ticket(ticket_id):
    ticket = Tickets.query.get(ticket_id)
    technicians = Empleados.query.filter_by(cargo="servicioTecnico").all()
    if request.method == "POST":
        # Actualizamos solo los campos del ticket (no se modifica el cliente)
        ticket.technical_name = request.form.get("technical_name")
        ticket.state = request.form.get("state")
        ticket.priority = request.form.get("priority")
        ticket.spare_parts = request.form.get("spare_parts")
        ticket.IMEI = request.form.get("IMEI")
        ticket.reference = request.form.get("reference")
        try:
            ticket.service_value = float(request.form.get("service_value", 0))
            ticket.spare_value = float(request.form.get("spare_value", 0))
            ticket.total = ticket.service_value + ticket.spare_value
        except ValueError:
            flash("Error: Los valores deben ser numéricos.", "danger")
            return redirect(url_for("edit_ticket", ticket_id=ticket_id))

        db.session.commit()
        flash("Ticket actualizado correctamente", "success")
        return redirect(url_for("technical_service"))

    return render_template("edit_ticket.html", ticket=ticket, technicians=technicians)

# Ver detalle del Ticket
@app.route("/view_detail_ticket/<int:ticket_id>", methods=["GET", "POST"])
@login_required
def view_detail_ticket(ticket_id):
    ticket = Tickets.query.filter_by(id_ticket=ticket_id).first()
    if not ticket:
        flash("Ticket no encontrado", "danger")
        return redirect(url_for("technical_service"))
    return render_template("view_detail_ticket.html", ticket=ticket, now=datetime.utcnow())


# ------------------ OTRAS RUTAS ------------------#

@app.route("/profile")
@login_required
def profile():
    return render_template("profile.html")

@app.route("/logout")
def logout():
    logout_user()
    return redirect(url_for("login"))

@app.route("/index")
@login_required
def index():
    return render_template("index.html")

@app.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html")

@app.route("/warranty")
@login_required
def warranty():
    return render_template("warranty.html")

@app.route("/internal_repair")
@login_required
def internal_repair():
    return render_template("internal_repair.html")

@app.route("/view_technical.html")
@login_required
def view_technical():
    return render_template("view_technical.html")

@app.route("/upload_images.html")
@login_required
def upload_images():
    return render_template("upload_images.html")

# with app.app_context():
#     db.create_all()

if __name__ == "__main__":
    app.run(debug=True)
