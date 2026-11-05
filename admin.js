
const form = document.getElementById("productForm");
const statusBox = document.getElementById("status");

// Create admin login form
const loginBox = document.createElement("div");
loginBox.className = "admin-panel";
loginBox.innerHTML = `
  <h2>ADMIN LOGIN</h2>
  <form id="loginForm">
    <input type="email" id="adminEmail"
      placeholder="Admin Email" required>
    <input type="password" id="adminPassword"
      placeholder="Admin Password" required>
    <button type="submit">LOGIN</button>
    <p id="loginStatus"></p>
  </form>
`;

form.parentElement.insertBefore(loginBox, form);
form.style.display = "none";

// Check admin permission
async function checkAdmin() {
  const { data: { user } } =
    await supabaseClient.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabaseClient
    .from("admin_users")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  return !error && data && data.is_admin === true;
}

// Admin login
document.getElementById("loginForm")
.addEventListener("submit", async function(e) {
  e.preventDefault();

  const email = document.getElementById("adminEmail").value;
  const password = document.getElementById("adminPassword").value;
  const loginStatus = document.getElementById("loginStatus");

  loginStatus.textContent = "Checking login...";

  const { error } = await supabaseClient.auth
    .signInWithPassword({ email, password });

  if (error) {
    loginStatus.textContent = error.message;
    return;
  }

  if (!(await checkAdmin())) {
    await supabaseClient.auth.signOut();
    loginStatus.textContent = "Admin permission denied.";
    return;
  }

  loginBox.style.display = "none";
  form.style.display = "block";
});

// Check existing session
(async function() {
  if (await checkAdmin()) {
    loginBox.style.display = "none";
    form.style.display = "block";
  }
})();

// Upload image and save product
form.addEventListener("submit", async function(e) {
  e.preventDefault();

  statusBox.textContent = "Uploading product...";

  try {
    if (!(await checkAdmin())) {
      throw new Error("Please login with your admin account.");
    }

    const file = document.getElementById("productImages").files[0];

    if (!file) {
      throw new Error("Please select a product image.");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Please select an image file.");
    }

    const user = (await supabaseClient.auth.getUser()).data.user;

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = user.id + "/" + Date.now() + "-" + safeName;

    const { error: uploadError } = await supabaseClient.storage
      .from("product-images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: imageData } = supabaseClient.storage
      .from("product-images")
      .getPublicUrl(filePath);

    const product = {
      name: document.getElementById("productName").value.trim(),
      price: Number(document.getElementById("productPrice").value),
      old_price: document.getElementById("oldPrice").value
        ? Number(document.getElementById("oldPrice").value)
        : null,
      category: document.getElementById("productCategory").value,
      description: document.getElementById("productDescription").value,
      stock: Number(document.getElementById("productStock").value),
      image_url: imageData.publicUrl,
      featured: document.getElementById("productFeatured").checked,
      active: document.getElementById("productActive").checked
    };

    const { error: insertError } = await supabaseClient
      .from("products")
      .insert([product]);

    if (insertError) throw insertError;

    statusBox.textContent = "Product added successfully!";
    form.reset();

  } catch (error) {
    statusBox.textContent = "Error: " + error.message;
  }
});
