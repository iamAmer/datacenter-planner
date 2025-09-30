import * as THREE from 'three'
import { raycasterCollision, models, floor } from './scene3d.js'
import { walls } from './pathsTo3d.js'

export let particleSystems = []

// reduces velocity by 50% at every update on the main direction due to friction with other particles
// increases by 50% towards the floor due to gravity and lower temperature
// along z on the plane parrallel to the floor is constant
const accelerations = [0.5, 1.5, 1]

/**
 * createCoolerParticles creates and attaches a particle system to a cooler object.
 *
 * @param {THREE.Object3D} coolerObject - The cooler object to attach particles to.
 * @returns {void}
 */
export function createCoolerParticles(coolerObject) {
  const particleCount = 500
  const particlesGeometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const worldPositions = new Float32Array(particleCount * 3)
  const velocities = new Float32Array(particleCount * 3)
  const lifetimes = new Float32Array(particleCount)
  const maxLifetime = new Float32Array(particleCount)
  const colors = new Float32Array(particleCount * 3) // Add color attribute

  for (let i = 0; i < particleCount; i++) {
    initCoolerParticleProps(
      i,
      positions,
      worldPositions,
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
    'worldPosition',
    new THREE.BufferAttribute(worldPositions, 3)
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
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true, // Enable vertex colors
  })

  const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial)

  // Group particles to cooler object
  coolerObject.add(particleSystem)

  // Store reference for updating
  particleSystems.push({
    system: particleSystem,
    geometry: particlesGeometry,
    cooler: coolerObject,
  })
}

/**
 * updateCoolerParticles updates all cooler particle systems each frame.
 *
 * @returns {void}
 */
export function updateCoolerParticles() {
  particleSystems.forEach((particleData) => {
    const geometry = particleData.geometry
    const positions = geometry.attributes.position.array
    const worldPositions = geometry.attributes.worldPosition.array
    const velocities = geometry.attributes.velocity.array
    const lifetimes = geometry.attributes.lifetime.array
    const maxLifetime = geometry.attributes.maxLifetime.array
    const colors = geometry.attributes.color.array

    for (let i = 0; i < positions.length; i += 3) {
      const particleIndex = i / 3

      // Update particle lifetime
      lifetimes[particleIndex]++
      if (lifetimes[particleIndex] >= maxLifetime[particleIndex]) {
        // Reset particle
        initCoolerParticleProps(
          particleIndex,
          positions,
          worldPositions,
          velocities,
          lifetimes,
          maxLifetime,
          colors
        )
      }

      // Update position
      positions[i] += velocities[i] * accelerations[0]
      positions[i + 1] += velocities[i + 1] * accelerations[1]
      positions[i + 2] += velocities[i + 2] * accelerations[2]

      // Add some turbulence
      velocities[i] += (Math.random() - 0.5) * 0.001
      velocities[i + 1] += (Math.random() - 0.5) * 0.01
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

      // Store current world positions for other uses
      worldPositions[i] = worldPosition['x']
      worldPositions[i + 1] = worldPosition['y']
      worldPositions[i + 2] = worldPosition['z']

      // Set up raycaster from particle position
      const rayDirection = new THREE.Vector3(
        velocities[i],
        velocities[i + 1],
        velocities[i + 2]
      ).normalize()

      raycasterCollision.set(worldPosition, rayDirection)

      // Get all objects except the cooler itself
      const filteredObjects = models.filter(
        (obj) => obj !== particleData.cooler
      )
      // Take only the object itself without its particles if present
      const filteredObjectsMeshes = filteredObjects.map((obj) =>
        obj.getObjectByProperty('type', 'Mesh')
      )
      const objectsToTest = [...filteredObjectsMeshes, floor, ...walls]

      const intersects = raycasterCollision.intersectObjects(
        objectsToTest,
        false // do not check descendants
      )

      // Check if collision is close enough (within particle size)
      if (intersects.length > 0 && intersects[0].distance < 0.1) {
        // Change particle color on collision
        colors[i] = 1.0 // Red
        colors[i + 1] = 0.5 // Orange-ish
        colors[i + 2] = 0.0 // Blue = 0

        // Stop the particle completely on wall collision
        velocities[i] = 0
        velocities[i + 1] = 0
        velocities[i + 2] = 0

        maxLifetime[particleIndex] *= 0.9 // Reduce maxLifetime to avoid accumulation
      }
    }

    geometry.attributes.color.needsUpdate = true
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.worldPosition.needsUpdate = true
    geometry.attributes.lifetime.needsUpdate = true
    geometry.attributes.maxLifetime.needsUpdate = true
  })
}

/**
 * initCoolerParticleProps initializes (or resets) the properties of a single particle.
 *
 * Used internally by `createCoolerParticles` and `updateCoolerParticles`.
 *
 * @param {number} index - Index of the particle to initialize.
 * @param {Float32Array} positions - Buffer attribute for local positions.
 * @param {Float32Array} worldPositions - Buffer attribute for world positions.
 * @param {Float32Array} velocities - Buffer attribute for particle velocities.
 * @param {Float32Array} lifetimes - Buffer attribute for particle lifetimes.
 * @param {Float32Array} maxLifetime - Buffer attribute for max lifetimes.
 * @param {Float32Array} colors - Buffer attribute for particle colors (r,g,b).
 * @returns {void}
 */
export function initCoolerParticleProps(
  index,
  positions,
  worldPositions,
  velocities,
  lifetimes,
  maxLifetime,
  colors
) {
  // Initialize position
  positions[index * 3] = 0 // x no offset
  positions[index * 3 + 1] = (Math.random() - 0.5) * 0.2 + 20 // y offset
  positions[index * 3 + 2] = (Math.random() - 0.5) * 40 // z offset

  worldPositions[index * 3] = 0
  worldPositions[index * 3 + 1] = 0
  worldPositions[index * 3 + 2] = 0 // initialy set world position to 0

  // Initial velocities
  velocities[index * 3] = Math.random() * 2 // main flow direction (along X-axis)
  velocities[index * 3 + 1] = -(Math.random() * 0.1 + 0.1) // slight downward flow
  velocities[index * 3 + 2] = (Math.random() - 0.5) * 0.02 // slight z variation

  // Initialize color
  colors[index * 3] = 0.1 // Red
  colors[index * 3 + 1] = 0.5 // Green
  colors[index * 3 + 2] = 1.0 // Blue

  // Initialize lifetime
  lifetimes[index] = Math.random() * 1000
  maxLifetime[index] = 1000 + Math.random() * 500
}
