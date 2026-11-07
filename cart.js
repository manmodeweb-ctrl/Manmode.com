// MAN MODE cart: browser-persisted basket shared by catalogue, cart and checkout.
(() => {
  const KEY="manmode_cart_v1";
  const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(v)?v:[]}catch{return []}};
  const write=items=>localStorage.setItem(KEY,JSON.stringify(items));
  const money=n=>"৳ "+new Intl.NumberFormat("en-BD",{maximumFractionDigits:0}).format(Number(n)||0);
  window.ManModeCart={
    items:read,
    add(product){const items=read(),id=String(product.id);const old=items.find(x=>x.id===id);if(old)old.quantity=Math.min(99,old.quantity+1);else items.push({id,name:String(product.name||"Product"),price:Number(product.price)||0,image_url:product.image_url||"",quantity:1});write(items);return items;},
    set(id,quantity){const items=read().map(x=>x.id===id?{...x,quantity:Math.max(1,Math.min(99,Number(quantity)||1))}:x);write(items);return items;},
    remove(id){const items=read().filter(x=>x.id!==id);write(items);return items;},
    clear(){write([]);},
    money
  };
})();
