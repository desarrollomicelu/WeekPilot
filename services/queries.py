# services/queries.py

import pyodbc


def execute_query(query):
    """
    Ejecuta una consulta SQL y devuelve los resultados
    """
    print(f"Ejecutando consulta: {query}")
    try:
        conn = pyodbc.connect('''DRIVER={ODBC Driver 18 for SQL Server};
                                SERVER=20.109.21.246;
                                DATABASE=MICELU;
                                UID=db_read;
                                PWD=mHRL_<='(],#aZ)T"A3QeD;
                                TrustServerCertificate=yes''')
        cursor = conn.cursor()
        cursor.execute(query)
        results = cursor.fetchall()
        print(f"Consulta exitosa. Filas retornadas: {len(results)}")
        cursor.close()
        conn.close()
        return results
    except Exception as e:
        print(f"Error al ejecutar consulta: {str(e)}")
        # Volver a intentar con comillas simples escapadas si hay un error de sintaxis
        if "syntax error" in str(e).lower() and "'" in query:
            try:
                # Reemplazar ' por '' para escapar comillas
                modified_query = query.replace("'", "''")
                print(
                    f"Reintentando con consulta modificada: {modified_query}")
                conn = pyodbc.connect('''DRIVER={ODBC Driver 18 for SQL Server};
                                        SERVER=20.109.21.246;
                                        DATABASE=MICELU;
                                        UID=db_read;
                                        PWD=mHRL_<='(],#aZ)T"A3QeD;
                                        TrustServerCertificate=yes''')
                cursor = conn.cursor()
                cursor.execute(modified_query)
                results = cursor.fetchall()
                print(
                    f"Consulta modificada exitosa. Filas retornadas: {len(results)}")
                cursor.close()
                conn.close()
                return results
            except Exception as e2:
                print(f"Error en segundo intento: {str(e2)}")
                return []
        return []


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


def get_consecutive():
    query = '''
    select Tipo_Documento, Documento from VSeriesUtilidad 
    '''
    results = execute_query(query)
    consecutive_data = None
    if results:
        row = results[0]
        consecutive_data = {
            "consecutive": f"{row[0]}{row[1]}"
        }
    return consecutive_data


def format_document(document):
    """
    Formatea el documento para:
    1. Eliminar todo lo que está después del guion
    2. Tomar solo los primeros 10 dígitos
    """
    # Eliminar caracteres no numéricos
    digits_only = ''.join(c for c in document if c.isdigit())

    # Tomar solo los primeros 10 dígitos
    if len(digits_only) > 10:
        result = digits_only[:10]
    else:
        result = digits_only

    print(f"Documento formateado: {document} -> {result}")
    return result


def get_client_by_document(document):
    """
    Busca un cliente por su número de documento y retorna sus datos
    """
    # Formatear el documento para obtener solo los primeros 10 dígitos
    formatted_document = format_document(document)

    print(
        f"Buscando cliente con los primeros 10 dígitos: {formatted_document}")

    # Buscar clientes que coincidan con los primeros dígitos
    query = f'''
    SELECT NOMBRE1, NOMBRE2, APELLIDO1, APELLIDO2, NIT, EMAIL, TEL1 FROM MtProcli
    WHERE NIT LIKE '{formatted_document}%'
    '''
    results = execute_query(query)

    client_data = None
    if results:
        row = results[0]
        # Asegurarse de que el documento guardado esté formateado (sin guion)
        clean_document = format_document(row[4])
        
        client_data = {
            "nombre1": row[0] or '',
            "nombre2": row[1] or '',
            "apellido1": row[2] or '',
            "apellido2": row[3] or '',
            "document": clean_document,  # Guardar el documento sin guion
            "email": row[5],
            "phone": row[6]
        }
    return client_data


def get_client_invoices(document):
    """
    Obtiene las facturas asociadas a un cliente por su número de documento
    con información completa y ordenada.
    """
    # Formatear el documento: eliminar guiones y tomar los primeros 10 dígitos
    formatted_document = format_document(document)

    print(f"Buscando facturas con documento formateado: {formatted_document}")

    # Consulta mejorada para obtener más información relevante de las facturas
    # y ordenarla por fecha en orden descendente (las más recientes primero)
    query = f'''
    SELECT 
        Su.Producto AS codigo_producto, 
        Su.Referencia AS descripcion, 
        Su.Serie AS numero_factura, 
        Su.Fecha_Inicial AS fecha, 
        Su.Nit AS documento,
        Su.VrTotal AS valor_total,
        Su.Fecha_Vence AS fecha_vencimiento,
        CASE WHEN Su.Activo = 1 THEN 'Activa' ELSE 'Inactiva' END AS estado,
        Su.Origen AS origen
    FROM VSeriesUtilidad Su
    WHERE Su.Nit LIKE '{formatted_document}%'
    ORDER BY Su.Fecha_Inicial DESC
    '''

    results = execute_query(query)

    invoices = []
    for row in results:
        # Formatear fecha para presentación
        formatted_date = None
        if row[3]:  # fecha
            try:
                if isinstance(row[3], str):
                    # Si es string, extraer la fecha
                    date_parts = row[3].split('T')[0].split('-')
                    if len(date_parts) == 3:
                        formatted_date = f"{date_parts[2]}/{date_parts[1]}/{date_parts[0]}"
                else:
                    # Si es datetime, formatear directamente
                    formatted_date = row[3].strftime("%d/%m/%Y")
            except Exception as e:
                print(f"Error al formatear fecha: {e}")
                formatted_date = str(row[3])

        # Formatear valor total
        formatted_value = "N/A"
        if row[5] is not None:  # valor_total
            try:
                value = float(row[5])
                formatted_value = f"${value:,.2f}".replace(',', '.')
            except (ValueError, TypeError) as e:
                print(f"Error al formatear valor: {e}")
                formatted_value = str(row[5])

        # Limpiar el NIT en los resultados para mantener consistencia
        clean_document = format_document(row[4]) if row[4] else ""

        # Crear objeto factura con la información completa
        invoices.append({
            # código_producto
            "product_code": row[0] or "N/A",
            "product_description": row[1] or "N/A",            # descripción
            "invoice_number": row[2] or "N/A",                 # número_factura
            # fecha (original para procesamiento)
            "date": row[3],
            "formatted_date": formatted_date or "N/A",         # fecha formateada para mostrar
            "document": clean_document,                        # documento formateado
            # valor_total (original para procesamiento)
            "total_value": row[5],
            # valor formateado para mostrar
            "formatted_value": formatted_value,
            # fecha_vencimiento
            "expiration_date": row[6],
            "status": row[7] or "N/A",                         # estado
            "origin": row[8] or "N/A"                          # origen
        })

    return invoices
