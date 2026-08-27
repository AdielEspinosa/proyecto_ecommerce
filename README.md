# Arquitectura del Sistema: Sistema de pedidos Online - Pizza Express


## Problema que resuelve

El sistema busca solucionar los problemas que se presentan en las pizzerías locales cuando los pedidos se realizan mediante llamadas telefónicas, mensajes de WhatsApp o atención presencial.

Estos procesos pueden provocar demoras en la atención al cliente, errores al tomar los pedidos, confusiones al registrar datos manualmente, dificultades para administrar los pedidos y confusiones con los precios y productos disponibles.

El sistema propone una plataforma web que permitirá gestionar de manera ordenada el proceso de compra de pizzas. Los clientes podrán registrarse y seleccionar los productos disponibles, mientras que la pizzería podrá administrar los productos y pedidos desde el sistema.


## Servicios del sistema
- **Usuarios:** registro, gestión de usuarios, roles y actualización de información.
- **Autenticación:** inicio de sesión, cierre de sesión y validación de acceso.
- **Productos:** gestión de pizzas, tamaños, ingredientes, bebidas, precios y disponibilidad.
- **Pedidos:** creación, consulta, modificación y actualización del estado de los pedidos.
- **Pagos:** registro del método de pago, procesamiento, confirmación y resultado de la transacción.
- **Inventario:** control de ingredientes, cantidades disponibles y validación de existencias.
- **Notificaciones:** avisos sobre confirmación y pago.

Estos módulos forman parte de la aplicación del servidor. No se desplegarán como microservicios independientes en la primera versión.


## Comunicación entre servicios
La arquitectura utiliza un modelo Cliente–Servidor. El cliente web envía solicitudes al servidor y el servidor procesa las operaciones correspondientes.


El flujo principal es:


1. El cliente solicita el menú al servidor.
2. El servidor devuelve las pizzas disponibles, ingredientes, tamaños y precios.
3. El cliente envía los productos seleccionados y la información del pedido al servidor.
4. El módulo de **Pedidos** consulta al módulo de **Inventario** para verificar si existen suficientes ingredientes.
5. **Inventario** informa a **Pedidos** si los productos pueden prepararse.
6. **Pedidos** solicita a **Pagos** el procesamiento del pago.
7. **Pagos** devuelve a **Pedidos** la confirmación o el rechazo del pago.
8. **Pedidos** solicita a **Notificaciones** el envío de una notificación al cliente.
9. **Notificaciones** informa al cliente que el pedido fue recibido.


## Tipo de arquitectura
...

## Base de datos
...

## Usuarios del sistema
...

## Riesgos y fallas posibles
...
