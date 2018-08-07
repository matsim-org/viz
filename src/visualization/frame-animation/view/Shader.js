class Shader {
  static interpolatePositionsVertexShader() {
    return `
                attribute vec3 nextPosition;
                attribute float shouldInterpolate;
                attribute float id;

                uniform float timestepFraction;
                uniform float size;
                uniform float hitTestThreshold;
                uniform float selectedId;

                varying float vRotation;
                varying float vShouldInterpolate;
                varying float vIsSelected;
                varying float vIsHover;

                vec3 interpolate(in vec3 pos1, in vec3 pos2, in float timestepFraction, in float shouldInterpolate) {

                    if(shouldInterpolate >= 0.0) {
                        vec3 direction = (pos2 - pos1);
                        vRotation = atan(direction.x, direction.y);
                        return (direction * timestepFraction) + pos1;
                    }
                    else {
                        vRotation = 0.0;
                        return pos1;
                    }
                }

                float isIdSelected() {

                    float result = 0.0;

                    if(selectedId == id) {
                        result = 1.0;
                    }
                    return result;
                }

                float getSize() {
                    float result = 0.0;

                    if (vIsSelected >= 1.0) {
                        result = size * 3.0;
                    } else if (shouldInterpolate < 1.0) {
                        result = size * 0.7;
                    } else {
                        result = size;
                    }
                    return result;
                }

                void main() {

                    vIsSelected = isIdSelected();

                    gl_PointSize = getSize();

                    vShouldInterpolate = shouldInterpolate;
                    vec3 interpolated = interpolate(position, nextPosition, timestepFraction, shouldInterpolate);

                    if (vIsSelected >= 1.0) {
                        interpolated.z = 1.0;
                    }
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(interpolated, 1.0);
                }
        `
  }

  static interpolatePositionsFragmentShader() {
    return `
                uniform vec3 color;
                uniform vec3 selectedColor;
                uniform float timestepFraction;

                uniform sampler2D triangle;
                uniform sampler2D circle;

                varying float vRotation;
                varying float vShouldInterpolate;
                varying float vIsSelected;

                vec2 rotateCoordinates() {
                    mat2 rotationMatrix = mat2(cos(vRotation), sin(vRotation), -sin(vRotation), cos(vRotation));

                    vec2 centerBasedCoord = vec2(gl_PointCoord.x -0.5, gl_PointCoord.y - 0.5);
                    vec2 centerBasedRotatedCoord = centerBasedCoord * rotationMatrix;
                    return centerBasedRotatedCoord + 0.5;
                }

                vec4 getColor() {

                    vec4 result;

                    if (vIsSelected >= 1.0) {
                        result = vec4(selectedColor, 1.0);
                    }
                    else {
                        result = vec4(color, 1.0);
                    }
                    return result;
                }

                void main() {

                    vec4 opaqueColor = getColor();

                    if (vShouldInterpolate >= 1.0) {
                        vec2 coord = rotateCoordinates();
                        gl_FragColor = opaqueColor * texture2D(triangle, coord);
                    } else {
                        opaqueColor.a = 1.0 - timestepFraction;
                        gl_FragColor = opaqueColor * texture2D(circle, gl_PointCoord);
                    }

                    if ( gl_FragColor.a < ALPHATEST ) discard;
                }
        `
  }
}

export { Shader }
