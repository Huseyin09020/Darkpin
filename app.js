let cart = [];
let allProducts = []; 
let currentProducts = []; 
let orders = []; 
let promoApplied = false;
let currentTotal = 0; 

// Kullanıcı Bilgileri
let isLightMode = localStorage.getItem('darkpin_theme') === 'light';
let currentUser = localStorage.getItem('darkpin_user');
let balance = parseFloat(localStorage.getItem('darkpin_balance')) || 0;

document.addEventListener('DOMContentLoaded', () => {
    if (isLightMode) { document.body.classList.add('light-mode'); }
    
    updateAuthUI();
    fetchProducts();
    
    document.getElementById('searchInput').addEventListener('input', (e) => searchProducts(e.target.value));
    
    // Logoya Çift Tıklama = Gizli Admin Paneli
    document.getElementById('main-logo').addEventListener('dblclick', () => {
        document.getElementById('admin-modal').classList.remove('hidden');
    });

    // Sayfayı yenilediğinde daha önce çark çevirmediyse aç
    if(currentUser && !localStorage.getItem('darkpin_spun')) {
        setTimeout(() => { document.getElementById('wheel-modal').classList.remove('hidden'); }, 1000);
    }
});

// GİRİŞ VE HESAP SİSTEMİ
function updateAuthUI() {
    const authSection = document.getElementById('auth-section');
    authSection.innerHTML = ''; 

    if (currentUser) {
        cart = JSON.parse(localStorage.getItem('darkpin_cart_' + currentUser)) || [];
        orders = JSON.parse(localStorage.getItem('darkpin_orders_' + currentUser)) || [];
        if(!localStorage.getItem('darkpin_balance')) { balance = 1500; localStorage.setItem('darkpin_balance', 1500); }
        
        authSection.innerHTML = `
            <button id="theme-toggle" class="theme-btn" onclick="toggleTheme()">${isLightMode ? '🌙' : '☀️'}</button>
            <div class="user-wallet">👤 ${currentUser} | 💳 <span id="balance-amount">${balance.toFixed(2)}</span> TL</div>
            <button class="orders-btn" onclick="openOrders()">📦 Siparişlerim</button>
            <button class="cart-btn" onclick="openCart()">Sepetim <span class="cart-count">${cart.length}</span></button>
            <button class="login-btn" style="border-color:var(--danger); color:var(--danger);" onclick="logoutUser()">Çıkış</button>
        `;
    } else {
        authSection.innerHTML = `
            <button id="theme-toggle" class="theme-btn" onclick="toggleTheme()">${isLightMode ? '🌙' : '☀️'}</button>
            <button class="login-btn" onclick="openLogin()">Giriş Yap / Kayıt Ol</button>
        `;
    }
}

function openLogin() { document.getElementById('login-modal').classList.remove('hidden'); }
function closeLogin() { document.getElementById('login-modal').classList.add('hidden'); }

function loginUser() {
    const username = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    
    if(username.length < 3 || pass.length < 4) { 
        showToast("Hata: Kullanıcı adı en az 3, şifre en az 4 haneli olmalı!"); 
        return; 
    }
    
    currentUser = username;
    localStorage.setItem('darkpin_user', currentUser);
    closeLogin();
    updateAuthUI();
    showToast(`Hoş geldin, ${currentUser}!`);
    
    // Giriş yapınca çarkı göster
    if(!localStorage.getItem('darkpin_spun')) { 
        setTimeout(() => { document.getElementById('wheel-modal').classList.remove('hidden'); }, 1000); 
    }
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('darkpin_user');
    cart = []; orders = [];
    updateAuthUI();
    showToast("Hesaptan güvenle çıkış yapıldı.");
}

function toggleTheme() {
    isLightMode = !isLightMode;
    if (isLightMode) { document.body.classList.add('light-mode'); localStorage.setItem('darkpin_theme', 'light'); } 
    else { document.body.classList.remove('light-mode'); localStorage.setItem('darkpin_theme', 'dark'); }
    updateAuthUI();
}

async function fetchProducts() {
    try {
        const localData = localStorage.getItem('darkpin_products');
        if (localData) { allProducts = JSON.parse(localData); } 
        else {
            const response = await fetch('products.json');
            allProducts = await response.json(); 
            localStorage.setItem('darkpin_products', JSON.stringify(allProducts)); 
        }
        currentProducts = [...allProducts];
        displayProducts(currentProducts);
    } catch (error) { console.error("Hata:", error); }
}

