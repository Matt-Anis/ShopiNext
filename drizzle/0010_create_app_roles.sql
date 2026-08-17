-- Custom SQL migration file, put your code below! --

-- Restricted application roles: each app connects with its own role
-- instead of the superuser, enforcing the public/admin schema boundary
-- at the database level. Migrations continue to run as the admin
-- superuser (see root .env.local) — neither role gets CREATE, only CRUD.
--
-- Passwords are deliberately NOT set here — this file is git-tracked.
-- Set them out of band with:
--   ALTER ROLE client_app WITH PASSWORD '...';
--   ALTER ROLE admin_app WITH PASSWORD '...';

CREATE ROLE client_app WITH LOGIN;
CREATE ROLE admin_app WITH LOGIN;

GRANT CONNECT ON DATABASE store TO client_app;
GRANT CONNECT ON DATABASE store TO admin_app;

-- client_app: public schema only
GRANT USAGE ON SCHEMA public TO client_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO client_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO client_app;
ALTER DEFAULT PRIVILEGES FOR ROLE admin IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO client_app;
ALTER DEFAULT PRIVILEGES FOR ROLE admin IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO client_app;

-- admin_app: public schema
GRANT USAGE ON SCHEMA public TO admin_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO admin_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO admin_app;
ALTER DEFAULT PRIVILEGES FOR ROLE admin IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO admin_app;
ALTER DEFAULT PRIVILEGES FOR ROLE admin IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO admin_app;

-- admin_app: admin schema too (client_app gets nothing here — that's the boundary)
GRANT USAGE ON SCHEMA admin TO admin_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA admin TO admin_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA admin TO admin_app;
ALTER DEFAULT PRIVILEGES FOR ROLE admin IN SCHEMA admin
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO admin_app;
ALTER DEFAULT PRIVILEGES FOR ROLE admin IN SCHEMA admin
  GRANT USAGE, SELECT ON SEQUENCES TO admin_app;
