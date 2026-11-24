# E-commerce: Sistema de pedidos Online - Pizza Express

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

El sistema está diseñado con una arquitectura de microservicios. La solución cuenta con una interfaz web Home, un API Gateway y cinco microservicios de dominio: Usuarios, Autenticación, Productos, Pedidos y Pagos. Cada servicio tiene una responsabilidad específica y administra su propia información.

El diagrama visual de la arquitectura del proyecto se encuentra en la carpeta `docs/arquitectura`, en el archivo **Arquitectura Pizzeria Express.drawio.png**. Allí se representa la distribución de los componentes y sus relaciones.

### 5.1. Componentes y relaciones

| Componente | Responsabilidad | Relación principal |
|---|---|---|
| Home | Interfaz web de Pizza Express. | Envía solicitudes al API Gateway. |
| API Gateway | Punto de entrada centralizado para las APIs. | Reenvía solicitudes a Usuarios, Autenticación, Productos, Pedidos y Pagos. |
| Usuarios | Administra perfiles de usuarios. | Es consultado por Autenticación y Pedidos. |
| Autenticación | Registra credenciales e inicia sesión. | Se comunica con Usuarios para crear y consultar el perfil. |
| Productos | Administra el catálogo de pizzas. | Es consultado por Pedidos. |
| Pedidos | Registra y administra pedidos. | Consulta Usuarios y Productos. |
| Pagos | Registra y administra pagos. | Consulta Pedidos antes de crear un pago. |
| Bases de datos | Almacenan la información de cada servicio. | Cada microservicio administra su propia base de datos. |

## 6. Microservicios

Los cinco microservicios están desarrollados con Flask y conectores MySQL. Cada servicio cuenta con su propio código, configuración de conexión y contenedor.

| Servicio | Responsabilidad | Información que administra | Persistencia |
|---|---|---|---|
| **Usuarios** | Consultar, crear, actualizar y eliminar usuarios. | Identificador, nombre, apellidos, correo, teléfono, dirección y rol. | MySQL, base `db_usuarios`, tabla `usuarios`. |
| **Autenticación** | Registrar credenciales e iniciar sesión. | Identificador, identificador del usuario asociado, nombre de usuario y contraseña. | MySQL, base `db_autenticacion`, tabla `credenciales`. |
| **Productos** | Administrar el catálogo de pizzas. | Identificador, nombre, tamaño, descripción, precio y disponibilidad. | MySQL, base `db_productos`, tabla `productos`. |
| **Pedidos** | Crear y consultar pedidos, actualizar su estado o dirección y eliminarlos. | Identificador, cliente, producto, cantidad, dirección, total, fecha y estado. | MySQL, base `db_pedidos`, tabla `pedidos`. |
| **Pagos** | Registrar y administrar pagos relacionados con pedidos. | Identificador, pedido asociado, método de pago, estado y fecha. | MySQL, base `db_pagos`, tabla `pagos`. |

### 6.3. Inventario de servicios

El siguiente inventario identifica los servicios que forman parte de la implementación incluida en el proyecto:

| Microservicio | Responsabilidad | Base de datos | Comunicación con otros servicios | Estado |
|---|---|---|---|---|
| Usuarios | Crear, consultar, actualizar y eliminar perfiles de usuario. | `db_usuarios` | Es consultado por Autenticación y Pedidos mediante HTTP. | Implementado |
| Autenticación | Registrar credenciales e iniciar sesión. | `db_autenticacion` | Consulta Usuarios para registrar el perfil y validar la información relacionada. | Implementado |
| Productos | Administrar pizzas, precios, tamaños y disponibilidad. | `db_productos` | Es consultado por Pedidos mediante HTTP. | Implementado |
| Pedidos | Crear, consultar, actualizar y eliminar pedidos. | `db_pedidos` | Consulta Usuarios y Productos; es consultado por Pagos. | Implementado |
| Pagos | Registrar, consultar, actualizar y eliminar pagos asociados a pedidos. | `db_pagos` | Consulta Pedidos mediante HTTP. | Implementado |

