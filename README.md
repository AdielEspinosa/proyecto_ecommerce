# Plataforma de Comercio Electrónico Distribuida: Sistema de pedidos Online - Pizza Express

## Problema que resuelve

El sistema busca solucionar los problemas que se presentan en las pizzerías locales cuando los pedidos se realizan mediante llamadas telefónicas, mensajes de WhatsApp o atención presencial.

Estos procesos pueden provocar demoras en la atención al cliente, errores al tomar los pedidos, confusiones al registrar datos manualmente, dificultades para administrar los pedidos y confusiones con los precios y productos disponibles.

El sistema propone una plataforma web que permitirá gestionar de manera ordenada el proceso de compra de pizzas. Los clientes podrán registrarse y seleccionar los productos disponibles, mientras que la pizzería podrá administrar los productos y pedidos desde el sistema.


## Objetivo

Desarrollar una plataforma web para gestionar los pedidos de Pizza Express mediante una arquitectura de microservicios, separando las principales funciones del sistema en servicios independientes.

La arquitectura busca permitir:

- Separar las responsabilidades del sistema.
- Facilitar el mantenimiento y actualización de cada servicio.
- Permitir el escalamiento independiente de los componentes.
- Aislar fallos para evitar que un problema en un servicio afecte a todo el sistema.
- Mantener los datos organizados según la responsabilidad de cada servicio.
- Facilitar la incorporación de nuevas funcionalidades en el futuro.


## Integrantes y roles

| Integrante | Rol |
|---|---|
| Ricardo Vela López | Líder del proyecto |
| Adiel Felipe Espinosa Muñoz | Encargado Técnico |
| Alejandra Yunda López | Encargada de Documentación |
| Cristian David Musse Ordoñez | Encargado de Presentación |


# Arquitectura

El sistema utiliza una **arquitectura de microservicios**.

La aplicación se divide en servicios independientes, donde cada servicio tiene una responsabilidad específica. El cliente web interactúa con el sistema mediante APIs y las solicitudes se dirigen al servicio correspondiente.

### Control de cambios de arquitectura

Inicialmente se había seleccionado una arquitectura **Cliente–Servidor**, debido a que el proyecto corresponde a un comercio electrónico de una pizzería local, con una cantidad moderada de usuarios y procesos que podían centralizarse.

Sin embargo, después de analizar con mayor detalle las funciones del sistema, se decidió cambiar a una **arquitectura de microservicios**. El cambio se realizó porque las principales funcionalidades del sistema pueden trabajar de manera independiente: autenticación, gestión de usuarios, productos, pedidos, pagos, inventario y notificaciones tienen responsabilidades diferentes y pueden ser separadas en servicios.

Además, la nueva arquitectura permite:

- Desplegar y mantener los servicios de forma independiente.
- Escalar únicamente el servicio que lo necesite.
- Aislar fallos para reducir el impacto sobre todo el sistema.
- Separar la información según la responsabilidad de cada servicio.
- Facilitar futuras modificaciones y la incorporación de nuevas funcionalidades.
- Establecer una comunicación clara mediante APIs entre los servicios.

El cambio también permite que el sistema mantenga la posibilidad de crecer aunque inicialmente se estime una cantidad de **100 a 200 clientes registrados**, además del personal de la pizzería.
{}
### Componentes principales

- **Cliente Web:** interfaz utilizada por clientes, operadores y administradores.
- **API Gateway:** punto de entrada propuesto para centralizar y enrutar las solicitudes hacia los microservicios.
- **Usuarios:** administra la información y roles de los usuarios.
- **Autenticación:** gestiona inicio y cierre de sesión y validación de acceso.
- **Productos:** administra pizzas, bebidas, tamaños, ingredientes, precios y disponibilidad.
- **Pedidos:** gestiona la creación, consulta y seguimiento de los pedidos.
- **Pagos:** procesa y confirma las transacciones.
- **Inventario:** controla las existencias de ingredientes.
- **Notificaciones:** gestiona avisos relacionados con pedidos y pagos.
- **Bases de datos:** cada servicio administra la información que le corresponde.


# Servicios del sistema

| Servicio | Responsabilidad | ¿Qué información manejará? | ¿Con qué otros servicios se comunicará? |
|---|---|---|---|
| **Usuarios** | Gestionar los usuarios del sistema | Nombre, apellidos, correo, teléfono, dirección y rol | Autenticación, Pedidos |
| **Autenticación** | Gestionar el acceso al sistema | Credenciales, sesiones, tokens y permisos de acceso | Usuarios |
| **Productos** | Gestionar el catálogo de productos | Pizzas, bebidas, tamaños, ingredientes, precios, imágenes y disponibilidad | Pedidos, Inventario |
| **Pedidos** | Gestionar el ciclo de vida de los pedidos | Cliente, productos, cantidades, dirección, total, fecha y estado | Usuarios, Productos, Inventario, Pagos, Notificaciones |
| **Pagos** | Gestionar y procesar los pagos | Método de pago, monto, pedido, estado y referencia de transacción | Pedidos |
| **Inventario** | Controlar las existencias de ingredientes | Ingredientes, cantidades disponibles, cantidades mínimas y estado | Productos, Pedidos |
| **Notificaciones** | Gestionar los avisos enviados al cliente | Destinatario, mensaje, tipo, fecha y estado de envío | Pedidos, Pagos |

