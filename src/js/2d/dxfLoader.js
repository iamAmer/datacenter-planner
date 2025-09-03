import paper from 'paper'

export function loadDxfFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const dxfContent = event.target.result
        console.log('DXF Content:', dxfContent.substring(0, 200) + '...')

        // Parse DXF manually for basic entities
        const entities = parseDxfManually(dxfContent)
        console.log('Parsed entities:', entities)

        // Clear existing content
        paper.project.clear()

        // Process entities
        entities.forEach((entity, index) => {
          console.log(`Processing entity ${index}:`, entity)
          processDxfEntity(entity)
        })

        resolve({ entities })
      } catch (error) {
        console.error('DXF parsing error:', error)
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

function parseDxfManually(content) {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  const entities = []
  let i = 0

  while (i < lines.length) {
    if (lines[i] === '0' && lines[i + 1] === 'LINE') {
      const entity = parseLineEntity(lines, i)
      if (entity) {
        entities.push(entity)
        i = entity.endIndex
      } else {
        i++
      }
    } else if (lines[i] === '0' && lines[i + 1] === 'CIRCLE') {
      const entity = parseCircleEntity(lines, i)
      if (entity) {
        entities.push(entity)
        i = entity.endIndex
      } else {
        i++
      }
    } else {
      i++
    }
  }

  return entities
}

function parseLineEntity(lines, startIndex) {
  let i = startIndex
  const entity = { type: 'LINE' }

  try {
    while (i < lines.length && !(lines[i] === '0' && i > startIndex)) {
      const code = parseInt(lines[i])
      const value = lines[i + 1]

      switch (code) {
        case 10: entity.startX = parseFloat(value); break
        case 20: entity.startY = parseFloat(value); break
        case 11: entity.endX = parseFloat(value); break
        case 21: entity.endY = parseFloat(value); break
      }

      i += 2
    }

    if (entity.startX !== undefined && entity.startY !== undefined &&
        entity.endX !== undefined && entity.endY !== undefined) {
      entity.start = { x: entity.startX, y: entity.startY }
      entity.end = { x: entity.endX, y: entity.endY }
      entity.endIndex = i
      return entity
    }
  } catch (error) {
    console.error('Error parsing LINE entity:', error)
  }

  return null
}

function parseCircleEntity(lines, startIndex) {
  let i = startIndex
  const entity = { type: 'CIRCLE' }

  try {
    while (i < lines.length && !(lines[i] === '0' && i > startIndex)) {
      const code = parseInt(lines[i])
      const value = lines[i + 1]

      switch (code) {
        case 10: entity.centerX = parseFloat(value); break
        case 20: entity.centerY = parseFloat(value); break
        case 40: entity.radius = parseFloat(value); break
      }

      i += 2
    }

    if (entity.centerX !== undefined && entity.centerY !== undefined && entity.radius !== undefined) {
      entity.center = { x: entity.centerX, y: entity.centerY }
      entity.endIndex = i
      return entity
    }
  } catch (error) {
    console.error('Error parsing CIRCLE entity:', error)
  }

  return null
}

function processDxfEntity(entity) {
  console.log('Processing entity:', entity)
  switch (entity.type) {
    case 'LINE':
      createLineFromDxf(entity)
      break
    case 'CIRCLE':
      createCircleFromDxf(entity)
      break
    default:
      console.log('Unsupported entity type:', entity.type)
  }
}

function createLineFromDxf(entity) {
  console.log('Creating line from:', entity)

  if (entity.start && entity.end) {
    const start = new paper.Point(entity.start.x, entity.start.y)
    const end = new paper.Point(entity.end.x, entity.end.y)

    const path = new paper.Path.Line(start, end)
    path.strokeColor = 'black'
    path.strokeWidth = 2
  } else {
    console.log('Invalid line data:', entity)
  }
}



function createCircleFromDxf(entity) {
  console.log('Creating circle from:', entity)

  if (entity.center && entity.radius) {
    const center = new paper.Point(entity.center.x, entity.center.y)
    const circle = new paper.Path.Circle(center, entity.radius)
    circle.strokeColor = 'black'
    circle.strokeWidth = 2
    circle.fillColor = null
  } else {
    console.log('Invalid circle data:', entity)
  }
}



export function setupDxfUpload() {
  const fileInput = document.getElementById('dxfFileInput')
  const uploadBtn = document.getElementById('uploadDxfBtn')

  uploadBtn.addEventListener('click', () => {
    fileInput.click()
  })

  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0]
    if (file && file.name.toLowerCase().endsWith('.dxf')) {
      try {
        await loadDxfFile(file)
        console.log('DXF file loaded successfully')
      } catch (error) {
        console.error('Error loading DXF file:', error)
        alert('Error loading DXF file: ' + error.message)
      }
    }
  })
}