El API Gateway y Home son componentes de integración y presentación, respectivamente; no son microservicios de dominio ni administran una base de datos propia.

### 6.4. Usuarios

Administra los perfiles de los clientes y demás usuarios del sistema. Permite listar usuarios, consultar uno por identificador, crear, actualizar completamente, modificar parcialmente y eliminar perfiles.

### 6.5. Autenticación

Gestiona el registro de cuentas y el inicio de sesión. Durante el registro valida los campos obligatorios, verifica el nombre de usuario y solicita al servicio Usuarios la creación del perfil. Después almacena las credenciales en su propia base de datos.

Los roles aceptados por el código son `cliente`, `operador` y `administrador`. El inicio de sesión valida el nombre de usuario y la contraseña y consulta el perfil asociado en Usuarios.

### 6.6. Productos

Administra el catálogo de pizzas. Permite listar y consultar productos, crear productos, actualizar sus datos, cambiar su disponibilidad y eliminarlos.

### 6.7. Pedidos

Administra los pedidos. Para crear uno, consulta al servicio Usuarios para obtener los datos del cliente y su dirección, y consulta Productos para verificar el producto, el precio y su disponibilidad. Calcula el total multiplicando el precio por la cantidad y guarda el pedido en su base de datos.

También permite consultar pedidos, actualizar su estado, modificar su dirección y eliminar registros.

### 6.8. Pagos

Administra los pagos asociados a pedidos. Antes de registrar un pago consulta al servicio Pedidos para verificar que el pedido exista. El código acepta los métodos de pago `efectivo`, `tarjeta` y `transferencia`; el pago se registra inicialmente con estado `pendiente`.

Permite listar, consultar, registrar, actualizar el estado y eliminar pagos.

## 7. Endpoints

Las rutas siguientes se verificaron en los archivos `app.py` de cada microservicio y en `servicios/gateway/app.py`. Las rutas locales se utilizan para acceder directamente a cada servicio. Las rutas públicas del Gateway se detallan en la sección **API Gateway**.

Las respuestas de las APIs se entregan en formato JSON. Cuando se indica un cuerpo JSON, los nombres de los campos corresponden a los utilizados por el código.

### 7.1. Usuarios

Base URL local: `http://localhost:3001`

| Método | Ruta | Entrada | Respuesta documentada por el código |
|---|---|---|---|
| GET | `/usuarios` | Sin cuerpo. | Lista de usuarios en JSON. |
| GET | `/api/usuarios/{id}` | Identificador en la ruta. | Usuario en JSON o mensaje de usuario no encontrado (404). |
| POST | `/api/usuarios` | `nombre`, `apellidos`, `correo`, `telefono`, `direccion`, `rol`. | Mensaje de creación e identificador (201). |
| PUT | `/api/usuarios/{id}` | Los seis campos del usuario. | Mensaje de actualización. |
| PATCH | `/api/usuarios/{id}` | Campos que se desean modificar. | Mensaje de modificación. |
| DELETE | `/api/usuarios/{id}` | Identificador en la ruta. | Mensaje de eliminación o no encontrado (404). |

Ejemplo de solicitud para crear un usuario:

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

### 7.2. Autenticación

Base URL local: `http://localhost:3002`

| Método | Ruta | Entrada | Respuesta documentada por el código |
|---|---|---|---|
| POST | `/api/autenticacion/registro` | `nombre`, `apellidos`, `correo`, `direccion`, `nombre_usuario`, `password`; `telefono` y `rol` son opcionales. | Confirmación de registro, identificadores, nombre de usuario y rol (201); errores de validación o dependencia. |
| POST | `/api/autenticacion/login` | `nombre_usuario`, `password`. | Mensaje de inicio de sesión y objeto usuario (200); credenciales incorrectas (401). |
| GET | `/api/autenticacion/circuito/usuarios` | Sin cuerpo. | Estado del Circuit Breaker, fallos, umbral y periodo de recuperación. |

Para el registro, el rol predeterminado es `cliente`. Los roles permitidos son `cliente`, `operador` y `administrador`.

