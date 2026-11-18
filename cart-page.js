document.addEventListener("DOMContentLoaded",()=>{
  const root=document.getElementById("cartContent");
  const render=()=>{
    const items=ManModeCart.items();
    if(!items.length){root.innerHTML='<div class="empty-cart"><h2>Your cart is waiting.</h2><p>Discover something that defines your style.</p><a class="cart-action" href="products.html">CONTINUE SHOPPING ↗</a></div>';return;}
    root.replaceChildren();let total=0;
    items.forEach(item=>{
      total+=item.price*item.quantity;
      const key=item.cart_key||[String(item.id),String(item.selected_size||""),String(item.selected_color||"")].join("::");
      const row=document.createElement("article");row.className="cart-row";
      const img=document.createElement("img");img.src=item.image_url||"https://placehold.co/200x240/222/eee?text=MAN+MODE";img.alt=item.name;
      const info=document.createElement("div"),h=document.createElement("h2"),p=document.createElement("p"),variant=document.createElement("p");
      h.textContent=item.name;p.textContent=ManModeCart.money(item.price);
      variant.style.cssText="color:#aaa;font-size:12px";
      variant.textContent=[item.selected_size?"Size: "+item.selected_size:"",item.selected_color?"Color: "+item.selected_color:""].filter(Boolean).join(" · ");
      info.append(h,p);if(variant.textContent)info.append(variant);
      const qty=document.createElement("input");qty.className="cart-qty";qty.type="number";qty.min="1";qty.max="99";qty.value=item.quantity;qty.setAttribute("aria-label","Quantity for "+item.name);
      qty.addEventListener("change",()=>{ManModeCart.set(key,qty.value);render();});
      const remove=document.createElement("button");remove.className="cart-remove";remove.type="button";remove.textContent="REMOVE";remove.addEventListener("click",()=>{ManModeCart.remove(key);render();});
      row.append(img,info,qty,remove);root.append(row);
    });
    const summary=document.createElement("section");summary.className="cart-summary";
    const line=document.createElement("p");line.className="cart-total";
    const label=document.createElement("span"),amount=document.createElement("span");label.textContent="Subtotal";amount.textContent=ManModeCart.money(total);line.append(label,amount);
    const checkout=document.createElement("a");checkout.className="cart-action";checkout.href="checkout.html";checkout.textContent="PROCEED TO CHECKOUT ↗";
    summary.append(line,checkout);root.append(summary);
  };render();
});