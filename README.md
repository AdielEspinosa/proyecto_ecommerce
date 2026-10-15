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
## 9. Bases de datos

Cada servicio administra su propia base de datos MySQL y no debe acceder directamente a las tablas de los otros servicios.

| Servicio | Base configurada en Compose | Tabla principal | Campos principales |
|---|---|---|---|
| Usuarios | `db_usuarios` | `usuarios` | `id`, `nombre`, `apellidos`, `correo`, `telefono`, `direccion`, `rol`. |
| Productos | `db_productos` | `productos` | `id`, `nombre`, `tamanio`, `descripcion`, `precio`, `disponible`. |
| Pedidos | `db_pedidos` | `pedidos` | `id`, `cliente_id`, `producto_id`, `cantidad`, `direccion`, `total`, `fecha`, `estado`. |

Los scripts SQL del repositorio se encuentran en `bases_datos/`:

- `db_usuarios.sql`
- `db_productos.sql`
- `db_pedidos.sql`

### Persistencia con Docker

En `docker-compose.yml` se definen los volúmenes nombrados `db_usuarios`, `db_productos` y `db_pedidos`, montados en `/var/lib/mysql`. Estos volúmenes permiten conservar los datos al eliminar y volver a crear los contenedores, siempre que no se eliminen también los volúmenes.

## 10. Variables de entorno

Los servicios leen los parámetros de conexión desde archivos `.env`, cargados por Docker Compose con `env_file`.

### Usuarios — `servicios/usuarios/.env`

| Variable | Uso | Valor actual |
|---|---|---|
| `DB_HOST` | Nombre del contenedor de base de datos en la red Compose. | `db_usuarios` |
| `DB_PORT` | Puerto interno de MySQL. | `3306` |
| `DB_USER` | Usuario de conexión. | `root` |
| `DB_PASSWORD` | Contraseña de conexión. | `root` |
| `DB_NAME` | Base de datos. | `db_usuarios` |

### Productos — `servicios/productos/.env`

| Variable | Uso | Valor actual |
|---|---|---|
| `DB_HOST` | Host MySQL. | `db_productos` |
| `DB_PORT` | Puerto interno de MySQL. | `3306` |
| `DB_USER` | Usuario de conexión. | `root` |
| `DB_PASSWORD` | Contraseña de conexión. | `root` |
| `DB_NAME` | Base de datos. | `db_productos` |

### Pedidos — `servicios/pedidos/.env`

| Variable | Uso | Valor actual |
|---|---|---|
| `DB_HOST` | Host MySQL. | `db_pedidos` |
| `DB_PORT` | Puerto interno de MySQL. | `3306` |
| `DB_USER` | Usuario de conexión. | `root` |
| `DB_PASSWORD` | Contraseña de conexión. | `root` |
| `DB_NAME` | Base de datos. | `db_pedidos` |
| `USUARIOS_URL` | URL interna de Usuarios. | `http://usuarios:5000` |
| `PRODUCTOS_URL` | URL interna de Productos. | `http://productos:5000` |

Los valores actuales son apropiados para un entorno académico local, no para producción. No se deben publicar contraseñas reales en un repositorio público; para una entrega pública, se recomienda usar un archivo `.env.example` y excluir los `.env` reales del control de versiones.

## 11. Cómo ejecutar el sistema

### Requisitos previos

- Docker instalado.
- Docker Compose disponible como `docker compose`.
- Puertos locales `3000`, `3001`, `3003`, `3004`, `3303` y `3308` libres.

### Levantar los contenedores

Desde la carpeta raíz del repositorio, donde está `docker-compose.yml`:

```bash
docker compose up --build
```

Consultar el estado:

```bash
docker compose ps
```

### Crear y consultar las bases de datos por consola

**1. Entrar al contenedor de MySQL**. Para Usuarios, ejecutar:

```bash
docker compose exec db_usuarios bash
```

**2. Iniciar sesión en MySQL**:

```bash
mysql -u root -p
```

Escribir la contraseña "root" configurada en el archivo `.env` cuando se solicite.

**3. Crear la base de datos y seleccionarla**:

```sql
CREATE DATABASE IF NOT EXISTS db_usuarios;
USE db_usuarios;
```

**4. Crear la tabla de Usuarios**:

```sql
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    direccion VARCHAR(200),
    rol VARCHAR(50) NOT NULL
);
```

**5. Verificar que la base de datos y la tabla se hayan creado**:

```sql
SHOW DATABASES;
SHOW TABLES;
DESCRIBE usuarios;
```

Para consultar los registros guardados en la tabla:

```sql
SELECT * FROM usuarios;
```

**Para Productos y Pedidos**, se sigue el mismo procedimiento. Solo cambia el nombre de la base de datos y de la tabla: `db_productos` / `productos` y `db_pedidos` / `pedidos`. Primero hay que entrar al contenedor correspondiente desde la terminal:

```bash
docker compose exec db_productos bash
```

Después, iniciar MySQL con `mysql -u root -p` y ejecutar los comandos SQL correspondientes.

#### Script para crear la tabla Productos

Dentro de MySQL, en la instancia de Productos:

```sql
CREATE DATABASE IF NOT EXISTS db_productos;
USE db_productos;

CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tamanio VARCHAR(50) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    disponible BOOLEAN DEFAULT TRUE
);

SHOW TABLES;
DESCRIBE productos;
```

#### Script para crear la tabla Pedidos

Dentro de MySQL, en la instancia de Pedidos:

```sql
CREATE DATABASE IF NOT EXISTS db_pedidos;
USE db_pedidos;

CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente'
);

SHOW TABLES;
DESCRIBE pedidos;
```

### Puertos publicados

| Componente | Dirección local | Puerto interno |
|---|---|---:|
| Home / frontend | `http://localhost:3000` | `80` |
| Usuarios | `http://localhost:3001` | `5000` |
| Productos | `http://localhost:3003` | `5000` |
| Pedidos | `http://localhost:3004` | `5000` |
| MySQL Usuarios | Puerto local `3308` | `3306` |
| MySQL Productos | Puerto local `3303` | `3306` |


### Detener los contenedores

```bash
docker compose down
```

Para eliminar también los volúmenes y los datos guardados (solo si se desea reiniciar toda la información):

```bash
docker compose down -v
```