Ejemplo de solicitud de inicio de sesión:

```json
{
  "nombre_usuario": "laura.gomez",
  "password": "123456"
}
```

### 7.3. Productos

Base URL local: `http://localhost:3003`

| Método | Ruta | Entrada | Respuesta documentada por el código |
|---|---|---|---|
| GET | `/productos` | Sin cuerpo. | Lista de productos en JSON. |
| GET | `/productos/{id}` | Identificador en la ruta. | Producto en JSON o mensaje de producto no encontrado (404). |
| POST | `/productos` | `nombre`, `tamanio`, `descripcion`, `precio`; `disponible` es opcional. | Mensaje de creación e identificador (201). |
| PUT | `/productos/{id}` | `nombre`, `tamanio`, `descripcion`, `precio`, `disponible`. | Mensaje de actualización (200) o no encontrado (404). |
| PATCH | `/productos/{id}/disponibilidad` | `disponible` booleano. | Mensaje de actualización de disponibilidad (200) o no encontrado (404). |
| DELETE | `/productos/{id}` | Identificador en la ruta. | Mensaje de eliminación (200) o no encontrado (404). |

Ejemplo de solicitud para crear un producto:

```json
{
  "nombre": "Pizza Pepperoni",
  "tamanio": "Mediana",
  "descripcion": "Salsa de tomate, queso mozzarella y pepperoni",
  "precio": 38000,
  "disponible": true
}
```

### 7.4. Pedidos

Base URL local: `http://localhost:3004`

| Método | Ruta | Entrada | Respuesta documentada por el código |
|---|---|---|---|
| GET | `/api/pedidos` | Sin cuerpo. | Lista de pedidos en JSON. |
| GET | `/api/pedidos/{id}` | Identificador en la ruta. | Pedido en JSON o no encontrado (404). |
| POST | `/api/pedidos` | `cliente_id`, `producto_id`, `cantidad`. | Mensaje de pedido creado, identificador y total (201); errores de validación, dependencia o disponibilidad. |
| PUT | `/api/pedidos/{id}/estado` | `estado`. | Mensaje de actualización o no encontrado (404). |
| PATCH | `/api/pedidos/{id}` | `direccion`. | Mensaje de actualización de dirección o no encontrado (404). |
| DELETE | `/api/pedidos/{id}` | Identificador en la ruta. | Mensaje de eliminación o no encontrado (404). |
| GET | `/api/pedidos/circuito/usuarios` | Sin cuerpo. | Estado del circuito hacia Usuarios. |
| GET | `/api/pedidos/circuito/productos` | Sin cuerpo. | Estado del circuito hacia Productos. |

Ejemplo de solicitud para crear un pedido:

```json
{
  "cliente_id": 1,
  "producto_id": 1,
  "cantidad": 2
}
```

La dirección se obtiene del usuario consultado y el total se calcula usando el precio del producto multiplicado por la cantidad.

### 7.5. Pagos

Base URL local: `http://localhost:3005`

| Método | Ruta | Entrada | Respuesta documentada por el código |
|---|---|---|---|
| GET | `/api/pagos` | Sin cuerpo. | Lista de pagos en JSON. |
| GET | `/api/pagos/{id}` | Identificador en la ruta. | Pago en JSON o no encontrado (404). |
| POST | `/api/pagos` | `pedido_id`, `metodo_pago`. | Confirmación, identificador, pedido, método y estado inicial (201); errores de validación o dependencia. |
| PUT | `/api/pagos/{id}` | `estado`. | Mensaje de actualización o no encontrado (404). |
| DELETE | `/api/pagos/{id}` | Identificador en la ruta. | Mensaje de eliminación o no encontrado (404). |
| GET | `/api/pagos/circuito/pedidos` | Sin cuerpo. | Estado del Circuit Breaker hacia Pedidos. |

Métodos de pago admitidos por el código: `efectivo`, `tarjeta` y `transferencia`.

Ejemplo de solicitud para registrar un pago:

```json
{
  "pedido_id": 1,
  "metodo_pago": "efectivo"
}
```

