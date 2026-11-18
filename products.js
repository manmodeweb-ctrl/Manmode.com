// MAN MODE catalogue with customer size and color selection.
document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.querySelector("[data-catalog-grid]");
  const status = document.querySelector("[data-catalog-status]");
  const title = document.querySelector("#catalog-title");
  if (!grid) return;
  const params = new URLSearchParams(location.search);
  const selected = (params.get("category") || "all").trim().toLowerCase();
  const labels = {all:"ALL PRODUCTS",clothing:"CLOTHING","t-shirts":"T-SHIRTS",shirts:"SHIRTS",hoodies:"HOODIES",pants:"PANTS",footwear:"SHOES",accessories:"ACCESSORIES"};
  if (title) title.textContent = (labels[selected] || selected.replace(/[-_]/g," ").toUpperCase()) + ".";
  document.querySelectorAll("[data-category]").forEach(a => {
    const active = a.dataset.category === selected;
    a.classList.toggle("active", active);
    if (active) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current");
  });
  const norm = v => String(v || "").toLowerCase().trim().replace(/[_\s]+/g,"-");
  const match = c => {
    c = norm(c);
    if (selected === "all") return true;
    if (selected === "clothing") return ["clothing","t-shirts","t-shirt","tshirt","shirts","shirt","hoodies","hoodie","pants","trousers","jeans"].includes(c);
    if (selected === "t-shirts") return ["t-shirts","t-shirt","tshirt","tee","tees"].includes(c);
    if (selected === "shirts") return ["shirts","shirt","formal-shirts","casual-shirts"].includes(c);
    if (selected === "hoodies") return ["hoodies","hoodie","sweatshirts","sweatshirt"].includes(c);
    if (selected === "pants") return ["pants","trousers","jeans","joggers"].includes(c);
    if (selected === "footwear") return ["footwear","shoes","shoe","sneakers","sneaker","sandals"].includes(c);
    if (selected === "accessories") return ["accessories","accessory","watch","watches","bags","bag","belts","belt","caps","cap"].includes(c);
    return c === selected;
  };
  const makeChoices = (parent,label,values) => {
    if (!values.length) return null;
    const wrap=document.createElement("div"); wrap.className="variant-group";
    const heading=document.createElement("span"); heading.className="variant-label"; heading.textContent=label;
    const options=document.createElement("div"); options.className="variant-options";
    let chosen="";
    values.forEach(value=>{
      const button=document.createElement("button"); button.type="button"; button.className="variant-option";
      button.textContent=value; button.setAttribute("aria-pressed","false");
      button.addEventListener("click",()=>{
        chosen=value;
        options.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));
      });
      options.append(button);
    });
    wrap.append(heading,options); parent.append(wrap);
    return ()=>chosen;
  };
  try {
    if (typeof supabaseClient === "undefined") throw new Error("Store connection is unavailable.");
    const {data,error}=await supabaseClient.from("products")
      .select("id,name,price,category,image_url,stock,featured,active,sizes,colors")
      .eq("active",true).order("created_at",{ascending:false});
    if(error) throw error;
    const products=(data||[]).filter(p=>match(p.category));
    grid.replaceChildren();
    if(!products.length){status.textContent="এই ক্যাটাগরিতে এখনো কোনো পণ্য যোগ করা হয়নি।";return;}
    status.textContent=products.length+" product"+(products.length===1?"":"s")+" found";
    products.forEach(p=>{
      const card=document.createElement("article"); card.className="catalog-card";
      const mediaLink=document.createElement("a"); mediaLink.href="product-detail.html?id="+encodeURIComponent(p.id); mediaLink.className="product-detail-link"; const media=document.createElement("div"); media.className="catalog-card-image";
      const img=document.createElement("img"); img.loading="lazy"; img.src=p.image_url||"https://placehold.co/600x750/222/eee?text=MAN+MODE"; img.alt=p.name; media.append(img); mediaLink.append(media);
      const info=document.createElement("div"); info.className="catalog-card-info";
      const cat=document.createElement("p"); cat.className="catalog-card-category"; cat.textContent=p.category||"MAN MODE";
      const name=document.createElement("h2"); const nameLink=document.createElement("a"); nameLink.href="product-detail.html?id="+encodeURIComponent(p.id); nameLink.className="product-detail-link"; nameLink.textContent=p.name; name.append(nameLink);
      const price=document.createElement("p"); price.className="catalog-card-price"; price.textContent=ManModeCart.money(p.price);
      info.append(cat,name,price);
      const getSize=makeChoices(info,"SIZE",Array.isArray(p.sizes)?p.sizes:[]);
      const getColor=makeChoices(info,"COLOR",Array.isArray(p.colors)?p.colors:[]);
      const errorBox=document.createElement("p"); errorBox.className="variant-error"; errorBox.setAttribute("role","status");
      const add=document.createElement("button"); add.type="button"; add.className="catalog-add";
      add.textContent=Number(p.stock)>0?"ADD TO CART +":"OUT OF STOCK"; add.disabled=Number(p.stock)<=0;
      add.style.cssText="width:100%;margin-top:10px;padding:12px;background:#c6a36b;color:#111;border:0;font-weight:800;cursor:pointer";
      add.addEventListener("click",()=>{
        const size=getSize?getSize():"", color=getColor?getColor():"";
        if(getSize&&!size){errorBox.textContent="Please select a size.";return;}
        if(getColor&&!color){errorBox.textContent="Please select a color.";return;}
        ManModeCart.add(p,{selected_size:size,selected_color:color});
        errorBox.textContent=""; add.textContent="ADDED ✓";
        setTimeout(()=>{add.textContent="ADD TO CART +";},1400);
      });
      const buy=document.createElement("button"); buy.type="button"; buy.className="catalog-buy-now"; buy.textContent="BUY NOW";
      buy.style.cssText="width:100%;margin-top:8px;padding:12px;background:transparent;color:#c6a36b;border:1px solid #c6a36b;font-weight:800;cursor:pointer";
      buy.disabled=Number(p.stock)<=0;
      buy.addEventListener("click",()=>{
        const size=getSize?getSize():"", color=getColor?getColor():"";
        if(getSize&&!size){errorBox.textContent="Please select a size.";return;}
        if(getColor&&!color){errorBox.textContent="Please select a color.";return;}
        sessionStorage.setItem("manmode_buy_now",JSON.stringify({...p,quantity:1,selected_size:size,selected_color:color}));
        location.href="checkout.html?buy_now=1";
      });
      const view=document.createElement("a"); view.className="catalog-view"; view.href="product-detail.html?id="+encodeURIComponent(p.id); view.textContent="VIEW DETAILS ↗";
      view.style.cssText="display:block;text-align:center;margin-top:12px;color:#c6a36b;font-size:10px;font-weight:800;letter-spacing:1px";
      info.append(errorBox,add,buy,view); card.append(mediaLink,info); grid.append(card);
    });
  } catch(e){console.error(e);status.textContent="পণ্য লোড করা যাচ্ছে না। Store connection পরীক্ষা করুন।";}
});