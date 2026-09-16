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

    products.forEach(product => {
        const card = document.createElement('div');
        card.classList.add('product-card');

        const stockText = product.inStock ? '<span class="in-stock">Stokta Var</span>' : '<span class="out-stock">Stokta Yok</span>';
        const buttonDisabled = product.inStock ? '' : 'disabled';
        const buttonText = product.inStock ? 'Sepete Ekle' : 'Tükendi';

        card.innerHTML = `
            <div class="product-image-placeholder">
                <p>${product.category}</p>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">${product.price} ${product.currency}</p>
                ${stockText}
                <button class="add-to-cart-btn" onclick="addToCart('${product.id}')" ${buttonDisabled}>${buttonText}</button>
            </div>
        `;
        productList.appendChild(card);
    });
}

function addToCart(productId) {
    cart.push(productId);
    localStorage.setItem('darkpin_cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const cartCountElement = document.querySelector('.cart-count');
    if(cartCountElement) {
        cartCountElement.textContent = cart.length;
    }
}

// --- GÜNCELLENMİŞ SEPET MODAL FONKSİYONLARI ---
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
                // Her ürünün yanına silme butonu eklendi
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
    const modal = document.getElementById('cart-modal');
    modal.classList.add('hidden'); 
}

// YENİ FONKSİYON: Sepetten Ürün Silme
function removeFromCart(index) {
    cart.splice(index, 1); // Ürünü diziden çıkar
    localStorage.setItem('darkpin_cart', JSON.stringify(cart)); // Hafızayı güncelle
    updateCartCount(); // Sağ üstteki sayıyı güncelle
    openCart(); // Sepet ekranını anında yenile
}
