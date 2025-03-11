from flask import Blueprint, render_template
from flask_login import login_required
warranty = Blueprint('warranty', __name__)

@warranty.route("/warranty")
@login_required
def warranty():
    return render_template("warranty.html")