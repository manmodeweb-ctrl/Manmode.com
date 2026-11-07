document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("checkoutForm");
  const msg = document.getElementById("checkoutMessage");
  const btn = document.getElementById("placeOrder");
  const itemsBox = document.getElementById("checkoutItems");
  const totalBox = document.getElementById("checkoutTotal");
  const areaInput = form.elements.district;
  const items = ManModeCart.items();
  const money = ManModeCart.money;
  let subtotal = 0;
  let settings = { delivery_fee: 0, free_shipping_minimum: 0, free_delivery_areas: "" };
  let shipping = 0;

  if (!items.length) {
    form.hidden = true;
    msg.textContent = "Your cart is empty. Please add products before checkout.";
    msg.classList.add("error");
    btn.disabled = true;
    return;
  }

  try {
    if (typeof supabaseClient === "undefined") throw new Error("Store connection unavailable.");
    const { data: liveProducts, error: productsError } = await supabaseClient
      .from("products")
      .select("id,name,price,stock,active")
      .in("id", items.map(item => item.id));
    if (productsError) throw productsError;
    const productMap = new Map((liveProducts || []).map(product => [String(product.id), product]));
    if (productMap.size !== items.length) throw new Error("আপনার কার্টের একটি পণ্য আর পাওয়া যাচ্ছে না। Cart থেকে সেটি সরিয়ে আবার চেষ্টা করুন।");
    for (const item of items) {
      const product = productMap.get(String(item.id));
      if (!product || product.active !== true) throw new Error("কার্টের একটি পণ্য বর্তমানে বিক্রির জন্য নেই।");
      if (Number(product.stock || 0) < Number(item.quantity || 0)) throw new Error("“" + product.name + "” পণ্যের পর্যাপ্ত স্টক নেই। Cart-এ পরিমাণ কমিয়ে আবার চেষ্টা করুন।");
      item.name = product.name;
      item.price = Number(product.price);
    }
    subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const { data, error } = await supabaseClient.from("site_settings").select("value").eq("key", "checkout_settings").maybeSingle();
    if (error) throw error;
    if (data?.value) settings = { ...settings, ...data.value };
  } catch (error) {
    msg.textContent = "Delivery settings could not be loaded. Please refresh and try again.";
    msg.classList.add("error");
    btn.disabled = true;
    return;
  }

  const freeAreas = String(settings.free_delivery_areas || "")
    .split(/[，,\n]/).map(area => area.trim().toLocaleLowerCase()).filter(Boolean);
  const isFreeArea = () => freeAreas.includes(String(areaInput.value || "").trim().toLocaleLowerCase());
  const calculateShipping = () => {
    if (isFreeArea()) return 0;
    const minimum = Math.max(0, Number(settings.free_shipping_minimum) || 0);
    if (minimum > 0 && subtotal >= minimum) return 0;
    return Math.max(0, Number(settings.delivery_fee) || 0);
  };

  items.forEach(item => {
    const p = document.createElement("p");
    const name = document.createElement("span");
    const price = document.createElement("strong");
    name.textContent = item.name + " × " + item.quantity;
    price.textContent = money(item.price * item.quantity);
    p.append(name, price);
    itemsBox.append(p);
  });

  const deliveryLine = document.createElement("p");
  const deliveryLabel = document.createElement("span");
  const deliveryValue = document.createElement("strong");
  deliveryLabel.textContent = "Delivery";
  deliveryLine.append(deliveryLabel, deliveryValue);
  itemsBox.append(deliveryLine);

  const note = document.createElement("p");
  note.className = "message";
  note.textContent = "Cash on Delivery · কোনো অগ্রিম bKash লাগবে না। পণ্য হাতে পেয়ে টাকা দেবেন।";
  form.insertBefore(note, btn);

  const deliveryNote = String(settings.delivery_note || "").trim();
  if (deliveryNote) {
    const extra = document.createElement("p");
    extra.className = "message";
    extra.textContent = deliveryNote;
    form.insertBefore(extra, btn);
  }

  const updateSummary = () => {
    shipping = calculateShipping();
    deliveryValue.textContent = shipping === 0 ? "FREE" : money(shipping);
    totalBox.textContent = money(subtotal + shipping);
  };
  areaInput.addEventListener("input", updateSummary);
  updateSummary();

  btn.disabled = settings.cod_enabled === false;
  btn.textContent = "ORDER";
  if (btn.disabled) {
    msg.textContent = "দোকান থেকে Cash on Delivery বন্ধ রাখা হয়েছে। অর্ডার নিতে হলে Admin Dashboard থেকে COD চালু করতে হবে।";
    msg.classList.add("error");
  } else {
    msg.textContent = "";
    msg.classList.remove("error");
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (btn.disabled) return;
    if (!form.reportValidity()) return;
    btn.disabled = true;
    btn.textContent = "PLACING YOUR ORDER…";
    msg.classList.remove("error");
    msg.textContent = "";
    try {
      shipping = calculateShipping();
      const { data, error } = await supabaseClient.rpc("place_order", {
        p_customer_name: form.customerName.value.trim(),
        p_phone: form.phone.value.trim(),
        p_address: form.address.value.trim(),
        p_district: areaInput.value.trim(),
        p_items: items.map(item => ({ product_id: item.id, quantity: item.quantity }))
      });
      if (error) throw error;
      const orderId = String(data);
      const total = subtotal + shipping;
      sessionStorage.setItem("manmode_last_order", JSON.stringify({
        orderId, paymentMethod: "cash_on_delivery", subtotal, shipping, total,
        advance: 0, dueOnDelivery: total
      }));
      ManModeCart.clear();
      window.location.assign("order-success.html");
    } catch (error) {
      msg.classList.add("error");
      msg.textContent = error.message || "অর্ডার নেওয়া যায়নি। আবার চেষ্টা করুন।";
      btn.disabled = false;
      btn.textContent = "ORDER";
    }
  });
});