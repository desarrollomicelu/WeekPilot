# services/queries.py

import pyodbc


def execute_query(query):
    conn = pyodbc.connect('''DRIVER={ODBC Driver 17 for SQL Server};
                         SERVER=localhost;
                         DATABASE=MICELU;
                         Trusted_Connection=yes;
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
    WHERE COMENTARIO LIKE '%ASESOR SERVICIO TECNICO%' 
    OR COMENTARIO LIKE '%TECNICO MEDELLIN%' 
    OR COMENTARIO LIKE '%REPARACIÒN%'
    """
    return execute_query(query)
