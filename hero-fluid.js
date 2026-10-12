/* Diffuse projected light: broad blue/cyan/orange blends with a soft luminous rim. */
window.HaloFluidSphere = function (canvas) {
  const gl = canvas.getContext('webgl', {alpha:true, antialias:false, premultipliedAlpha:false, powerPreference:'low-power'});
  if (!gl) return null;
  const vertex = `attribute vec2 a_position;
    varying vec2 v_uv;
    void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
  const fragment = `precision highp float;
    varying vec2 v_uv;
    uniform float u_time;
    uniform vec2 u_pointer;
    uniform float u_hover;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){
      vec2 p=vec2(v_uv.x-.5,.5-v_uv.y)*2.75;
      float r=length(p);
      if(r>1.36){gl_FragColor=vec4(0.);return;}
      float z=sqrt(max(0.,1.-min(r*r,1.)));
      vec2 q=p;
      vec2 d=p-u_pointer*.65;
      float influence=exp(-dot(d,d)*1.1)*u_hover;
      float turn=.045*sin(u_time*.18)+influence*(.35+.14*sin(u_time*.44));
      q=mat2(cos(turn),-sin(turn),sin(turn),cos(turn))*q;
      q+=vec2(sin(q.y*1.3+u_time*.27),cos(q.x*1.15-u_time*.22))*(.035+.15*u_hover);
      q+=u_pointer*.23*u_hover;
      // Overlapping, very broad light fields; no repeating bands or surface relief.
      float vertical=q.y+.05*sin(u_time*.23);
      // Vivid reference palette: blue #1266EE, cyan #13BFFA, amber #FFD27A, hot orange #FF4A00.
      vec3 color=mix(vec3(.071,.400,.933),vec3(.075,.749,.980),smoothstep(-.94,.18,vertical));
      color=mix(color,vec3(1.,.824,.478),smoothstep(-.25,.60,vertical));
      color=mix(color,vec3(1.,.290,0.),smoothstep(.15,1.04,vertical));
      vec2 glow=q-vec2(-.22+.28*sin(u_time*.24),.08);
      float bloom=exp(-dot(glow,glow)*1.5)*(.08+.10*u_hover);
      color=mix(color,vec3(1.,.91,.66),bloom*.65);
      color*=.94+.06*z;
      color+=(hash(gl_FragCoord.xy)-.5)*.012;
      float warm=smoothstep(-.75,.72,p.y);
      vec3 rimColor=mix(vec3(.74,.86,1.),vec3(1.,.72,.30),warm);
      float rim=exp(-pow((r-.976)*46.,2.));
      float softRim=exp(-pow((r-.982)*15.,2.));
      color+=rim*rimColor*(.38+.47*warm+.17*u_hover);
      color+=softRim*rimColor*.10;
      float disc=1.-smoothstep(.985,1.022,r);
      float halo=exp(-max(r-.97,0.)*15.)*(.22+.12*u_hover);
      vec3 haloColor=mix(vec3(.14,.47,1.),vec3(1.,.30,.025),warm);
      gl_FragColor=vec4(mix(haloColor,color,disc),max(disc,halo));
    }`;
  const shaders = [];
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    shaders.push(shader);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  };
  let program, buffer;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  } catch (error) {
    console.warn('Sphere uses the gradient fallback:', error.message);
    shaders.forEach(shader => gl.deleteShader(shader));
    if (program) gl.deleteProgram(program);
    if (buffer) gl.deleteBuffer(buffer);
    return null;
  }
  const time = gl.getUniformLocation(program, 'u_time');
  const pointer = gl.getUniformLocation(program, 'u_pointer');
  const hover = gl.getUniformLocation(program, 'u_hover');
  return {
    resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.min(768, Math.round(canvas.clientWidth * ratio));
      const height = Math.min(768, Math.round(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {canvas.width=width;canvas.height=height;}
      gl.viewport(0,0,width,height);
    },
    draw(elapsed, x, y, activity) {
      if (gl.isContextLost()) return;
      gl.uniform1f(time, elapsed); gl.uniform2f(pointer, x, y); gl.uniform1f(hover, activity);
      gl.drawArrays(gl.TRIANGLES,0,3);
    }
  };
};
