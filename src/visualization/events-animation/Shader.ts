export const linkTripVertexShader = `
    
    attribute vec3 toPosition;
    attribute float fromTime;
    attribute float toTime;

    uniform float time;

    vec3 interpolate(in vec3 from, in vec3 to, in float fromTime, in float toTime, in float time) {
        
        float fraction = (time - fromTime) / (toTime - fromTime);
        return (to - from) * fraction + from;
    }

    void main() {
        if (fromTime > time || toTime < time) {
            gl_PointSize = 0.0;
            gl_Position = vec4(100.0, 0.0, 0.0, 0.0);
        } else {
            gl_PointSize = 5.0;
            vec3 interpolated = interpolate(position, toPosition, fromTime, toTime, time);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(interpolated, 1.0 );
        }
    }
`

export const linkTripFragmentShader = `

    uniform vec3 color;

    void main() {
        gl_FragColor = vec4(color, 1.0);
    }

`