function displayProducts(products) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = ''; 
    if (products.length === 0) { productList.innerHTML = '<p style="color:var(--text-muted); font-size:18px;">Ürün bulunamadı.</p>'; return; }

    products.forEach(product => {
        const card = document.createElement('div');
        card.classList.add('product-card');
        card.onclick = () => openDetail(product.id);
        const stockText = product.inStock ? '<span class="in-stock">✓ Stokta Var</span>' : '<span class="out-stock">✗ Stokta Yok</span>';
        const btnText = product.inStock ? 'Sepete Ekle' : 'Tükendi';
        
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">${product.price.toFixed(2)} ${product.currency}</p>
                ${stockText}
                <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart('${product.id}', '${product.name}')" ${product.inStock ? '' : 'disabled'}>${btnText}</button>
            </div>
        `;
        productList.appendChild(card);
    });
}

// GİZLİ OYUN YÖNLENDİRMESİ
function searchProducts(keyword) {
    const searchTerm = keyword.trim().toUpperCase();
    
    if(searchTerm === 'DARKGAME') {
        document.getElementById('searchInput').value = ""; 
        showToast("Gizli portal açılıyor... Lost Camp'a Hoş Geldin!");
        setTimeout(() => { window.open('https://huseyin09020.github.io/Lost-Camp/', '_blank'); }, 1500);
        return;
    }

    currentProducts = allProducts.filter(product => 
        product.name.toUpperCase().includes(searchTerm) || product.category.toUpperCase().includes(searchTerm)
    );
    sortProducts(document.getElementById('sort-options').value);
}

function filterProducts(category, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentProducts = category === 'All' ? [...allProducts] : allProducts.filter(p => p.category === category);
    sortProducts(document.getElementById('sort-options').value);
}
function sortProducts(type) {
    if (type === 'asc') currentProducts.sort((a, b) => a.price - b.price); 
    else if (type === 'desc') currentProducts.sort((a, b) => b.price - a.price); 
    displayProducts(currentProducts);
}

// Ürün Detay
function openDetail(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    const content = document.getElementById('detail-content');
    let reviewsHtml = p.reviews && p.reviews.length>0 ? p.reviews.map(r => `<div class="review-box">" ${r} "</div>`).join('') : `<p>Yorum yok.</p>`;
    
    content.innerHTML = `
        <div class="detail-img-box"><img src="${p.image}"></div>
        <div class="detail-info-box">
            <h2>${p.name}</h2><h3 style="color:var(--accent); font-size:24px; margin-bottom:10px;">${p.price.toFixed(2)} TL</h3>
            <p class="detail-desc">${p.desc || 'Açıklama yok.'}</p>
            <button class="add-to-cart-btn" style="margin-bottom:20px;" onclick="addToCart('${p.id}', '${p.name}'); closeDetail();" ${p.inStock?'':'disabled'}>${p.inStock?'Hemen Sepete Ekle':'Stokta Yok'}</button>
            <h4>Müşteri Yorumları</h4>${reviewsHtml}
        </div>`;
    document.getElementById('detail-modal').classList.remove('hidden');
}
function closeDetail() { document.getElementById('detail-modal').classList.add('hidden'); }

// Sepet ve Ödeme
function addToCart(id, name) {
    if(!currentUser) { showToast("Önce giriş yapmalısınız!"); openLogin(); return; }
    cart.push(id);
    localStorage.setItem('darkpin_cart_' + currentUser, JSON.stringify(cart));
    updateAuthUI(); showToast(name + " sepete eklendi!");
}
function openCart() {
    const modal = document.getElementById('cart-modal');
    const container = document.getElementById('cart-items');
    modal.classList.remove('hidden'); container.innerHTML = ''; 
    let total = 0;

    if (cart.length === 0) { container.innerHTML = '<p style="text-align:center;">Sepetiniz boş.</p>'; } 
    else {
        cart.forEach((cartId, i) => {
            const p = allProducts.find(x => x.id === cartId);
            if (p) {
                total += p.price;
                container.innerHTML += `<div class="cart-item"><span>${p.name}</span><div><span style="color:var(--accent); font-weight:bold; margin-right:15px;">${p.price.toFixed(2)} TL</span><button onclick="removeFromCart(${i})" style="background:none; border:none; color:var(--danger); font-size:16px; cursor:pointer; font-weight:bold;">X</button></div></div>`;
            }
        });
    }
    if (promoApplied && total > 0) total = total * 0.80; // Kuponu %20 yaptık!
    currentTotal = total;
    document.getElementById('total-price').textContent = currentTotal.toFixed(2); 
}
function closeCart() { document.getElementById('cart-modal').classList.add('hidden'); }
function removeFromCart(index) {
    cart.splice(index, 1); 
    localStorage.setItem('darkpin_cart_' + currentUser, JSON.stringify(cart)); 
    if(cart.length === 0) promoApplied = false; 
    updateAuthUI(); openCart(); 
}
function applyPromo() {
    const input = document.getElementById('promo-input').value.trim().toUpperCase();
    if (cart.length === 0) { showToast("Önce sepete ürün ekleyin!"); return; }
    if (promoApplied) { showToast("Zaten kupon kullandınız!"); return; }
    
    if (input === 'DARK10' || input === 'VALO20') { 
        promoApplied = true; showToast("Süper! İndirim Uygulandı."); openCart(); 
    } else { showToast("Geçersiz kupon!"); }
}
function checkout() {
    if (cart.length === 0) return;
    if (balance >= currentTotal) {
        balance -= currentTotal;
        localStorage.setItem('darkpin_balance', balance);
        cart.forEach(cartId => {
            const p = allProducts.find(x => x.id === cartId);
            if (p) {
                let pin = ''; const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                for(let i=0; i<12; i++) { if(i>0 && i%4===0) pin += '-'; pin += chars.charAt(Math.floor(Math.random()*chars.length)); }
                orders.push({ name: p.name, date: new Date().toLocaleString('tr-TR'), pin: pin });
            }
        });
        localStorage.setItem('darkpin_orders_' + currentUser, JSON.stringify(orders)); 
        cart = []; localStorage.setItem('darkpin_cart_' + currentUser, JSON.stringify(cart));
        promoApplied = false; closeCart(); updateAuthUI();
        showToast("Başarılı! Kodlar siparişlerimde.");
    } else { showToast("Bakiye Yetersiz!"); }
}

function openOrders() {
    document.getElementById('orders-modal').classList.remove('hidden'); 
    const list = document.getElementById('orders-list'); list.innerHTML = ''; 
    if (orders.length === 0) { list.innerHTML = '<p style="text-align:center;">Hiç siparişiniz yok.</p>'; } 
    else {
        [...orders].reverse().forEach(o => {
            list.innerHTML += `<div class="order-item"><div class="order-info"><h4>${o.name}</h4><small>${o.date}</small></div><div class="order-pin">${o.pin}</div></div>`;
        });
    }
}
function closeOrders() { document.getElementById('orders-modal').classList.add('hidden'); }

// ŞANS ÇARKI MANTIĞI
function closeWheel() { document.getElementById('wheel-modal').classList.add('hidden'); }
function spinWheel() {
    const wheel = document.getElementById('wheel');
    const resultText = document.getElementById('wheel-result');
    document.getElementById('spin-btn').disabled = true;
    
    const randomDegree = Math.floor(Math.random() * 1800) + 1800;
    wheel.style.transform = `rotate(${randomDegree}deg)`;
    
    setTimeout(() => {
        resultText.textContent = "Tebrikler! '%20 İndirim' kazandın. Kod: VALO20";
        localStorage.setItem('darkpin_spun', 'true'); 
    }, 4000); 
}

// CANLI DESTEK BOTU MANTIĞI
function toggleChat() {
    const box = document.getElementById('chat-box');
    if(box.classList.contains('hidden')) box.classList.remove('hidden');
    else box.classList.add('hidden');
}
function sendChat() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if(!text) return;
    
    const body = document.getElementById('chat-body');
    body.innerHTML += `<div class="user-msg">${text}</div>`;
    input.value = "";
    body.scrollTop = body.scrollHeight; 

    setTimeout(() => {
        let reply = "Maalesef bunu anlayamadım. E-pin, indirim veya teslimat hakkında sorabilirsiniz.";
        const lowText = text.toLowerCase();
        
        if(lowText.includes("indirim") || lowText.includes("kupon")) {
            reply = "Şu an aktif olan indirim kodumuz: DARK10. Ayrıca şans çarkını çevirerek sürpriz kodlar kazanabilirsiniz!";
        } else if(lowText.includes("teslimat") || lowText.includes("nasıl")) {
            reply = "Ürünler 'Satın Al' butonuna bastığınız an hesabınıza tanımlanır ve kodlarınız 'Siparişlerim' kısmına düşer. %100 otomatik ve anındadır.";
        } else if(lowText.includes("merhaba") || lowText.includes("selam")) {
            reply = "Merhaba! Darkpin'e hoş geldin. Aradığın bir oyun var mı?";
        }

        body.innerHTML += `<div class="bot-msg">${reply}</div>`;
        body.scrollTop = body.scrollHeight;
    }, 1000);
}
function handleChat(e) { if(e.key === 'Enter') sendChat(); }

// Admin Paneli
function closeAdmin() { document.getElementById('admin-modal').classList.add('hidden'); }
function addNewProduct() {
    const name = document.getElementById('admin-name').value;
    const cat = document.getElementById('admin-cat').value;
    const price = parseFloat(document.getElementById('admin-price').value);
    const img = document.getElementById('admin-img').value;
    if(!name || !cat || isNaN(price) || !img) { showToast("Alanları doldurun!"); return; }

    allProducts.push({
        id: "prod_" + Math.floor(Math.random() * 10000), name: name, category: cat, price: price, currency: "TRY", inStock: document.getElementById('admin-stock').value === 'true', image: img, desc: "Admin ekledi."
    });
    localStorage.setItem('darkpin_products', JSON.stringify(allProducts)); 
    currentProducts = [...allProducts]; displayProducts(currentProducts);
    closeAdmin(); showToast("Ürün eklendi!");
}
function resetDatabase() { localStorage.removeItem('darkpin_products'); location.reload(); }

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div'); toast.classList.add('toast'); toast.textContent = message;
    container.appendChild(toast); setTimeout(() => { toast.remove(); }, 3000);
}
