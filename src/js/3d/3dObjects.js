import * as THREE from 'three'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import {
  createCoolerParticles,
  particleSystems as coolerParticleSystems,
} from './coolerParticles.js'
import {
  createRackParticles,
  particleSystems as rackParticleSystems,
} from './rackParticles.js'
import { addAttractorToRack, attractors } from './attractors.js'
import { scene, models, raycasterMouse, transformControls } from './scene3d.js'

const loadingManager = new THREE.LoadingManager()
let activeLoads = 0

loadingManager.onStart = function() {
  showLoadingIndicator()
}

loadingManager.onLoad = function() {
  hideLoadingIndicator()
}

loadingManager.onError = function(url) {
  console.error('Error loading:', url)
  hideLoadingIndicator()
}

/**
 * addObjectToScene loads a 3D object (OBJ format) by its model name.
 *
 * @param {string} model
 */
export function addObjectToScene(model) {
  console.log(model)

  if (!model) {
    console.warn('No model specified, skip loading!')
    return
  }
  activeLoads++
  showLoadingIndicator()

  // Use a material that responds to light
  let material_obj = new THREE.MeshStandardMaterial({
    color: 0x6e6e6e, // Gray color
    metalness: 0.5, // How metallic the material appears (0 = non-metal, 1 = metal)
    roughness: 0.7, // How rough the surface is (0 = smooth, 1 = rough)
  })
  
  const objLoader = new OBJLoader(loadingManager)
  
  objLoader.load(
    `${model}.obj`,
    // onLoad callback
    function (object) {
      switch (model) {
        case 'Chair':
          aux_mesh_name(object, material_obj, 'chair')
          object.scale.setScalar(0.05)
          break
        case 'Cooler':
          aux_mesh_name(object, material_obj, 'cooler')
          object.scale.setScalar(0.01)
          createCoolerParticles(object)
          break
        case 'Table':
          aux_mesh_name(object, material_obj, 'table')
          object.scale.setScalar(0.8)
          break
        case 'Rack':
          aux_mesh_name(object, material_obj, 'rack')
          object.scale.setY(1.1)
          setRackPosition(object)
          createRackParticles(object)
          addAttractorToRack(object)
          break
      }
      scene.add(object)
      models.push(object)
      
      activeLoads--
      if (activeLoads === 0) {
        hideLoadingIndicator()
      }
    },
    undefined, // onProgress - not needed
    // onError callback
    function (error) {
      console.error(`Error loading ${model}:`, error)
      activeLoads--
      if (activeLoads === 0) {
        hideLoadingIndicator()
      }
    }
  )
}

// Helper functions for the loading UI
function showLoadingIndicator() {
  const indicator = document.getElementById('loading-indicator')
  if (indicator) {
    indicator.style.display = 'flex'
  }
}

function hideLoadingIndicator() {
  const indicator = document.getElementById('loading-indicator')
  if (indicator) {
    indicator.style.display = 'none'
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

  // Check if there are any intersected objects
  if (intersects.length > 0) {
    // Get the parent object that was added to the models array
    let draggableObject = intersects[0].object
    console.log(draggableObject)

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
        console.log('Object removed from models array')
      }

      // If the object is a cooler, remove also the associated particle system
      if (draggableObject?.name === 'cooler') {
        const coolerParticleSystemIndex = coolerParticleSystems.findIndex(
          (ps) => ps.cooler === draggableObject
        )
        if (coolerParticleSystemIndex > -1) {
          coolerParticleSystems.splice(coolerParticleSystemIndex, 1)
        }
      }

      // If the object is a rack, remove also the associated particle system and attractor
      if (draggableObject?.name === 'rack') {
        const rackParticleSystemIndex = rackParticleSystems.findIndex(
          (ps) => ps.rack === draggableObject
        )
        if (rackParticleSystemIndex > -1) {
          rackParticleSystems.splice(rackParticleSystemIndex, 1)
          console.log('Particle system removed from rackParticleSystems array')
        }

        const attractorIndex = attractors.findIndex(
          (a) => (a.parent === draggableObject)
        )
        if (attractorIndex > -1) {
          attractors.splice(attractorIndex, 1)
          console.log('Attractor removed from attractors array')
        }
      }

      // Detach transform controls and reset the draggableObject variable
      transformControls.detach()
      draggableObject = null
    }
  }
}
