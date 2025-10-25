// Seleciona os elementos principais
const cartIcon = document.querySelector(".cart-icon");
const cartModal = document.querySelector(".cart-modal");
const closeBtn = document.querySelector(".close-btn");
const cartCount = document.querySelector("#cart-count");
const cartItemsList = document.querySelector("#cart-items");
const cartTotal = document.querySelector("#cart-total");
const btnClear = document.querySelector(".btn-clear");
const btnBuy = document.querySelector(".btn-buy");
const addToCartButtons = document.querySelectorAll(".add-to-cart");

let cart = [];

// === Mostrar / esconder o carrinho ===
cartIcon.addEventListener("click", () => {
  cartModal.classList.toggle("active");
});

// Fechar o carrinho ao clicar no X
closeBtn.addEventListener("click", () => {
  cartModal.classList.remove("active");
});

// Fechar ao clicar fora do modal
window.addEventListener("click", (e) => {
  if (!cartModal.contains(e.target) && !cartIcon.contains(e.target)) {
    cartModal.classList.remove("active");
  }
});

// === Adicionar produto ao carrinho ===
addToCartButtons.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const card = e.target.closest(".product-card");
    const title = card.dataset.title;
    const price = parseFloat(card.dataset.price);

    const existingItem = cart.find((item) => item.title === title);
    if (existingItem) {
      existingItem.quantity++;
    } else {
      cart.push({ title, price, quantity: 1 });
    }

    updateCart();
    cartModal.classList.add("active"); // abre o modal com animação
  });
});

// === Atualizar carrinho ===
function updateCart() {
  cartItemsList.innerHTML = "";
  let total = 0;
  let itemCount = 0;

  cart.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${item.title} x${item.quantity}</span>
      <div>
        <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
        <button class="remove-item" data-index="${index}">X</button>
      </div>
    `;
    cartItemsList.appendChild(li);

    total += item.price * item.quantity;
    itemCount += item.quantity;
  });

  cartTotal.textContent = `Total: R$ ${total.toFixed(2)}`;
  cartCount.textContent = itemCount;

  // Botões de remover
  document.querySelectorAll(".remove-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = e.target.dataset.index;
      cart.splice(index, 1);
      updateCart();
    });
  });
}

// === Limpar carrinho ===
btnClear.addEventListener("click", () => {
  cart = [];
  updateCart();
});

// === Comprar (limpa o carrinho e fecha modal) ===
btnBuy.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }

  alert("Compra finalizada com sucesso!");
  cart = [];
  updateCart();
  cartModal.classList.remove("active");
});
