-- =============================================================================
-- Script de inicialización SQL (init.sql) — Proyecto MichiMochi
-- Evidencia: GA10-220501097-AA5-EV01 (SENA - ADSO)
-- Base de datos: michimochi | Tablas: productos, pedidos
-- =============================================================================

CREATE DATABASE IF NOT EXISTS michimochi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE michimochi;

CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL UNIQUE,
    categoria VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    precio_usd DECIMAL(10, 2) NOT NULL,
    descuento_pct INT DEFAULT 0,
    stock INT NOT NULL DEFAULT 10,
    destacado BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_nombre VARCHAR(100) NOT NULL,
    cliente_correo VARCHAR(120) NOT NULL,
    ciudad VARCHAR(60) NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    total_usd DECIMAL(10, 2) NOT NULL,
    estado ENUM('PENDING', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pedido_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
);

INSERT INTO productos (nombre, categoria, descripcion, precio_usd, descuento_pct, stock, destacado) VALUES
('Strawberry Dream Mochi', 'Strawberry', 'Mochi artesanal relleno de fresa fresca y crema batida', 4.25, 0, 32, TRUE),
('Mango Sunshine Mochi', 'Mango', 'Mochi suave con relleno de mango Alphonso tropical', 4.50, 14, 38, FALSE),
('Matcha Zen Mochi', 'Matcha', 'Mochi tradicional con te verde matcha ceremonial de Uji', 4.75, 0, 28, FALSE),
('Velvet Chocolate Mochi', 'Chocolate', 'Mochi relleno de ganache de chocolate belga 70%', 4.50, 25, 45, FALSE);

INSERT INTO pedidos (cliente_nombre, cliente_correo, ciudad, producto_id, cantidad, total_usd, estado) VALUES
('Ana Maria Gomez', 'ana.gomez@correo.com', 'Bogota', 1, 2, 8.50, 'DELIVERED'),
('Carlos Andres Ruiz', 'carlos.ruiz@correo.com', 'Medellin', 3, 3, 14.25, 'ON_THE_WAY'),
('Laura Valentina Diaz', 'laura.diaz@correo.com', 'Cali', 4, 4, 18.00, 'PREPARING'),
('Juan Esteban Mora', 'juan.mora@correo.com', 'Bogota', 2, 1, 4.50, 'PENDING');
