/* Same visual slots and 0.5px/frame speed as the homepage's trusted-client strip. */
(() => {
  const root=document.querySelector('#clients');
  if(!root)return;
  const track=root.querySelector('.client-marquee-track');
  const run=root.querySelector('.client-marquee-run');
  const resize=()=>{
    let speed=30;
    if(/^((?!chrome|android).)*safari/i.test(navigator.userAgent))speed*=3;
    if(matchMedia('(max-width:767px)').matches)speed*=.5;
    track.style.setProperty('--client-duration',`${run.getBoundingClientRect().width/speed}s`);
  };
  new ResizeObserver(resize).observe(root);
  document.fonts.ready.then(resize);
})();
