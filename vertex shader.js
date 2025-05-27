var starVertexShader = `#version 300 es
    layout(std140) uniform Uniforms{ //items must be multiples of 4 bytes, so vec3 has an extra value at the end and mat3 has 3 extra values when setting
		mat4 transform;
    };

    layout(location = 0) in vec3 position;
    layout(location = 1) in vec4 in_color;

    out vec4 color;
    void main(){
        color = in_color;
        vec4 transformed = vec4(position, 1) * transform;
		//color.a = 1.0 / transformed.z;
        gl_Position = transformed;
        gl_PointSize = 1.0;
    }
`;