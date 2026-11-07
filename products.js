// MAN MODE catalogue: category-aware product listing from the existing Supabase products table.
document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.querySelector("[data-catalog-grid]");
  const status = document.querySelector("[data-catalog-status]");
  const title = document.querySelector("#catalog-title");
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  const selected = (params.get("category") || "all").trim().toLowerCase();
  const labels = {
    all: "ALL PRODUCTS", clothing: "CLOTHING", "t-shirts": "T-SHIRTS",
    shirts: "SHIRTS", hoodies: "HOODIES", pants: "PANTS",
    footwear: "SHOES", accessories: "ACCESSORIES"
  };
  if (title) title.textContent = (labels[selected] || selected.replace(/[-_]/g, " ").toUpperCase()) + ".";
  document.querySelectorAll("[data-category]").forEach(link => {
    const active = link.dataset.category === selected;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  const normalize = value => String(value || "").toLowerCase().trim().replace(/[_\s]+/g, "-");
  const categoryMatches = (productCategory) => {
    const category = normalize(productCategory);
    if (selected === "all") return true;
    if (selected === "clothing") return ["clothing","t-shirts","t-shirt","tshirt","shirts","shirt","hoodies","hoodie","pants","trousers","jeans"].includes(category);
    if (selected === "t-shirts") return ["t-shirts","t-shirt","tshirt","t-shirts-men","tee","tees"].includes(category);
    if (selected === "shirts") return ["shirts","shirt","formal-shirts","casual-shirts"].includes(category);
    if (selected === "hoodies") return ["hoodies","hoodie","sweatshirts","sweatshirt"].includes(category);
    if (selected === "pants") return ["pants","trousers","jeans","joggers"].includes(category);
    if (selected === "footwear") return ["footwear","shoes","shoe","sneakers","sneaker","sandals"].includes(category);
    if (selected === "accessories") return ["accessories","accessory","watch","watches","bags","bag","belts","belt","caps","cap"].includes(category);
    return category === selected;
  };

  try {
    if (typeof supabaseClient === "undefined") throw new Error("Store connection is unavailable.");
    const { data, error } = await supabaseClient.from("products")
      .select("id,name,price,category,image_url,featured,active,created_at")
      .eq("active", true).order("created_at", { ascending: false });
    if (error) throw error;

    const products = (Array.isArray(data) ? data : []).filter(p => categoryMatches(p.category));
    grid.replaceChildren();
    if (!products.length) {
      status.textContent = "এই ক্যাটাগরিতে এখনো কোনো পণ্য যোগ করা হয়নি। অন্য ক্যাটাগরি দেখুন।";
      return;
    }
    status.textContent = products.length + " product" + (products.length === 1 ? "" : "s") + " found";
    products.forEach(product => {
      const card = document.createElement("article");
      card.className = "catalog-card";
      const media = document.createElement("div");
      media.className = "catalog-card-image";
      const img = document.createElement("img");
      img.loading = "lazy";
      img.src = product.image_url || "https://placehold.co/600x750/222222/eeeeee?text=MAN+MODE";
      img.alt = product.name || "MAN MODE product";
      media.appendChild(img);
      const info = document.createElement("div");
      info.className = "catalog-card-info";
      const category = document.createElement("p");
      category.className = "catalog-card-category";
      category.textContent = product.category || "MAN MODE";
      const name = document.createElement("h2");
      name.textContent = product.name || "New arrival";
      const price = document.createElement("p");
      price.className = "catalog-card-price";
      const amount = Number(product.price);
      price.textContent = Number.isFinite(amount) ? "৳ " + new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(amount) : "";
      info.append(category, name, price);
      card.append(media, info);
      grid.appendChild(card);
    });
  } catch (error) {
    console.error("MAN MODE catalogue:", error);
    status.textContent = "পণ্য লোড করা যাচ্ছে না। Store connection পরীক্ষা করুন।";
  }
});
