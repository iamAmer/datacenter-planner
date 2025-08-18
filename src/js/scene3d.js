import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { walls } from './main.js'

const canvas3D = document.getElementById('canvas3D')

let scene, camera, renderer, controls, transformControls
let raycasterMouse
let raycasterCollision
let draggableObject = null
let floor
let models = []
let MODELS_NAME = ['cooler', 'chair', 'table', 'wall']
let particleSystems = []

export { scene, camera, canvas3D, renderer }

function render() {
  renderer.render(scene, camera)
}

export function init3D() {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )

  renderer = new THREE.WebGLRenderer({ canvas: canvas3D })
  renderer.setSize(window.innerWidth, window.innerHeight)

  // Orbit controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.zoomToCursor = true
  camera.position.set(5, 20, 20)
  controls.update()
  controls.addEventListener('change', render)

  // Transform controls
  transformControls = new TransformControls(camera, renderer.domElement)
  transformControls.addEventListener('change', render)
  transformControls.addEventListener('dragging-changed', function (event) {
    controls.enabled = !event.value
  })
  transformControls.showX = true
  transformControls.showY = false
  transformControls.showZ = true
  const gizmo = transformControls.getHelper()
  scene.add(gizmo)

  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 1)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
  directionalLight.position.set(5, 10, 7.5)
  scene.add(directionalLight)

  // Add a floor
  const floorGeometry = new THREE.PlaneGeometry(20, 20)
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    side: THREE.DoubleSide,
  })
  floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = 0
  scene.add(floor)

  // Raycaster and mouse initialization
  raycasterMouse = new THREE.Raycaster()
  raycasterCollision = new THREE.Raycaster()

  animate()

  // Event listeners for drag functionality
  window.addEventListener('click', onMouseClick)
  window.addEventListener('resize', onWindowResize)
}

function onMouseClick(event) {
  //  event.preventDefault();
  const rect = renderer.domElement.getBoundingClientRect()
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  )

  // Update the raycaster with camera and mouse
  raycasterMouse.setFromCamera(mouse, camera)

  // Check for intersection with objects in the scene
  const intersects = raycasterMouse.intersectObjects(models, true)

  const selectedModelElem = document.getElementById('selectedModel')
  if (intersects.length > 0) {
    selectedModelElem.innerText = `Selected: ${intersects[0].object.name}`
    if (draggableObject) {
      transformControls.detach()
    }
    // Find the root parent object (the one in models array)
    let rootObject = intersects[0].object
    while (rootObject.parent && !models.includes(rootObject)) {
      rootObject = rootObject.parent
    }
    // Attach transform controls to the root object to move everything together
    draggableObject = rootObject
    transformControls.attach(draggableObject)
  } else {
    selectedModelElem.innerText = 'No selected model'
    if (draggableObject) {
      transformControls.detach()
      draggableObject = null
    }
  }
}

function animate() {
  requestAnimationFrame(animate)
  updateParticles()
  render()
}

function aux_mesh_name(object, material, name) {
  object.traverse(function (child) {
    if (child.isMesh) child.material = material
    child.name = name
  })
}

function addObjectToScene(model) {
  console.log(model)
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
    }
    scene.add(object)
    models.push(object)
  })
}

function createCoolerParticles(coolerObject) {
  const particleCount = 500
  const particlesGeometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const velocities = new Float32Array(particleCount * 3)
  const lifetimes = new Float32Array(particleCount)
  const maxLifetime = new Float32Array(particleCount)
  const colors = new Float32Array(particleCount * 3) // Add color attribute

  // Get cooler's bounding box to determine particle spawn position
  const box = new THREE.Box3().setFromObject(coolerObject)
  const size = new THREE.Vector3()
  box.getSize(size)

  // Assume air flows from the front of the cooler (negative Z direction)
  const spawnOffset = new THREE.Vector3(size.x * 30, size.y * 40, 0)

  for (let i = 0; i < particleCount; i++) {
    initializeParticleProperties(
      i,
      positions,
      velocities,
      lifetimes,
      maxLifetime,
      colors
    )
  }

  particlesGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3)
  )
  particlesGeometry.setAttribute(
    'velocity',
    new THREE.BufferAttribute(velocities, 3)
  )
  particlesGeometry.setAttribute(
    'lifetime',
    new THREE.BufferAttribute(lifetimes, 1)
  )
  particlesGeometry.setAttribute(
    'maxLifetime',
    new THREE.BufferAttribute(maxLifetime, 1)
  )
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3)) // Add color attribute

  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.05,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    vertexColors: true // Enable vertex colors
  })

  const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial)

  // Group particles to cooler object
  coolerObject.add(particleSystem)
  particleSystem.position.copy(spawnOffset)

  // Store reference for updating
  particleSystems.push({
    system: particleSystem,
    geometry: particlesGeometry,
    cooler: coolerObject,
    spawnOffset: spawnOffset.clone(), // Store original spawn offset for resets
  })
}

