/* Original shader: softly warped blue/cyan/orange light inspired by the reference palette. */
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
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);
    }
    float fbm(vec2 p){
      float n=.55*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.03;
      n+=.28*noise(p+3.1);p=mat2(.8,-.6,.6,.8)*p*2.01;
      return n+.17*noise(p+7.4);
    }
    vec3 palette(float v){
      vec3 c=mix(vec3(.018,.037,.075),vec3(.14,.29,.51),smoothstep(.05,.27,v));
      c=mix(c,vec3(.44,.65,.71),smoothstep(.27,.44,v));
      c=mix(c,vec3(.72,.79,.74),smoothstep(.44,.53,v));
      c=mix(c,vec3(.91,.43,.19),smoothstep(.53,.65,v));
      c=mix(c,vec3(.69,.22,.065),smoothstep(.72,.88,v));
      return mix(c,vec3(.045,.019,.014),smoothstep(.9,1.,v));
    }
    void main(){
      vec2 p=vec2(v_uv.x-.5,.5-v_uv.y)*2.75;
      float r=length(p);
      if(r>1.36){gl_FragColor=vec4(0.);return;}
      float z=sqrt(max(0.,1.-min(r*r,1.)));
      vec2 q=p*(1.+.24*(1.-z));
      vec2 d=q-u_pointer*.76;
      float influence=exp(-dot(d,d)*3.1)*u_hover;
      float twist=influence*(.65+.18*sin(u_time*.7));
      q=u_pointer*.76+mat2(cos(twist),-sin(twist),sin(twist),cos(twist))*d;
      q+=normalize(d+vec2(.001))*.12*influence*sin(length(d)*9.-u_time*1.6);
      vec2 flow=vec2(fbm(q*.9+vec2(u_time*.11,-u_time*.065)),fbm(q*.9+vec2(4.7-u_time*.075,2.3)));
      q+=(flow-.5)*(.58+u_hover*.6)+u_pointer*.12*u_hover;
      float wave=sin(q.x*1.6+q.y*1.4+fbm(q+u_time*.055)*1.6-1.+sin(u_time*.24)*.65);
      float band=.5+.45*wave;
      vec3 color=palette(band);
      color*=.72+.28*z;
      vec3 normal=normalize(vec3(p*.78,z));
      vec3 light=normalize(vec3(-.4+u_pointer.x*.25,-.6+u_pointer.y*.25,1.));
      float spec=pow(max(dot(normal,light),0.),24.)*(.1+.12*u_hover);
      color+=vec3(.78,.88,.9)*spec;
      float grain=(hash(gl_FragCoord.xy)-.5)*.065;
      color+=grain;
      float rim=exp(-pow((r-.984)*100.,2.));
      color+=rim*vec3(.66,.79,.79)*(.13+.12*u_hover);
      float disc=1.-smoothstep(.99,1.012,r);
      float halo=exp(-max(r-.98,0.)*20.)*(.17+.14*u_hover);
      vec3 haloColor=mix(vec3(.22,.44,.7),vec3(.95,.43,.19),smoothstep(-.45,.5,p.y+p.x*.4));
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
