from flask import Blueprint, render_template

view_technical_bp = Blueprint('view_technical', __name__, template_folder='templates')

@view_technical_bp.route('/view_technical')
def view_technical():
    return render_template('view_technical.html')