let cart = [];
let allProducts = []; 
let currentProducts = []; 
let balance = parseFloat(localStorage.getItem('darkpin_balance')) || 1500.00;
let orders = JSON.parse(localStorage.getItem('darkpin_orders')) || []; 
let promoApplied = false;
let currentTotal = 0; 
let isLightMode = localStorage.getItem('darkpin_theme') === 'light';

document.addEventListener('DOMContentLoaded', () => {
    // Temayı Yükle
    if (isLightMode) { document.body.classList.add('light-mode'); document.getElementById('theme-toggle').textContent = '🌙'; }
    
    // Sepeti Yükle
    const savedCart = localStorage.getItem('darkpin_cart');
    if (savedCart) { cart = JSON.parse(savedCart); updateCartCount(); }
    
    updateBalanceDisplay();
    fetchProducts();
    
    // Event Listeners
    document.getElementById('searchInput').addEventListener('input', (e) => searchProducts(e.target.value));
    
    // Gizli Admin Panel Tetikleyicisi (Logoya Çift Tıklama)
    document.getElementById('main-logo').addEventListener('dblclick', () => {
        document.getElementById('admin-modal').classList.remove('hidden');
    });
});

// YENİ: Tema Değiştirici
function toggleTheme() {
    isLightMode = !isLightMode;
    if (isLightMode) {
        document.body.classList.add('light-mode');
        document.getElementById('theme-toggle').textContent = '🌙';
        localStorage.setItem('darkpin_theme', 'light');
    } else {
        document.body.classList.remove('light-mode');
        document.getElementById('theme-toggle').textContent = '☀️';
        localStorage.setItem('darkpin_theme', 'dark');
    }
}

