import { Rectangle } from '../contracts/Rectangle.js';
import Configuration from '../contracts/Configuration.js';

class MapInteractionController {
  set clicked (callback) {
    this._clicked = callback;
  }

  set redrawNeeded (callback) {
    this._redrawNeeded = callback;
  }

  constructor (mapState) {
    this._mapState = mapState;

    let canvas = document.getElementById(Configuration.getConfig().canvasId);
    this._boundPointerDown = (e) => this.onPointerDown(e);
    this._boundPointerUp = (e) => this.onPointerUp(e);
    this._boundPointerMove = (e) => this.onPointerMove(e);
    this._boundMouseWheel = (e) => this.onMouseWheel(e);

    let pointerDown = ('onpointerdown' in canvas) ? 'pointerdown' : 'mousedown';
    let pointerUp = ('onpointerup' in canvas) ? 'pointerup' : 'mouseup';
    let pointerMove = ('onpointermove' in canvas) ? 'pointermove' : 'mousemove';

    canvas.addEventListener(pointerDown, this._boundPointerDown);
    canvas.addEventListener(pointerUp, this._boundPointerUp);
    canvas.addEventListener(pointerMove, this._boundPointerMove);
    canvas.addEventListener('wheel', this._boundMouseWheel);
  }

  destroy () {
    let canvas = document.getElementById(Configuration.getConfig().canvasId);
    canvas.removeEventListener('mousedown', this._boundPointerDown);
    canvas.removeEventListener('mouseup', this._boundPointerUp);
    canvas.removeEventListener('mousemove', this._boundPointerMove);
    canvas.removeEventListener('pointerdown', this._boundPointerDown);
    canvas.removeEventListener('pointerup', this._boundPointerUp);
    canvas.removeEventListener('pointermove', this._boundPointerMove);
    canvas.removeEventListener('wheel', this._boundMouseWheel);

    this._redrawNeeded = null;
    this._clicked = null;
  }

  onPointerDown (args) {
    this._isMouseDown = true;
    this._oldX = args.offsetX;
    this._oldY = args.offsetY;
  }

  onPointerUp (args) {
    this._isMouseDown = false;
    if (!this._mouseMoved) { // it's a click
      let point = this._mapState.transformCoordinate(args.offsetX, args.offsetY);
      this._clicked(point);
    }
    this._mouseMoved = false;
  }

  onPointerMove (args) {
    if (this._isMouseDown) {
      let dx = args.offsetX - this._oldX;
      let dy = args.offsetY - this._oldY;
      if (dx != 0 || dy != 0) {
        this._mouseMoved = true;
      }
      this._oldX = args.offsetX;
      this._oldY = args.offsetY;
      this._mapState.moveMap(dx, -dy);
      this._redrawNeeded();
    }
  }

  onMouseWheel (args) {
    let x = args.offsetX;
    let y = args.offsetY;

    if (args.deltaY < 0) {
      this._mapState.zoomInReCenter(x, y);
    } else {
      this._mapState.zoomOutReCenter(x, y);
    }
    this._redrawNeeded();
    args.preventDefault();
    args.stopPropagation();
  }
}

export { MapInteractionController };
