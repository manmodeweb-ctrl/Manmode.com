async function loadProducts() {
  const grid = document.querySelector(".products-grid");

  if (!grid) return;

  grid.innerHTML = "<p>Loading products...</p>";

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    grid.textContent = "Products load failed: " + error.message;
    return;
  }

  if (!data || data.length === 0) {
    grid.textContent = "No products available yet.";
    return;
  }

  grid.innerHTML = "";

  data.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";

    const image = document.createElement("img");
    image.src = product.image_url || "";
    image.alt = product.name;
    image.className = "product-image";

    const name = document.createElement("h3");
    name.textContent = product.name;

    const price = document.createElement("p");
    price.textContent = "৳" + product.price;

    card.append(image, name, price);
    grid.appendChild(card);
  });
}

loadProducts();
