/* eslint-disable */
import * as THREE from 'three'
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  TextureLoader,
  Vector2,
} from 'three'
/* eslint-disable */
import { Shader } from './Shader.js'
import Configuration from '../contracts/Configuration'

/* eslint-disable */
import triangle from './assets/triangle-64.png'
import circle from './assets/circle-64.png'
/* eslint-enable */

class BufferHolder {
  static AGENT_LAYER() {
    return 'agent-layer'
  }
  static NETWORK_LAYER() {
    return 'network-layer'
  }

  get scene() {
    return this._scene
  }

  get hasAgentLayer() {
    return this._hasLayer(BufferHolder.AGENT_LAYER())
  }

  set redrawNeeded(callback) {
    this._redrawNeeded = callback
  }

  constructor() {
    this._config = Configuration.getConfig()
    this._scene = new Scene()
    window.scene = this._scene
    window.THREE = THREE
    this._scene.background = new Color(this._config.colors.background)
  }

  destroy() {
    this._redrawNeeded = null
    this._scene = null
  }

  clearNetworkBuffer() {
    this._clearBuffer(BufferHolder.NETWORK_LAYER())
  }

  clearAgentBuffer() {
    this._clearBuffer(BufferHolder.AGENT_LAYER())
  }

  clearGeoJsonBuffer(layerName) {
    this._clearBuffer('p' + layerName)
    this._clearBuffer('l' + layerName)
    this._clearBuffer('s' + layerName)
  }

  _clearBuffer(layerName) {
    if (this._scene.children) {
      let layer = this._scene.getObjectByName(layerName)
      this.scene.remove(layer)
    }
  }

  loadNetworkBuffer(links) {
    if (!this._hasLayer(BufferHolder.NETWORK_LAYER())) {
      let lines = this._createLineMesh(BufferHolder.NETWORK_LAYER(), links, -11, this._config.colors.network)
      this._scene.add(lines)
    }
  }

  loadAgentBuffer() {
    if (this._hasLayer(BufferHolder.AGENT_LAYER())) return

    let shaderMaterial = new ShaderMaterial({
      vertexShader: Shader.interpolatePositionsVertexShader(),
      fragmentShader: Shader.interpolatePositionsFragmentShader(),
      uniforms: {
        timestepFraction: { value: 0.0 },
        size: { value: 10.0 * window.devicePixelRatio },
        hitTestThreshold: { value: 100.0 },
        selectedId: { value: -1 },
        mousePosition: { value: new Vector2(0, 0) },

        color: { value: new Color(this._config.colors.agents) },
        selectedColor: { value: new Color(this._config.colors.selectedAgent) },
        triangle: { value: this._createTexture(triangle) },
        circle: { value: this._createTexture(circle) },
      },
      transparent: true,
      alphaTest: 0.1,
    })
    let points = new Points(new BufferGeometry(), shaderMaterial)
    points.name = BufferHolder.AGENT_LAYER()
    points.frustumCulled = false
    points.position.z = -10
    this._scene.add(points)

    this._createAgentBufferAttribute('position', 3)
    this._createAgentBufferAttribute('nextPosition', 3)
    this._createAgentBufferAttribute('shouldInterpolate', 1)
    this._createAgentBufferAttribute('id', 1)
  }

  loadGeoJsonBuffer(layer) {
    if (!layer) return

    if (layer.points && layer.points.length > 0) {
      let points = this._createPointsMesh('p' + layer.name, layer.points, layer.z, 16, layer.color, circle)
      this._scene.add(points)
    }

    if (layer.lines && layer.lines.length > 0) {
      let lines = this._createLineMesh('l' + layer.name, layer.lines, layer.z, layer.color)
      this._scene.add(lines)
    }
    if (
      layer.shapeVertices &&
      layer.shapeVertices.length > 0 &&
      layer.shapeNormals &&
      layer.shapeNormals.length === layer.shapeVertices.length
    ) {
      let shapes = this._createShapeMesh(
        's' + layer.name,
        layer.shapeVertices,
        layer.shapeNormals,
        layer.z,
        layer.color
      )
      this._scene.add(shapes)
    }
  }

  _createAgentBufferAttribute(name, itemSize) {
    let attribute = new BufferAttribute(new Float32Array([]), itemSize)
    let agentLayer = this._scene.getObjectByName(BufferHolder.AGENT_LAYER())
    agentLayer.geometry.addAttribute(name, attribute)
  }

  updateAgentBufferAttribute(name, array) {
    let agentLayer = this._scene.getObjectByName(BufferHolder.AGENT_LAYER())
    let attribute = agentLayer.geometry.getAttribute(name)
    attribute.setArray(array)
    attribute.needsUpdate = true
  }

  updateAgentBufferUniform(name, value) {
    let agentLayer = this._scene.getObjectByName(BufferHolder.AGENT_LAYER())
    agentLayer.material.uniforms[name].value = value
  }

  getLayer(layerName) {
    return this._scene.getObjectByName(layerName)
  }

  _createLineMesh(name, lines, z, color) {
    let material = new LineBasicMaterial({ color: color })
    let geometry = this._createBufferGeometry(lines)
    let mesh = new LineSegments(geometry, material)
    this._setMeshProperties(mesh, name, z)
    return mesh
  }

  _createPointsMesh(name, points, z, size, color, image) {
    let material = new PointsMaterial({ color: color, sizeAttenuation: false, size: size })

    if (image) {
      material.map = this._createTexture(image, this._redrawNeeded)
      material.alphaTest = 0.9
    }
    let geometry = this._createBufferGeometry(points)
    let mesh = new Points(geometry, material)
    this._setMeshProperties(mesh, name, z)
    return mesh
  }

  _createShapeMesh(name, vertices, normals, z, color) {
    let material = new MeshBasicMaterial({ color: color })
    let geometry = this._createBufferGeometry(vertices)
    geometry.addAttribute('normal', new BufferAttribute(normals, 3))
    let mesh = new Mesh(geometry, material)
    mesh.name = name
    mesh.position.z = z
    return mesh
  }

  _createBufferGeometry(positions) {
    let attribute = new BufferAttribute(positions, 3)
    let geometry = new BufferGeometry()
    geometry.addAttribute('position', attribute)
    geometry.verticesNeedUpdate = true
    return geometry
  }

  _createTexture(image, callback) {
    let texture

    if (callback) {
      texture = new TextureLoader().load(image, t => callback())
    } else {
      texture = new TextureLoader().load(image)
    }

    texture.flipY = false
    texture.magFilter = NearestFilter
    texture.minFilter = NearestFilter
    return texture
  }

  _setMeshProperties(mesh, name, z) {
    mesh.name = name
    mesh.position.z = z
    mesh.frustumCulled = false
  }

  _hasLayer(name) {
    if (this._scene.getObjectByName(name)) {
      return true
    } else return false
  }
}

export { BufferHolder }
