/* A short cursor-following tween, with no idle animation or layout writes. */
(() => {
  const grid = document.querySelector('#recognition .awards-grid');
  if (!grid || !window.gsap) return;
  const media = gsap.matchMedia();
  media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
    let active = null;
    const cards = [...grid.querySelectorAll('.award')].map(card => {
      const light = document.createElement('span');
      light.className = 'award-border-light';
      light.setAttribute('aria-hidden', 'true');
      const sweep = document.createElement('span');
      sweep.className = 'award-border-sweep';
      const spot = document.createElement('span');
      spot.className = 'award-border-spot';
      light.append(sweep, spot);
      card.append(light);
      const xTo = gsap.quickTo(spot, 'x', {duration:.35, ease:'power3.out'});
      const yTo = gsap.quickTo(spot, 'y', {duration:.35, ease:'power3.out'});
      const turnTo = gsap.quickTo(sweep, 'rotation', {duration:.55, ease:'power3.out'});
      let bounds, angle = 0;
      const measure = () => { bounds = card.getBoundingClientRect(); };
      const position = event => {
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;
        const next = Math.atan2(y - bounds.height / 2, x - bounds.width / 2) * 180 / Math.PI;
        // Follow the shortest arc when crossing the -180/180 degree seam.
        angle += ((next - angle + 180) % 360 + 360) % 360 - 180;
        return {x:x - 120, y:y - 120, angle};
      };
      const enter = event => {
        if (event.pointerType === 'touch') return;
        measure();
        active = measure;
        const point = position(event);
        gsap.set(spot, {x:point.x, y:point.y});
        gsap.set(sweep, {rotation:point.angle});
        gsap.to(light, {autoAlpha:1, duration:.3, ease:'power2.out', overwrite:true});
      };
      const move = event => {
        if (event.pointerType === 'touch' || active !== measure) return;
        const point = position(event);
        xTo(point.x); yTo(point.y); turnTo(point.angle);
      };
      const leave = () => {
        if (active === measure) active = null;
        gsap.to(light, {autoAlpha:0, duration:.55, ease:'power2.out', overwrite:true});
      };
      card.addEventListener('pointerenter', enter);
      card.addEventListener('pointermove', move);
      card.addEventListener('pointerleave', leave);
      card.addEventListener('pointercancel', leave);
      return () => {
        card.removeEventListener('pointerenter', enter);
        card.removeEventListener('pointermove', move);
        card.removeEventListener('pointerleave', leave);
        card.removeEventListener('pointercancel', leave);
        [xTo, yTo, turnTo].forEach(to => to.tween.kill());
        gsap.killTweensOf([light, sweep, spot]);
        light.remove();
      };
    });
    const measureActive = () => { if (active) active(); };
    window.addEventListener('scroll', measureActive, {passive:true});
    window.addEventListener('resize', measureActive, {passive:true});
    return () => {
      active = null;
      window.removeEventListener('scroll', measureActive);
      window.removeEventListener('resize', measureActive);
      cards.forEach(dispose => dispose());
    };
  });
})();
