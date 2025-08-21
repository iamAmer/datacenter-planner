import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import paper from 'paper'
import { createGrid } from './2d/floor2d.js'
import { init3D, camera, renderer } from './3d/scene3d.js'
import { convertPathsTo3D } from './3d/pathsTo3d.js'

createGrid()
init3D()

// Switch between 2D and 3D modes
const container2D = document.getElementById('container2D')
const container3D = document.getElementById('container3D')
const switchButton = document.getElementById('switchMode')
switchButton.addEventListener('click', () => {
  if (container3D.style.display === 'none') {
    container2D.style.display = 'none'
    container3D.style.display = 'block'
    convertPathsTo3D()
    switchButton.textContent = 'Switch to 2D'
  } else {
    container2D.style.display = 'block'
    container2D.style.display = 'block'
    container3D.style.display = 'none'
    switchButton.textContent = 'Switch to 3D'
  }
})

// Handle window resizing
window.addEventListener('resize', () => {
  console.log('resizing...')
  paper.view.viewSize = new paper.Size(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
