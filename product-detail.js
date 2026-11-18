// MAN MODE individual product detail page.
document.addEventListener("DOMContentLoaded",async()=>{
 const root=document.getElementById("detailRoot"); if(!root)return;
 const id=new URLSearchParams(location.search).get("id");
 if(!id){root.className="detail-not-found";root.textContent="Product not found.";return;}
 const choices=(values,label)=>{
  if(!Array.isArray(values)||!values.length)return null;
  const section=document.createElement("section");section.className="detail-variant";
  const h=document.createElement("h3");h.textContent=label;const options=document.createElement("div");options.className="detail-options";let selected="";
  values.forEach(value=>{const b=document.createElement("button");b.type="button";b.className="detail-option";b.textContent=value;b.setAttribute("aria-pressed","false");b.addEventListener("click",()=>{selected=value;options.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));});options.append(b);});
  section.append(h,options);return {section,get:()=>selected};
 };
 try{
  if(typeof supabaseClient==="undefined")throw new Error("Store connection unavailable.");
  const {data:p,error}=await supabaseClient.from("products").select("id,name,price,category,image_url,stock,description,sizes,colors,active").eq("id",id).eq("active",true).single();
  if(error||!p)throw error||new Error("Product not found.");
  root.className="detail-layout";
  const photo=document.createElement("div");photo.className="detail-photo";const img=document.createElement("img");img.src=p.image_url||"https://placehold.co/900x1100/222/eee?text=MAN+MODE";img.alt=p.name||"MAN MODE product";photo.append(img);
  const info=document.createElement("section");info.className="detail-info";
  const cat=document.createElement("p");cat.className="detail-category";cat.textContent=p.category||"MAN MODE";
  const name=document.createElement("h1");name.textContent=p.name||"Product";
  const price=document.createElement("p");price.className="detail-price";price.textContent=ManModeCart.money(p.price);
  const desc=document.createElement("p");desc.className="detail-description";desc.textContent=p.description||"A considered pick from the MAN MODE collection.";
  info.append(cat,name,price);
  const size=choices(p.sizes,"SELECT SIZE"),color=choices(p.colors,"SELECT COLOR");
  if(size)info.append(size.section);if(color)info.append(color.section);
  const add=document.createElement("button");add.className="detail-add";add.textContent=Number(p.stock)>0?"ADD TO CART":"OUT OF STOCK";add.disabled=Number(p.stock)<=0;
  const message=document.createElement("p");message.className="detail-message";message.setAttribute("role","status");
  add.addEventListener("click",()=>{const s=size?size.get():"",c=color?color.get():"";if(size&&!s){message.textContent="Please select a size.";return;}if(color&&!c){message.textContent="Please select a color.";return;}ManModeCart.add(p,{selected_size:s,selected_color:c});message.textContent="Added to cart successfully.";add.textContent="ADDED ✓";});
  info.append(desc,add,message);root.append(photo,info);
  document.title=(p.name||"Product")+" | MAN MODE";
 }catch(e){console.error(e);root.className="detail-not-found";root.textContent="This product could not be loaded. Please return to the shop and try again.";}
});