## 8. Bases de datos

Cada microservicio que administra información cuenta con una base MySQL propia. No se comparten tablas entre servicios ni se realizan consultas SQL directas a las bases de datos de otros microservicios.

### 8.1. Inventario de bases de datos y tablas

| Microservicio | Base de datos | Tabla principal | Información almacenada |
|---|---|---|---|
| Usuarios | `db_usuarios` | `usuarios` | Identificador, nombre, apellidos, correo, teléfono, dirección y rol. |
| Autenticación | `db_autenticacion` | `credenciales` | Identificador, usuario relacionado, nombre de usuario y contraseña. |
| Productos | `db_productos` | `productos` | Identificador, nombre, tamaño, descripción, precio y disponibilidad. |
| Pedidos | `db_pedidos` | `pedidos` | Identificador, cliente, producto, cantidad, dirección, total, fecha y estado. |
| Pagos | `db_pagos` | `pagos` | Identificador, pedido relacionado, método de pago, estado y fecha. |

Los atributos se describen en texto para facilitar su lectura:

- **usuarios:** id, nombre, apellidos, correo, telefono, direccion y rol.
- **credenciales:** id, usuario_id, nombre_usuario y password.
- **productos:** id, nombre, tamanio, descripcion, precio y disponible.
- **pedidos:** id, cliente_id, producto_id, cantidad, direccion, total, fecha y estado.
- **pagos:** id, pedido_id, metodo_pago, estado y fecha.

Los scripts SQL se encuentran en la carpeta `bases_datos/`:

- `db_usuarios.sql`
- `db_autenticacion.sql`
- `db_productos.sql`
- `db_pedidos.sql`
- `db_pagos.sql`

Los scripts incluyen sentencias de creación de tablas y, en algunos casos, registros iniciales de ejemplo. El archivo `db_pagos.sql` crea la tabla de pagos sin insertar datos iniciales.

## 9. Persistencia

La persistencia se implementa mediante cinco contenedores MySQL, cada uno asociado a una base de datos y a un volumen Docker nombrado.

| Contenedor de base de datos | Volumen | Punto de montaje |
|---|---|---|
| `db_usuarios` | `db_usuarios` | `/var/lib/mysql` |
| `db_autenticacion` | `db_autenticacion` | `/var/lib/mysql` |
| `db_productos` | `db_productos` | `/var/lib/mysql` |
| `db_pedidos` | `db_pedidos` | `/var/lib/mysql` |
| `db_pagos` | `db_pagos` | `/var/lib/mysql` |

Los volúmenes están declarados al final de `docker-compose.yml`. Permiten conservar los datos cuando se detienen o recrean los contenedores, siempre que no se eliminen los volúmenes.

Para comprobar la persistencia se debe:

1. Registrar información en uno o varios servicios.
2. Consultar y verificar que los registros se encuentren almacenados.
3. Detener y recrear los contenedores de aplicación sin eliminar los volúmenes.
4. Consultar nuevamente los registros y comprobar que continúan disponibles.

**Advertencia:** `docker compose down -v` elimina los volúmenes y, por tanto, los datos persistidos. No debe utilizarse durante la prueba de persistencia.

## 10. Comunicación

La comunicación entre microservicios se realiza mediante solicitudes HTTP. Cada servicio consulta los endpoints del servicio propietario de la información; no accede directamente a sus tablas.

### 10.1. Inventario de comunicaciones

| Servicio solicitante | Servicio destino | Solicitud HTTP | Información utilizada |
|---|---|---|---|
| Autenticación | Usuarios | POST `/api/usuarios` | Crea el perfil asociado al registro. |
| Autenticación | Usuarios | GET `/api/usuarios/{id}` | Consulta el perfil durante el inicio de sesión. |
| Autenticación | Usuarios | DELETE `/api/usuarios/{id}` | Intenta revertir la creación del perfil si falla el almacenamiento de credenciales. |
| Pedidos | Usuarios | GET `/api/usuarios/{id}` | Obtiene los datos del cliente y su dirección. |
| Pedidos | Productos | GET `/productos/{id}` | Verifica el producto, precio y disponibilidad. |
| Pagos | Pedidos | GET `/api/pedidos/{id}` | Verifica que exista el pedido asociado al pago. |
| Home | API Gateway | Solicitudes a rutas `/api/...` | Acceso a las funcionalidades expuestas por los servicios. |
| API Gateway | Microservicios | Reenvío de métodos HTTP | Transmite parámetros y cuerpo JSON, y conserva el código HTTP de respuesta. |

