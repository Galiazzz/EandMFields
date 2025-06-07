var fragmentShader = `#version 300 es
    precision lowp float;

    in vec4 color;
    out vec4 pixel_color;

    void main (){
        pixel_color = color;
    }
`;