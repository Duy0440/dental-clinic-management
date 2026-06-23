# Code Explanation Guide

## 1. Why split frontend and backend?

- `frontend` is responsible for interface and user interaction.
- `backend` is responsible for business logic, authentication, and database access.
- Splitting them makes the project easier to maintain and easier to explain in thesis defense.

## 2. Why use MVC in backend?

Backend is divided into:

- `routes`: declare API endpoints
- `controllers`: receive request, validate input, and return response
- `models`: run SQL queries with MySQL
- `middlewares`: handle reusable logic like checking JWT token

This structure is beginner-friendly because each file has one clear responsibility.

## 3. Request flow

Example: login

1. Frontend sends `POST /api/auth/login`
2. `authRoutes.js` receives the route
3. `authController.js` checks email and password
4. `userModel.js` queries user data from MySQL
5. If correct, backend creates JWT token and returns it
6. Frontend stores token in `localStorage`

## 4. Why use JWT?

- After login, server returns a token.
- Frontend sends that token in later requests.
- Backend checks token in `authMiddleware.js`.
- This is simpler than session for a beginner fullstack project.

## 5. Why create `axiosClient.js`?

- It stores one common `baseURL`.
- It automatically adds JWT token to request header.
- This helps avoid repeating code in every page.

## 6. Why use React Router?

- The project has many pages like Home, Login, Services, Booking, Dashboard.
- React Router helps switch pages without reloading the whole website.

## 7. Why build chatbot in simple form first?

- The current chatbot is rule-based, easy to understand and easy to demo.
- Later, it can be upgraded to use OpenAI API or Gemini API.
- This is a safe approach because the thesis still has an AI module, but code remains simple enough to explain.

## 8. Files you should learn first

- `backend/src/app.js`: where the main Express app is created
- `backend/src/routes/authRoutes.js`: where login/register routes are declared
- `backend/src/controllers/authController.js`: where login/register logic is handled
- `backend/src/models/userModel.js`: where SQL query for user is written
- `backend/src/middlewares/authMiddleware.js`: where token checking is handled
- `frontend/src/App.jsx`: where page routes are declared
- `frontend/src/api/axiosClient.js`: where Axios is configured
- `frontend/src/pages/Login.jsx`: easy example of calling API from frontend

## 9. Common defense questions

### Why separate route, controller, model?

Because each layer has a different responsibility:

- route: define endpoint
- controller: process request and response
- model: query database

This makes the code clean and easy to debug.

### Why use middleware for token?

Because token checking is repeated in many APIs.  
If written inside every controller, code would be duplicated.

### Why store token in localStorage?

Because it is simple for a student project and easy to explain.  
Frontend can read the token and attach it to API requests.

### Why use REST API?

Because frontend and backend are separated.  
REST API is the bridge that allows them to communicate clearly.

### Why use MySQL?

Because the project data is relational:

- one patient can have many appointments
- one dentist can handle many appointments
- one appointment belongs to one patient, one dentist, and one service

So relational database is a suitable choice.
