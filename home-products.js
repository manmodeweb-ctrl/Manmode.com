// MAN MODE homepage product feed. Uses the existing Supabase products table.
document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.querySelector("[data-home-products]");
  const status = document.querySelector("[data-products-status]");
  if (!grid) return;
  try {
    if (typeof supabaseClient === "undefined") throw new Error("Store connection is unavailable.");
    const { data, error } = await supabaseClient
      .from("products")
      .select("id,name,price,category,image_url,stock,featured,active,sizes,colors,created_at")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const products = Array.isArray(data) ? data.slice(0, 8) : [];
    if (status) status.textContent = products.length ? "" : "New products will appear here as soon as they are added in the MAN MODE admin panel.";
    if (!products.length) return;
    grid.replaceChildren();
    products.forEach(product => {
      const card = document.createElement("article");
      card.className = "shop-card";
      const mediaLink = document.createElement("a");
      mediaLink.href = "product-detail.html?id=" + encodeURIComponent(product.id);
      mediaLink.className = "product-detail-link";
      const media = document.createElement("div");
      media.className = "shop-card-image";
      const img = document.createElement("img");
      img.loading = "lazy";
      img.src = product.image_url || "https://placehold.co/600x750/222222/eeeeee?text=MAN+MODE";
      img.alt = product.name || "MAN MODE product";
      media.appendChild(img);
      mediaLink.appendChild(media);
      if (product.featured) {
        const tag = document.createElement("span");
        tag.className = "shop-tag";
        tag.textContent = "FEATURED";
        media.appendChild(tag);
      }
      const details = document.createElement("div");
      details.className = "shop-card-details";
      const category = document.createElement("p");
      category.className = "shop-card-category";
      category.textContent = product.category || "MAN MODE";
      const name = document.createElement("h3");
      const nameLink = document.createElement("a");
      nameLink.href = "product-detail.html?id=" + encodeURIComponent(product.id);
      nameLink.className = "product-detail-link";
      nameLink.textContent = product.name || "New arrival";
      name.appendChild(nameLink);
      const price = document.createElement("p");
      price.className = "shop-card-price";
      const amount = Number(product.price);
      price.textContent = Number.isFinite(amount) ? "৳ " + new Intl.NumberFormat("en-BD", {maximumFractionDigits:0}).format(amount) : "";
      const makeChoices = (label, values) => {
        if (!Array.isArray(values) || !values.length) return null;
        const wrap = document.createElement("div"); wrap.className = "variant-group";
        const heading = document.createElement("span"); heading.className = "variant-label"; heading.textContent = label;
        const options = document.createElement("div"); options.className = "variant-options";
        let chosen = "";
        values.forEach(value => {
          const button = document.createElement("button"); button.type = "button"; button.className = "variant-option";
          button.textContent = value; button.setAttribute("aria-pressed", "false");
          button.addEventListener("click", () => { chosen = value; options.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b === button))); });
          options.append(button);
        });
        wrap.append(heading, options); details.append(wrap);
        return () => chosen;
      };
      const getSize = makeChoices("SIZE", product.sizes);
      const getColor = makeChoices("COLOR", product.colors);
      const variantError = document.createElement("p"); variantError.className = "variant-error"; variantError.setAttribute("role", "status");
      const add = document.createElement("button");
      add.type = "button";
      add.className = "home-add-cart";
      add.textContent = Number(product.stock ?? 1) > 0 ? "ADD TO CART +" : "OUT OF STOCK";
      add.disabled = Number(product.stock ?? 1) <= 0;
      add.addEventListener("click", event => {
        event.preventDefault(); event.stopPropagation();
        const size = getSize ? getSize() : "", color = getColor ? getColor() : "";
        if (getSize && !size) { variantError.textContent = "Please select a size."; return; }
        if (getColor && !color) { variantError.textContent = "Please select a color."; return; }
        if (window.ManModeCart) { window.ManModeCart.add(product, {selected_size:size, selected_color:color}); variantError.textContent = ""; add.textContent = "ADDED ✓"; setTimeout(() => { add.textContent = "ADD TO CART +"; }, 1400); }
      });
      const buy = document.createElement("button");
      buy.type = "button"; buy.className = "home-buy-now"; buy.textContent = "BUY NOW";
      buy.disabled = Number(product.stock ?? 1) <= 0;
      buy.addEventListener("click", event => {
        event.preventDefault(); event.stopPropagation();
        const size = getSize ? getSize() : "", color = getColor ? getColor() : "";
        if (getSize && !size) { variantError.textContent = "Please select a size."; return; }
        if (getColor && !color) { variantError.textContent = "Please select a color."; return; }
        sessionStorage.setItem("manmode_buy_now", JSON.stringify({...product, quantity:1, selected_size:size, selected_color:color}));
        window.location.href = "checkout.html";
      });
      const view = document.createElement("a");
      buy.style.cssText = "width:100%;margin-top:8px;padding:12px;background:transparent;color:#c6a36b;border:1px solid #c6a36b;font-weight:800;cursor:pointer";
      view.className = "shop-card-view";
      view.href = "product-detail.html?id=" + encodeURIComponent(product.id);
      view.textContent = "VIEW DETAILS ↗";
      details.append(category, name, price, variantError, add, buy, view);
      card.append(mediaLink, details);
      grid.appendChild(card);
    });
  } catch (error) {
    console.error("MAN MODE homepage products:", error);
    if (status) status.textContent = "Products are temporarily unavailable. Please check back soon.";
  }
});
