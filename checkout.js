document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("checkoutForm");
  const msg = document.getElementById("checkoutMessage");
  const btn = document.getElementById("placeOrder");
  const itemsBox = document.getElementById("checkoutItems");
  const totalBox = document.getElementById("checkoutTotal");
  const items = ManModeCart.items();
  const money = ManModeCart.money;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let settings = { delivery_fee: 0, free_shipping_minimum: 0 };

  if (!items.length) {
    form.hidden = true;
    msg.textContent = "Your cart is empty. Please add products before checkout.";
    msg.classList.add("error");
    btn.disabled = true;
    return;
  }

  try {
    if (typeof supabaseClient === "undefined") throw new Error("Store connection unavailable.");
    const { data, error } = await supabaseClient.from("site_settings").select("value").eq("key", "checkout_settings").maybeSingle();
    if (error) throw error;
    if (data?.value) settings = { ...settings, ...data.value };
  } catch (error) {
    msg.textContent = "Delivery settings could not be loaded. Please refresh and try again.";
    msg.classList.add("error");
    btn.disabled = true;
    return;
  }

  const shipping = Number(settings.free_shipping_minimum) > 0 && subtotal >= Number(settings.free_shipping_minimum)
    ? 0 : Math.max(0, Number(settings.delivery_fee) || 0);
  const total = subtotal + shipping;

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
  deliveryValue.textContent = shipping === 0 ? "FREE" : money(shipping);
  deliveryLine.append(deliveryLabel, deliveryValue);
  itemsBox.append(deliveryLine);
  totalBox.textContent = money(total);

  const note = document.createElement("p");
  note.className = "message";
  note.textContent = "Cash on Delivery · কোনো bKash অগ্রিম লাগবে না। পণ্য হাতে পেয়ে টাকা দেবেন।";
  form.insertBefore(note, btn);

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
      const { data, error } = await supabaseClient.rpc("place_order", {
        p_customer_name: form.customerName.value.trim(),
        p_phone: form.phone.value.trim(),
        p_address: form.address.value.trim(),
        p_district: form.district.value.trim(),
        p_items: items.map(item => ({ product_id: item.id, quantity: item.quantity }))
      });
      if (error) throw error;
      const orderId = String(data);
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