async function fetchProducts() {
    try {
        // Önce LocalStorage'da özel ürün listesi var mı bak (Admin eklemiş olabilir)
        const localData = localStorage.getItem('darkpin_products');
        if (localData) {
            allProducts = JSON.parse(localData);
        } else {
            const response = await fetch('products.json');
            allProducts = await response.json(); 
            localStorage.setItem('darkpin_products', JSON.stringify(allProducts)); // İlk veriyi hafızaya al
        }
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
        productList.innerHTML = '<p style="color:var(--text-muted); font-size:18px;">Kriterlere uygun ürün bulunamadı.</p>';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.classList.add('product-card');
        // Karta tıklayınca detay açılsın diye onclick ekliyoruz
        card.onclick = () => openDetail(product.id);

        const stockText = product.inStock ? '<span class="in-stock">✓ Stokta Var</span>' : '<span class="out-stock">✗ Stokta Yok</span>';
        const buttonDisabled = product.inStock ? '' : 'disabled';
        const buttonText = product.inStock ? 'Sepete Ekle' : 'Tükendi';

        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">${product.price.toFixed(2)} ${product.currency}</p>
                ${stockText}
                <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart('${product.id}', '${product.name}')" ${buttonDisabled}>${buttonText}</button>
            </div>
        `;
        productList.appendChild(card);
    });
}

// YENİ: Ürün Detay Penceresi
function openDetail(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('detail-content');
    
    let reviewsHtml = '';
    if(product.reviews && product.reviews.length > 0) {
        product.reviews.forEach(rev => { reviewsHtml += `<div class="review-box">" ${rev} "</div>`; });
    } else {
        reviewsHtml = `<p style="color:var(--text-muted); font-size:14px;">Henüz yorum yapılmamış.</p>`;
    }

    const buttonDisabled = product.inStock ? '' : 'disabled';
    const buttonText = product.inStock ? 'Hemen Sepete Ekle' : 'Stokta Yok';

    content.innerHTML = `
        <div class="detail-img-box">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="detail-info-box">
            <h2>${product.name}</h2>
            <h3 style="color:var(--accent); font-size:24px; margin-bottom:10px;">${product.price.toFixed(2)} ${product.currency}</h3>
            <p class="detail-desc">${product.desc || 'Bu ürün için açıklama bulunmuyor.'}</p>
            <button class="add-to-cart-btn" style="margin-bottom:20px;" onclick="addToCart('${product.id}', '${product.name}'); closeDetail();" ${buttonDisabled}>${buttonText}</button>
            <h4 style="margin-bottom:10px; border-bottom:1px solid var(--border-color); padding-bottom:5px;">Müşteri Yorumları</h4>
            ${reviewsHtml}
        </div>
    `;
    modal.classList.remove('hidden');
}
function closeDetail() { document.getElementById('detail-modal').classList.add('hidden'); }

// YENİ: Gizli Admin Fonksiyonları
function closeAdmin() { document.getElementById('admin-modal').classList.add('hidden'); }
function addNewProduct() {
    const name = document.getElementById('admin-name').value;
    const cat = document.getElementById('admin-cat').value;
    const price = parseFloat(document.getElementById('admin-price').value);
    const img = document.getElementById('admin-img').value;
    const stock = document.getElementById('admin-stock').value === 'true';

    if(!name || !cat || isNaN(price) || !img) { showToast("Lütfen tüm alanları doldurun!"); return; }

    const newProduct = {
        id: "prod_" + Math.floor(Math.random() * 10000),
        name: name,
        category: cat,
        price: price,
        currency: "TRY",
        inStock: stock,
        image: img,
        desc: "Admin tarafından eklendi.",
        reviews: ["Yeni ürün!"]
    };

    allProducts.push(newProduct);
    localStorage.setItem('darkpin_products', JSON.stringify(allProducts)); // Veritabanını güncelle
    currentProducts = [...allProducts];
    displayProducts(currentProducts); // Ekranı yenile
    
    closeAdmin();
    showToast("Ürün başarıyla mağazaya eklendi!");
}
function resetDatabase() {
    localStorage.removeItem('darkpin_products');
    showToast("Veritabanı sıfırlandı. Sayfa yenileniyor...");
    setTimeout(() => { location.reload(); }, 1500);
}

// Filtreleme, Arama ve Sıralama
function searchProducts(keyword) {
    const searchTerm = keyword.toLowerCase();
    currentProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) || 
        product.category.toLowerCase().includes(searchTerm)
    );
    sortProducts(document.getElementById('sort-options').value);
}
function filterProducts(category, buttonElement) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    buttonElement.classList.add('active');
    currentProducts = category === 'All' ? [...allProducts] : allProducts.filter(product => product.category === category);
    sortProducts(document.getElementById('sort-options').value);
}
function sortProducts(type) {
    if (type === 'asc') currentProducts.sort((a, b) => a.price - b.price); 
    else if (type === 'desc') currentProducts.sort((a, b) => b.price - a.price); 
    displayProducts(currentProducts);
}

// Sepet ve Ödeme
function updateBalanceDisplay() { document.getElementById('balance-amount').textContent = balance.toFixed(2); }
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

function openCart() {
    const modal = document.getElementById('cart-modal');
    const container = document.getElementById('cart-items');
    modal.classList.remove('hidden'); 
    container.innerHTML = ''; 
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Sepetiniz boş.</p>';
    } else {
        cart.forEach((cartId, index) => {
            const p = allProducts.find(x => x.id === cartId);
            if (p) {
                total += p.price;
                container.innerHTML += `
                    <div class="cart-item">
                        <span>${p.name}</span>
                        <div>
                            <span style="color:var(--accent); font-weight:bold; margin-right:15px;">${p.price.toFixed(2)} ${p.currency}</span>
                            <button onclick="removeFromCart(${index})" style="background:none; border:none; color:var(--danger); font-size:16px; cursor:pointer; font-weight:bold;">X</button>
                        </div>
                    </div>`;
            }
        });
    }
    if (promoApplied && total > 0) total = total * 0.90; 
    currentTotal = total;
    document.getElementById('total-price').textContent = currentTotal.toFixed(2); 
}
function closeCart() { document.getElementById('cart-modal').classList.add('hidden'); }
function removeFromCart(index) {
    cart.splice(index, 1); 
    localStorage.setItem('darkpin_cart', JSON.stringify(cart)); 
    if(cart.length === 0) promoApplied = false; 
    updateCartCount(); openCart(); 
}
function applyPromo() {
    const input = document.getElementById('promo-input').value.trim().toUpperCase();
    if (cart.length === 0) { showToast("Önce sepete ürün ekleyin!"); return; }
    if (promoApplied) { showToast("Zaten bir kupon kullandınız!"); return; }
    if (input === 'DARK10') { promoApplied = true; showToast("%10 İndirim Uygulandı."); openCart(); } 
    else { showToast("Geçersiz kupon!"); }
}

function generatePin() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pin = '';
    for(let i=0; i<12; i++) { if(i>0 && i%4===0) pin += '-'; pin += chars.charAt(Math.floor(Math.random()*chars.length)); }
    return pin;
}

function checkout() {
    if (cart.length === 0) { showToast("Sepetiniz boş!"); return; }
    if (balance >= currentTotal) {
        balance -= currentTotal;
        localStorage.setItem('darkpin_balance', balance);
        updateBalanceDisplay();
        
        cart.forEach(cartId => {
            const p = allProducts.find(x => x.id === cartId);
            if (p) {
                orders.push({ name: p.name, date: new Date().toLocaleString('tr-TR'), pin: generatePin() });
            }
        });
        localStorage.setItem('darkpin_orders', JSON.stringify(orders)); 
        
        cart = []; localStorage.setItem('darkpin_cart', JSON.stringify(cart));
        updateCartCount(); promoApplied = false; closeCart();
        showToast("Satın alma başarılı! Kodlar siparişlerimde.");
    } else {
        showToast("Bakiye Yetersiz!");
    }
}

function openOrders() {
    document.getElementById('orders-modal').classList.remove('hidden'); 
    const list = document.getElementById('orders-list');
    list.innerHTML = ''; 
    if (orders.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Henüz hiç alışveriş yapmadınız.</p>';
    } else {
        [...orders].reverse().forEach(o => {
            list.innerHTML += `<div class="order-item"><div class="order-info"><h4>${o.name}</h4><small>${o.date}</small></div><div class="order-pin">${o.pin}</div></div>`;
        });
    }
}
function closeOrders() { document.getElementById('orders-modal').classList.add('hidden'); }

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}
