import MapState from './MapState'
import { SimpleEventEmmiter } from '@/project/Event'

export default class MapInteractionController {
  private mapState: MapState
  private isPointerDown = false

  private pointerDownHandler: (event: PointerEvent) => void
  private pointerUpHandler: (event: PointerEvent) => void
  private pointerMoveHandler: (event: PointerEvent) => void
  private wheelHandler: (event: WheelEvent) => void
  private canvas: HTMLElement

  private changedEvent = new SimpleEventEmmiter<MapState>()

  public get ChangedEvent() {
    return this.changedEvent
  }

  constructor(mapState: MapState, canvas: HTMLElement) {
    this.mapState = mapState
    this.canvas = canvas

    // necessary to remove the handlers on destroy
    this.pointerDownHandler = e => this.onPointerDown(e)
    this.pointerUpHandler = e => this.onPointerUp(e)
    this.pointerMoveHandler = e => this.onPointerMove(e)
    this.wheelHandler = e => this.onWheel(e)

    canvas.addEventListener('pointerdown', this.pointerDownHandler)
    canvas.addEventListener('pointerup', this.pointerUpHandler)
    canvas.addEventListener('pointermove', this.pointerMoveHandler)
    canvas.addEventListener('wheel', this.wheelHandler)
  }

  public destroy() {
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.pointerDownHandler)
      this.canvas.removeEventListener('pointerup', this.pointerUpHandler)
      this.canvas.removeEventListener('pointermove', this.pointerMoveHandler)
      this.canvas.removeEventListener('wheel', this.wheelHandler)
    }
  }

  private onPointerDown(event: PointerEvent) {
    this.isPointerDown = true
  }

  private onPointerUp(event: PointerEvent) {
    this.isPointerDown = false
  }

  private onPointerMove(event: PointerEvent) {
    if (this.isPointerDown) {
      this.mapState.moveMap(event.movementX, event.movementY)
      this.changedEvent.emmit(this.mapState)
    }
  }

  private onWheel(event: WheelEvent) {
    event.preventDefault()
    event.stopPropagation()

    const x = event.offsetX
    const y = event.offsetY

    if (event.deltaY < 0) {
      this.mapState.zoomInReCenter(x, y)
    } else {
      this.mapState.zoomOutReCenter(x, y)
    }
    this.changedEvent.emmit(this.mapState)
  }
}
