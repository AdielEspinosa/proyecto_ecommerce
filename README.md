# Pizza Express — Plataforma de pedidos en línea

## 1. Nombre del proyecto

**E-commerce: Sistema de pedidos Online - Pizza Express**

## 2. Integrantes del equipo

| Integrante | Rol |
|---|---|
| Ricardo Vela López | Líder del proyecto |
| Adiel Felipe Espinosa Muñoz | Encargado técnico |
| Alejandra Yunda López | Encargada de documentación |
| Cristian David Musse Ordoñez | Encargado de presentación |

## 3. Problema que resuelve

El sistema busca solucionar los problemas que se presentan en las pizzerías locales cuando los pedidos se realizan mediante llamadas telefónicas, mensajes de WhatsApp o atención presencial.

Estos procesos pueden provocar demoras en la atención al cliente, errores al tomar los pedidos, confusiones al registrar datos manualmente, dificultades para administrar los pedidos y confusiones con los precios y productos disponibles.

El sistema propone una plataforma web que permitirá gestionar de manera ordenada el proceso de compra de pizzas. Los clientes podrán registrarse y seleccionar los productos disponibles, mientras que la pizzería podrá administrar los productos y pedidos desde el sistema.

# 4. Objetivo

Desarrollar una plataforma web para gestionar los pedidos de Pizza Express mediante una arquitectura de microservicios, separando las principales funciones del sistema en servicios independientes.

La arquitectura busca permitir:

- Separar las responsabilidades del sistema.
- Facilitar el mantenimiento y actualización de cada servicio.
- Permitir el escalamiento independiente de los componentes.
- Aislar fallos para evitar que un problema en un servicio afecte a todo el sistema.
- Mantener los datos organizados según la responsabilidad de cada servicio.
- Facilitar la incorporación de nuevas funcionalidades en el futuro.

## 5. Arquitectura

El sistema está diseñado con una arquitectura de microservicios. Cada servicio tiene una responsabilidad específica y administra sus propios datos.

El diagrama visual de la arquitectura del proyecto se encuentra en la carpeta docs/arquitectura, en el archivo Arquitectura Pizzeria Express.drawio.png. Se puede consultar esa imagen para observar la distribución de los componentes y sus relaciones.

Docker Compose crea una red interna para los servicios. Los contenedores pueden resolverse por el nombre del servicio. 

La arquitectura busca separar responsabilidades, facilitar el mantenimiento y permitir que cada servicio evolucione sin tener que modificar directamente las tablas de los demás.

## 6. Servicios implementados

Los tres servicios de aplicación principales están desarrollados con Flask y conectores MySQL.

| Servicio | Responsabilidad | Información que administra | Persistencia |
|---|---|---|---|
| **Usuarios** | Consultar, crear, actualizar y eliminar usuarios. | `id`, `nombre`, `apellidos`, `correo`, `telefono`, `direccion`, `rol`. | MySQL, base prevista `db_usuarios`, tabla `usuarios`. |
| **Productos** | Administrar el catálogo de pizzas. | `id`, `nombre`, `tamanio`, `descripcion`, `precio`, `disponible`. | MySQL, base `db_productos`, tabla `productos`. |
| **Pedidos** | Crear y consultar pedidos, actualizar su estado o dirección y eliminarlos. | `id`, `cliente_id`, `producto_id`, `cantidad`, `direccion`, `total`, `fecha`, `estado`. | MySQL, base `db_pedidos`, tabla `pedidos`. |

## 7. Endpoints

Los siguientes endpoints están declarados en el código de `app.py`. 

### 7.1 Servicio Usuarios

Base URL local: `http://localhost:3001`

