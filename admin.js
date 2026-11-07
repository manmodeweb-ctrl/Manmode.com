// MAN MODE Admin Studio — authenticated Supabase store management.
(() => {
  const $ = (id) => document.getElementById(id);
  const state = { user:null, products:[], orders:[], categories:[] };
  const money = value => "৳ " + new Intl.NumberFormat("en-BD",{maximumFractionDigits:0}).format(Number(value)||0);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const say = message => { $("notice").textContent = message || ""; };
  const fail = (box,error) => { box.textContent = error?.message || String(error); };
  const slug = value => String(value||"").trim().toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const fallbackCategories = ["Clothing","T-Shirts","Shirts","Hoodies","Pants","Footwear","Accessories"];
  const date = value => value ? new Date(value).toLocaleDateString("en-BD",{day:"2-digit",month:"short",year:"numeric"}) : "—";

  function showLogin(message="") {
    $("adminApp").hidden = true; $("loginGate").hidden = false; $("loginStatus").textContent = message;
  }
  function showApp() {
    $("loginGate").hidden = true; $("adminApp").hidden = false;
    $("adminIdentity").textContent = state.user?.email || "ADMIN";
  }
  async function isAdmin() {
    const {data:{user},error} = await supabaseClient.auth.getUser();
    if(error || !user) return false;
    const {data,error:adminError} = await supabaseClient.from("admin_users").select("is_admin").eq("user_id",user.id).maybeSingle();
    if(adminError || data?.is_admin !== true) return false;
    state.user=user; return true;
  }
  async function guard() {
    if(!(await isAdmin())) { await supabaseClient.auth.signOut(); showLogin("Admin access is required for this page."); return false; }
    showApp(); await refreshAll(); return true;
  }
  $("loginForm").addEventListener("submit",async e=>{
    e.preventDefault(); const btn=e.submitter; btn.disabled=true; $("loginStatus").textContent="Signing in…";
    try {
      const {error}=await supabaseClient.auth.signInWithPassword({email:$("adminEmail").value.trim(),password:$("adminPassword").value});
      if(error) throw error;
      if(!(await isAdmin())) { await supabaseClient.auth.signOut(); throw new Error("Admin permission denied. This account is not registered as an administrator."); }
      showApp(); $("loginStatus").textContent=""; await refreshAll();
    } catch(error) { $("loginStatus").textContent=error.message; }
    finally { btn.disabled=false; }
  });
  $("logoutBtn").addEventListener("click",async()=>{await supabaseClient.auth.signOut();state.user=null;showLogin("You have signed out.");});
  supabaseClient.auth.onAuthStateChange((_event,session)=>{ if(!session) showLogin(); });

  function go(view) {
    document.querySelectorAll(".side-nav [data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
    document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id==="view-"+view));
    $("pageTitle").textContent=({overview:"Overview",products:"Products",orders:"Orders",categories:"Categories",settings:"Website design"})[view]||"Overview";
    if(view==="products") renderProducts(); if(view==="orders") renderOrders(); if(view==="categories") renderCategories(); if(view==="settings") loadThemeSettings();
  }
  document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.view)));
  document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));

  async function refreshAll() {
    say("Refreshing store data…");
    try {
      const [p,o,c]=await Promise.all([
        supabaseClient.from("products").select("*").order("created_at",{ascending:false}),
        supabaseClient.from("orders").select("*").order("created_at",{ascending:false}),
        supabaseClient.from("categories").select("*").order("name")
      ]);
      if(p.error) throw p.error; if(o.error) throw o.error; if(c.error) throw c.error;
      state.products=p.data||[]; state.orders=o.data||[]; state.categories=c.data||[];
      renderOverview(); renderProducts(); renderOrders(); renderCategories(); fillCategoryOptions();
      say("Store data updated.");
    } catch(error) { say("Could not load store data: "+error.message); }
  }
  $("refreshBtn").addEventListener("click",refreshAll); $("ordersRefresh").addEventListener("click",refreshAll);

  function renderOverview() {
    $("statProducts").textContent=state.products.length;
    $("statActive").textContent=state.products.filter(p=>p.active).length;
    $("statStock").textContent=state.products.filter(p=>Number(p.stock||0)<=5).length;
    $("statOrders").textContent=state.orders.length;
    const recent=state.orders.slice(0,6);
    $("recentOrders").innerHTML=recent.length?'<table><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>TOTAL</th><th>STATUS</th><th>DATE</th></tr></thead><tbody>'+recent.map(o=>'<tr><td>#'+esc(String(o.id).slice(0,8))+'</td><td>'+esc(o.customer_name)+'</td><td>'+money(o.total_amount)+'</td><td><span class="pill">'+esc(o.status||"pending")+'</span></td><td>'+date(o.created_at)+'</td></tr>').join("")+'</tbody></table>':'<p class="empty">No orders have been placed yet.</p>';
  }
  function fillCategoryOptions() {
    const values=[...new Set([...state.categories.filter(c=>c.active!==false).map(c=>c.name),...fallbackCategories])];
    $("productCategory").innerHTML='<option value="">Choose category</option>'+values.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join("");
  }
  function renderProducts() {
    const q=$("productSearch").value.toLowerCase(),filter=$("productFilter").value;
    const rows=state.products.filter(p=>(String(p.name||"").toLowerCase().includes(q)||String(p.category||"").toLowerCase().includes(q))&&(filter==="all"||(filter==="active"&&p.active)||(filter==="inactive"&&!p.active)||(filter==="low"&&Number(p.stock||0)<=5)));
    $("productsTable").innerHTML=rows.length?'<table><thead><tr><th>PRODUCT</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>'+rows.map(p=>'<tr><td><div class="product-cell"><img src="'+esc(p.image_url||"https://placehold.co/80x100/222/ddd?text=MM")+'" alt=""><div><strong>'+esc(p.name)+'</strong><br><span class="muted">'+esc(p.category||"Uncategorised")+'</span></div></div></td><td>'+money(p.price)+'</td><td>'+Number(p.stock||0)+'</td><td><span class="pill '+(p.active?"":"off")+'">'+(p.active?"ACTIVE":"HIDDEN")+'</span></td><td><button class="btn" data-edit="'+esc(p.id)+'">Edit</button> <button class="btn" data-toggle="'+esc(p.id)+'">'+(p.active?"Hide":"Publish")+'</button> <button class="btn danger" data-delete="'+esc(p.id)+'">Delete</button></td></tr>').join("")+'</tbody></table>':'<p class="empty">No products match this filter.</p>';
    $("productsTable").querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>editProduct(b.dataset.edit)));
    $("productsTable").querySelectorAll("[data-toggle]").forEach(b=>b.addEventListener("click",()=>toggleProduct(b.dataset.toggle)));
    $("productsTable").querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>deleteProduct(b.dataset.delete)));
  }
  $("productSearch").addEventListener("input",renderProducts); $("productFilter").addEventListener("change",renderProducts);
  function resetProductForm() {
    $("productForm").reset(); $("productId").value=""; $("productStock").value=0; $("productActive").checked=true;
    $("productEditorTitle").textContent="Add product"; $("saveProductBtn").textContent="Save product"; $("productStatus").textContent="";
  }
  $("newProductBtn").addEventListener("click",()=>{$("productEditor").hidden=false;resetProductForm();$("productEditor").scrollIntoView({behavior:"smooth"});});
  $("cancelProductBtn").addEventListener("click",()=>{$("productEditor").hidden=true;resetProductForm();});
  function editProduct(id) {
    const p=state.products.find(x=>x.id===id); if(!p)return;
    $("productEditor").hidden=false; $("productEditorTitle").textContent="Edit product"; $("saveProductBtn").textContent="Update product";
    $("productId").value=p.id; $("productName").value=p.name||""; fillCategoryOptions(); $("productCategory").value=p.category||"";
    $("productPrice").value=p.price??""; $("oldPrice").value=p.old_price??""; $("productStock").value=p.stock??0;
    $("productDescription").value=p.description||""; $("productFeatured").checked=!!p.featured; $("productActive").checked=p.active!==false;
    $("productStatus").textContent="Choose a new image only if you want to replace the current one.";
    $("productEditor").scrollIntoView({behavior:"smooth"});
  }
  async function uploadImage(file) {
    if(!file) return null;
    if(!file.type.startsWith("image/")) throw new Error("Please select a valid image file.");
    if(file.size>8*1024*1024) throw new Error("Image must be smaller than 8 MB.");
    const path=state.user.id+"/"+Date.now()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const {error}=await supabaseClient.storage.from("product-images").upload(path,file,{upsert:false});
    if(error) throw error;
    return supabaseClient.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }
  $("productForm").addEventListener("submit",async e=>{
    e.preventDefault(); const btn=$("saveProductBtn"); btn.disabled=true; $("productStatus").textContent="Saving product…";
    try {
      if(!(await isAdmin())) throw new Error("Admin session expired. Please sign in again.");
      const id=$("productId").value, old=state.products.find(p=>p.id===id);
      const uploaded=await uploadImage($("productImage").files[0]);
      const record={name:$("productName").value.trim(),category:$("productCategory").value,price:Number($("productPrice").value),old_price:$("oldPrice").value?Number($("oldPrice").value):null,stock:Number($("productStock").value),description:$("productDescription").value.trim(),featured:$("productFeatured").checked,active:$("productActive").checked,image_url:uploaded||old?.image_url||null};
      const result=id?await supabaseClient.from("products").update(record).eq("id",id):await supabaseClient.from("products").insert(record);
      if(result.error) throw result.error;
      $("productStatus").textContent=id?"Product updated successfully.":"Product added successfully.";
      resetProductForm(); $("productEditor").hidden=true; await refreshAll();
    } catch(error) { fail($("productStatus"),error); }
    finally {btn.disabled=false;}
  });
  async function toggleProduct(id) {
    const p=state.products.find(x=>x.id===id); if(!p)return;
    const {error}=await supabaseClient.from("products").update({active:!p.active}).eq("id",id);
    if(error) say(error.message); else {say("Product visibility updated.");await refreshAll();}
  }
  async function deleteProduct(id) {
    const p=state.products.find(x=>x.id===id); if(!p||!confirm('Delete "'+p.name+'" permanently?'))return;
    const {error}=await supabaseClient.from("products").delete().eq("id",id);
    if(error) say("Could not delete product: "+error.message); else {say("Product deleted.");await refreshAll();}
  }

  function renderOrders() {
    const q=$("orderSearch").value.toLowerCase(),filter=$("orderFilter").value;
    const rows=state.orders.filter(o=>(filter==="all"||String(o.status||"pending")===filter)&&[o.customer_name,o.phone,o.id].some(v=>String(v||"").toLowerCase().includes(q)));
    $("ordersTable").innerHTML=rows.length?'<table><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>PHONE</th><th>TOTAL</th><th>DATE</th><th>STATUS</th></tr></thead><tbody>'+rows.map(o=>'<tr><td><strong>#'+esc(String(o.id).slice(0,8))+'</strong><br><span class="muted">'+esc(o.district||"")+'</span></td><td>'+esc(o.customer_name)+'<br><span class="muted">'+esc(o.address||"")+'</span></td><td>'+esc(o.phone)+'</td><td>'+money(o.total_amount)+'</td><td>'+date(o.created_at)+'</td><td><select data-order-status="'+esc(o.id)+'">'+["pending","confirmed","processing","shipped","delivered","cancelled"].map(s=>'<option value="'+s+'" '+(String(o.status||"pending")===s?"selected":"")+'>'+s.toUpperCase()+'</option>').join("")+'</select></td></tr>').join("")+'</tbody></table>':'<p class="empty">No orders found. New customer orders will appear here.</p>';
    $("ordersTable").querySelectorAll("[data-order-status]").forEach(sel=>sel.addEventListener("change",async()=>{
      const {error}=await supabaseClient.from("orders").update({status:sel.value}).eq("id",sel.dataset.orderStatus);
      if(error){say("Order update failed: "+error.message);await refreshAll();}else{say("Order status updated.");await refreshAll();}
    }));
  }
  $("orderSearch").addEventListener("input",renderOrders); $("orderFilter").addEventListener("change",renderOrders);

  function renderCategories() {
    $("categoriesTable").innerHTML=state.categories.length?'<table><thead><tr><th>CATEGORY</th><th>SLUG</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>'+state.categories.map(c=>'<tr><td><strong>'+esc(c.name)+'</strong></td><td>'+esc(c.slug)+'</td><td><span class="pill '+(c.active?"":"off")+'">'+(c.active?"ACTIVE":"HIDDEN")+'</span></td><td><button class="btn" data-cat-toggle="'+esc(c.id)+'">'+(c.active?"Hide":"Activate")+'</button></td></tr>').join("")+'</tbody></table>':'<p class="empty">No custom categories yet. You can add one above; the built-in shop categories remain available.</p>';
    $("categoriesTable").querySelectorAll("[data-cat-toggle]").forEach(b=>b.addEventListener("click",async()=>{
      const c=state.categories.find(x=>x.id===b.dataset.catToggle);if(!c)return;
      const {error}=await supabaseClient.from("categories").update({active:!c.active}).eq("id",c.id);
      if(error)say(error.message);else await refreshAll();
    }));
  }
  $("categoryForm").addEventListener("submit",async e=>{
    e.preventDefault(); const name=$("categoryName").value.trim(),key=slug(name);
    if(!key){say("Enter a valid category name.");return;}
    const {error}=await supabaseClient.from("categories").insert({name,slug:key,active:true});
    if(error)say("Could not add category: "+error.message);else{$("categoryName").value="";say("Category added.");await refreshAll();}
  });

  const defaultTheme = {
    logoText:"MAN MODE", logoUrl:"", bannerUrl:"",
    announcement:"A NEW POINT OF VIEW ON EVERYDAY STYLE",
    eyebrow:"THE MAN MODE EDIT · 2026", heroTitle:"OWN YOUR", heroHighlight:"IDENTITY.",
    heroCopy:"A considered collection for the way you move through the world. Simple choices. Strong presence.",
    buttonText:"DISCOVER THE COLLECTION",
    preset:"midnight", colors:{bg:"#101010",surface:"#191919",text:"#f5f2eb",muted:"#aaa49a",accent:"#c6a36b"},
    sections:{announcement:true,hero:true,categories:true,products:true,about:true,contact:true,footer:true},contact:{whatsapp:"",email:"",phone:"",address:"",instagram:"",facebook:""}
  };
  let themeDraft = JSON.parse(JSON.stringify(defaultTheme));
  const themeVal = id => $(id).value.trim();
  async function loadThemeSettings(){
    $("themeStatus").textContent="Loading saved website settings…";
    try{
      const {data,error}=await supabaseClient.from("site_settings").select("value").eq("key","active_theme").maybeSingle();
      if(error) throw error;
      themeDraft={...defaultTheme,...(data?.value||{}),logoUrl:(data?.value?.logoUrl||data?.value?.logo||""),bannerUrl:(data?.value?.bannerUrl||""),colors:{...defaultTheme.colors,...(data?.value?.colors||{})},sections:{...defaultTheme.sections,...(data?.value?.sections||{})},contact:{...defaultTheme.contact,...(data?.value?.contact||{})}};
      const set=(id,v)=>{if($(id)) $(id).value=v??"";};
      set("themeLogoText",themeDraft.logoText);set("themeAnnouncement",themeDraft.announcement);set("themeEyebrow",themeDraft.eyebrow);
      set("themeHeroTitle",themeDraft.heroTitle);set("themeHeroHighlight",themeDraft.heroHighlight);set("themeHeroCopy",themeDraft.heroCopy);set("themeButtonText",themeDraft.buttonText);set("contactWhatsApp",themeDraft.contact.whatsapp);set("contactEmail",themeDraft.contact.email);set("contactPhone",themeDraft.contact.phone);set("contactAddress",themeDraft.contact.address);set("contactInstagram",themeDraft.contact.instagram);set("contactFacebook",themeDraft.contact.facebook);
      set("themeAccent",themeDraft.colors.accent);set("themeBg",themeDraft.colors.bg);set("themeSurface",themeDraft.colors.surface);set("themeText",themeDraft.colors.text);set("themeMuted",themeDraft.colors.muted);set("themePreset",themeDraft.preset);
      ["Announcement","Hero","Categories","Products","About","Contact","Footer"].forEach(n=>{const key=n.toLowerCase();$("toggle"+n).checked=themeDraft.sections[key]!==false;});
      $("themeStatus").textContent="Saved settings loaded. Edit and publish when ready.";
    }catch(e){$("themeStatus").textContent="Could not load settings: "+e.message;}
  }
  async function uploadThemeAsset(file,label){
    if(!file)return null;
    if(!file.type.startsWith("image/"))throw new Error(label+" must be an image file.");
    if(file.size>6*1024*1024)throw new Error(label+" must be smaller than 6 MB.");
    const ext=(file.name.split(".").pop()||"jpg").replace(/[^a-z0-9]/gi,"").toLowerCase();
    const path=state.user.id+"/site-"+label.toLowerCase()+"-"+Date.now()+"."+ext;
    const {error}=await supabaseClient.storage.from("product-images").upload(path,file,{upsert:false});
    if(error)throw error;
    return supabaseClient.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }
  $("siteSettingsForm").addEventListener("submit",async e=>{
    e.preventDefault();const btn=$("saveThemeBtn");btn.disabled=true;$("themeStatus").textContent="Uploading assets and publishing settings…";
    try{
      if(!(await isAdmin()))throw new Error("Admin session expired. Sign in again.");
      const logo=await uploadThemeAsset($("themeLogoFile").files[0],"logo");
      const banner=await uploadThemeAsset($("themeBannerFile").files[0],"banner");
      themeDraft={...themeDraft,logoText:themeVal("themeLogoText")||"MAN MODE",logoUrl:logo||themeDraft.logoUrl||"",bannerUrl:banner||themeDraft.bannerUrl||"",
        announcement:themeVal("themeAnnouncement"),eyebrow:themeVal("themeEyebrow"),heroTitle:themeVal("themeHeroTitle"),heroHighlight:themeVal("themeHeroHighlight"),
        heroCopy:themeVal("themeHeroCopy"),buttonText:themeVal("themeButtonText"),preset:themeVal("themePreset"),
        colors:{accent:themeVal("themeAccent"),bg:themeVal("themeBg"),surface:themeVal("themeSurface"),text:themeVal("themeText"),muted:themeVal("themeMuted")},
        sections:{announcement:$("toggleAnnouncement").checked,hero:$("toggleHero").checked,categories:$("toggleCategories").checked,products:$("toggleProducts").checked,about:$("toggleAbout").checked,contact:$("toggleContact").checked,footer:$("toggleFooter").checked}};
      const {error}=await supabaseClient.from("site_settings").upsert({key:"active_theme",value:themeDraft,updated_at:new Date().toISOString()},{onConflict:"key"});
      if(error)throw error;
      $("themeLogoFile").value="";$("themeBannerFile").value="";
      $("themeStatus").textContent="Published successfully. Open the live website and refresh to see your changes.";
      say("Website design settings published.");
    }catch(err){$("themeStatus").textContent="Save failed: "+err.message;}
    finally{btn.disabled=false;}
  });
  $("reloadSettingsBtn").addEventListener("click",loadThemeSettings);
  $("resetThemeBtn").addEventListener("click",()=>{themeDraft=JSON.parse(JSON.stringify(defaultTheme));$("themeLogoFile").value="";$("themeBannerFile").value="";loadThemeSettingsFromDefault();});
  function loadThemeSettingsFromDefault(){
    const d=defaultTheme;const set=(id,v)=>$(id).value=v;
    set("themeLogoText",d.logoText);set("themeAnnouncement",d.announcement);set("themeEyebrow",d.eyebrow);set("themeHeroTitle",d.heroTitle);set("themeHeroHighlight",d.heroHighlight);set("themeHeroCopy",d.heroCopy);set("themeButtonText",d.buttonText);set("contactWhatsApp",d.contact.whatsapp);set("contactEmail",d.contact.email);set("contactPhone",d.contact.phone);set("contactAddress",d.contact.address);set("contactInstagram",d.contact.instagram);set("contactFacebook",d.contact.facebook);
    set("themeAccent",d.colors.accent);set("themeBg",d.colors.bg);set("themeSurface",d.colors.surface);set("themeText",d.colors.text);set("themeMuted",d.colors.muted);set("themePreset",d.preset);
    Object.keys(d.sections).forEach(k=>$("toggle"+k[0].toUpperCase()+k.slice(1)).checked=d.sections[k]);
    $("themeStatus").textContent="Defaults loaded in the editor. Press SAVE & PUBLISH to apply them.";
  }

  // Always require an explicit admin sign-in when this page is opened.
  // A previously persisted Supabase session must not bypass the login screen.
  showLogin();
})();