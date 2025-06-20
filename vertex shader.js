var vertexShader = `#version 300 es
    layout(std140) uniform Uniforms{ //items must be multiples of 4 bytes, so vec3 has an extra value at the end and mat3 has 3 extra values when setting
		mat4 transform;
        float dt;
        float spawnRadius;
        float lifetimeMultiplier;
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

    float epsilon_0 = 8.85418782e-12; //m^-3 kg^-1 s^4 A^2
    float PI = 3.14159265359;
    float mu_0 = 1.25663706127e-6; //N A^-2
    const float timeScale = 1e-6;

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
        vec3 v = vec3(0.,0.,0.);
        float colorMultiplier = 1.;

        if(type==0u){ //Electric fields
            ptColor=vec4(0.0,0.5,1.0,1.0);
            vec3 dir = position;
            float mag = (1./(4.*PI*epsilon_0))* (1.*1.)/(dir.x*dir.x+dir.y*dir.y+dir.z*dir.z);
            v = dir*mag;//vec3(position.x+dt*0.001*0.05,position.y,position.z);
        }
        if(type==1u){ //Magnetic fields
            ptColor=vec4(1.0,0.2,0.2,1.0);
            v = vec3(0.,1e8,0.);
            colorMultiplier*=1e2;
        }
        if(type==2u){ //Electric displacement field
            ptColor=vec4(0.7,0.0,1.0,1.0);
            v = vec3(0.,0.,1e8);
            colorMultiplier*=1e2;
        }
        if(type==3u){ //H field
            ptColor=vec4(1.0,1.0,0.0,1.0);
            v = vec3(-1e8,0.,0.);
            colorMultiplier*=1e2;
        }
        if(type==4u){ //Vector potential
            ptColor=vec4(0.0,1.0,0.0,1.0);
            pos = vec3(position.x,position.y-dt*0.001*0.05,position.z);
            v = vec3(0.,-1e8,0.);
            colorMultiplier*=1e2;
        }

        pos = position + timeScale*v*dt*1e-6;
        colorMultiplier *= length(v)*1e-10;
        color = ptColor*colorMultiplier;
        vec4 transformed = vec4(position, 1) * transform;
		//color.a = 1.0 / transformed.z;
        s = state;
        t = time+dt;
        if(t>lifetime*lifetimeMultiplier){
            t=0.f;
            s = xorshift(s);
            pos.x = (float(s)/float(1u<<31)-1.)*spawnRadius;//Random01(s);
            s = xorshift(s);
            pos.y = (float(s)/float(1u<<31)-1.)*spawnRadius;//Random01(s);
            s = xorshift(s);
            pos.z = (float(s)/float(1u<<31)-1.)*spawnRadius;//Random01(s);
        }
        gl_Position = transformed;
        gl_Position.z *= -colorMultiplier;
        gl_PointSize = 3.0;
    }
`;