# 2D-3D-Converter

A web-based tool to convert 2D floorplans into interactive 3D scenes. Draw a floorplan in a 2D canvas using Paper.js, then switch to a 3D view powered by Three.js to add and manipulate 3D models (e.g., furniture like chairs, tables, and coolers).

## Features

- 2D Floorplan Creation: Draw walls and layouts on a 2D canvas.

- 3D Scene Rendering: Convert 2D floorplans into 3D scenes with a single click.

- Model Management: Add, delete, and transform 3D models using a dropdown menu.

- Export Capability: Export the 3D scene for further use.

- Interactive Controls: Use OrbitControls for navigation and TransformControls for model manipulation.

## Prerequisites

Node.js (version 16 or higher recommended)
npm (comes with Node.js)
A modern web browser (e.g., Chrome, Firefox, Edge)

# Installation

Clone the Repository:

```bash

git clone https://github.com/your-username/2d-3d-converter.git
cd 2d-3d-converter
```

Install Dependencies:
Run the following command to install the required dependencies (including Three.js and Vite):

```bash

npm install
```

## Running the Application

Start the Development Server:

Use the start script to launch the Vite development server:
```bash

npm start
```

Access the webpage:
Open your browser and navigate to http://localhost:5173 (or the port shown in the terminal). The tool will load, displaying the 2D canvas for drawing floorplans.
