# services/queries.py

import pyodbc


def execute_query(query):
    """
    Ejecuta una consulta SQL y devuelve los resultados
    """
    print(f"INICIO DE CONSULTA SQL -------")
    print(f"Consulta a ejecutar: {query}")
    try:
        conn = pyodbc.connect('''DRIVER={ODBC Driver 18 for SQL Server};
                                SERVER=20.109.21.246;
                                DATABASE=MICELU;
                                UID=db_read;
                                PWD=mHRL_<='(],#aZ)T"A3QeD;
                                TrustServerCertificate=yes''')
        print(f"Conexión a base de datos establecida")
        cursor = conn.cursor()
        cursor.execute(query)
        results = cursor.fetchall()
        print(f"Consulta exitosa. Filas retornadas: {len(results)}")
        if len(results) > 0:
            print(f"Ejemplo de primera fila: {results[0]}")
            
        cursor.close()
        conn.close()
        print(f"FIN DE CONSULTA SQL -------")
        return results
    except Exception as e:
        print(f"ERROR SQL: {str(e)}")
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
                print(f"ERROR en segundo intento: {str(e2)}")
                return []
        print(f"FIN DE CONSULTA SQL CON ERROR -------")
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
    3. Eliminar espacios en blanco
    """
    if not document:
        return ""
        
    # Eliminar espacios en blanco
    document = document.strip()
    
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

    # Consulta mejorada para obtener información más completa de las facturas
    query = f'''
    SELECT 
    Producto, 
    Referencia, 
    Serie,
    Fecha_Inicial,
	Documento,
    Nit
FROM 
    VSeriesUtilidad
    WHERE 
        NIT LIKE '{formatted_document}%'
    '''

    results = execute_query(query)
    
    # Función para limpiar valores
    def clean_value(value):
        if value is None:
            return "N/A"
        return str(value).strip()
    
    invoices = []
    for row in results:
        # Formatear fechas
        formatted_date = "N/A"
        
        # Fecha principal
        if row[3]:  # Fecha_Inicial
            try:
                if isinstance(row[3], str):
                    date_parts = row[3].split('T')[0].split('-')
                    if len(date_parts) == 3:
                        formatted_date = f"{date_parts[2]}/{date_parts[1]}/{date_parts[0]}"
                else:
                    formatted_date = row[3].strftime("%d/%m/%Y")
            except Exception as e:
                print(f"Error al formatear fecha principal: {e}")
                formatted_date = str(row[3])

        # Crear objeto factura con la información completa y limpia de espacios
        invoice = {
            "numero": clean_value(row[2]),               # Serie
            "referencia": clean_value(row[1]),           # Referencia
            "fecha": row[3],                             # Fecha_Inicial (original)
            "fecha_formateada": formatted_date,          # fecha formateada
            "documento": clean_value(row[4]),            # Documento
            "codigo_producto": clean_value(row[0]),      # Producto
            "estado": "Activo"                           # Por defecto activo
        }
        
        invoices.append(invoice)

    return invoices


def get_spare_parts_with_price():
    """
    Obtiene todos los repuestos con sus precios
    """
    query = '''
    SELECT CODIGO, DESCRIPCIO, PRECIO
    FROM MTMERCIA
    WHERE CODLINEA = 'ST'
    '''
    results = execute_query(query)
    spare_parts = []
    for row in results:
        # Verificar si hay precio y procesarlo
        try:
            if len(row) > 2 and row[2] is not None:
                price = float(row[2])
            else:
                price = 0
        except (ValueError, TypeError):
            price = 0
            
        spare_parts.append({
            "code": row[0],
            "description": row[1],
            "price": price
        })
    return spare_parts


def search_spare_parts_query(search_term):
    """
    Busca repuestos específicos basados en un término de búsqueda
    """
    # Verificar si el término de búsqueda tiene espacios y procesarlo
    clean_term = search_term.lower().strip()
    
    # Consulta explícita incluyendo el campo PRECIO
    query = f'''
    SELECT m.CODIGO, m.DESCRIPCIO, m.PRECIO 
    FROM MTMERCIA m
    WHERE m.CODLINEA = 'ST' AND 
    (LOWER(m.CODIGO) LIKE '%{clean_term}%' OR LOWER(m.DESCRIPCIO) LIKE '%{clean_term}%')
    ORDER BY 
        CASE 
            WHEN LOWER(m.CODIGO) = '{clean_term}' THEN 1
            WHEN LOWER(m.CODIGO) LIKE '{clean_term}%' THEN 2
            WHEN LOWER(m.DESCRIPCIO) = '{clean_term}' THEN 3
            WHEN LOWER(m.DESCRIPCIO) LIKE '{clean_term}%' THEN 4
            ELSE 5
        END
    '''
    
    print(f"Ejecutando búsqueda de repuestos con término: '{clean_term}'")
    results = execute_query(query)
    print(f"Resultados obtenidos: {len(results)} filas")
    
    # Mostrar información detallada del primer resultado para depuración
    if len(results) > 0:
        first_row = results[0]
        print(f"Primer resultado: {first_row}")
        print(f"Tipo de datos de la primera fila: {type(first_row)}")
        print(f"Número de columnas en la primera fila: {len(first_row)}")
        for i, val in enumerate(first_row):
            print(f"Columna {i}: {val} (tipo: {type(val)})")
    
    spare_parts = []
    for row in results:
        # Obtener código y descripción
        code = row[0].strip() if row[0] and hasattr(row[0], 'strip') else str(row[0]) if row[0] else ""
        description = row[1].strip() if row[1] and hasattr(row[1], 'strip') else str(row[1]) if row[1] else ""
        
        # Procesar precio con manejo explícito de errores
        try:
            if len(row) > 2:
                # Intentar convertir a número, con manejo de diferentes formatos
                price_val = row[2]
                if price_val is None:
                    price = 0
                elif isinstance(price_val, (int, float)):
                    price = float(price_val)
                elif isinstance(price_val, str):
                    # Limpiar el string de caracteres no numéricos excepto punto decimal
                    clean_price = ''.join(c for c in price_val if c.isdigit() or c == '.')
                    price = float(clean_price) if clean_price else 0
                else:
                    price = 0
                    print(f"Tipo de precio no manejado: {type(price_val)} - Valor: {price_val}")
            else:
                price = 0
                print(f"Fila sin columna de precio: {row}")
        except Exception as e:
            price = 0
            print(f"Error al procesar precio: {e} - Fila: {row}")
        
        spare_parts.append({
            "code": code,
            "description": description,
            "price": price
        })
    
    print(f"Repuestos procesados: {len(spare_parts)}")
    # Mostrar algunos ejemplos procesados
    if len(spare_parts) > 0:
        print(f"Ejemplo de repuesto procesado: {spare_parts[0]}")
    
    return spare_parts
