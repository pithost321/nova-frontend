-- CRM NOVA Database - Complete Data Insertion Script
-- This script inserts all required data for testing the system

USE u894306996_nova;

-- Clear existing data (in correct order to respect foreign keys)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE agent;
TRUNCATE TABLE agent_history;
TRUNCATE TABLE team;
TRUNCATE TABLE nova;
TRUNCATE TABLE client;
TRUNCATE TABLE service_client;
SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================
-- 1. Insert NOVA (HQ Users)
-- ==============================================
INSERT INTO nova (id, username, password, role) VALUES
(1, 'admin@crm.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye/LvdP8SqHPVpOYCBE5oJkxGQ9z6r5Ea', 'NOVA'),
(2, 'manager@crm.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye/LvdP8SqHPVpOYCBE5oJkxGQ9z6r5Ea', 'NOVA');

-- ==============================================
-- 2. Insert TEAMS
-- ==============================================
INSERT INTO team (id, username, password, role, nova_id, calls, leads, contacts, contact_ratio, 
                  nopause_time, system_time, talk_time, Sales, sales_per_working_hour, 
                  sales_to_leads_ratio, sales_to_contacts_ratio, sales_per_hour, 
                  incomplete_sales, cancelled_sales, callbacks, first_call_resolution, 
                  avg_sale_time, avg_contact_time) 
VALUES
(1, 'team.alpha@crm.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye/LvdP8SqHPVpOYCBE5oJkxGQ9z6r5Ea', 'TEAM', 1,
 450, 180, 120, '26.7%', '07:30:00', '08:00:00', '06:15:00', 45, 5.6, 
 '25.0%', '37.5%', 5.6, 5, 3, 25, 65.5, '00:08:30', '00:03:15'),

(2, 'team.bravo@crm.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye/LvdP8SqHPVpOYCBE5oJkxGQ9z6r5Ea', 'TEAM', 1,
 380, 152, 98, '25.8%', '07:00:00', '08:00:00', '05:45:00', 38, 5.4,
 '25.0%', '38.8%', 5.4, 4, 2, 22, 68.2, '00:08:00', '00:03:30'),

(3, 'team.charlie@crm.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye/LvdP8SqHPVpOYCBE5oJkxGQ9z6r5Ea', 'TEAM', 2,
 420, 168, 110, '26.2%', '07:15:00', '08:00:00', '06:00:00', 42, 5.8,
 '25.0%', '38.2%', 5.8, 3, 2, 28, 70.1, '00:08:15', '00:03:20');

-- ==============================================
-- 3. Insert AGENTS
-- ==============================================
INSERT INTO agent (username, password, role, team_id, ID, most_current_user_group, cost_per_hour, 
                   campaign, most_recent_user_group, calls, time, pause, wait, talk, dispo, 
                   dead, customer, callbk, N, NI, SALE) 
VALUES
-- Team Alpha Agents
('john.smith@crm.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye/LvdP8SqHPVpOYCBE5oJkxGQ9z6r5Ea', 'AGENT', 1, 
 1001, 'Alpha Team', 15.50, 'Spring Campaign', 'Alpha Team', 85, 
 '08:00:00', '00:30:00', '00:15:00', '05:30:00', '01:00:00', '00:15:00', '00:30:00', 
 12, 45, 25, 15),

('sarah.johnson@crm.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye/LvdP8SqHPVpOYCBE5oJkxGQ9z6r5Ea', 'AGENT', 1,
 1002, 'Alpha Team', 16.00, 'Spring Campaign', 'Alpha Team', 92,
 '08:00:00', '00:25:00', '00:20:00', '05:45:00', '00:50:00', '00:20:00', '00:20:00',
 10, 50, 28, 14),

('mike.wilson@crm.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye/LvdP8SqHPVpOYCBE5oJkxGQ9z6r5Ea', 'AGENT', 1,
 1003, 'Alpha Team', 15.75, 'Spring Campaign', 'Alpha Team', 78,
 '08:00:00', '00:35:00', '00:18:00', '05:15:00', '01:10:00', '00:12:00', '00:30:00',
 15, 42, 22, 14),

('emily.davis@crm.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye/LvdP8SqHPVpOYCBE5oJkxGQ9z6r5Ea', 'AGENT', 1,
 1004, 'Alpha Team', 17.00, 'Spring Campaign', 'Alpha Team', 88,
 '08:00:00', '00:20:00', '00:12:00', '06:00:00', '00:45:00', '00:18:00', '00:25:00',
 8, 48, 30, 10),

