import * as THREE from 'three'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { createCoolerParticles } from './coolerParticles.js'
import { createRackParticles } from './rackParticles.js'
import { scene, models, raycasterMouse, transformControls } from './scene3d.js'

const loadingManager = new THREE.LoadingManager();
let activeLoads = 0;

loadingManager.onStart = function() {
  showLoadingIndicator();
};

loadingManager.onLoad = function() {
  hideLoadingIndicator();
};

loadingManager.onError = function(url) {
  console.error('Error loading:', url);
  hideLoadingIndicator();
};

/**
 * addObjectToScene loads a 3D object (OBJ format) by its model name.
 *
 * @param {string} model
 */
export function addObjectToScene(model) {
  console.log(model);
  
  activeLoads++;
  showLoadingIndicator();
  
  let material_obj = new THREE.MeshStandardMaterial({
    color: 0x6e6e6e,
    metalness: 0.5,
    roughness: 0.7,
  });
  
  const objLoader = new OBJLoader(loadingManager);
  
  objLoader.load(
    `${model}.obj`,
    // onLoad callback
    function (object) {
      switch (model) {
        case 'Chair':
          aux_mesh_name(object, material_obj, 'chair');
          object.scale.setScalar(0.05);
          break;
        case 'Cooler':
          aux_mesh_name(object, material_obj, 'cooler');
          object.scale.setScalar(0.01);
          createCoolerParticles(object);
          break;
        case 'Table':
          aux_mesh_name(object, material_obj, 'table');
          object.scale.setScalar(0.8);
          break;
        case 'Rack':
          aux_mesh_name(object, material_obj, 'rack');
          object.scale.setY(1.1);
          setRackPosition(object);
          createRackParticles(object);
          break;
      }
      scene.add(object);
      models.push(object);
      
      activeLoads--;
      if (activeLoads === 0) {
        hideLoadingIndicator();
      }
    },
    undefined, // onProgress - not needed
    // onError callback
    function (error) {
      console.error(`Error loading ${model}:`, error);
      activeLoads--;
      if (activeLoads === 0) {
        hideLoadingIndicator();
      }
    }
  );
}

// Helper functions for the loading UI
function showLoadingIndicator() {
  let indicator = document.getElementById('loading-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'loading-indicator';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px 40px;
        border-radius: 10px;
        z-index: 1000;
        text-align: center;
      ">
        <div class="spinner" style="
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 10px;
        "></div>
        <div>Loading model...</div>
      </div>
    `;
    
    // Add spinner animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(indicator);
  }
  indicator.style.display = 'block';
}

function hideLoadingIndicator() {
  const indicator = document.getElementById('loading-indicator');
  if (indicator) {
    indicator.style.display = 'none';
  }
}

function setRackPosition(object) {
  const box = new THREE.Box3().setFromObject(object)
  const size = new THREE.Vector3()
  box.getSize(size)
  object.translateY(size.y / 2)
}

function aux_mesh_name(object, material, name) {
  object.traverse(function (child) {
    if (child.isMesh) child.material = material
    child.name = name
  })
}

/**
 * deleteObject deletes the 3D object from the scene.
 *
 * @returns {void}
 */
export function deleteObject() {
  const intersects = raycasterMouse.intersectObjects(models, true)
  console.log(intersects[0].object)

  // Check if there are any intersected objects
  if (intersects.length > 0) {
    // Get the parent object that was added to the models array
    let draggableObject = intersects[0].object

    // Traverse up the hierarchy to find the root parent that was added to models
    while (draggableObject.parent && !models.includes(draggableObject)) {
      draggableObject = draggableObject.parent
    }

    // Remove the object from the scene if it's part of models
    if (models.includes(draggableObject)) {
      console.log(draggableObject)
      scene.remove(draggableObject)

      // Find and remove the object from the models array
      const index = models.indexOf(draggableObject)
      if (index > -1) {
        models.splice(index, 1)
      }

      // Detach transform controls and reset the draggableObject variable
      transformControls.detach()
      draggableObject = null
    }
  }
}