### 10.2. Flujo de creación de pedido

1. El cliente envía cliente_id, producto_id y cantidad a `POST /api/pedidos`.
2. Pedidos consulta Usuarios para comprobar el cliente y obtener su dirección.
3. Pedidos consulta Productos para comprobar el producto, su precio y su disponibilidad.
4. Si las consultas son correctas y el producto está disponible, Pedidos calcula el total y guarda el registro en `db_pedidos`.
5. El servicio devuelve el resultado de la operación.

### 10.3. Flujo de registro de cuenta

1. El cliente envía los datos de perfil y las credenciales a Autenticación.
2. Autenticación valida los campos y consulta su base para verificar que el nombre de usuario no esté registrado.
3. Autenticación solicita a Usuarios la creación del perfil.
4. Si Usuarios crea el perfil, Autenticación guarda las credenciales en `db_autenticacion`.
5. Si falla el almacenamiento de credenciales, el código intenta eliminar el perfil creado para revertir la operación.

### 10.4. Flujo de registro de pago

1. El cliente envía el identificador del pedido y el método de pago a Pagos.
2. Pagos consulta Pedidos mediante HTTP.
3. Si el pedido existe, Pagos registra el pago con estado inicial `pendiente`.
4. Si la dependencia no está disponible, Pagos devuelve el error correspondiente.

Dentro de Docker Compose, las direcciones internas se configuran mediante nombres de servicio y puerto `5000`. Por ejemplo, Usuarios se consulta mediante `http://usuarios:5000`, Productos mediante `http://productos:5000` y Pedidos mediante `http://pedidos:5000`.

## 11. Timeout y Circuit Breaker

### 11.1. Timeout

Los servicios que realizan solicitudes HTTP configuran un tiempo máximo de espera para evitar que una operación quede esperando indefinidamente.

| Comunicación | Variable de entorno | Valor por defecto en el código |
|---|---|---:|
| Autenticación a Usuarios | `USUARIOS_TIMEOUT` | 5 segundos |
| Pedidos a Usuarios | `USUARIOS_TIMEOUT` | 2 segundos |
| Pedidos a Productos | `PRODUCTOS_TIMEOUT` | 2 segundos |
| Pagos a Pedidos | `PEDIDOS_TIMEOUT` | 5 segundos |
| API Gateway a microservicios | Valor definido en la función de reenvío | 5 segundos |

### 11.2. Circuit Breaker

El proyecto utiliza `pybreaker` para proteger las dependencias HTTP frente a fallos técnicos repetidos.

| Servicio solicitante | Servicio protegido | Umbral de fallos | Tiempo de recuperación |
|---|---|---:|---:|
| Autenticación | Usuarios | 3 | 20 segundos por defecto |
| Pedidos | Usuarios | 3 | 30 segundos por defecto |
| Pedidos | Productos | 3 | 30 segundos por defecto |
| Pagos | Pedidos | 3 | 30 segundos por defecto |

Los valores se configuran mediante `CB_MAX_FALLOS` y `CB_RECUPERACION`. En el `.env` incluido se establece `CB_MAX_FALLOS = 3` y `CB_RECUPERACION = 20`. Como los servicios utilizan estas variables, el valor de recuperación efectivo en ese archivo es de 20 segundos para los circuitos, aunque los valores de respaldo del código de Pedidos y Pagos sean 30 segundos.

El patrón contempla los siguientes estados:

