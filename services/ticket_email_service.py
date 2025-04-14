"""
Servicio de correo electrónico para notificaciones relacionadas con tickets.
Utiliza Azure Communication Services para enviar correos electrónicos.
"""
from flask import current_app
from azure.communication.email import EmailClient
import logging
import datetime


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

            # Generar el contenido HTML del correo utilizando el método dedicado
            contenido_html = self._generar_contenido_html(cliente, ticket, problemas, tecnico)

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
        problemas_html = "".join(f"<li style='margin-bottom: 5px;'>{problema.name}</li>" for problema in problemas)
        
        # Obtener el nombre del técnico de manera segura
        nombre_tecnico = tecnico.nombre if tecnico and hasattr(tecnico, 'nombre') else ticket.technical_name
        
        # Generar contenido HTML completo con diseño mejorado
        return f"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Servicio Técnico MiCelu - Dispositivo Reparado</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f9f9f9; color: #333333;">
            <table cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <!-- Encabezado -->
                <tr>
                    <td style="background-color: #0066cc; padding: 20px; text-align: center;">
                        <img src="{url_logo}" alt="Logo MiCelu" style="max-width: 180px; height: auto;">
                    </td>
                </tr>
                
                <!-- Contenido principal -->
                <tr>
                    <td style="padding: 30px 25px;">
                        <h1 style="color: #0066cc; font-size: 24px; margin-top: 0; margin-bottom: 20px; text-align: center;">¡Su dispositivo está listo!</h1>
                        
                        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                            Estimado(a) <strong>{cliente.name} {cliente.lastname}</strong>,
                        </p>
                        
                        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                            Nos complace informarle que hemos finalizado el servicio técnico de su dispositivo y ya se encuentra disponible para retirar en nuestras instalaciones.
                        </p>
                        
                        <table cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f7ff; border-radius: 6px; margin-bottom: 25px;">
                            <tr>
                                <td style="padding: 20px;">
                                    <h2 style="color: #0066cc; font-size: 18px; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #cce0ff; padding-bottom: 10px;">
                                        Detalles del Servicio
                                    </h2>
                                    
                                    <table cellpadding="5" cellspacing="0" width="100%" style="font-size: 15px;">
                                        <tr>
                                            <td width="40%" style="font-weight: bold;">Número de Ticket:</td>
                                            <td width="60%">{ticket.id_ticket}</td>
                                        </tr>
                                        <tr>
                                            <td width="40%" style="font-weight: bold;">Técnico responsable:</td>
                                            <td width="60%">{nombre_tecnico}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                        
                        <h2 style="color: #0066cc; font-size: 18px; margin-top: 25px; margin-bottom: 15px;">Problemas Solucionados</h2>
                        <ul style="font-size: 15px; line-height: 1.5; margin-bottom: 25px; padding-left: 20px;">
                            {problemas_html}
                        </ul>
                        
                        <h2 style="color: #0066cc; font-size: 18px; margin-top: 25px; margin-bottom: 15px;">Diagnóstico Técnico</h2>
                        <div style="background-color: #f7f7f7; border-left: 4px solid #0066cc; padding: 15px; margin-bottom: 25px; font-size: 15px; line-height: 1.5;">
                            {ticket.comment or "No se han registrado observaciones adicionales para este servicio."}
                        </div>
                        
                        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                            Por favor, recuerde traer su comprobante de servicio o identificación al momento de retirar el equipo. Nuestro horario de atención es de Lunes a Viernes de 9:00 a 18:00 hrs.
                        </p>
                        
                        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                            Agradecemos su confianza en nuestros servicios. Si tiene alguna pregunta adicional, no dude en contactarnos.
                        </p>
                    </td>
                </tr>
                
                <!-- Pie de página -->
                <tr>
                    <td style="background-color: #0066cc; color: #ffffff; padding: 15px; text-align: center; font-size: 14px;">
                        <p style="margin: 0 0 10px 0;">
                            <strong>Servicio Técnico MiCelu</strong>
                        </p>
                        <p style="margin: 0 0 5px 0;">
                            <a href="tel:+123456789" style="color: #ffffff; text-decoration: none;">Teléfono: (123) 456-789</a>
                        </p>
                        <p style="margin: 0;">
                            <a href="mailto:soporte@micelu.com" style="color: #ffffff; text-decoration: none;">soporte@micelu.com</a>
                        </p>
                    </td>
                </tr>
                
                <!-- Aviso legal -->
                <tr>
                    <td style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #777777;">
                        <p style="margin: 0 0 10px 0;">
                            © {datetime.datetime.now().year} MiCelu. Todos los derechos reservados.
                        </p>
                        <p style="margin: 0;">
                            Este correo es exclusivamente informativo y fue enviado automáticamente.
                        </p>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
