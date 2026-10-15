CREATE DATABASE IF NOT EXISTS db_usuarios;

USE db_usuarios;


CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    direccion VARCHAR(200),
    rol VARCHAR(50) NOT NULL
);

INSERT INTO usuarios
(nombre, apellidos, correo, telefono, direccion, rol)
VALUES
('Laura', 'Gomez Rodriguez', 'laura.gomez@gmail.com', '3001234567', 'Calle 10 # 5-20', 'cliente'),
('Carlos', 'Martinez Lopez', 'carlos.martinez@gmail.com', '3012345678', 'Carrera 12 # 8-30', 'cliente'),
('Sofia', 'Ramirez Torres', 'sofia.ramirez@gmail.com', '3023456789', 'Calle 20 # 10-15', 'cliente'),
('Andres', 'Perez Castro', 'andres.perez@gmail.com', '3034567890', 'Carrera 8 # 15-40', 'administrador'),
('Valentina', 'Lopez Diaz', 'valentina.lopez@gmail.com', '3045678901', 'Calle 15 # 7-25', 'cliente'),
('Juan', 'Rodriguez Silva', 'juan.rodriguez@gmail.com', '3056789012', 'Carrera 20 # 12-10', 'cliente'),
('Camila', 'Torres Moreno', 'camila.torres@gmail.com', '3067890123', 'Calle 30 # 18-50', 'cliente'),
('Daniel', 'Castro Herrera', 'daniel.castro@gmail.com', '3078901234', 'Carrera 5 # 22-18', 'cliente');