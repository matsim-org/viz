import { Scene, LineBasicMaterial, BufferAttribute, BufferGeometry, LineSegments, Mesh, Object3D } from 'three'

export default class BufferHolder {
  private scene: Scene = new Scene()

  public get Scene() {
    return this.scene
  }

  constructor() {}

  private static NETWORK_LAYER() {
    return 'network-layer'
  }

  public loadNetworkBuffer(data: Float32Array) {
    if (!this.hasLayer(BufferHolder.NETWORK_LAYER())) {
      const lines = this.createLineMesh(BufferHolder.NETWORK_LAYER(), data, 11, 0x00000)
      this.scene.add(lines)
    }
  }

  public clearNetworkBuffer() {
    this.clearBuffer(BufferHolder.NETWORK_LAYER())
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
    const geometry = new BufferGeometry()
    geometry.addAttribute('position', attribute)
    attribute.needsUpdate = true
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