- **CLOSED:** permite las solicitudes y registra los fallos de la dependencia.
- **OPEN:** después de alcanzar el umbral, rechaza las solicitudes protegidas durante el periodo de recuperación.
- **HALF_OPEN:** después del periodo de recuperación, permite una solicitud de prueba para comprobar si la dependencia se recuperó. Si la prueba es satisfactoria, el circuito vuelve a CLOSED; si falla, vuelve a OPEN.

El estado de los circuitos puede consultarse mediante estos endpoints locales:

| Servicio | Endpoint de estado | Dependencia protegida |
|---|---|---|
| Autenticación | `/api/autenticacion/circuito/usuarios` | Usuarios |
| Pedidos | `/api/pedidos/circuito/usuarios` | Usuarios |
| Pedidos | `/api/pedidos/circuito/productos` | Productos |
| Pagos | `/api/pagos/circuito/pedidos` | Pedidos |

Las respuestas de estas rutas incluyen el servicio protegido, estado actual, contador de fallos, umbral de fallos y periodo de recuperación.

Para demostrar el patrón se debe comprobar el estado inicial CLOSED, provocar fallos controlados hasta alcanzar el umbral, consultar el estado OPEN, realizar otra solicitud durante la apertura, restablecer el servicio dependiente y comprobar el intento de recuperación HALF_OPEN y el retorno a CLOSED.

### 11.3. Manejo de errores y recuperación

En las dependencias entre servicios se manejan errores de conexión, Timeout y Circuit Breaker abierto. Entre las respuestas contempladas por el código se encuentran:

| Código HTTP | Situación documentada |
|---|---|
| 200 | Consulta u operación correcta. |
| 201 | Registro creado. |
| 400 | Datos obligatorios ausentes, inválidos o producto no disponible. |
| 401 | Credenciales incorrectas o cuenta sin usuario asociado. |
| 404 | Usuario, producto, pedido o pago no encontrado. |
| 409 | Nombre de usuario o correo duplicado durante el registro. |
| 500 | Error al guardar credenciales u otra operación interna controlada. |
| 502 | Error de comunicación o respuesta inesperada de una dependencia. |
| 503 | Servicio no disponible o Circuit Breaker abierto. |
| 504 | Tiempo de espera agotado. |

## 12. API Gateway

El proyecto contiene un API Gateway desarrollado con Flask en `servicios/gateway/`. Su dirección local publicada por Docker Compose es `http://localhost:3006`.

El Gateway funciona como punto de entrada centralizado. Recibe las solicitudes del cliente, las reenvía al servicio correspondiente y conserva el contenido de la respuesta, el código de estado y el tipo de contenido. No implementa las operaciones SQL ni la lógica de negocio de los microservicios.

La función de reenvío utiliza un Timeout de 5 segundos. Si la solicitud excede ese tiempo devuelve HTTP 504; si no puede establecer conexión con el servicio de destino devuelve HTTP 503.

### 12.1. Rutas públicas y servicios destino

| Método | Ruta pública | Servicio destino | Ruta interna |
|---|---|---|---|
| GET | `/api/usuarios-list` | Usuarios | `/usuarios` |
| POST | `/api/usuarios` | Usuarios | `/api/usuarios` |
| GET, PUT, PATCH, DELETE | `/api/usuarios/{id}` | Usuarios | `/api/usuarios/{id}` |
| GET | `/api/productos-list` | Productos | `/productos` |
| POST | `/api/productos` | Productos | `/productos` |
| GET, PUT, DELETE | `/api/productos/{id}` | Productos | `/productos/{id}` |
| PATCH | `/api/productos/{id}/disponibilidad` | Productos | `/productos/{id}/disponibilidad` |
| GET, POST | `/api/pedidos` | Pedidos | `/api/pedidos` |
| GET, PATCH, DELETE | `/api/pedidos/{id}` | Pedidos | `/api/pedidos/{id}` |
| PUT | `/api/pedidos/{id}/estado` | Pedidos | `/api/pedidos/{id}/estado` |
| GET | `/api/pedidos/circuito/usuarios` | Pedidos | `/api/pedidos/circuito/usuarios` |
| GET | `/api/pedidos/circuito/productos` | Pedidos | `/api/pedidos/circuito/productos` |
| POST | `/api/autenticacion/registro` | Autenticación | `/api/autenticacion/registro` |
| POST | `/api/autenticacion/login` | Autenticación | `/api/autenticacion/login` |
| GET | `/api/autenticacion/circuito` | Autenticación | La ruta interna definida por el Gateway es `/api/autenticacion/circuito` |
| GET, POST | `/api/pagos` | Pagos | `/api/pagos` |
| GET, PUT, DELETE | `/api/pagos/{id}` | Pagos | `/api/pagos/{id}` |
| GET | `/api/pagos/circuito/pedidos` | Pagos | `/api/pagos/circuito/pedidos` |

