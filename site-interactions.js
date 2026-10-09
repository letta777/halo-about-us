/* Local integration of Halo's original header, dropdowns and footer. */
(() => {
  const header = document.querySelector('.site-header header');
  if (!header) return;
  const fixedBar=header.querySelector('[data-header-fixed]');
  const absoluteBar=header.querySelector('[data-header-absolute]');
  fixedBar.inert=true;
  if(window.lottie)header.querySelectorAll('.button__icon-lottie').forEach(el=>{
    const animation=lottie.loadAnimation({container:el,renderer:'svg',loop:true,autoplay:false,animationData:JSON.parse(document.getElementById('halo-pen-animation').textContent)});
    const button=el.closest('a');
    const highlight=active=>{
      button.querySelectorAll('[data-hover-elem]').forEach(node=>node.classList.toggle('active',active));
      active?animation.play():animation.goToAndStop(0,true);
    };
    button.addEventListener('mouseenter',()=>highlight(true));
    button.addEventListener('mouseleave',()=>highlight(false));
    button.addEventListener('focus',()=>highlight(true));
    button.addEventListener('blur',()=>highlight(false));
  });
  const menu = header.querySelector('.menu');
  const triggers = [...header.querySelectorAll('[data-menu-open]')];
  let activeTrigger = null;
  const desktop = () => matchMedia('(min-width:992px)').matches;
  const closeMenu = () => {
    menu.classList.remove('is-open');
    header.classList.remove('is-menu-open');
    header.querySelectorAll('[data-menu-anim]').forEach(el => el.classList.add('anim'));
    triggers.forEach(el => {el.classList.remove('active');el.setAttribute('aria-expanded','false');});
    document.documentElement.classList.remove('menu-locked');
    menu.inert=true;
  };
  const openMenu = (trigger, type) => {
    activeTrigger = trigger;
    const active = type ?? trigger.dataset.menuOpen ?? 'services';
    menu.dataset.menuActive = active || (desktop() ? 'services' : '');
    const bar = trigger.closest('.section.mod--header');
    const bottom = bar ? bar.getBoundingClientRect().bottom : 100;
    menu.querySelector('.container.mod--menu').style.top = `${bottom}px`;
    menu.classList.add('is-open');
    header.classList.add('is-menu-open');
    menu.inert=false;
    header.querySelectorAll('[data-menu-anim]').forEach(el => el.classList.remove('anim'));
    header.querySelectorAll('[data-submenu-block]').forEach(el => {
      const show = el.dataset.submenuBlock === menu.dataset.menuActive;
      el.classList.toggle('anim', !show);
      if (!desktop()) el.style.display = show ? 'block' : 'none';
    });
    if (!desktop()) {
      const main = menu.querySelector('.menu__nav.is--main');
      if (main) main.style.display = active ? 'none' : 'flex';
      document.documentElement.classList.add('menu-locked');
    }
    triggers.forEach(el => {el.classList.toggle('active',el === trigger);el.setAttribute('aria-expanded',String(el===trigger));});
    closeResources();
  };
  triggers.forEach(trigger => {
    trigger.addEventListener('mouseenter',() => {if(desktop())openMenu(trigger);});
    trigger.addEventListener('click',() => !desktop() && menu.classList.contains('is-open') && activeTrigger===trigger ? closeMenu() : openMenu(trigger));
    trigger.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();trigger.click();}});
  });
  header.querySelectorAll('[data-menu-close]').forEach(el=>el.addEventListener('click',closeMenu));
  menu.addEventListener('click',e=>{if(e.target===menu)closeMenu();});
  header.querySelectorAll('.header__nav-link:not([data-menu-open])').forEach(el=>el.addEventListener('mouseenter',()=>{if(desktop())closeMenu();}));
  menu.querySelector('.menu__block').addEventListener('mouseleave',e=>{
    if(desktop() && !e.relatedTarget?.closest('.section.mod--header'))closeMenu();
  });
  header.querySelectorAll('[data-submenu-button]').forEach(el=>el.addEventListener('click',()=>openMenu(activeTrigger||triggers[0],el.dataset.submenuButton)));
  header.querySelectorAll('[data-submenu-back]').forEach(el=>el.addEventListener('click',()=>openMenu(activeTrigger||triggers[0],'')));
  const resourceGroups = [...header.querySelectorAll('.w-dropdown')];
  const closeResources = () => resourceGroups.forEach(group=>{
    group.querySelector('.w-dropdown-toggle')?.classList.remove('w--open');
    group.querySelector('.w-dropdown-toggle')?.setAttribute('aria-expanded','false');
    group.querySelector('.w-dropdown-list')?.classList.remove('w--open');
    if(group.querySelector('.w-dropdown-list'))group.querySelector('.w-dropdown-list').inert=true;
  });
  resourceGroups.forEach(group=>{
    const toggle=group.querySelector('.w-dropdown-toggle'),list=group.querySelector('.w-dropdown-list');
    if(!toggle||!list)return;
    const open=()=>{closeMenu();toggle.classList.add('w--open');list.classList.add('w--open');list.inert=false;toggle.setAttribute('aria-expanded','true');};
    group.addEventListener('mouseenter',()=>{if(desktop())open();});
    group.addEventListener('mouseleave',closeResources);
    toggle.addEventListener('click',()=>!desktop()&&list.classList.contains('w--open')?closeResources():open());
    toggle.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle.click();}});
  });
  closeMenu();closeResources();
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();closeResources();activeTrigger?.focus();}});
  document.addEventListener('click',e=>{if(!header.contains(e.target)){closeMenu();closeResources();}});
  let prev=scrollY,upStart=scrollY;
  addEventListener('scroll',()=>{
    const y=scrollY;
    if(y>prev){upStart=y;header.classList.remove('has-fixed');closeMenu();closeResources();}
    else if(y>innerHeight && upStart-y>innerHeight*.4)header.classList.add('has-fixed');
    if(y<=innerHeight)header.classList.remove('has-fixed');
    fixedBar.inert=!header.classList.contains('has-fixed');
    absoluteBar.inert=y>innerHeight;
    prev=y;
  },{passive:true});
  addEventListener('resize',()=>{closeMenu();closeResources();},{passive:true});
  document.querySelectorAll('.site-footer .w-dropdown').forEach((group,i)=>{
    const toggle=group.querySelector('.w-dropdown-toggle'),list=group.querySelector('.w-dropdown-list');
    if(!toggle||!list)return;
    list.id=`footer-list-${i}`;list.inert=true;toggle.setAttribute('role','button');toggle.tabIndex=0;
    toggle.setAttribute('aria-controls',list.id);toggle.setAttribute('aria-expanded','false');
    const change=()=>{const open=!list.classList.contains('w--open');list.classList.toggle('w--open',open);list.inert=!open;toggle.classList.toggle('w--open',open);toggle.setAttribute('aria-expanded',String(open));};
    toggle.addEventListener('click',change);
    toggle.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();change();}});
  });
  const form=document.querySelector('.site-footer form');
  if(form){
    const input=form.querySelector('input[type="email"]');
    input.setAttribute('aria-label','Your email address');
    form.querySelector('[data-submit-wrap]')?.addEventListener('click',e=>{if(e.target.type!=='submit')form.requestSubmit();});
    form.addEventListener('submit',e=>{
      e.preventDefault();
      let note=form.querySelector('.newsletter-handoff');
      if(!note){note=document.createElement('p');note.className='newsletter-handoff';note.setAttribute('role','status');note.innerHTML='Complete your subscription on <a href="https://halo-website-staging.halo-lab.workers.dev/#Subscription-footer-Email-redesign">the Halo Lab website ↗</a>.';form.append(note);}
    });
  }
})();
