import {
  Scene,
  LineBasicMaterial,
  BufferAttribute,
  BufferGeometry,
  LineSegments,
  Object3D,
  Color,
  ShaderMaterial,
  Points,
} from 'three'
import { linkTripVertexShader, linkTripFragmentShader } from '@/visualization/events-animation/Shader'

export default class BufferHolder {
  private scene: Scene = new Scene()

  public get Scene() {
    return this.scene
  }

  constructor() {
    this.scene.background = new Color(0xecf0f1)
    this.loadAgentBuffer()
  }

  private static NETWORK_LAYER() {
    return 'network-layer'
  }

  private static AGENT_LAYER() {
    return 'agent-layer'
  }

  public loadNetworkBuffer(data: Float32Array) {
    if (!this.hasLayer(BufferHolder.NETWORK_LAYER())) {
      const lines = this.createLineMesh(BufferHolder.NETWORK_LAYER(), data, -11, 0x2c3e50)
      this.scene.add(lines)
    }
  }

  public loadAgentBuffer() {
    if (this.hasLayer(BufferHolder.AGENT_LAYER())) return

    const shaderMaterial = new ShaderMaterial({
      vertexShader: linkTripVertexShader,
      fragmentShader: linkTripFragmentShader,
      uniforms: {
        color: { value: new Color(0x3498db) },
        time: { value: 0.0 },
      },
    })
    const points = new Points(this.createAgentBufferGeometry(), shaderMaterial)
    points.name = BufferHolder.AGENT_LAYER()
    points.frustumCulled = false
    points.position.z = -10
    this.scene.add(points)
  }

  public updateAgentBufferAttribute(name: string, array: Float32Array) {
    const layer = this.scene.getObjectByName(BufferHolder.AGENT_LAYER()) as Points
    const attribute = (layer.geometry as BufferGeometry).getAttribute(name) as BufferAttribute
    attribute.setArray(array)
    attribute.needsUpdate = true
  }

  public updateAgentBufferUniform(name: string, value: any) {
    const layer = this.scene.getObjectByName(BufferHolder.AGENT_LAYER()) as Points
    ;(layer.material as ShaderMaterial).uniforms[name].value = value
  }

  public clearNetworkBuffer() {
    this.clearBuffer(BufferHolder.NETWORK_LAYER())
  }

  private createAgentBufferGeometry() {
    const geometry = new BufferGeometry()
    geometry.addAttribute('position', new BufferAttribute(new Float32Array([]), 3))
    geometry.addAttribute('toPosition', new BufferAttribute(new Float32Array([]), 3))
    geometry.addAttribute('fromTime', new BufferAttribute(new Float32Array([]), 1))
    geometry.addAttribute('toTime', new BufferAttribute(new Float32Array([]), 1))
    return geometry
  }

  private clearBuffer(layerName: string) {
    if (this.scene.children) {
      const layer = this.scene.getObjectByName(layerName)
      if (layer) {
        this.scene.remove(layer)
      }
    }
  }

  private createLineMesh(name: string, lines: Float32Array, z: number, color: number) {
    const material = new LineBasicMaterial({ color: color })
    const geometry = this.createBufferGeometry(lines)
    const mesh = new LineSegments(geometry, material)
    this.setMeshProperties(mesh, name, z)
    return mesh
  }

  private createBufferGeometry(positions: Float32Array) {
    const attribute = new BufferAttribute(positions, 3)
    attribute.needsUpdate = true
    const geometry = new BufferGeometry()
    geometry.addAttribute('position', attribute)
    return geometry
  }

  private setMeshProperties(mesh: Object3D, name: string, z: number) {
    mesh.name = name
    mesh.position.z = z
    mesh.frustumCulled = false
  }

  private hasLayer(name: string) {
    return this.scene.getObjectByName(name) ? true : false
  }
}