## 13. Docker Compose

El archivo `docker-compose.yml` se encuentra en la raíz del proyecto y define los siguientes componentes:

- Home.
- API Gateway.
- Microservicios Usuarios, Autenticación, Productos, Pedidos y Pagos.
- Bases de datos MySQL independientes para cada microservicio.
- Puertos publicados para acceder desde el equipo local.
- Volúmenes nombrados para conservar la información de las bases de datos.
- Dependencias de arranque entre los contenedores.

### 13.1. Puertos publicados

| Componente | Dirección local o puerto | Puerto interno |
|---|---|---:|
| Home / frontend | `http://localhost:3000` | 80 |
| API Gateway | `http://localhost:3006` | 5000 |
| Usuarios | `http://localhost:3001` | 5000 |
| Autenticación | `http://localhost:3002` | 5000 |
| Productos | `http://localhost:3003` | 5000 |
| Pedidos | `http://localhost:3004` | 5000 |
| Pagos | `http://localhost:3005` | 5000 |
| MySQL Usuarios | Puerto local 3308 | 3306 |
| MySQL Autenticación | Puerto local 3302 | 3306 |
| MySQL Productos | Puerto local 3303 | 3306 |
| MySQL Pedidos | Puerto local 3304 | 3306 |
| MySQL Pagos | Puerto local 3305 | 3306 |

### 13.2. Variables de entorno

Docker Compose carga el archivo `.env` de la raíz mediante `env_file` para los servicios de aplicación. El archivo incluido en el ZIP contiene parámetros de conexión para las cinco bases de datos, direcciones internas para Usuarios, Productos y Pedidos, y parámetros de Timeout y Circuit Breaker.

Las variables principales son:

| Variable | Función |
|---|---|
| `DB_PORT` | Puerto de MySQL. |
| `USUARIOS_DB_HOST`, `USUARIOS_DB_NAME`, `USUARIOS_DB_USER`, `USUARIOS_DB_PASSWORD` | Conexión de Usuarios a su base de datos. |
| `AUTENTICACION_DB_HOST`, `AUTENTICACION_DB_NAME`, `AUTENTICACION_DB_USER`, `AUTENTICACION_DB_PASSWORD` | Conexión de Autenticación a su base de datos. |
| `PRODUCTOS_DB_HOST`, `PRODUCTOS_DB_NAME`, `PRODUCTOS_DB_USER`, `PRODUCTOS_DB_PASSWORD` | Conexión de Productos a su base de datos. |
| `PEDIDOS_DB_HOST`, `PEDIDOS_DB_NAME`, `PEDIDOS_DB_USER`, `PEDIDOS_DB_PASSWORD` | Conexión de Pedidos a su base de datos. |
| `PAGOS_DB_HOST`, `PAGOS_DB_NAME`, `PAGOS_DB_USER`, `PAGOS_DB_PASSWORD` | Conexión de Pagos a su base de datos. |
| `USUARIOS_URL` | Dirección interna del servicio Usuarios. |
| `PRODUCTOS_URL` | Dirección interna del servicio Productos. |
| `PEDIDOS_URL` | Dirección interna del servicio Pedidos. |
| `CB_MAX_FALLOS` | Umbral de fallos del Circuit Breaker. |
| `CB_RECUPERACION` | Tiempo de recuperación del Circuit Breaker. |
| `USUARIOS_TIMEOUT` | Tiempo máximo de espera para llamadas a Usuarios. |
| `PRODUCTOS_TIMEOUT` | Tiempo máximo de espera para llamadas a Productos. |

