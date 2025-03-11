from flask import Blueprint, render_template
from flask_login import login_required


internal_repair = Blueprint('internal_repair', __name__)

@internal_repair.route("/internal_repair")
@login_required
def internal_repair():
    return render_template("internal_repair.html")