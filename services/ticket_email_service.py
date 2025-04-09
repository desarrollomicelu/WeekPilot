"""
Servicio de correo electrónico para notificaciones relacionadas con tickets.
Utiliza Azure Communication Services para enviar correos electrónicos.
"""
from flask import current_app
from azure.communication.email import EmailClient
import logging


class TicketEmailService:
    def __init__(self, connection_string, sender_address):
        self.connection_string = connection_string
        self.sender_address = sender_address

    def enviar_notificacion_reparacion(self, cliente, ticket, problemas, tecnico):
        """
        Envía una notificación al cliente indicando que su dispositivo ha sido reparado.

        :param cliente: Objeto cliente con atributos (name, lastname, mail).
        :param ticket: Objeto ticket con atributos (id_ticket, comment).
        :param problemas: Lista de problemas reportados.
        :param tecnico: Objeto técnico con atributo (nombre).
        :return: Tupla (success, mensaje_error)
        """
        try:
            # Verificar que el cliente tenga correo
            if not cliente.mail:
                return False, "El cliente no tiene correo electrónico registrado"

            email_client = EmailClient.from_connection_string(self.connection_string)

            url_logo = "https://i.ibb.co/1DsGPLQ/imagen.jpg"

            problemas_html = "".join(f"<li>{problema.name}</li>" for problema in problemas)

            # Obtener el nombre del técnico de manera segura
            nombre_tecnico = tecnico.nombre if tecnico else ticket.technical_name

            contenido_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 550px; margin: auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 25px;">
                    <img src="{url_logo}" alt="Logo MiCelu" style="width:200px;">
                </div>
                <h2 style="color: #2a2a2a;">Notificación de dispositivo reparado</h2>
                <p>Estimado(a) {cliente.name} {cliente.lastname},</p>
                <p>
                    Le informamos que su dispositivo ya ha sido reparado exitosamente. <br>
                    Puede recogerlo en las instalaciones de <strong>MiCelu</strong> cuando guste.
                </p>
                <h3>Detalles del Servicio:</h3>
                <ul>
                    <li><strong>Número de Ticket:</strong> {ticket.id_ticket}</li>
                    <li><strong>Técnico a cargo:</strong> {nombre_tecnico}</li>
                </ul>
                <h3>Problemas reportados:</h3>
                <ul>
                    {problemas_html}
                </ul>
                <h3>Diagnóstico del técnico:</h3>
                <p style="background-color: #f9f9f9; padding: 10px; border-radius: 5px;">
                    {ticket.comment or "Sin observaciones adicionales."}
                </p>
                <p>
                    Le agradecemos por confiar en nuestros servicios.<br>
                    Estamos siempre a su disposición para cualquier consulta.
                </p>
                <p>Atentamente,<br><strong>Equipo de soporte MiCelu</strong></p>
            </body>
            </html>
            """

            destinatario = {
                "address": cliente.mail,
                "displayName": f"{cliente.name} {cliente.lastname}"
            }

            mensaje = {
                "senderAddress": self.sender_address,
                "recipients": {"to": [destinatario]},
                "content": {
                    "subject": f"Dispositivo reparado - Ticket #{ticket.id_ticket}",
                    "html": contenido_html
                }
            }

            poller = email_client.begin_send(mensaje)
            poller.result()

            return True, None

        except Exception as e:
            mensaje_error = f"Error al enviar correo de notificación de reparación del ticket {ticket.id_ticket}: {str(e)}"
            # Usar current_app para registrar el error
            current_app.logger.error(mensaje_error)
            return False, mensaje_error
    
    def _generar_contenido_html(self, cliente, ticket, problemas, tecnico):
        """
        Genera el contenido HTML para el correo electrónico.
        
        Args:
            cliente: Objeto cliente con información del cliente.
            ticket: Objeto ticket con información del ticket.
            problemas: Lista de problemas reportados.
            tecnico: Objeto técnico con información del técnico.
            
        Returns:
            str: Contenido HTML del correo electrónico.
        """
        # URL del logo
        url_logo = "https://i.ibb.co/1DsGPLQ/imagen.jpg"
        
        # Generar lista HTML de problemas
        problemas_html = "".join(f"<li>{problema.name}</li>" for problema in problemas)
        
        # Generar contenido HTML completo
        return f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 550px; margin: auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 25px;">
                <img src="{url_logo}" alt="Logo MiCelu" style="width:200px;">
            </div>
            <h2 style="color: #2a2a2a;">Notificación de dispositivo reparado</h2>
            <p>Estimado(a) {cliente.name} {cliente.lastname},</p>
            <p>
                Le informamos que su dispositivo ya ha sido reparado exitosamente. <br>
                Puede recogerlo en las instalaciones de <strong>MiCelu</strong> cuando guste.
            </p>
            <h3>Detalles del Servicio:</h3>
            <ul>
                <li><strong>Número de Ticket:</strong> {ticket.id_ticket}</li>
                <li><strong>Técnico a cargo:</strong> {tecnico.nombre}</li>
            </ul>
            <h3>Problemas reportados:</h3>
            <ul>
                {problemas_html}
            </ul>
            <h3>Diagnóstico del técnico:</h3>
            <p style="background-color: #f9f9f9; padding: 10px; border-radius: 5px;">
                {ticket.comment or "Sin observaciones adicionales."}
            </p>
            <p>
                Le agradecemos por confiar en nuestros servicios.<br>
                Estamos siempre a su disposición para cualquier consulta.
            </p>
            <p>Atentamente,<br><strong>Equipo de soporte MiCelu</strong></p>
        </body>
        </html>
        """
