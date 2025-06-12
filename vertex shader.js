var vertexShader = `#version 300 es
    layout(std140) uniform Uniforms{ //items must be multiples of 4 bytes, so vec3 has an extra value at the end and mat3 has 3 extra values when setting
		mat4 transform;
        float dt;
    };

    layout(location = 0) in vec3 position;
    layout(location = 1) in uint type;
    layout(location = 2) in uint state;
    layout(location = 3) in float time;
    layout(location = 4) in float lifetime;

    out vec3 pos;
    flat out uint s;
    out float t;
    out vec4 color;

    const float epsilon_0 = 8.85418782e-12; //m^-3 kg^-1 s^4 A^2\\
    const float PI = 3.14159265359;
    const float mu_0 = 1.25663706127e-6; //N A^-2

    const float timeScale = 1.0;

    uint xorshift(uint st){
        st ^= st << 14;
        st ^= st >> 17;
        st ^= st << 5;
        return st;
    }

    float Random01(uint i){
        uint masked = i&0x007fffffu;
        masked |=       0x00ffffffu;
        return uintBitsToFloat(masked);
    }

    void main(){
        vec4 ptColor = vec4(1.0,1.0,1.0,1.0);
        
        if(type==0u){ //Electric fields
            ptColor=vec4(0.0,0.5,1.0,1.0);

        }
        if(type==1u){ //Magnetic fields
            ptColor=vec4(1.0,0.2,0.2,1.0);
        }
        if(type==2u){ //Electric displacement field
            ptColor=vec4(0.7,0.0,1.0,1.0);
        }
        if(type==3u){ //H field
            ptColor=vec4(1.0,1.0,0.0,1.0);
        }
        if(type==4u){ //Vector potential
            ptColor=vec4(0.0,1.0,0.0,1.0);
        }


        color = ptColor;
        vec4 transformed = vec4(position, 1) * transform;
		//color.a = 1.0 / transformed.z;
        pos = vec3(position.x+dt*0.001*0.05,position.y,position.z);
        s = state;
        t = time+dt;
        if(t>lifetime){
            t=0.f;
            s = xorshift(s);
            pos.x = float(s)/float(1u<<31)-1.;//Random01(s);
            s = xorshift(s);
            pos.y = float(s)/float(1u<<31)-1.;//Random01(s);
            s = xorshift(s);
            pos.z = float(s)/float(1u<<31)-1.;//Random01(s);
        }
        gl_Position = transformed;
        gl_PointSize = 3.0;
    }
`;