### Estado de los servicios

#### Usuarios
- **Diseñado:** registro, gestión de usuarios, roles y actualización de información.
- **Configurado:** servicio y base de datos definidos en Docker Compose.
- **Implementado:** contenedor configurado.
- **Pendiente:** API y lógica de negocio funcional.

#### Autenticación
- **Diseñado:** inicio de sesión, cierre de sesión y validación de acceso.
- **Configurado:** servicio y base de datos definidos en Docker Compose.
- **Implementado:** contenedor configurado.
- **Pendiente:** autenticación, autorización y API funcional.

#### Productos
- **Diseñado:** gestión de pizzas, tamaños, ingredientes, bebidas, precios y disponibilidad.
- **Configurado:** servicio y base de datos definidos en Docker Compose.
- **Implementado:** contenedor configurado.
- **Pendiente:** API, lógica de catálogo y conexión funcional con la base de datos.

#### Pedidos
- **Diseñado:** creación, consulta, modificación y actualización del estado de los pedidos.
- **Configurado:** servicio y base de datos definidos en Docker Compose.
- **Implementado:** contenedor configurado.
- **Pendiente:** API, lógica de pedidos, persistencia y comunicación con los demás servicios.

#### Pagos
- **Diseñado:** registro del método de pago, procesamiento, confirmación y resultado de la transacción.
- **Configurado:** servicio y base de datos definidos en Docker Compose.
- **Implementado:** contenedor configurado.
- **Pendiente:** procesamiento real de pagos, API y comunicación funcional con Pedidos.

#### Inventario
- **Diseñado:** control de ingredientes, cantidades disponibles y validación de existencias.
- **Configurado:** servicio y base de datos definidos en Docker Compose.
- **Implementado:** contenedor configurado.
- **Pendiente:** API, lógica de inventario y comunicación funcional con Pedidos y Productos.

#### Notificaciones
- **Diseñado:** avisos sobre confirmación, pago y cambios relacionados con el pedido.
- **Configurado:** servicio contemplado dentro de la arquitectura.
- **Implementado:** pendiente.
- **Pendiente:** contenedor, API, lógica de notificaciones y persistencia.


# Comunicación entre servicios

Los microservicios se comunican mediante **APIs REST**, utilizando solicitudes HTTP. Cada servicio solicita información al servicio responsable de administrarla.

## Relaciones de comunicación

### Autenticación → Usuarios

- **Quién solicita:** Autenticación.
- **Quién responde:** Usuarios.
- **Información intercambiada:** identificación del usuario, correo, credenciales necesarias para validar el acceso y rol.
- **Método HTTP:** `GET` / `POST`.

### Pedidos → Usuarios

- **Quién solicita:** Pedidos.
- **Quién responde:** Usuarios.
- **Información intercambiada:** identificación del cliente, nombre, dirección y datos necesarios para asociar el pedido al usuario.
- **Método HTTP:** `GET`.

### Pedidos → Productos

- **Quién solicita:** Pedidos.
- **Quién responde:** Productos.
- **Información intercambiada:** identificador del producto, nombre, precio, tamaño, ingredientes y disponibilidad.
- **Método HTTP:** `GET`.

### Pedidos → Inventario

- **Quién solicita:** Pedidos.
- **Quién responde:** Inventario.
- **Información intercambiada:** ingredientes requeridos, cantidades disponibles y resultado de la validación de existencias.
- **Método HTTP:** `GET` / `POST`.

### Pedidos → Pagos

- **Quién solicita:** Pedidos.
- **Quién responde:** Pagos.
- **Información intercambiada:** identificador del pedido, monto, método de pago y resultado de la transacción.
- **Método HTTP:** `POST`.

### Pedidos → Notificaciones

- **Quién solicita:** Pedidos.
- **Quién responde:** Notificaciones.
- **Información intercambiada:** destinatario, tipo de notificación, mensaje e información relacionada con el pedido.
- **Método HTTP:** `POST`.

### Resumen

