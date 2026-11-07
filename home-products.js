// MAN MODE homepage product feed. Uses the existing Supabase products table.
document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.querySelector("[data-home-products]");
  const status = document.querySelector("[data-products-status]");
  if (!grid) return;
  try {
    if (typeof supabaseClient === "undefined") throw new Error("Store connection is unavailable.");
    const { data, error } = await supabaseClient
      .from("products")
      .select("id,name,price,category,image_url,featured,active,created_at")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const products = Array.isArray(data) ? data.slice(0, 8) : [];
    if (status) status.textContent = products.length ? "" : "New products will appear here as soon as they are added in the MAN MODE admin panel.";
    if (!products.length) return;
    grid.replaceChildren();
    products.forEach(product => {
      const card = document.createElement("a");
      card.className = "shop-card";
      card.href = "products.html?category=" + encodeURIComponent(String(product.category || "all").toLowerCase());
      const media = document.createElement("div");
      media.className = "shop-card-image";
      const img = document.createElement("img");
      img.loading = "lazy";
      img.src = product.image_url || "https://placehold.co/600x750/222222/eeeeee?text=MAN+MODE";
      img.alt = product.name || "MAN MODE product";
      media.appendChild(img);
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
      name.textContent = product.name || "New arrival";
      const price = document.createElement("p");
      price.className = "shop-card-price";
      const amount = Number(product.price);
      price.textContent = Number.isFinite(amount) ? "৳ " + new Intl.NumberFormat("en-BD", {maximumFractionDigits:0}).format(amount) : "";
      details.append(category, name, price);
      card.append(media, details);
      grid.appendChild(card);
    });
  } catch (error) {
    console.error("MAN MODE homepage products:", error);
    if (status) status.textContent = "Products are temporarily unavailable. Please check back soon.";
  }
});
