let cart = [];
let allProducts = []; 

document.addEventListener('DOMContentLoaded', () => {
    const savedCart = localStorage.getItem('darkpin_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
    fetchProducts();
    
    document.querySelector('.cart-btn').addEventListener('click', openCart);
    document.getElementById('searchInput').addEventListener('input', (e) => searchProducts(e.target.value));
});

async function fetchProducts() {
    try {
        const response = await fetch('products.json');
        allProducts = await response.json(); 
        displayProducts(allProducts);
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

        // Siyah kutu yerine JSON'dan gelen resmi (<img src...>) koyuyoruz
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">${product.price} ${product.currency}</p>
                ${stockText}
                <button class="add-to-cart-btn" onclick="addToCart('${product.id}', '${product.name}')" ${buttonDisabled}>${buttonText}</button>
            </div>
        `;
        productList.appendChild(card);
    });
}

function searchProducts(keyword) {
    const searchTerm = keyword.toLowerCase();
    const filtered = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) || 
        product.category.toLowerCase().includes(searchTerm)
    );
    displayProducts(filtered);
}

function filterProducts(category, buttonElement) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    buttonElement.classList.add('active');

    if (category === 'All') {
        displayProducts(allProducts);
    } else {
        const filtered = allProducts.filter(product => product.category === category);
        displayProducts(filtered);
    }
}

function addToCart(productId, productName) {
    cart.push(productId);
    localStorage.setItem('darkpin_cart', JSON.stringify(cart));
    updateCartCount();
    showToast(productName + " sepete eklendi!"); // Ekranda uyarı göster
}

function updateCartCount() {
    const cartCountElement = document.querySelector('.cart-count');
    if(cartCountElement) { cartCountElement.textContent = cart.length; }
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
                            <span style="color:#00e5ff; font-weight:bold; margin-right:15px;">${product.price} ${product.currency}</span>
                            <button onclick="removeFromCart(${index})" style="background:none; border:none; color:#ff0055; font-size:16px; cursor:pointer; font-weight:bold;">X</button>
                        </div>
                    </div>
                `;
            }
        });
    }
    totalPriceElement.textContent = total.toFixed(2); 
}

function closeCart() {
    document.getElementById('cart-modal').classList.add('hidden'); 
}

function removeFromCart(index) {
    cart.splice(index, 1); 
    localStorage.setItem('darkpin_cart', JSON.stringify(cart)); 
    updateCartCount(); 
    openCart(); 
}

// YENİ: Bildirim (Toast) Fonksiyonu
function showToast(message) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Bildirimi 3 saniye sonra ekrandan sil
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
