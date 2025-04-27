BigData Project - Client Application
===================================

This is a React-based client application for the BigData Project. The application provides a dashboard interface with various data visualization components including charts, maps, and heatmaps.

Prerequisites
------------
1. Node.js (version 18 or higher)
2. npm (Node Package Manager)
3. Git (for version control)

Installation Instructions
------------------------
1. Clone the repository:
   git clone <repository-url>

2. Navigate to the project directory:
   cd client

3. Install dependencies:
   npm install

Running the Application
----------------------
1. Development Mode:
   - Run the following command to start the development server:
     npm run dev
   - The application will be available at http://localhost:5173

2. Production Build:
   - To create a production build:
     npm run build
   - To preview the production build:
     npm run preview

Project Structure
----------------
- src/         : Contains the source code
- public/      : Static assets
- node_modules/: Project dependencies
- cl/          : Additional project files

Key Features
-----------
- Interactive data visualization using Chart.js
- Geographic data display using Leaflet maps
- Calendar heatmap visualization
- Material-UI components for modern UI
- React Router for navigation
- Date picker and calendar components

Available Scripts
----------------
- npm run dev    : Start development server
- npm run build  : Create production build
- npm run preview: Preview production build
- npm run lint   : Run ESLint for code quality check

Dependencies
-----------
The project uses several key libraries:
- React 19
- Material-UI
- Chart.js
- Leaflet
- React Router
- Plotly.js
- And other utility libraries

Troubleshooting
--------------
1. If you encounter dependency issues:
   - Delete node_modules folder
   - Delete package-lock.json
   - Run npm install

2. For build issues:
   - Ensure you have the correct Node.js version
   - Check for any missing dependencies
   - Run npm install to update dependencies

Support
-------
For any issues or questions, please contact the project maintainers.

Note: Make sure to have all the required environment variables set up before running the application. 