El Gateway también contiene valores predeterminados para las direcciones de los cinco servicios, por lo que puede resolver sus destinos mediante los nombres internos de Compose.

**Seguridad:** el `.env` incluido en el ZIP contiene credenciales de ejemplo con usuario `root` y contraseña `root`. Son valores para el entorno académico local, no para producción. No se deben publicar credenciales reales en GitHub. Se recomienda mantener el `.env` fuera del control de versiones y agregar un `.env.example` sin secretos.

### 13.3. Requisitos previos

- Docker instalado.
- Docker Compose disponible como `docker compose`.
- Puertos locales indicados en la tabla disponibles.
- Archivo `.env` configurado en la raíz del proyecto.

### 13.4. Procedimiento de ejecución

Desde la carpeta raíz del repositorio, donde se encuentra `docker-compose.yml`, ejecutar:

```bash
docker compose up -d --build
```

Comprobar el estado de los contenedores:

```bash
docker compose ps
```

Para detener los contenedores:

```bash
docker compose down
```

Para eliminar también los volúmenes y los datos guardados, únicamente cuando se desee reiniciar toda la información:

```bash
docker compose down -v
```

### 13.5. Consulta de las bases de datos por consola

Por ejemplo, para ingresar a la base de datos de Usuarios:

```bash
docker compose exec db_usuarios bash
```

Iniciar sesión en MySQL:

```bash
mysql -u root -p
```

La contraseña configurada en el Compose para este entorno es `root`.

Una vez dentro de MySQL:

```sql
SHOW DATABASES;
USE db_usuarios;
SHOW TABLES;
DESCRIBE usuarios;
SELECT * FROM usuarios;
```

Para las demás bases de datos se ingresa al contenedor correspondiente: `db_autenticacion`, `db_productos`, `db_pedidos` o `db_pagos`, y se selecciona la base de datos respectiva.

Los scripts de creación y los datos iniciales se encuentran en `bases_datos/`. Las bases y tablas también se declaran en los scripts SQL del proyecto.

## 14. Pruebas

### 14.1. Ubicación de la matriz y las evidencias

La matriz de verificación y las evidencias se adjuntarán en la ruta:

`docs/pruebas/`

En esa ubicación se deberán incorporar los resultados obtenidos, las solicitudes realizadas, las respuestas recibidas y las capturas o registros que permitan comprobar el funcionamiento. La matriz no se incluye dentro de este README; se mantiene como documento de soporte independiente.

## 15. Estado actual

### 15.1. Funcionalidades y componentes presentes en el proyecto

| Elemento | Estado observado en los archivos |
|---|---|
| Home | Existe la aplicación web en `home/` y está declarada en Docker Compose. |
| API Gateway | Existe en `servicios/gateway/` y está declarado en Docker Compose. |
| Usuarios | API Flask y conexión MySQL implementadas. |
| Autenticación | Registro, inicio de sesión, consulta de perfil y Circuit Breaker hacia Usuarios implementados. |
| Productos | Operaciones para consultar, crear, actualizar, modificar disponibilidad y eliminar productos implementadas. |
| Pedidos | Operaciones de consulta, creación, actualización de estado, modificación de dirección y eliminación implementadas; consume Usuarios y Productos. |
| Pagos | Operaciones de consulta, creación, actualización de estado y eliminación implementadas; consume Pedidos. |
| Bases de datos | Cinco bases MySQL, scripts SQL y volúmenes Docker declarados. |
| Timeout | Configurado en llamadas HTTP entre servicios y en el reenvío del Gateway. |
| Circuit Breaker | Implementado en las dependencias Autenticación–Usuarios, Pedidos–Usuarios, Pedidos–Productos y Pagos–Pedidos. |
| Docker Compose | Define Home, Gateway, cinco microservicios y cinco contenedores de base de datos. |




