# 🏡 HomeNest — House Rental Management System

A full-stack web application for managing rental properties, tracking availability, and maintaining property information through a clean, user-friendly dashboard.

## 📌 Overview

**HomeNest** simplifies house rental management by allowing users to add new properties, view listings, search and filter properties, update property details, manage tenant vacancies, and remove properties when necessary.

The application uses React for the frontend, Node.js and Express for the backend API, and MongoDB for persistent data storage.

## ✨ Features

- **Dashboard:** View property statistics, availability, occupancy, and rental value.
- **Add Properties:** Enter property details, including title, location, rent, bedrooms, property type, description, and image.
- **View Properties:** Browse property listings with their details and images.
- **Search and Filter:** Find properties by location, rent, property type, and availability.
- **Edit Properties:** Update existing property information.
- **Vacate Property:** Mark an occupied property as available when a tenant leaves.
- **Delete Properties:** Remove property records from the system.
- **Image Uploads:** Upload and display property images.
- **MongoDB Integration:** Store and retrieve property records from a database.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| Vite | Frontend development server and build tool |
| Bootstrap | Responsive styling and layout |
| Node.js | JavaScript runtime for the backend |
| Express.js | Backend REST API |
| MongoDB | Database |
| Mongoose | MongoDB object modelling |
| Multer | Property image uploads |

## 📂 Project Structure

```text
HouseRentalManagement/
├── backend/
│   ├── models/
│   │   └── Property.js
│   ├── routes/
│   │   └── propertyRoutes.js
│   ├── uploads/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── .gitignore
└── README.md
```

*Note: The `.env` file is local configuration and should not be committed to GitHub.*

## ⚙️ Prerequisites

Install the following before running the project:

- [Node.js and npm](https://nodejs.org/)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community)
- [MongoDB Compass](https://www.mongodb.com/products/tools/compass) (optional, for viewing database records)
- [Git](https://git-scm.com/)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/HomeNest-House-Rental-Management.git
cd HomeNest-House-Rental-Management
```

Replace `YOUR_GITHUB_USERNAME` with your GitHub username.

### 2. Configure MongoDB

Make sure your MongoDB service is running locally.

The project uses the database name `house_rental_db` and connects through the MongoDB URI configured in the backend environment variables.

### 3. Configure the backend

Open a terminal and run:

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder with the following configuration:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/house_rental_db
```

Start the backend:

```bash
npm run dev
```

If your backend `package.json` does not define a `dev` script, use:

```bash
npx nodemon server.js
```

Alternatively, if Nodemon is not installed, run:

```bash
node server.js
```

The backend API should be available at `http://localhost:5000`.

### 4. Configure the frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, usually `http://localhost:5173`.

## 🗄️ Database

HomeNest uses MongoDB to store property records in:

- **Database:** `house_rental_db`
- **Collection:** `properties`

Property records include details such as title, location, monthly rent, bedrooms, property type, description, image path, availability, tenant name, and timestamps.

MongoDB Compass can be used to inspect these records.

## 🔌 API Overview

The backend exposes REST API endpoints for property management.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/properties` | Retrieve all properties |
| GET | `/api/properties/:id` | Retrieve a specific property |
| POST | `/api/properties` | Create a property |
| PUT | `/api/properties/:id` | Update a property |
| PATCH | `/api/properties/:id/vacate` | Mark an occupied property as vacated |
| DELETE | `/api/properties/:id` | Delete a property |

Property creation and updates can include image uploads.

## 🔒 Security and Configuration

- Keep `.env` files out of public repositories.
- Never publish passwords, API keys, or other secrets.
- Do not commit `node_modules` or local MongoDB database files.
- Uploaded images are stored locally by the backend; image files must also be available for the corresponding image paths to work.

## 🎯 Project Objective

The objective of HomeNest is to demonstrate a practical full-stack web application that combines a responsive user interface, REST API operations, image handling, and database integration to manage rental properties efficiently.

## 👨‍💻 Author

**Adithyan Suresh**

B.Tech Computer Science and Engineering  
Karunya Institute of Technology and Sciences

## 📄 License

This project was developed for academic and learning purposes. A formal open-source license has not been specified.
