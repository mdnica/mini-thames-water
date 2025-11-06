DELETE FROM users;
DELETE FROM bills;
DELETE FROM meter_readings;
DELETE FROM incidents;

INSERT INTO users (email, password_hash, first_name, last_name, address)
VALUES (
    'demo@customer.test',
  '$2b$10$n9o0S2L2Y0TrmS8J1gq5nOa8m4c5i6wR2g9i9cY9eF3Jt7xk6J7Si',
  'Demo',
  'User',
  '1 River St, London' 
);

-- password for demo user is: Demo123!

INSERT INTO bills (user_id, due_date, amount_pence, pdf_url, status)
VALUES 
(1, '2025-11-20', 3825, '/mock/bills/2025-11.pdf', 'due'),
(1, '2025-08-20', 4012, '/mock/bills/2025-08.pdf', 'paid');

INSERT INTO meter_readings (user_id, reading, submitted_at)
VALUES 
    (1, 12345, '2025-08-01T10:00:00Z');


INSERT INTO customers (name, address, email)
VALUES
('Alice Johnson', 'London', 'alice.johnson@thames.com'),
('Ben Smith', 'Oxford', 'ben.smith@thames.com'),
('Charlie Evans', 'Cambridge', 'charlie.evans@thames.com');
