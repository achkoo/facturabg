CREATE DATABASE IF NOT EXISTS facturacion_bulgaria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE facturacion_bulgaria;

-- Usuarios
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(100),
  lastName VARCHAR(100),
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Empresas
CREATE TABLE companies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  eik VARCHAR(20) UNIQUE NOT NULL,
  vatNumber VARCHAR(20),
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  bankName VARCHAR(255),
  iban VARCHAR(50),
  bic VARCHAR(20),
  logo TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Clientes
CREATE TABLE clients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  companyId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  eik VARCHAR(20) NOT NULL,
  vatNumber VARCHAR(20),
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
);

-- Productos
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  companyId INT NOT NULL,
  code VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  vatRate DECIMAL(5,2) DEFAULT 20,
  unit VARCHAR(20) DEFAULT 'бр.',
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
);

-- Documentos (Facturas, Presupuestos, Albaranes)
CREATE TABLE documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  companyId INT NOT NULL,
  clientId INT NOT NULL,
  documentType ENUM('invoice', 'quote', 'delivery', 'proforma') NOT NULL,
  documentNumber VARCHAR(50) UNIQUE NOT NULL,
  documentDate DATE NOT NULL,
  dueDate DATE,
  currency VARCHAR(3) DEFAULT 'BGN',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  vatAmount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
  language ENUM('bg', 'es', 'en') DEFAULT 'bg',
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE RESTRICT
);

-- Items de documentos
CREATE TABLE document_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  documentId INT NOT NULL,
  productId INT,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unitPrice DECIMAL(10,2) NOT NULL,
  vatRate DECIMAL(5,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL
);

-- Gastos
CREATE TABLE expenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  companyId INT NOT NULL,
  supplierId INT,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  vatAmount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  expenseDate DATE NOT NULL,
  category VARCHAR(100),
  status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
  attachments TEXT,
  ocrData TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (supplierId) REFERENCES clients(id) ON DELETE SET NULL
);

-- Métodos de pago
CREATE TABLE payment_methods (
  id INT PRIMARY KEY AUTO_INCREMENT,
  companyId INT,
  name VARCHAR(255) NOT NULL,
  type ENUM('cash', 'bank_transfer', 'card', 'other') NOT NULL,
  isDefault BOOLEAN DEFAULT false,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
);

-- Cuentas bancarias
CREATE TABLE bank_accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  companyId INT NOT NULL,
  accountName VARCHAR(255) NOT NULL,
  bankName VARCHAR(255) NOT NULL,
  iban VARCHAR(50) NOT NULL,
  bic VARCHAR(20),
  currency VARCHAR(3) DEFAULT 'BGN',
  isDefault BOOLEAN DEFAULT false,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
);

-- DATOS DE PRUEBA
-- Usuario demo (email: admin@test.bg, password: 123456)
INSERT INTO users (email, password, firstName, lastName) VALUES 
('admin@test.bg', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Test');

-- Empresa demo
INSERT INTO companies (userId, name, eik, vatNumber, address, city, email, phone, bankName, iban, bic) VALUES 
(1, 'Mi Empresa EOOD', '123456789', 'BG123456789', 'ул. Витоша 1', 'София', 'empresa@test.bg', '+359888123456', 'УниКредит Булбанк', 'BG80UNCR70001523456789', 'UNCRBGSF');

-- Métodos de pago globales (companyId NULL para ser globales)
INSERT INTO payment_methods (companyId, name, type, isDefault) VALUES 
(NULL, 'В брой', 'cash', false),
(NULL, 'Банков превод', 'bank_transfer', true),
(NULL, 'Карта', 'card', false);

-- Algunos clientes de ejemplo
INSERT INTO clients (companyId, name, eik, vatNumber, address, city, email, phone) VALUES 
(1, 'ACME OOD', '987654321', 'BG987654321', 'бул. България 10', 'София', 'contact@acme.bg', '+359888999888'),
(1, 'Tech Solutions EOOD', '111222333', 'BG111222333', 'ул. Технологична 5', 'Пловдив', 'info@techsolutions.bg', '+359888777666'),
(1, 'Marketing Pro OOD', '444555666', 'BG444555666', 'пл. Централен 3', 'Варна', 'hello@marketingpro.bg', '+359888555444');

-- Algunos productos de ejemplo
INSERT INTO products (companyId, code, name, description, price, vatRate, unit) VALUES 
(1, 'SERV001', 'Консултантски услуги', 'Бизнес консултации', 100.00, 20.00, 'час'),
(1, 'SERV002', 'Уеб дизайн', 'Дизайн на уебсайт', 800.00, 20.00, 'проект'),
(1, 'PROD001', 'Лаптоп', 'Бизнес лаптоп', 1200.00, 20.00, 'бр.'),
(1, 'SERV003', 'Поддръжка', 'Техническа поддръжка', 50.00, 20.00, 'час');