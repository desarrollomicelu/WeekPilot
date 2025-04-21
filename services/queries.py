# services/queries.py

import pyodbc


def execute_query(query):
    conn = pyodbc.connect('''DRIVER={ODBC Driver 18 for SQL Server};
                             SERVER=20.109.21.246;
                             DATABASE=MICELU;
                             UID=db_read;
                             PWD=mHRL_<='(],#aZ)T"A3QeD;
                             TrustServerCertificate=yes''')
    cursor = conn.cursor()
    cursor.execute(query)
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results


def get_spare_parts():
    query = '''
    SELECT CODIGO, DESCRIPCIO
    FROM MTMERCIA
    WHERE CODLINEA = 'ST'
    '''
    results = execute_query(query)
    spare_parts = []
    for row in results:
        spare_parts.append({
            "code": row[0],
            "description": row[1]
        })
    return spare_parts


def get_product_information():
    query = '''
    SELECT DESCRIPCIO, CODIGO
    FROM MTMERCIA
    WHERE (CODLINEA = 'CEL' AND CODGRUPO = 'SEMI') OR (CODLINEA = 'CYT' AND CODGRUPO = 'NUE')
    '''
    results = execute_query(query)
    information = []
    for row in results:
        information.append({
            "DESCRIPCIO": row[0],
            "CODIGO": row[1],
        })
    return information


def get_spare_name():
    query = '''
    SELECT DESCRIPCIO
    FROM MTMERCIA
    WHERE CODLINEA = 'ST'
    '''
    results = execute_query(query)
    spare_names = []
    for row in results:
        spare_names.append(row[0])
    return spare_names


def get_sertec():
    query = '''
    SELECT CODIGO
    FROM MTMERCIA
    WHERE CODIGO = 'SERTEC'
    '''
    results = execute_query(query)
    sertec_values = []
    for row in results:
        sertec_values.append(row[0])
    return sertec_values


def get_technicians():
    query = """
    SELECT NOMBRE, CODVEN
    FROM Venden 
    WHERE COMENTARIO LIKE '%TECNICO%' 
    """
    results = execute_query(query)
    technicians = []
    for row in results:
        technicians.append({
            "NOMBRE": row[0],
            "DOCUMENT": row[1]
        })
    return technicians
