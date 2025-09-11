import * as THREE from 'three'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { createCoolerParticles } from './coolerParticles.js'
import { createRackParticles } from './rackParticles.js'
import { addRectangle } from './rectangles.js'
import { scene, models, raycasterMouse, transformControls } from './scene3d.js'

export function addObjectToScene(model) {
  if (model === 'Rectangle') {
    addRectangle()
    return
  }
  // Use a material that responds to light
  let material_obj = new THREE.MeshStandardMaterial({
    color: 0x6e6e6e, // Gray color
    metalness: 0.5, // How metallic the material appears (0 = non-metal, 1 = metal)
    roughness: 0.7, // How rough the surface is (0 = smooth, 1 = rough)
  })

  // let material_obj = new THREE.MeshBasicMaterial( { color: 0x6E6E6E} );
  const objLoader = new OBJLoader()
  objLoader.load(`${model}.obj`, function (object) {
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
        break
    }
    scene.add(object)
    models.push(object)
  })
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
