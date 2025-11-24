# Employee Management System - Spring Boot Backend

This is the Spring Boot backend for the Employee Management System application.

## Features

- JWT Authentication (Sign in, Sign up)
- Employee CRUD Operations
- MySQL Database Integration
- RESTful API
- CORS Configuration for Angular Frontend
- Spring Security

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- MySQL 8.0+
- IDE (IntelliJ IDEA, Eclipse, VS Code)

## Database Setup

1. Create MySQL database:
```sql
CREATE DATABASE Employee_managementSystem;
```

2. Update `application.properties` with your MySQL credentials:
```properties
spring.datasource.username=root
spring.datasource.password=your_password
```

## Running the Application

1. Navigate to the backend directory:
```bash
cd backend
```

2. Build the project:
```bash
mvn clean install
```

3. Run the application:
```bash
mvn spring-boot:run
```

Or run the main class: `EmployeeManagementSystemApplication`

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Login
- `POST /api/auth/signup` - Register

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/{id}` - Get employee by ID
- `POST /api/employees` - Create employee
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee

## Default Configuration

- Server Port: 8080
- Database: Employee_managementSystem
- JWT Secret: Configured in application.properties
- JWT Expiration: 86400000 ms (24 hours)

## Testing

Use Postman or any REST client to test the endpoints. Make sure to:
1. Register a user first at `/api/auth/signup`
2. Login at `/api/auth/signin` to get JWT token
3. Use the token in Authorization header: `Bearer <token>`
4. Access protected endpoints with the token

