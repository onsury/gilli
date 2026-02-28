// src/lib/billing/bill-generator.js
// Generates formatted WhatsApp bills matching shop's billing software codes

export function generateBill(shop, items, orderId) {
    const billNumber = `G-${orderId.substring(0, 6).toUpperCase()}`;
    const date = new Date().toLocaleDateString("en-IN", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
    const time = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  
    let subtotal = 0;
    const lines = items.map((item, i) => {
      const amount = item.price * item.qty;
      subtotal += amount;
      const code = item.code ? `${item.code} | ` : "";
      return `${i + 1}. ${code}${item.name} × ${item.qty}${item.unit ? " " + item.unit : ""} = ₹${amount}`;
    });
  
    // Calculate GST if available
    let gstTotal = 0;
    let hasGst = false;
    items.forEach(item => {
      if (item.gst && item.gst > 0) {
        hasGst = true;
        gstTotal += (item.price * item.qty * item.gst) / 100;
      }
    });
  
    const total = subtotal + Math.round(gstTotal);
  
    // ---- Customer-facing bill ----
    let customerBill = `📄 *BILL — ${shop.name}*\n`;
    customerBill += `📍 ${shop.areaDisplay || shop.area}\n`;
    customerBill += `📅 ${date} ${time} | Bill: ${billNumber}\n`;
    customerBill += `━━━━━━━━━━━━━━━━━━\n`;
    customerBill += lines.join("\n");
    customerBill += `\n━━━━━━━━━━━━━━━━━━\n`;
    if (hasGst) {
      customerBill += `Subtotal: ₹${subtotal}\n`;
      customerBill += `GST: ₹${Math.round(gstTotal)}\n`;
    }
    customerBill += `*Total: ₹${total}*\n`;
    customerBill += `━━━━━━━━━━━━━━━━━━\n`;
    customerBill += `💳 Pay via UPI: *${shop.upiId}*\n`;
    customerBill += `\nThank you! — ${shop.name}`;
  
    // ---- Shop-facing bill (with product codes for billing software) ----
    let shopBill = `🔔 *New Order!* — ${billNumber}\n`;
    shopBill += `📅 ${date} ${time}\n`;
    shopBill += `━━━━━━━━━━━━━━━━━━\n`;
  
    const shopLines = items.map((item, i) => {
      const amount = item.price * item.qty;
      if (item.code) {
        return `${item.code} → ${item.name} × ${item.qty} = ₹${amount}`;
      }
      return `${i + 1}. ${item.name} × ${item.qty} = ₹${amount}`;
    });
  
    shopBill += shopLines.join("\n");
    shopBill += `\n━━━━━━━━━━━━━━━━━━\n`;
    shopBill += `*Total: ₹${total}*\n`;
  
    if (items.some(i => i.code)) {
      shopBill += `\n💻 Product codes match your ${shop.billingSoftwareName || "billing software"}. Enter them directly!`;
    }
  
    return {
      customerBill,
      shopBill,
      billNumber,
      subtotal,
      gstTotal: Math.round(gstTotal),
      total,
    };
  }
  
  // Generate a simple order summary (before full bill — for confirmation)
  export function generateOrderSummary(items, shop) {
    let msg = `📋 *Your order from ${shop.name}:*\n\n`;
    let total = 0;
  
    items.forEach((item, i) => {
      const amount = item.price * item.qty;
      total += amount;
      msg += `${i + 1}. ${item.name} × ${item.qty}${item.unit ? " " + item.unit : ""} — ₹${amount}\n`;
    });
  
    msg += `\n*Total: ₹${total}*\n`;
    msg += `💳 UPI: ${shop.upiId}\n`;
    msg += `\nReply *confirm* to place order\nReply *cancel* to cancel`;
  
    return { message: msg, total };
  }