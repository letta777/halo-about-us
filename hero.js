/* Separate layers keep the flowing material, cursor tilt and scroll motion independent. */
(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const art = hero.querySelector('.hero-art');
  const canvas = hero.querySelector('.hero-fluid-canvas');
  let renderer = window.HaloFluidSphere?.(canvas);
  const material = {x:0, y:0, activity:0};
  let clock = 0;
  const draw = () => renderer?.draw(clock, material.x, material.y, material.activity);
  if (renderer) {
    renderer.resize(); draw(); art.classList.add('has-fluid');
    const resize = new ResizeObserver(() => {renderer?.resize(); draw();});
    resize.observe(canvas);
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault(); art.classList.remove('has-fluid');
    });
    canvas.addEventListener('webglcontextrestored', () => {
      renderer=window.HaloFluidSphere?.(canvas);
      if(renderer) {renderer.resize();draw();art.classList.add('has-fluid');}
    });
  }
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add({motion:'(prefers-reduced-motion: no-preference)',fine:'(hover: hover) and (pointer: fine)'}, context => {
    if (!context.conditions.motion) {
      material.x=0; material.y=0; material.activity=0; draw();
      return;
    }
    const orbit = hero.querySelector('.hero-orbit');
    const hover = hero.querySelector('.hero-hover');
    const breathe = hero.querySelector('.hero-breathe');
    const field = hero.querySelector('.hero-light-field');
    const entrance = gsap.timeline({defaults:{ease:'power3.out'}})
      .from(art,{opacity:0,duration:1.7},0)
      .from([canvas,hero.querySelector('.hero-fallback')],{scale:.84,duration:1.7},0)
      .from('.hero-title-line>span',{y:24,opacity:0,duration:1.1,stagger:.13},.22)
      .from('.hero .lead',{y:14,opacity:0,duration:1},.55)
      .from('.hero #clients',{y:12,opacity:0,duration:1},.7);
    const ambient = gsap.timeline({repeat:-1,yoyo:true,defaults:{ease:'sine.inOut'}})
      .to(breathe,{scale:1.045,rotation:3,y:-4,duration:5.2},0)
      .to(field,{scale:1.12,opacity:.7,duration:5.2},0);
    const fallback = gsap.timeline({repeat:-1,yoyo:true,defaults:{ease:'sine.inOut'}})
      .to('.hero-fluid-layer.is-cool',{xPercent:18,yPercent:12,rotation:32,duration:6},0)
      .to('.hero-fluid-layer.is-warm',{xPercent:-16,yPercent:-14,rotation:-24,duration:7},0);
    const scroll = gsap.to(art,{y:()=>Math.min(hero.offsetHeight*.15,135),rotation:-12,scale:1.12,ease:'none',
      scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.85,invalidateOnRefresh:true}});
    const quicks = [];
    const quick = (target, property, duration=.75) => {
      const to=gsap.quickTo(target,property,{duration,ease:'power3.out'});quicks.push(to);return to;
    };
    const xTo=quick(orbit,'x'),yTo=quick(orbit,'y');
    const rxTo=quick(orbit,'rotationX'),ryTo=quick(orbit,'rotationY');
    const scaleX=quick(hover,'scaleX'),scaleY=quick(hover,'scaleY');
    const lightX=quick(material,'x',.55),lightY=quick(material,'y',.55),activity=quick(material,'activity',.9);
    let bounds, orbBounds, active=false, inView=true, frame=0, previous=0;
    const measure = () => {bounds=hero.getBoundingClientRect();orbBounds=art.getBoundingClientRect();};
    const clamp=gsap.utils.clamp(-1,1);
    const point = event => {
      const x=clamp((event.clientX-orbBounds.left)/orbBounds.width*2-1);
      const y=clamp((event.clientY-orbBounds.top)/orbBounds.height*2-1);
      lightX(x);lightY(y);rxTo(-y*12);ryTo(x*15);
    };
    const activate = event => {
      if(event.pointerType==='touch' && event.type==='pointerenter') return;
      measure();active=true;point(event);activity(1);scaleX(1.16);scaleY(1.16);
    };
    const deactivate = () => {
      active=false;activity(0);scaleX(1);scaleY(1);lightX(0);lightY(0);rxTo(0);ryTo(0);
    };
    const reset = () => {deactivate();xTo(0);yTo(0);};
    const move = event => {
      if(event.pointerType==='touch' || !bounds) return;
      const x=clamp((event.clientX-bounds.left)/bounds.width*2-1);
      const y=clamp((event.clientY-bounds.top)/bounds.height*2-1);
      xTo(x*12);yTo(y*8);
      if(active) point(event);
      else {lightX(x*.2);lightY(y*.2);rxTo(-y*5);ryTo(x*7);}
    };
    const touchStart = event => {if(event.pointerType==='touch') activate(event);};
    const touchEnd = event => {if(event.pointerType==='touch') deactivate();};
    if(context.conditions.fine) {
      measure();hero.addEventListener('pointerenter',measure);
      hero.addEventListener('pointermove',move);hero.addEventListener('pointerleave',reset);
      art.addEventListener('pointerenter',activate);art.addEventListener('pointerleave',deactivate);
    }
    art.addEventListener('pointerdown',touchStart);
    window.addEventListener('pointerup',touchEnd);window.addEventListener('pointercancel',touchEnd);
    window.addEventListener('blur',reset);
    window.addEventListener('resize',measure,{passive:true});window.addEventListener('scroll',measure,{passive:true});
    const tick = now => {
      if(previous) clock+=Math.min((now-previous)/1000,.05)*(1+material.activity*1.35);
      previous=now;draw();frame=requestAnimationFrame(tick);
    };
    const sync = () => {
      const running=inView&&!document.hidden;
      const painting=running&&art.classList.contains('has-fluid');
      ambient.paused(!running);
      fallback.paused(!running||art.classList.contains('has-fluid'));
      if(painting&&!frame) {previous=0;frame=requestAnimationFrame(tick);}
      if(!painting&&frame) {cancelAnimationFrame(frame);frame=0;previous=0;}
    };
    const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();});
    observer.observe(art);
    document.addEventListener('visibilitychange',sync);
    canvas.addEventListener('webglcontextlost',sync);
    canvas.addEventListener('webglcontextrestored',sync);
    sync();
    return () => {
      cancelAnimationFrame(frame);observer.disconnect();
      document.removeEventListener('visibilitychange',sync);canvas.removeEventListener('webglcontextlost',sync);
      canvas.removeEventListener('webglcontextrestored',sync);
      hero.removeEventListener('pointerenter',measure);hero.removeEventListener('pointermove',move);hero.removeEventListener('pointerleave',reset);
      art.removeEventListener('pointerenter',activate);art.removeEventListener('pointerleave',deactivate);art.removeEventListener('pointerdown',touchStart);
      window.removeEventListener('pointerup',touchEnd);window.removeEventListener('pointercancel',touchEnd);window.removeEventListener('blur',reset);
      window.removeEventListener('resize',measure);window.removeEventListener('scroll',measure);
      quicks.forEach(to=>to.tween.kill());entrance.kill();ambient.kill();fallback.kill();scroll.kill();
    };
  });
})();
