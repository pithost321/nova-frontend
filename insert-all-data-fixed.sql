-- CRM NOVA Database - Complete Data Insertion Script
-- Based on actual database schema

USE u894306996_nova;

-- Clear existing data (respecting foreign keys)
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM agent WHERE id_agent > 0;
DELETE FROM historique_agent WHERE id > 0;
DELETE FROM team WHERE id > 0;
DELETE FROM nova WHERE id > 0;
DELETE FROM client WHERE id > 0;
SET FOREIGN_KEY_CHECKS = 1;

-- Reset auto-increment
ALTER TABLE agent AUTO_INCREMENT = 1;
ALTER TABLE client AUTO_INCREMENT = 1;

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
-- Team Alpha Agents (Team ID = 1)
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

-- Team Bravo Agents (Team ID = 2)
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

-- Team Charlie Agents (Team ID = 3)
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
-- 4. Insert CLIENTS
-- ==============================================
INSERT INTO client (nom_complet, email, adresse, telephone, code_postal, commentaire, 
                    date_visite, nom_service, statut_service)
VALUES
('Jean Dupont', 'jean.dupont@email.com', '123 Rue de Paris', '0612345678', '75001', 
 'Client regulier, prefere les rendez-vous matinaux', '10:00:00', 'service de menage', 'en_attente'),

('Marie Martin', 'marie.martin@email.com', '456 Avenue des Champs', '0623456789', '75008',
 'Nouveau client, demande un devis detaille', '14:30:00', 'service de menage', 'confirme'),

('Pierre Bernard', 'pierre.bernard@email.com', '789 Boulevard Saint-Germain', '0634567890', '75006',
 'Client VIP, service premium', '09:00:00', 'service de menage', 'confirme'),

('Sophie Dubois', 'sophie.dubois@email.com', '321 Rue de Rivoli', '0645678901', '75004',
 'Demande recurrente chaque mois', '11:00:00', 'service de menage', 'confirme'),

('Luc Petit', 'luc.petit@email.com', '654 Avenue Montaigne', '0656789012', '75008',
 'Prefere paiement en ligne', '15:00:00', 'service de menage', 'en_attente'),

('Isabelle Roux', 'isabelle.roux@email.com', '987 Rue du Faubourg', '0667890123', '75010',
 'Client refere par Sophie Dubois', '13:00:00', 'service de menage', 'confirme'),

('Antoine Moreau', 'antoine.moreau@email.com', '147 Boulevard Haussmann', '0678901234', '75009',
 'Appartement de 150m2', '10:30:00', 'service de menage', 'confirme'),

('Celine Laurent', 'celine.laurent@email.com', '258 Avenue de la Republique', '0689012345', '75011',
 'Demande eco-responsable uniquement', '16:00:00', 'service de menage', 'en_attente'),

('Francois Simon', 'francois.simon@email.com', '369 Rue de la Paix', '0690123456', '75002',
 'Bureau commercial, service hebdomadaire', '08:00:00', 'service de menage', 'confirme'),

('Nathalie Michel', 'nathalie.michel@email.com', '741 Boulevard Voltaire', '0601234567', '75011',
 'Animaux presents, allergies a signaler', '12:00:00', 'service de menage', 'confirme');

-- ==============================================
-- Summary
-- ==============================================
SELECT 'Data insertion completed successfully!' AS Message;
SELECT COUNT(*) AS Nova_Users FROM nova;
SELECT COUNT(*) AS Teams FROM team;
SELECT COUNT(*) AS Agents FROM agent;
SELECT COUNT(*) AS Clients FROM client;
