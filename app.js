/* Progressive enhancement: content remains readable without JavaScript. */
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.utils.toArray('.leadership-letter').forEach((letter) => {
      gsap.fromTo(letter,{rotation:letter.offsetLeft < window.innerWidth*.2 ? -3 : 3,y:35},{rotation:0,y:0,ease:'none',scrollTrigger:{trigger:letter,start:'top 92%',end:'center 58%',scrub:1}});
    });
    gsap.utils.toArray('#teams .card, #work .card, .grid-reasons__block, .award, .stats > div').forEach((element) => {
      gsap.from(element, {y:32,opacity:0,duration:.85,ease:'power3.out',scrollTrigger:{trigger:element,start:'top 93%',once:true}});
    });
    gsap.fromTo('.site-cta .new-discuss__text-wrap',{y:24,opacity:0},{y:0,opacity:1,duration:1,ease:'power3.out',scrollTrigger:{trigger:'.site-cta .new-discuss',start:'top 90%',once:true}});
  });
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
