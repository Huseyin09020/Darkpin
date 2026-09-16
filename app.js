let cart = [];
let allProducts = []; 
let currentProducts = []; 
let balance = parseFloat(localStorage.getItem('darkpin_balance')) || 1500.00;
// YENİ: Siparişleri tuttuğumuz dizi
let orders = JSON.parse(localStorage.getItem('darkpin_orders')) || []; 
let promoApplied = false;
let currentTotal = 0; 

document.addEventListener('DOMContentLoaded', () => {
    const savedCart = localStorage.getItem('darkpin_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
    updateBalanceDisplay();
    fetchProducts();
    
    document.querySelector('.cart-btn').addEventListener('click', openCart);
    document.getElementById('searchInput').addEventListener('input', (e) => searchProducts(e.target.value));
});

async function fetchProducts() {
    try {
        const response = await fetch('products.json');
        allProducts = await response.json(); 
        currentProducts = [...allProducts];
        displayProducts(currentProducts);
    } catch (error) {
        console.error("Hata:", error);
    }
}

function displayProducts(products) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = ''; 

    if (products.length === 0) {
        productList.innerHTML = '<p style="color:#888; font-size:18px;">Aradığınız kriterlere uygun ürün bulunamadı.</p>';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.classList.add('product-card');

        const stockText = product.inStock ? '<span class="in-stock">✓ Stokta Var</span>' : '<span class="out-stock">✗ Stokta Yok</span>';
        const buttonDisabled = product.inStock ? '' : 'disabled';
        const buttonText = product.inStock ? 'Sepete Ekle' : 'Tükendi';

        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">${product.price.toFixed(2)} ${product.currency}</p>
                ${stockText}
                <button class="add-to-cart-btn" onclick="addToCart('${product.id}', '${product.name}')" ${buttonDisabled}>${buttonText}</button>
            </div>
        `;
        productList.appendChild(card);
    });
}

function updateBalanceDisplay() {
    document.getElementById('balance-amount').textContent = balance.toFixed(2);
}

function searchProducts(keyword) {
    const searchTerm = keyword.toLowerCase();
    currentProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) || 
        product.category.toLowerCase().includes(searchTerm)
    );
    const sortVal = document.getElementById('sort-options').value;
    sortProducts(sortVal);
}

function filterProducts(category, buttonElement) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    buttonElement.classList.add('active');

    if (category === 'All') {
        currentProducts = [...allProducts];
    } else {
        currentProducts = allProducts.filter(product => product.category === category);
    }
    
    const sortVal = document.getElementById('sort-options').value;
    sortProducts(sortVal);
}

function sortProducts(type) {
    if (type === 'asc') {
        currentProducts.sort((a, b) => a.price - b.price); 
    } else if (type === 'desc') {
        currentProducts.sort((a, b) => b.price - a.price); 
    }
    displayProducts(currentProducts);
}

function addToCart(productId, productName) {
    cart.push(productId);
    localStorage.setItem('darkpin_cart', JSON.stringify(cart));
    updateCartCount();
    showToast(productName + " sepete eklendi!");
}

function updateCartCount() {
    const cartCountElement = document.querySelector('.cart-count');
    if(cartCountElement) { cartCountElement.textContent = cart.length; }
}

function applyPromo() {
    const input = document.getElementById('promo-input').value.trim().toUpperCase();
    if (cart.length === 0) { showToast("Önce sepete ürün ekleyin!"); return; }
    if (promoApplied) { showToast("Zaten bir kupon kullandınız!"); return; }
    if (input === 'DARK10') {
        promoApplied = true;
        showToast("Tebrikler! %10 İndirim Uygulandı.");
        openCart(); 
    } else {
        showToast("Geçersiz kupon kodu!");
    }
}

function openCart() {
    const modal = document.getElementById('cart-modal');
    const cartItemsContainer = document.getElementById('cart-items');
    const totalPriceElement = document.getElementById('total-price');
    
    modal.classList.remove('hidden'); 
    cartItemsContainer.innerHTML = ''; 
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; color:#888;">Sepetiniz şu an boş.</p>';
    } else {
        cart.forEach((cartId, index) => {
            const product = allProducts.find(p => p.id === cartId);
            if (product) {
                total += product.price;
                cartItemsContainer.innerHTML += `
                    <div class="cart-item">
                        <span>${product.name}</span>
                        <div>
                            <span style="color:#00e5ff; font-weight:bold; margin-right:15px;">${product.price.toFixed(2)} ${product.currency}</span>
                            <button onclick="removeFromCart(${index})" style="background:none; border:none; color:#ff0055; font-size:16px; cursor:pointer; font-weight:bold;">X</button>
                        </div>
                    </div>
                `;
            }
        });
    }

    if (promoApplied && total > 0) { total = total * 0.90; }
    currentTotal = total;
    totalPriceElement.textContent = currentTotal.toFixed(2); 
}

function closeCart() {
    document.getElementById('cart-modal').classList.add('hidden'); 
}

function removeFromCart(index) {
    cart.splice(index, 1); 
    localStorage.setItem('darkpin_cart', JSON.stringify(cart)); 
    if(cart.length === 0) promoApplied = false; 
    updateCartCount(); 
    openCart(); 
}

// YENİ: E-Pin Üretici Fonksiyonu
function generatePin() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pin = '';
    for(let i=0; i<12; i++) {
        if(i > 0 && i % 4 === 0) pin += '-';
        pin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pin;
}

// GÜNCELLENDİ: Satın Almayı Tamamla ve Siparişe Ekle
function checkout() {
    if (cart.length === 0) { showToast("Sepetiniz boş!"); return; }
    
    if (balance >= currentTotal) {
        balance -= currentTotal;
        localStorage.setItem('darkpin_balance', balance);
        updateBalanceDisplay();
        
        // Sepetteki her ürünü sipariş geçmişine ekle ve pin üret
        cart.forEach(cartId => {
            const product = allProducts.find(p => p.id === cartId);
            if (product) {
                orders.push({
                    name: product.name,
                    date: new Date().toLocaleDateString('tr-TR') + ' ' + new Date().toLocaleTimeString('tr-TR'),
                    pin: generatePin()
                });
            }
        });
        localStorage.setItem('darkpin_orders', JSON.stringify(orders)); // Siparişleri kaydet
        
        cart = [];
        localStorage.setItem('darkpin_cart', JSON.stringify(cart));
        updateCartCount();
        promoApplied = false;
        
        closeCart();
        showToast("Tebrikler! Ürünleriniz 'Siparişlerim' kısmına eklendi.");
    } else {
        showToast("Bakiye Yetersiz! Lütfen yükleme yapın.");
    }
}

// YENİ: Siparişlerim Penceresini Açma
function openOrders() {
    const modal = document.getElementById('orders-modal');
    const ordersList = document.getElementById('orders-list');
    modal.classList.remove('hidden'); 
    ordersList.innerHTML = ''; 

    if (orders.length === 0) {
        ordersList.innerHTML = '<p style="text-align:center; color:#888; font-size:16px;">Henüz hiç alışveriş yapmadınız.</p>';
    } else {
        // En yeni sipariş en üstte çıksın diye reverse() yapıyoruz
        [...orders].reverse().forEach(order => {
            ordersList.innerHTML += `
                <div class="order-item">
                    <div class="order-info">
                        <h4>${order.name}</h4>
                        <small style="color:#888;">Tarih: ${order.date}</small>
                    </div>
                    <div class="order-pin">${order.pin}</div>
                </div>
            `;
        });
    }
}

function closeOrders() {
    document.getElementById('orders-modal').classList.add('hidden'); 
}

function showToast(message) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}
