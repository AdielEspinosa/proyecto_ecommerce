USE db_pedidos;

CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente'
);

INSERT INTO pedidos
(cliente_id, producto_id, cantidad, direccion, total, estado)
VALUES
(1, 1, 2, 'Calle 10 # 5-20', 17.00, 'pendiente'),
(2, 4, 1, 'Carrera 12 # 8-30', 9.00, 'pendiente'),
(3, 2, 1, 'Calle 20 # 10-15', 12.99, 'preparando'),
(5, 5, 2, 'Calle 15 # 7-25', 27.00, 'pendiente'),
(6, 7, 1, 'Carrera 20 # 12-10', 14.50, 'entregado'),
(7, 10, 1, 'Calle 30 # 18-50', 19.99, 'cancelado'),
(8, 3, 2, 'Carrera 5 # 22-18', 35.00, 'preparando');