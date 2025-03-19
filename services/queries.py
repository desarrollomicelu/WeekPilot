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
    SELECT DESCRIPCIO
    FROM MTMERCIA
    WHERE (CODLINEA = 'CEL' AND CODGRUPO = 'SEMI') OR (CODLINEA = 'CYT' AND CODGRUPO = 'NUE')
    '''
    results = execute_query(query)
    reference = []
    for row in results:
        reference.append({
            "description": row[0],
        })
    return reference


def get_product_code():
    query = '''
    SELECT CODIGO
    FROM MTMERCIA
    WHERE (CODLINEA = 'CEL' AND CODGRUPO = 'SEMI') OR (CODLINEA = 'CYT' AND CODGRUPO = 'NUE')
    '''
    results = execute_query(query)
    product_code = []
    for row in results:
        product_code.append({
            "id": row[0],
        })
    return product_code



def get_spare_value():
    query = '''
    SELECT DESCRIPCIO
    FROM MTMERCIA
    WHERE CODLINEA = 'ST'
    '''
    results = execute_query(query)
    spare_values = []
    for row in results:
        spare_values.append(row[0])  
    return spare_values


def get_sertec():
    query = '''
    SELECT CODIGO
    FROM MTMERCIA
    WHERE CODIGO = 'SERTEC'
    '''   
    results = execute_query(query)
    sertec_values = []
    for row in results:
        sertec_values.append(row[0])  # Extraer solo el valor de CODIGO
    return sertec_values

def get_technicians():
    query = """
    SELECT NOMBRE, CODVEN
    FROM Venden 
    WHERE COMENTARIO LIKE '%ASESOR SERVICIO TECNICO%' 
    OR COMENTARIO LIKE '%TECNICO MEDELLIN%' 
    OR COMENTARIO LIKE '%REPARACIÒN%'
    """
    return execute_query(query)
