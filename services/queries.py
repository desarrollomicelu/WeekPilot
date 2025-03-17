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


def get_product_reference():
    query = '''
    SELECT DESCRIPCIO, CODLINEA
    FROM MTMERCIA
    WHERE CODLINEA = 'CEL' OR CODLINEA = 'CYT'
    '''
    results = execute_query(query)
    reference = []
    for row in results:
        reference.append({
            "description": row[0],
            "CODLINEA": row[1]
        })
    return reference


def get_product_code():
    query = '''
    SELECT CODIGO, CODLINEA
    FROM MTMERCIA
    WHERE CODLINEA = 'CEL' OR CODLINEA = 'CYT'
    '''
    results = execute_query(query)
    product_code = []
    for row in results:
        product_code.append({
            "id": row[0],
            "CODLINEA": row[1]
        })
    return product_code


def get_spare_name():
    query = '''
    SELECT DESCRIPCIO
    FROM MTMERCIA
    WHERE CODLINEA = 'ST'
    '''
    return execute_query(query)


def get_sertec():
    query = '''
    SELECT CODIGO
    FROM MTMERCIA
    WHERE CODIGO = 'SERTEC'
    '''   
    return execute_query(query)

def get_technicians():
    query = """
    SELECT NOMBRE 
    FROM Venden 
    WHERE COMENTARIO LIKE '%ASESOR SERVICIO TECNICO%' 
    OR COMENTARIO LIKE '%TECNICO MEDELLIN%' 
    OR COMENTARIO LIKE '%REPARACIÒN%'
    """
    return execute_query(query)
