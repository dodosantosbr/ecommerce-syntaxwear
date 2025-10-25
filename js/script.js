document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ script.js carregado - carrinho inicializando");

  // Seletores — garantimos existência com checagens
  const cartIcon = document.querySelector(".cart-icon");
  const cartModal = document.getElementById("cart-modal");
  const closeCartBtn = document.getElementById("close-cart");
  const cartItemsList = document.getElementById("cart-items");
  const cartTotalEl = document.getElementById("cart-total");
  const cartCountEl = document.getElementById("cart-count");
  const clearCartBtn = document.getElementById("clear-cart");
  const finalizeCartBtn = document.getElementById("finalize-cart");

  if (!cartItemsList || !cartTotalEl || !cartCountEl) {
    console.error(
      "Elemento do carrinho não encontrado. Verifique IDs: #cart-items, #cart-total, #cart-count"
    );
    return;
  }

  // Recupera do localStorage (persistência)
  const STORAGE_KEY = "syntaxwear_cart_v1";
  let cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  // Formatar valor para BRL simples
  const fmt = (num) => num.toFixed(2).replace(".", ",");

  // Salvar
  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  // Atualiza contador no ícone
  function updateCartCount() {
    const totalQty = cart.reduce((acc, it) => acc + it.qty, 0);
    cartCountEl.textContent = totalQty;
  }

  // Renderiza o conteúdo do modal
  function renderCart() {
    cartItemsList.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
      cartItemsList.innerHTML = `<li style="padding:10px;color:#666">Seu carrinho está vazio.</li>`;
    } else {
      cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;

        const li = document.createElement("li");
        li.className = "cart-row";
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";
        li.style.marginBottom = "8px";
        li.innerHTML = `
          <div style="flex:1; min-width:0;">
            <div style="font-weight:600; color:#222; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${escapeHtml(item.title)}
            </div>
            <div style="font-size:0.85rem; color:#666; margin-top:4px;">
              R$ ${fmt(item.price)} x ${item.qty} = R$ ${fmt(itemTotal)}
            </div>
          </div>
          <div style="display:flex; gap:6px; align-items:center; margin-left:10px;">
            <button class="qty-decrease" data-index="${index}" aria-label="Diminuir">−</button>
            <button class="qty-increase" data-index="${index}" aria-label="Aumentar">+</button>
            <button class="remove-item" data-index="${index}" aria-label="Remover">✕</button>
          </div>
        `;
        cartItemsList.appendChild(li);
      });
    }

    cartTotalEl.textContent = `Total: R$ ${fmt(total)}`;
    updateCartCount();
    saveCart();
  }

  // Proteção contra XSS ao injetar título
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

  // Adiciona ao carrinho (procura dados no card)
  function addProductFromButton(btn) {
    const card = btn.closest(".product-card");
    if (!card) return console.warn("Botão add-to-cart sem .product-card pai.");

    // title: prefer data-title, senão busca .product-name
    const title =
      card.dataset.title ||
      (card.querySelector(".product-name") &&
        card.querySelector(".product-name").textContent) ||
      "Produto";
    // price: prefer data-price, senão tenta extrair do .new-price
    let price = parseFloat(card.dataset.price);
    if (isNaN(price)) {
      const priceText = card.querySelector(".new-price")
        ? card.querySelector(".new-price").textContent
        : "";
      price = extractPrice(priceText);
    }
    if (isNaN(price)) price = 0;

    // opcional: pega imagem
    const imgEl = card.querySelector(".product-img img");
    const img = imgEl ? imgEl.src : null;

    // se item já existe, incrementa qty; senão cria novo
    const existing = cart.find((i) => i.title === title);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ title, price, qty: 1, img });
    }

    renderCart();
  }

  // Extrai número de string do tipo "R$ 189,99" -> 189.99
  function extractPrice(text) {
    if (!text) return NaN;
    const match = text.replace(/\s/g, "").match(/([\d\.,]+)/);
    if (!match) return NaN;
    // pega primeiro grupo numérico e padroniza
    const cleaned = match[1].replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned);
  }

  // Delegação de eventos no cartItemsList (aumentar, diminuir, remover)
  cartItemsList.addEventListener("click", (e) => {
    const index = e.target.dataset && e.target.dataset.index;
    if (e.target.classList.contains("remove-item") && index != null) {
      cart.splice(index, 1);
      renderCart();
    } else if (e.target.classList.contains("qty-increase") && index != null) {
      cart[index].qty += 1;
      renderCart();
    } else if (e.target.classList.contains("qty-decrease") && index != null) {
      if (cart[index].qty > 1) {
        cart[index].qty -= 1;
      } else {
        // se chegar a 0, remove
        cart.splice(index, 1);
      }
      renderCart();
    }
  });

  // Conecta botões "Adicionar ao carrinho"
  function bindAddButtons() {
    const addBtns = document.querySelectorAll(".add-to-cart");
    if (!addBtns || addBtns.length === 0) {
      console.warn("Nenhum .add-to-cart encontrado.");
      return;
    }
    addBtns.forEach((btn) => {
      // evita duplo binding
      btn.removeEventListener("click", btn.__addCartHandler);
      const handler = () => {
        addProductFromButton(btn);
        // feedback rápido
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

  // Abrir / fechar modal
  function toggleCartModal(force) {
    // preferimos usar classe 'open' caso o CSS espere por ela
    if (typeof force === "boolean") {
      cartModal.classList.toggle("open", force);
      cartModal.style.display = force ? "flex" : "none";
    } else {
      const isOpen =
        cartModal.classList.contains("open") ||
        cartModal.style.display === "flex";
      cartModal.classList.toggle("open", !isOpen);
      cartModal.style.display = isOpen ? "none" : "flex";
    }
  }

  if (cartIcon) {
    cartIcon.addEventListener("click", (e) => {
      e.preventDefault();
      toggleCartModal();
    });
  }

  if (closeCartBtn) {
    closeCartBtn.addEventListener("click", () => toggleCartModal(false));
  }

  // fechar clicando fora (opcional)
  window.addEventListener("click", (e) => {
    if (!cartModal) return;
    if (
      cartModal.classList.contains("open") &&
      !cartModal.contains(e.target) &&
      !e.target.closest(".cart-icon")
    ) {
      toggleCartModal(false);
    }
  });

  // limpar carrinho
  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      if (!confirm("Deseja esvaziar o carrinho?")) return;
      cart = [];
      renderCart();
    });
  }

  // finalizar compra
  if (finalizeCartBtn) {
    finalizeCartBtn.addEventListener("click", () => {
      if (cart.length === 0) return alert("Seu carrinho está vazio!");
      // aqui você integraria com checkout; por enquanto:
      alert("Compra finalizada com sucesso! (demo)");
      cart = [];
      renderCart();
      toggleCartModal(false);
    });
  }

  // se a página alterar dinamicamente produtos, podemos re-bind; expõe função globalmente para debug
  window.bindAddToCartButtons = bindAddButtons;

  // inicializa
  bindAddButtons();
  renderCart();
});