-- Team Bravo Agents
('david.brown@crm.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye/LvdP8SqHPVpOYCBE5oJkxGQ9z6r5Ea', 'AGENT', 2,
 2001, 'Bravo Team', 15.25, 'Summer Campaign', 'Bravo Team', 76,
 '08:00:00', '00:40:00', '00:22:00', '05:10:00', '01:05:00', '00:25:00', '00:18:00',
 14, 40, 20, 16),

('lisa.martinez@crm.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye/LvdP8SqHPVpOYCBE5oJkxGQ9z6r5Ea', 'AGENT', 2,
 2002, 'Bravo Team', 16.50, 'Summer Campaign', 'Bravo Team', 82,
 '08:00:00', '00:28:00', '00:16:00', '05:35:00', '00:55:00', '00:16:00', '00:30:00',
 11, 44, 24, 14),

('james.garcia@crm.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye/LvdP8SqHPVpOYCBE5oJkxGQ9z6r5Ea', 'AGENT', 2,
 2003, 'Bravo Team', 15.00, 'Summer Campaign', 'Bravo Team', 70,
 '08:00:00', '00:45:00', '00:25:00', '04:55:00', '01:15:00', '00:20:00', '00:20:00',
 16, 38, 18, 14),

('amanda.rodriguez@crm.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye/LvdP8SqHPVpOYCBE5oJkxGQ9z6r5Ea', 'AGENT', 2,
 2004, 'Bravo Team', 16.75, 'Summer Campaign', 'Bravo Team', 90,
 '08:00:00', '00:22:00', '00:14:00', '05:50:00', '00:48:00', '00:16:00', '00:30:00',
 9, 46, 26, 12),

-- Team Charlie Agents
('robert.lee@crm.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye/LvdP8SqHPVpOYCBE5oJkxGQ9z6r5Ea', 'AGENT', 3,
 3001, 'Charlie Team', 17.50, 'Fall Campaign', 'Charlie Team', 95,
 '08:00:00', '00:18:00', '00:10:00', '06:15:00', '00:40:00', '00:12:00', '00:25:00',
 7, 52, 32, 11),

('jennifer.taylor@crm.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye/LvdP8SqHPVpOYCBE5oJkxGQ9z6r5Ea', 'AGENT', 3,
 3002, 'Charlie Team', 16.25, 'Fall Campaign', 'Charlie Team', 84,
 '08:00:00', '00:32:00', '00:19:00', '05:25:00', '00:58:00', '00:16:00', '00:30:00',
 13, 45, 24, 15),

('william.anderson@crm.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye/LvdP8SqHPVpOYCBE5oJkxGQ9z6r5Ea', 'AGENT', 3,
 3003, 'Charlie Team', 15.50, 'Fall Campaign', 'Charlie Team', 79,
 '08:00:00', '00:38:00', '00:21:00', '05:05:00', '01:08:00', '00:18:00', '00:30:00',
 14, 41, 21, 17),

('patricia.thomas@crm.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye/LvdP8SqHPVpOYCBE5oJkxGQ9z6r5Ea', 'AGENT', 3,
 3004, 'Charlie Team', 17.25, 'Fall Campaign', 'Charlie Team', 91,
 '08:00:00', '00:24:00', '00:13:00', '05:55:00', '00:52:00', '00:14:00', '00:22:00',
 10, 48, 27, 13);

-- ==============================================
-- 4. Insert CLIENTS (Sample customer data)
-- ==============================================
INSERT INTO client (nom_complet, email, adresse, telephone, code_postal, commentaire, 
                    date_visite, nom_service, statut_service)
VALUES
('Jean Dupont', 'jean.dupont@email.com', '123 Rue de Paris', '0612345678', '75001', 
 'Client régulier, préfère les rendez-vous matinaux', '10:00:00', 'service de ménage', 'PENDING'),

('Marie Martin', 'marie.martin@email.com', '456 Avenue des Champs', '0623456789', '75008',
 'Nouveau client, demande un devis détaillé', '14:30:00', 'service de ménage', 'COMPLETED'),

('Pierre Bernard', 'pierre.bernard@email.com', '789 Boulevard Saint-Germain', '0634567890', '75006',
 'Client VIP, service premium', '09:00:00', 'service de ménage', 'IN_PROGRESS'),

('Sophie Dubois', 'sophie.dubois@email.com', '321 Rue de Rivoli', '0645678901', '75004',
 'Demande récurrente chaque mois', '11:00:00', 'service de ménage', 'COMPLETED'),

('Luc Petit', 'luc.petit@email.com', '654 Avenue Montaigne', '0656789012', '75008',
 'Préfère paiement en ligne', '15:00:00', 'service de ménage', 'PENDING'),