function updateParticles() {
  particleSystems.forEach((particleData) => {
    const geometry = particleData.geometry
    const positions = geometry.attributes.position.array
    const velocities = geometry.attributes.velocity.array
    const lifetimes = geometry.attributes.lifetime.array
    const maxLifetime = geometry.attributes.maxLifetime.array
    const colors = geometry.attributes.color.array;

    for (let i = 0; i < positions.length; i += 3) {
      const particleIndex = i / 3

      // Update particle lifetime
      lifetimes[particleIndex]++
      if (lifetimes[particleIndex] >= maxLifetime[particleIndex]) {
        // Reset particle
        initializeParticleProperties(
          particleIndex,
          positions,
          velocities,
          lifetimes,
          maxLifetime,
          colors
        )
      }

      // Update position
      positions[i] += velocities[i]
      positions[i + 1] += velocities[i + 1]
      positions[i + 2] += velocities[i + 2]

      // Add some turbulence
      velocities[i] += (Math.random() - 0.5) * 0.001
      velocities[i + 1] += (Math.random() - 0.5) * 0.001
      velocities[i + 2] += (Math.random() - 0.5) * 0.02 // it expands along z-axis orthogonal to main direction x

      // Check for collisions
      const particlePosition = new THREE.Vector3(
        positions[i],
        positions[i + 1],
        positions[i + 2]
      )
      
      // Convert particle position from local cooler space to world space
      const worldPosition = particlePosition.clone()
      particleData.cooler.localToWorld(worldPosition)
      
      // Set up raycaster from particle position
      const rayDirection = new THREE.Vector3(
        velocities[i],
        velocities[i + 1], 
        velocities[i + 2]
      ).normalize()
      
      raycasterCollision.set(worldPosition, rayDirection)
      
      // Get all objects except the cooler itself and particles
      const filteredObjects = models.filter(obj => obj !== particleData.cooler)
      const objectsToTest = [...filteredObjects, floor, ...walls]
      
      const intersects = raycasterCollision.intersectObjects(objectsToTest, true)
      
      // Check if collision is close enough (within particle size)
      if (intersects.length > 0 && intersects[0].distance < 0.1) {
        // Change particle color on collision
        colors[i] = 1.0     // Red
        colors[i + 1] = 0.5 // Orange-ish
        colors[i + 2] = 0.0 // Blue = 0
        
        // Optional: bounce the particle or reset its velocity
        velocities[i] *= 0
        velocities[i + 1] *= 0
        velocities[i + 2] *= 0
      }
    }
    
    geometry.attributes.color.needsUpdate = true
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.lifetime.needsUpdate = true
  })
}

function initializeParticleProperties(
  index,
  positions,
  velocities,
  lifetimes,
  maxLifetime,
  colors
) {
  // Initialize position
  positions[index * 3] = 0 // x at spawn position
  positions[index * 3 + 1] = (Math.random() - 0.5) * 0.2 // y offset
  positions[index * 3 + 2] = (Math.random() - 0.5) * 40 // z offset

  // Initialize velocity
  velocities[index * 3] = Math.random() * 1.5 // main flow direction (along X-axis)
  velocities[index * 3 + 1] = -(Math.random() * 0.1 + 0.05) // slight downward flow
  velocities[index * 3 + 2] = (Math.random() - 0.5) * 0.02 // slight z variation

  // Initialize color
  colors[index * 3] = 0.5; // Red
  colors[index * 3 + 1] = 0.8; // Green
  colors[index * 3 + 2] = 1.0; // Blue

  // Initialize lifetime
  lifetimes[index] = Math.random() * 1000
  maxLifetime[index] = 1000 + Math.random() * 500
}

function deleteObject() {
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

let localPosition = new THREE.Vector3(0, 0, 0)
let box = new THREE.Box3()
let size = new THREE.Vector3(0, 0, 0)

function exportSceneToJson() {
  const sceneData = {}

  scene.traverse((object) => {
    // Ensure object has a position property
    if (object.position && object.isMesh) {
      // Use object name as key, or generate a unique identifier if name is empty
      if (MODELS_NAME.includes(object.name)) {
        const objectKey = `${object.name}_${object.id}`
        if (object.name.startsWith('wall')) {
          sceneData[objectKey] = {
            dimensions: null,
            coords: object.localToWorld(localPosition.clone()),
          }
        } else {
          sceneData[objectKey] = {
            dimensions: box.setFromObject(object).getSize(size),
            coords: object.localToWorld(localPosition.clone()),
          }
        }
      }
    }
  })

  console.log(JSON.stringify(sceneData, null, 2)) // Pretty print JSON with 2-space indent
}

// Add event listener for keypress
window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 't': // If "t" is pressed, switch to translation mode
      transformControls.setMode('translate')
      transformControls.showX = true
      transformControls.showY = false
      transformControls.showZ = true
      break
    case 'r': // If "r" is pressed, switch to rotation mode
      transformControls.setMode('rotate')
      transformControls.showX = false
      transformControls.showY = true
      transformControls.showZ = false
      break
    case 'y': // If "t" is pressed, switch to translation mode
      transformControls.setMode('translate')
      transformControls.showX = false
      transformControls.showY = true
      transformControls.showZ = false
      break
  }
})

let add_model = document.getElementById('add_model')
add_model.addEventListener(
  'click',
  () => {
    let model = document
      .getElementById('dropdownMenuButton')
      .getAttribute('data-alt')
    addObjectToScene(model)
  },
  false
)

let remove_model = document.getElementById('delete_model')
remove_model.addEventListener('click', deleteObject, false)

let export_scene = document.getElementById('export_scene')
export_scene.addEventListener('click', exportSceneToJson, false)

// Resize canvas on window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}
