// MAN MODE cart: product variants remain separate cart lines.
(() => {
  const KEY="manmode_cart_v1";
  const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(v)?v:[]}catch{return []}};
  const write=items=>localStorage.setItem(KEY,JSON.stringify(items));
  const money=n=>"৳ "+new Intl.NumberFormat("en-BD",{maximumFractionDigits:0}).format(Number(n)||0);
  const keyFor=(id,size,color)=>[String(id),String(size||""),String(color||"")].join("::");
  window.ManModeCart={
    items:read,
    add(product,options={}){
      const items=read(),id=String(product.id),size=String(options.selected_size||""),color=String(options.selected_color||""),key=keyFor(id,size,color);
      const old=items.find(x=>(x.cart_key||keyFor(x.id,x.selected_size,x.selected_color))===key);
      if(old)old.quantity=Math.min(99,Number(old.quantity||0)+1);
      else items.push({id,name:String(product.name||"Product"),price:Number(product.price)||0,image_url:product.image_url||"",quantity:1,selected_size:size,selected_color:color,cart_key:key});
      write(items);return items;
    },
    set(key,quantity){const items=read().map(x=>(x.cart_key||keyFor(x.id,x.selected_size,x.selected_color))===key?{...x,quantity:Math.max(1,Math.min(99,Number(quantity)||1))}:x);write(items);return items;},
    remove(key){const items=read().filter(x=>(x.cart_key||keyFor(x.id,x.selected_size,x.selected_color))!==key);write(items);return items;},
    clear(){write([]);},money
  };
})();