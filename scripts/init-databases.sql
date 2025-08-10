-- Initialize databases for each microservice
CREATE DATABASE auth_db;
CREATE DATABASE user_db;
CREATE DATABASE gateway_db;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE auth_db TO "user";
GRANT ALL PRIVILEGES ON DATABASE user_db TO "user";
GRANT ALL PRIVILEGES ON DATABASE gateway_db TO "user";
