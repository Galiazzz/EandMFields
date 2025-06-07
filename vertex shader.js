var vertexShader = `#version 300 es
    layout(std140) uniform Uniforms{ //items must be multiples of 4 bytes, so vec3 has an extra value at the end and mat3 has 3 extra values when setting
		mat4 transform;
    };

    layout(location = 0) in vec3 position;
    layout(location = 1) in uint type;
    layout(location = 2) in uint index;
    layout(location = 3) in float time;
    layout(location = 4) in float lifetime;

    out vec4 color;
    void main(){
        vec4 ptColor = vec4(1.0,1.0,1.0,1.0);
        switch(type){
            case 0u:ptColor=vec4(0.0,0.0,1.0,1.0);//Electric fields
            case 1u:ptColor=vec4(1.0,0.0,0.0,1.0);//Magnetic fields
            case 2u:ptColor=vec4(0.7,0.0,1.0,1.0);//Electric displacement field
            case 3u:ptColor=vec4(1.0,1.0,0.0,1.0);//H field
            case 4u:ptColor=vec4(0.0,1.0,0.0,1.0);//Vector potential
        }
        color = ptColor;
        vec4 transformed = vec4(position, 1) * transform;
		//color.a = 1.0 / transformed.z;
        gl_Position = transformed;
        gl_PointSize = 1.0;
    }
`;