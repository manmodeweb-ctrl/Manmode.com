document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("checkoutForm");
  const msg = document.getElementById("checkoutMessage");
  const btn = document.getElementById("placeOrder");
  const itemsBox = document.getElementById("checkoutItems");
  const totalBox = document.getElementById("checkoutTotal");
  const items = ManModeCart.items();
  const money = ManModeCart.money;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let settings = {
    delivery_fee: 0, free_shipping_minimum: 0, free_delivery_areas: "",
    delivery_advance_amount: 100, cod_enabled: true, bkash_enabled: false,
    bkash_number: "", bkash_instruction: "Send Money to this number using your Order ID as reference."
  };
  let isFreeArea = false;
  let shipping = 0;
  let advance = 0;

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

  const areaLabel = document.createElement("label");
  areaLabel.htmlFor = "deliveryArea";
  areaLabel.textContent = "Area / locality";
  const areaInput = document.createElement("input");
  areaInput.id = "deliveryArea";
  areaInput.name = "deliveryArea";
  areaInput.placeholder = "Enter your area or neighbourhood";
  areaInput.minLength = 2;
  areaInput.required = true;
  const areaHelp = document.createElement("small");
  areaHelp.style.cssText = "display:block;color:#aaa;margin:-4px 0 12px";
  areaHelp.textContent = "এখানে জেলা নয়—আপনার থানা/এলাকা/মহল্লার নাম লিখুন। ফ্রি ডেলিভারির জন্য দোকানের তালিকার সঙ্গে নাম মিলতে হবে।";
  const paymentInfo = document.createElement("div");
  paymentInfo.id = "deliveryPaymentInfo";
  paymentInfo.style.cssText = "margin:16px 0;padding:14px;border:1px solid #555;background:#191919;color:#fff;line-height:1.6";
  form.insertBefore(areaLabel, btn);
  form.insertBefore(areaInput, btn);
  form.insertBefore(areaHelp, btn);
  form.insertBefore(paymentInfo, btn);

  const feeLine = document.createElement("p");
  const dueNowLine = document.createElement("p");
  const dueLaterLine = document.createElement("p");
  [feeLine, dueNowLine, dueLaterLine].forEach(line => {
    line.style.cssText = "display:flex;justify-content:space-between;gap:12px";
    itemsBox.append(line);
  });
  items.forEach(item => {
    const p = document.createElement("p");
    const name = document.createElement("span");
    const price = document.createElement("strong");
    name.textContent = item.name + " × " + item.quantity;
    price.textContent = money(item.price * item.quantity);
    p.append(name, price);
    itemsBox.insertBefore(p, feeLine);
  });

  function updateDelivery() {
    const area = areaInput.value.trim().toLocaleLowerCase();
    const freeAreas = String(settings.free_delivery_areas || "").split(/[,\n]/).map(x => x.trim().toLocaleLowerCase()).filter(Boolean);
    isFreeArea = freeAreas.includes(area) || (Number(settings.free_shipping_minimum) > 0 && subtotal >= Number(settings.free_shipping_minimum));
    shipping = isFreeArea ? 0 : Math.max(0, Number(settings.delivery_fee) || 0);
    advance = isFreeArea ? 0 : Math.min(shipping, Math.max(0, Number(settings.delivery_advance_amount) || 0));
    const total = subtotal + shipping;
    const canBkash = settings.bkash_enabled === true && String(settings.bkash_number || "").trim().length >= 8 && advance > 0;
    feeLine.innerHTML = "";
    const fl = document.createElement("span"), fv = document.createElement("strong");
    fl.textContent = "Delivery"; fv.textContent = shipping === 0 ? "FREE" : money(shipping);
    feeLine.append(fl, fv);
    dueNowLine.innerHTML = "";
    const nl = document.createElement("span"), nv = document.createElement("strong");
    nl.textContent = "Pay now (bKash delivery advance)"; nv.textContent = canBkash ? money(advance) : "৳0";
    dueNowLine.append(nl, nv);
    dueLaterLine.innerHTML = "";
    const rl = document.createElement("span"), rv = document.createElement("strong");
    rl.textContent = "Cash due on delivery"; rv.textContent = money(total - (canBkash ? advance : 0));
    dueLaterLine.append(rl, rv);
    totalBox.textContent = money(total);
    paymentInfo.replaceChildren();
    const heading = document.createElement("strong");
    if (isFreeArea) {
      heading.textContent = "Free local delivery · Cash on Delivery";
      const detail = document.createElement("p");
      detail.textContent = "Your area qualifies for free delivery. Pay the order total when it arrives.";
      paymentInfo.append(heading, detail);
    } else if (canBkash) {
      heading.textContent = "Outside free-delivery area · Small bKash advance";
      const number = document.createElement("p");
      number.style.cssText = "font-size:20px;font-weight:800;letter-spacing:1px;margin:8px 0";
      number.textContent = settings.bkash_number;
      const detail = document.createElement("p");
      detail.textContent = "Send " + money(advance) + " to this personal bKash number after placing the order. Use your Order ID as the reference. The remaining " + money(total - advance) + " is Cash on Delivery. " + (settings.bkash_instruction || "");
      paymentInfo.append(heading, number, detail);
    } else {
      heading.textContent = "bKash advance is not configured";
      const detail = document.createElement("p");
      detail.textContent = "This area is outside the free-delivery list. The store must enable bKash and set its number and advance amount before orders can be placed.";
      paymentInfo.append(heading, detail);
    }
    btn.disabled = settings.cod_enabled === false || (!isFreeArea && !canBkash);
    btn.textContent = "ORDER";
    if (settings.cod_enabled === false) { msg.textContent = "দোকান থেকে Cash on Delivery বন্ধ রাখা হয়েছে। অর্ডার নিতে হলে মালিককে Admin Dashboard থেকে COD চালু করতে হবে।"; msg.classList.add("error"); }
    else if (!isFreeArea && !canBkash) { msg.textContent = "এই এলাকা ফ্রি ডেলিভারির তালিকায় নেই। অর্ডার চালু করতে দোকানের মালিককে bKash নম্বর ও অগ্রিমের পরিমাণ সেট করতে হবে।"; msg.classList.add("error"); }
    else { msg.textContent = ""; msg.classList.remove("error"); }
  }

  areaInput.addEventListener("input", updateDelivery);
  updateDelivery();

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const area = areaInput.value.trim();
    if (!area || area.length < 2) return;
    updateDelivery();
    if (btn.disabled) return;
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
        p_items: items.map(item => ({ product_id: item.id, quantity: item.quantity })),
        p_delivery_area: area,
        p_payment_method: isFreeArea ? "cash_on_delivery" : "bkash_delivery_advance"
      });
      if (error) throw error;
      const orderId = String(data);
      sessionStorage.setItem("manmode_last_order", JSON.stringify({
        orderId,
        paymentMethod: isFreeArea ? "cash_on_delivery" : "bkash_delivery_advance",
        subtotal,
        shipping,
        total: subtotal + shipping,
        advance: isFreeArea ? 0 : advance,
        dueOnDelivery: subtotal + shipping - (isFreeArea ? 0 : advance),
        bkashNumber: settings.bkash_number || "",
        bkashInstruction: settings.bkash_instruction || "",
        isFreeArea
      }));
      ManModeCart.clear();
      window.location.assign("order-success.html");
    } catch (error) {
      msg.classList.add("error");
      msg.textContent = error.message || "অর্ডার নেওয়া যায়নি। আবার চেষ্টা করুন।";
    } finally {
      updateDelivery();
    }
  });
});