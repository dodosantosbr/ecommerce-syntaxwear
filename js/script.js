document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ script.js carregado - carrinho inicializado com novo CSS");

  const cartIcon = document.querySelector(".cart-icon");
  const cartModal = document.getElementById("cart-modal");
  const closeCartBtn = document.getElementById("close-cart");
  const cartItemsList = document.getElementById("cart-items");
  const cartTotalEl = document.getElementById("cart-total");
  const cartCountEl = document.getElementById("cart-count");
  const clearCartBtn = document.getElementById("clear-cart");
  const finalizeCartBtn = document.getElementById("finalize-cart");

  if (!cartItemsList || !cartTotalEl || !cartCountEl) {
    console.error("❌ Elementos do carrinho não encontrados. IDs esperados: #cart-items, #cart-total, #cart-count");
    return;
  }

  // ==========================
  // LOCALSTORAGE / ESTADO
  // ==========================
  const STORAGE_KEY = "syntaxwear_cart_v2";
  let cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  const fmt = (num) => num.toFixed(2).replace(".", ",");

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function updateCartCount() {
    const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    cartCountEl.textContent = totalQty;
  }

  // ==========================
  // RENDERIZAÇÃO DO CARRINHO
  // ==========================
  function renderCart() {
    cartItemsList.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
      cartItemsList.innerHTML = `<p style="text-align:center;color:#666;padding:10px;">Seu carrinho está vazio.</p>`;
    } else {
      cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;

        const div = document.createElement("div");
        div.classList.add("cart-item");
        div.innerHTML = `
          <img src="${item.img || "https://via.placeholder.com/60"}" alt="${escapeHtml(item.title)}">
          <div class="cart-item-info">
            <h4>${escapeHtml(item.title)}</h4>
            <p>R$ ${fmt(item.price)} × ${item.qty} = R$ ${fmt(itemTotal)}</p>
          </div>
          <div class="cart-item-controls">
            <div class="quantity">
              <button class="qty-decrease" data-index="${index}">−</button>
              <span>${item.qty}</span>
              <button class="qty-increase" data-index="${index}">+</button>
            </div>
            <button class="remove-item" data-index="${index}" style="background:#fff;border:none;font-size:1rem;cursor:pointer;">&#128465;</button>
          </div>
        `;
        cartItemsList.appendChild(div);
      });
    }

    cartTotalEl.textContent = `R$ ${fmt(total)}`;
    updateCartCount();
    saveCart();
  }

  // ==========================
  // ESCAPE HTML
  // ==========================
  function escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  }

  // ==========================
  // ADICIONAR PRODUTO
  // ==========================
  function addProductFromButton(btn) {
    const card = btn.closest(".product-card");
    if (!card) return console.warn("⚠️ Botão .add-to-cart fora de um .product-card");

    const title =
      card.dataset.title ||
      (card.querySelector(".product-name") &&
        card.querySelector(".product-name").textContent.trim()) ||
      "Produto";

    let price = parseFloat(card.dataset.price);
    if (isNaN(price)) {
      const priceText = card.querySelector(".new-price")
        ? card.querySelector(".new-price").textContent
        : "";
      price = extractPrice(priceText);
    }
    if (isNaN(price)) price = 0;

    const imgEl = card.querySelector(".product-img img");
    const img = imgEl ? imgEl.src : "";

    const existing = cart.find((i) => i.title === title);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ title, price, qty: 1, img });
    }

    renderCart();
  }

  function extractPrice(text) {
    if (!text) return NaN;
    const match = text.replace(/\s/g, "").match(/([\d\.,]+)/);
    if (!match) return NaN;
    const cleaned = match[1].replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned);
  }

  // ==========================
  // EVENTOS DO CARRINHO
  // ==========================
  cartItemsList.addEventListener("click", (e) => {
    const index = e.target.dataset && e.target.dataset.index;
    if (index == null) return;

    if (e.target.classList.contains("remove-item")) {
      cart.splice(index, 1);
      renderCart();
    } else if (e.target.classList.contains("qty-increase")) {
      cart[index].qty += 1;
      renderCart();
    } else if (e.target.classList.contains("qty-decrease")) {
      if (cart[index].qty > 1) {
        cart[index].qty -= 1;
      } else {
        cart.splice(index, 1);
      }
      renderCart();
    }
  });

  // ==========================
  // BOTÕES DE PRODUTO
  // ==========================
  function bindAddButtons() {
    const addBtns = document.querySelectorAll(".add-to-cart");
    addBtns.forEach((btn) => {
      btn.removeEventListener("click", btn.__addCartHandler);
      const handler = () => {
        addProductFromButton(btn);

        const orig = btn.textContent;
        btn.textContent = "Adicionado!";
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = orig;
          btn.disabled = false;
        }, 900);
      };
      btn.__addCartHandler = handler;
      btn.addEventListener("click", handler);
    });
  }

  // ==========================
  // ABRIR / FECHAR MODAL
  // ==========================
  function toggleCartModal(force) {
    if (typeof force === "boolean") {
      cartModal.classList.toggle("open", force);
    } else {
      cartModal.classList.toggle("open");
    }
  }

  if (cartIcon) {
    cartIcon.addEventListener("click", (e) => {
      e.preventDefault();
      toggleCartModal(true);
    });
  }

  if (closeCartBtn) {
    closeCartBtn.addEventListener("click", () => toggleCartModal(false));
  }

  // Fechar ao clicar fora do conteúdo
  cartModal.addEventListener("click", (e) => {
    if (e.target === cartModal) toggleCartModal(false);
  });

  // ==========================
  // LIMPAR / FINALIZAR
  // ==========================
  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      if (!confirm("Deseja esvaziar o carrinho?")) return;
      cart = [];
      renderCart();
    });
  }

  if (finalizeCartBtn) {
    finalizeCartBtn.addEventListener("click", () => {
      if (cart.length === 0) return alert("Seu carrinho está vazio!");
      alert("Compra finalizada com sucesso! (modo demo)");
      cart = [];
      renderCart();
      toggleCartModal(false);
    });
  }

  // ==========================
  // INICIALIZAÇÃO
  // ==========================
  bindAddButtons();
  renderCart();

  window.bindAddToCartButtons = bindAddButtons;
});