('Isabelle Roux', 'isabelle.roux@email.com', '987 Rue du Faubourg', '0667890123', '75010',
 'Client référé par Sophie Dubois', '13:00:00', 'service de ménage', 'CONFIRMED'),

('Antoine Moreau', 'antoine.moreau@email.com', '147 Boulevard Haussmann', '0678901234', '75009',
 'Appartement de 150m²', '10:30:00', 'service de ménage', 'COMPLETED'),

('Céline Laurent', 'celine.laurent@email.com', '258 Avenue de la République', '0689012345', '75011',
 'Demande éco-responsable uniquement', '16:00:00', 'service de ménage', 'IN_PROGRESS'),

('François Simon', 'francois.simon@email.com', '369 Rue de la Paix', '0690123456', '75002',
 'Bureau commercial, service hebdomadaire', '08:00:00', 'service de ménage', 'COMPLETED'),

('Nathalie Michel', 'nathalie.michel@email.com', '741 Boulevard Voltaire', '0601234567', '75011',
 'Animaux présents, allergies à signaler', '12:00:00', 'service de ménage', 'CONFIRMED');

-- ==============================================
-- 5. Insert AGENT_HISTORY (Historical performance data)
-- ==============================================
INSERT INTO agent_history (date, agent_id_agent, calls, leads, contacts, contact_ratio, 
                          nopause_time, system_time, talk_time, sales, sales_per_working_hour,
                          sales_to_leads_ratio, sales_to_contacts_ratio, sales_per_hour,
                          incomplete_sales, cancelled_sales, callbacks, first_call_resolution,
                          avg_sale_time, avg_contact_time)
VALUES
-- Last 7 days of history for agent 1 (john.smith@crm.com)
('2025-12-26', (SELECT id_agent FROM agent WHERE username = 'john.smith@crm.com'), 
 85, 34, 22, '25.9%', '07:30:00', '08:00:00', '05:30:00', 15, 2.0, '44.1%', '68.2%', 1.875, 2, 1, 12, 64.7, '00:08:30', '00:03:15'),

('2025-12-25', (SELECT id_agent FROM agent WHERE username = 'john.smith@crm.com'),
 82, 33, 21, '25.6%', '07:25:00', '08:00:00', '05:25:00', 14, 1.88, '42.4%', '66.7%', 1.75, 2, 1, 11, 63.4, '00:08:25', '00:03:18'),

('2025-12-24', (SELECT id_agent FROM agent WHERE username = 'john.smith@crm.com'),
 78, 31, 20, '25.6%', '07:20:00', '08:00:00', '05:20:00', 13, 1.77, '41.9%', '65.0%', 1.625, 1, 0, 10, 65.0, '00:08:20', '00:03:20'),

('2025-12-23', (SELECT id_agent FROM agent WHERE username = 'john.smith@crm.com'),
 80, 32, 21, '26.3%', '07:28:00', '08:00:00', '05:28:00', 14, 1.86, '43.8%', '66.7%', 1.75, 2, 1, 11, 66.7, '00:08:28', '00:03:16'),

('2025-12-22', (SELECT id_agent FROM agent WHERE username = 'john.smith@crm.com'),
 76, 30, 19, '25.0%', '07:15:00', '08:00:00', '05:15:00', 12, 1.66, '40.0%', '63.2%', 1.5, 1, 1, 9, 63.2, '00:08:15', '00:03:22'),

('2025-12-21', (SELECT id_agent FROM agent WHERE username = 'john.smith@crm.com'),
 88, 35, 23, '26.1%', '07:35:00', '08:00:00', '05:35:00', 16, 2.11, '45.7%', '69.6%', 2.0, 2, 0, 13, 65.2, '00:08:35', '00:03:12'),

('2025-12-20', (SELECT id_agent FROM agent WHERE username = 'john.smith@crm.com'),
 84, 34, 22, '26.2%', '07:32:00', '08:00:00', '05:32:00', 15, 1.99, '44.1%', '68.2%', 1.875, 1, 1, 12, 68.2, '00:08:32', '00:03:14');

-- ==============================================
-- Summary
-- ==============================================
-- Data inserted:
-- - 2 NOVA (HQ) users
-- - 3 TEAMS
-- - 12 AGENTS (4 per team)
-- - 10 CLIENTS
-- - 7 AGENT_HISTORY records (for testing trends)
--
-- All passwords are hashed: "password123"
-- ==============================================

SELECT 'Data insertion completed successfully!' AS Status;
SELECT COUNT(*) AS Nova_Count FROM nova;
SELECT COUNT(*) AS Team_Count FROM team;
SELECT COUNT(*) AS Agent_Count FROM agent;
SELECT COUNT(*) AS Client_Count FROM client;
SELECT COUNT(*) AS History_Count FROM agent_history;