| Método | Endpoint | Descripción | Entrada principal |
|---|---|---|---|
| `GET` | `/usuarios` | Lista los usuarios. | Ninguna. |
| `GET` | `/api/usuarios/{id}` | Consulta un usuario por ID. | ID en la URL. |
| `POST` | `/api/usuarios` | Crea un usuario. | JSON con `nombre`, `apellidos`, `correo`, `telefono`, `direccion`, `rol`. |
| `PUT` | `/api/usuarios/{id}` | Actualiza todos los campos del usuario. | JSON con los campos del usuario. |
| `PATCH` | `/api/usuarios/{id}` | Actualiza parcialmente campos enviados. | JSON con los campos que se desean cambiar. |
| `DELETE` | `/api/usuarios/{id}` | Elimina un usuario. | ID en la URL. |

Ejemplo de JSON para crear un usuario:

```json
{
  "nombre": "Laura",
  "apellidos": "Gómez Rodríguez",
  "correo": "laura@example.com",
  "telefono": "3001234567",
  "direccion": "Calle 10 # 5-20",
  "rol": "cliente"
}
```

### 7.2 Servicio Productos

Base URL local: `http://localhost:3003`

| Método | Endpoint | Descripción | Entrada principal |
|---|---|---|---|
| `GET` | `/productos` | Lista los productos. | Ninguna. |
| `GET` | `/productos/{id}` | Consulta un producto por ID. | ID en la URL. |
| `POST` | `/productos` | Crea un producto. | JSON con `nombre`, `tamanio`, `descripcion`, `precio` y, opcionalmente, `disponible`. |
| `PUT` | `/productos/{id}` | Actualiza los datos del producto. | JSON con los campos del producto. |
| `PATCH` | `/productos/{id}/disponibilidad` | Cambia la disponibilidad. | JSON con `disponible` booleano. |
| `DELETE` | `/productos/{id}` | Elimina un producto. | ID en la URL. |

Ejemplo de JSON para crear un producto:

```json
{
  "nombre": "Pizza Pepperoni",
  "tamanio": "Mediana",
  "descripcion": "Salsa de tomate, queso mozzarella y pepperoni",
  "precio": 12.99,
  "disponible": true
}
```

### 7.3 Servicio Pedidos

Base URL local: `http://localhost:3004`

| Método | Endpoint | Descripción | Entrada principal |
|---|---|---|---|
| `GET` | `/api/pedidos` | Lista los pedidos. | Ninguna. |
| `GET` | `/api/pedidos/{id}` | Consulta un pedido por ID. | ID en la URL. |
| `POST` | `/api/pedidos` | Crea un pedido tras consultar al cliente y al producto. | JSON con `cliente_id`, `producto_id` y `cantidad`. |
| `PUT` | `/api/pedidos/{id}/estado` | Actualiza el estado de un pedido. | JSON con `estado`. |
| `PATCH` | `/api/pedidos/{id}` | Actualiza la dirección del pedido. | JSON con `direccion`. |
| `DELETE` | `/api/pedidos/{id}` | Elimina un pedido. | ID en la URL. |

Ejemplo de JSON para crear un pedido:

```json
{
  "cliente_id": 1,
  "producto_id": 1,
  "cantidad": 2
}
```

La dirección se toma del usuario consultado y el total se calcula usando el precio del producto multiplicado por la cantidad.

## 8. Comunicación entre servicios

El servicio **Pedidos** consume las APIs de Usuarios y Productos mediante HTTP:

| Servicio solicitante | Servicio consultado | Endpoint llamado | Información recibida |
|---|---|---|---|
| Pedidos | Usuarios | `GET /api/usuarios/{id}` | Datos del cliente, especialmente la dirección. |
| Pedidos | Productos | `GET /productos/{id}` | Nombre, precio y disponibilidad del producto. |

Flujo previsto para crear un pedido:

1. El cliente envía `cliente_id`, `producto_id` y `cantidad` a `POST /api/pedidos`.
2. Pedidos consulta al servicio Usuarios para comprobar el cliente y obtener su dirección.
3. Pedidos consulta Productos para comprobar el producto, su precio y su disponibilidad.
4. Pedidos calcula el total y guarda el pedido en `db_pedidos`.
5. La API devuelve el resultado de la operación.

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