| Solicitante | Servicio que responde | Información intercambiada | Método HTTP |
|---|---|---|---|
| Autenticación | Usuarios | Datos necesarios para validar identidad y rol | GET / POST |
| Pedidos | Usuarios | Datos del cliente y dirección | GET |
| Pedidos | Productos | Producto, precio, tamaño e ingredientes | GET |
| Pedidos | Inventario | Existencias y disponibilidad | GET / POST |
| Pedidos | Pagos | Pedido, monto, método y resultado del pago | POST |
| Pedidos | Notificaciones | Destinatario, mensaje y estado del pedido | POST |

### Reglas de comunicación

- Las solicitudes externas llegan al API Gateway.
- Cada servicio expone únicamente operaciones relacionadas con su responsabilidad.
- Los servicios no acceden directamente a las bases de datos de otros servicios.
- Pedidos utiliza las APIs de Inventario y Pagos cuando el flujo de compra lo requiere.
- Las APIs devuelven estados, resultados y errores para que el servicio solicitante pueda continuar el proceso.


# APIs

Las APIs establecen los contratos de comunicación entre el cliente, el API Gateway y los microservicios.

| Servicio | Método | Endpoint | Función |
|---|---|---|---|
| Autenticación | POST | `/api/auth/login` | Iniciar sesión y obtener credenciales de acceso. |
| Autenticación | POST | `/api/auth/logout` | Cerrar la sesión del usuario. |
| Usuarios | POST | `/api/users` | Registrar un nuevo usuario. |
| Usuarios | GET | `/api/users/{id}` | Consultar información de un usuario autorizado. |
| Usuarios | PUT | `/api/users/{id}` | Actualizar información del usuario. |
| Productos | GET | `/api/products` | Consultar menú, precios y disponibilidad. |
| Productos | POST | `/api/products` | Crear un producto. |
| Productos | PUT | `/api/products/{id}` | Actualizar información o disponibilidad. |
| Pedidos | POST | `/api/orders` | Crear un pedido. |
| Pedidos | GET | `/api/orders/{id}` | Consultar detalle y estado de un pedido. |
| Pedidos | PUT | `/api/orders/{id}/status` | Actualizar el estado de un pedido. |
| Pedidos | GET | `/api/orders/customer/{id}` | Consultar historial de pedidos del cliente. |
| Inventario | GET | `/api/inventory/availability` | Verificar disponibilidad de ingredientes. |
| Inventario | PUT | `/api/inventory/{id}` | Actualizar cantidades del inventario. |
| Pagos | POST | `/api/payments` | Procesar un pago asociado a un pedido. |
| Pagos | GET | `/api/payments/{orderId}` | Consultar el resultado de un pago. |
| Notificaciones | POST | `/api/notifications` | Generar y enviar una notificación. |


# Base de datos

La arquitectura utiliza el principio de **base de datos por servicio**. Cada microservicio mantiene la información que le corresponde y los demás servicios no deben acceder directamente a sus tablas.

La comunicación con los datos de otro servicio debe realizarse mediante su API.

| Servicio | Base de datos | Información principal |
|---|---|---|
| Usuarios | `db_usuarios` | Usuarios y roles |
| Autenticación | `db_autenticacion` | Datos relacionados con autenticación |
| Productos | `db_productos` | Productos, categorías, tamaños e ingredientes |
| Pedidos | `db_pedidos` | Pedidos y detalles |
| Pagos | `db_pagos` | Pagos y transacciones |
| Inventario | `db_inventario` | Ingredientes y existencias |
| Notificaciones | Por definir | Notificaciones y estado de envío |

### Información almacenada

- **Usuarios:** nombres, apellidos, correo, contraseña, teléfono, dirección y rol.
- **Roles:** nombre y descripción.
- **Productos:** nombre, descripción, precio, estado, categoría e imagen.
- **Categorías:** nombre, descripción y estado.
- **Tamaños:** nombre, descripción, precio adicional y estado.
- **Ingredientes:** nombre, descripción, unidad de medida y estado.
- **Producto_Ingrediente:** producto, ingrediente y cantidad.
- **Inventario:** ingrediente, cantidad disponible, cantidad mínima y estado.
- **Pedidos:** cliente, fecha, estado, total y dirección de entrega.
- **Detalle del pedido:** producto, cantidad, precio y subtotal.
- **Pagos:** pedido, método de pago, monto, fecha, estado y referencia de transacción.

Los datos críticos son los usuarios registrados, pedidos realizados, pagos, información de productos, inventario e historial de ventas.

### ¿Por qué se cambia la base de datos centralizada?

Al utilizar microservicios, se separa la información según la responsabilidad de cada servicio. Esto evita que un microservicio dependa directamente de las tablas internas de otro.

Por ejemplo, el servicio de Pedidos no debe consultar directamente `db_productos`; debe solicitar la información mediante la API de Productos.


# Usuarios del sistema

## Cliente

- Registrarse.
- Iniciar sesión.
- Consultar el menú.
- Agregar productos al carrito.
- Realizar pedidos.
- Consultar historial de compras.

## Operador

