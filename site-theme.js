// MAN MODE live theme loader. Public visitors can read only the active_theme row.
document.addEventListener("DOMContentLoaded",async()=>{
  try{
    if(typeof supabaseClient==="undefined")return;
    const {data,error}=await supabaseClient.from("site_settings").select("value").eq("key","active_theme").maybeSingle();
    if(error||!data?.value)return;
    const t=data.value,root=document.documentElement,colors=t.colors||{},sections=t.sections||{};
    const visibilityStyle=document.createElement("style");
    visibilityStyle.textContent="[hidden]{display:none!important}body{background:var(--bg)!important;color:var(--text)!important}.site-header,.shop-card,.catalog-card{background:var(--surface)!important}.brand-story,.site-footer{background:var(--bg)!important}.announcement{background:var(--gold)!important}.primary-link,.shop-tag{background:var(--gold)!important}";
    document.head.appendChild(visibilityStyle);
    const css=(name,value)=>{if(value)root.style.setProperty(name,value);};
    css("--bg",colors.bg);css("--surface",colors.surface);css("--text",colors.text);css("--muted",colors.muted);css("--gold",colors.accent);
    if(t.bannerUrl)css("--hero-image","url("+JSON.stringify(t.bannerUrl)+")");
    if(t.announcement!==undefined)document.querySelectorAll(".announcement").forEach(el=>el.textContent=t.announcement);
    document.querySelectorAll(".brand-mark").forEach(el=>{
      if(t.logoUrl){el.textContent="";el.style.backgroundImage="url("+JSON.stringify(t.logoUrl)+")";el.style.backgroundSize="contain";el.style.backgroundRepeat="no-repeat";el.style.backgroundPosition="left center";}else{el.style.backgroundImage="none";el.textContent=t.logoText||"MAN MODE";}
    });
    document.querySelectorAll(".footer-brand").forEach(el=>{
      if(t.logoUrl){const img=document.createElement("img");img.src=t.logoUrl;img.alt=t.logoText||"MAN MODE";img.style.cssText="max-width:150px;max-height:46px;object-fit:contain;vertical-align:middle";el.replaceChildren(img);}
      else if(t.logoText){el.textContent=t.logoText;}
    });
    const hero=document.querySelector(".hero");
    if(hero&&t.eyebrow!==undefined){const e=hero.querySelector(".eyebrow");if(e)e.textContent=t.eyebrow;}
    if(hero&&t.heroTitle!==undefined){const h=hero.querySelector("h1");if(h){h.replaceChildren(document.createTextNode(t.heroTitle+" "));const em=document.createElement("em");em.textContent=t.heroHighlight||"";h.appendChild(document.createElement("br"));h.appendChild(em);}}
    if(hero&&t.heroCopy!==undefined){const p=hero.querySelector(".hero-copy");if(p)p.textContent=t.heroCopy;}
    if(hero&&t.buttonText!==undefined){const b=hero.querySelector(".primary-link");if(b)b.firstChild.textContent=t.buttonText+" ";}
    const hide=(selector,key)=>{if(sections[key]===false)document.querySelectorAll(selector).forEach(el=>el.hidden=true);};
    hide(".announcement","announcement");hide(".hero","hero");
    hide(".category-strip,.shop-home .section-heading:first-child","categories");
    hide(".product-section-heading,.products-status,.home-product-grid","products");
    hide(".brand-story","about");hide(".contact-strip","contact");hide(".site-footer","footer");
  }catch(e){console.warn("MAN MODE theme could not be loaded",e);}
});
