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
...

## Tipo de arquitectura
...

## Base de datos
...

## Usuarios del sistema
### Cliente


- Registrarse.
- Iniciar sesión.
- Consultar el menú.
- Agregar productos al carrito.
- Realizar pedidos.
- Consultar historial de compras.


### Operador


- Consultar pedidos.
- Actualizar estados.
- Verificar disponibilidad de productos.
- Gestionar el flujo de preparación y entrega.


### Administrador


- Gestionar usuarios.
- Gestionar productos, categorías, tamaños e ingredientes.
- Gestionar inventario.
- Supervisar pedidos.
- Generar reportes.
- Administrar el sistema.


Cada rol tiene permisos específicos para garantizar la seguridad y el correcto funcionamiento del sistema.


## Riesgos y fallas posibles
### Servicio de pagos


**Consecuencia:** el pedido podría quedar sin confirmar o el cliente podría recibir información incorrecta sobre el pago.


**Solución:** implementar reintentos, verificar nuevamente el estado de la transacción y enviar una notificación al cliente cuando el pago sea confirmado o rechazado.


### Base de datos


**Consecuencia:** se podría perder o dejar temporalmente inaccesible información de usuarios, pedidos, pagos, inventario e historial de ventas.


**Solución:** contar con copias de seguridad y respaldos periódicos para poder recuperar la información.


### Servidor principal


**Consecuencia:** los clientes, operadores y administradores no podrían acceder temporalmente a la plataforma.


**Solución:** realizar recuperación del servicio y disponer de mecanismos de respaldo para reducir la pérdida de información y el tiempo de interrupción.