- Consultar pedidos.
- Actualizar estados.
- Verificar disponibilidad de productos.
- Gestionar el flujo de preparación y entrega.

## Administrador

- Gestionar usuarios.
- Gestionar productos, categorías, tamaños e ingredientes.
- Gestionar inventario.
- Supervisar pedidos.
- Generar reportes.
- Administrar el sistema.

Cada rol tiene permisos específicos para garantizar la seguridad y el correcto funcionamiento del sistema.


# Riesgos y fallas posibles

## Servicio de pagos

**Consecuencia:** el pedido podría quedar sin confirmar o el cliente podría recibir información incorrecta sobre el pago.

**Solución:** implementar reintentos, verificar nuevamente el estado de la transacción y enviar una notificación al cliente cuando el pago sea confirmado o rechazado.

## Base de datos de un servicio

**Consecuencia:** el servicio afectado podría quedar temporalmente sin acceso a su información.

**Solución:** contar con copias de seguridad, recuperación, monitoreo y aislamiento del fallo.

## Microservicio de pedidos

**Consecuencia:** no se podrían crear o actualizar pedidos mientras el servicio esté fuera de funcionamiento.

**Solución:** implementar recuperación del servicio, manejo de errores y persistencia segura de la información.

## API Gateway

**Consecuencia:** el cliente podría no acceder normalmente a los servicios.

**Solución:** disponer de mecanismos de recuperación y, cuando sea necesario, disponibilidad redundante.

## Servicio de notificaciones

**Consecuencia:** el pedido podría procesarse, pero el cliente podría no recibir el aviso inmediatamente.

**Solución:** implementar reintentos y procesamiento posterior de las notificaciones sin bloquear innecesariamente el pedido.



# Docker

Actualmente el proyecto utiliza Docker para contenerizar los componentes del sistema.

El componente del frontend (`home`) cuenta con un Dockerfile basado en `nginx:alpine`.

```dockerfile
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY index.html /usr/share/nginx/html/index.html

COPY styles.css /usr/share/nginx/html/styles.css

COPY imagenes /usr/share/nginx/html/imagenes

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

El Dockerfile:

1. Utiliza `nginx:alpine` como imagen base.
2. Elimina el contenido predeterminado de `/usr/share/nginx/html`.
3. Copia `index.html`.
4. Copia `styles.css`.
5. Copia la carpeta `imagenes`.
6. Expone el puerto `80`.
7. Ejecuta Nginx en primer plano.

Los demás servicios aparecen configurados inicialmente en Docker Compose utilizando contenedores de `nginx:alpine`. Esto representa la estructura de contenerización del proyecto, pero no significa que la lógica completa de cada microservicio ya esté implementada.


# Docker Compose

Docker Compose permite levantar los diferentes componentes definidos en el proyecto.

Actualmente el archivo `docker-compose.yml` contiene servicios para:

- `home`
- `usuarios`
- `db_usuarios`
- `autenticacion`
- `db_autenticacion`
- `productos`
- `db_productos`
- `pedidos`
- `db_pedidos`
- `pagos`
- `db_pagos`
- `inventario`
- `db_inventario`

Las bases de datos utilizan **MySQL 8.0** y cada servicio tiene una base de datos asociada dentro de la configuración actual.

### Levantar el proyecto

Desde la carpeta raíz ejecutar:

```bash
docker compose up --build
```

Para ejecutar los servicios en segundo plano:

```bash
docker compose up --build -d
```

Para detener los contenedores:

```bash
docker compose down
```

Para consultar los contenedores activos:

```bash
docker compose ps
```

### Puertos actuales

| Componente | Puerto externo | Puerto interno |
|---|---:|---:|
| Home / Frontend | `3000` | `80` |
| Usuarios | `3001` | `80` |
| Autenticación | `3002` | `80` |
| Productos | `3003` | `80` |
| Pedidos | `3004` | `80` |
| Pagos | `3005` | `80` |
| Inventario | `3006` | `80` |
| Bases de datos MySQL | No expuesto al cliente | `3306` |

El puerto de la base de datos no debe ser utilizado directamente por el cliente. La comunicación con los datos debe realizarse mediante el microservicio correspondiente.

Los puertos indicados corresponden a la configuración actual de Docker Compose y pueden ajustarse cuando se implementen las APIs reales.


# Estado actual del proyecto

- **Diseñado:** arquitectura de microservicios, servicios, comunicación, APIs, bases de datos, roles y manejo de fallos.
- **Configurado:** Dockerfile, Docker Compose, servicios, bases de datos MySQL y puertos.
- **Implementado:** frontend inicial (Home), contenedorización y estructura inicial de los servicios.
- **Pendiente:** implementar APIs, lógica de negocio, comunicación entre servicios, API Gateway, persistencia completa y pruebas.
 
s