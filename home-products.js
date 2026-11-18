// MAN MODE homepage product feed. Uses the existing Supabase products table.
document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.querySelector("[data-home-products]");
  const status = document.querySelector("[data-products-status]");
  if (!grid) return;
  try {
    if (typeof supabaseClient === "undefined") throw new Error("Store connection is unavailable.");
    const { data, error } = await supabaseClient
      .from("products")
      .select("id,name,price,category,image_url,stock,featured,active,created_at")
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
      const add = document.createElement("button");
      add.type = "button";
      add.className = "home-add-cart";
      add.textContent = Number(product.stock ?? 1) > 0 ? "ADD TO CART +" : "OUT OF STOCK";
      add.disabled = Number(product.stock ?? 1) <= 0;
      add.addEventListener("click", event => {
        event.preventDefault(); event.stopPropagation();
        if (window.ManModeCart) { window.ManModeCart.add(product); add.textContent = "ADDED ✓"; setTimeout(() => { add.textContent = "ADD TO CART +"; }, 1400); }
      });
      const view = document.createElement("a");
      view.className = "shop-card-view";
      view.href = "product-detail.html?id=" + encodeURIComponent(product.id);
      view.textContent = "VIEW DETAILS ↗";
      details.append(category, name, price, add, view);
      card.append(mediaLink, details);
      grid.appendChild(card);
    });
  } catch (error) {
    console.error("MAN MODE homepage products:", error);
    if (status) status.textContent = "Products are temporarily unavailable. Please check back soon.";
  }
});
