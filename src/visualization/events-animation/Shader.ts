export const linkTripVertexShader = `
    attribute vec3 toPosition;
    attribute float fromTime;
    attribute float toTime;

    uniform float time;
    uniform float size;

    vec3 interpolate(in vec3 from, in vec3 to, in float fromTime, in float toTime) {
        return (to - from) * (time - fromTime) / (toTime - fromTime); 
    }

    void main() {
        if (fromTime < time || toTime > time) {
            gl_PointSize = 20.0;
        }
        else {
            gl_PointSize = 200.0;
            gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
            // vec3 interpolated = interpolate(position, toPosition, fromTime, toTime);
            // gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        
    }
`

export const linkTripFragmentShader = `

    uniform vec3 color;

    void main() {
        gl_FragColor = vec4(color, 1.0);
    }

`
