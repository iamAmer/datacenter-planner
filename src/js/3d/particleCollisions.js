import * as THREE from 'three'
import { particleSystems as rackParticleSystems } from './rackParticles.js'
import { particleSystems as coolerParticleSystems } from './coolerParticles.js'

export function checkInterParticleCollisions() {
  // Check collisions between rack particles (red) and cooler particles (blue)
  rackParticleSystems.forEach((rackData) => {
    coolerParticleSystems.forEach((coolerData) => {
      checkCollisionsBetweenSystems(rackData, coolerData)
    })
  })
}

function checkCollisionsBetweenSystems(rackData, coolerData) {
  const rackGeometry = rackData.geometry
  const coolerGeometry = coolerData.geometry

  const rackPositions = rackGeometry.attributes.position.array
  const coolerPositions = coolerGeometry.attributes.position.array

  // Convert rack positions to world space
  const rackWorldPositions = []
  for (let i = 0; i < rackPositions.length; i += 3) {
    const localPos = new THREE.Vector3(
      rackPositions[i],
      rackPositions[i + 1],
      rackPositions[i + 2]
    )
    const worldPos = localPos.clone()
    rackData.rack.localToWorld(worldPos)
    rackWorldPositions.push(worldPos)
  }

  // Convert cooler positions to world space
  const coolerWorldPositions = []
  for (let i = 0; i < coolerPositions.length; i += 3) {
    const localPos = new THREE.Vector3(
      coolerPositions[i],
      coolerPositions[i + 1],
      coolerPositions[i + 2]
    )
    const worldPos = localPos.clone()
    coolerData.cooler.localToWorld(worldPos)
    coolerWorldPositions.push(worldPos)
  }

  // Check for collisions between each rack particle and cooler particle
  const collisionDistance = 0.1 // Same as used in individual particle collision detection

  // Track which rack particles have already collided this frame
  const collidedRackParticles = new Set()

  for (let rackIndex = 0; rackIndex < rackWorldPositions.length; rackIndex++) {
    // Skip if this rack particle already collided
    if (collidedRackParticles.has(rackIndex)) {
      continue
    }

    const rackPos = rackWorldPositions[rackIndex]

    for (let coolerIndex = 0; coolerIndex < coolerWorldPositions.length; coolerIndex++) {
      const coolerPos = coolerWorldPositions[coolerIndex]
      const distance = rackPos.distanceTo(coolerPos)

      if (distance < collisionDistance) {
        // Collision detected!
        handleCollision(rackData, rackIndex, coolerData, coolerIndex)
        // Mark this rack particle as collided so it won't hit other particles
        collidedRackParticles.add(rackIndex)
        break // Stop checking this rack particle against other cooler particles
      }
    }
  }
}

function handleCollision(rackData, rackParticleIndex, coolerData, coolerParticleIndex) {
  // Make both particles disappear immediately by setting their lifetime to max
  const rackGeometry = rackData.geometry
  const coolerGeometry = coolerData.geometry

  const rackMaxLifetimes = rackGeometry.attributes.maxLifetime.array
  const rackColors = rackGeometry.attributes.color.array
  const coolerMaxLifetimes = coolerGeometry.attributes.maxLifetime.array
  const coolerColors = coolerGeometry.attributes.color.array

  // Rember to multiply indexes by 3 as colors are defined 3 dimensional vectors
  rackColors[rackParticleIndex * 3] = 1.0   // Red
  rackColors[rackParticleIndex * 3 + 1] = 0.5  // Yellow
  rackColors[rackParticleIndex * 3 + 2] = 0.0  // Blue

  coolerColors[coolerParticleIndex * 3] = 1.0   // Red
  coolerColors[coolerParticleIndex * 3 + 1] = 0.5  // Yellow
  coolerColors[coolerParticleIndex * 3 + 2] = 0.0  // Blue

  // Reduce maxLifetimes to avoid accumulation
  rackMaxLifetimes[rackParticleIndex] *= 0.9 
  coolerMaxLifetimes[coolerParticleIndex] *= 0.9

  rackGeometry.attributes.maxLifetime.needsUpdate = true
  coolerGeometry.attributes.maxLifetime.needsUpdate = true
  rackGeometry.attributes.color.needsUpdate = true
  coolerGeometry.attributes.color.needsUpdate = true
}

