// Sepetimizi tutacağımız dizi (array)
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    // Sayfa yüklendiğinde eski kayıtlı sepeti kontrol et
    const savedCart = localStorage.getItem('darkpin_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount(); // Sepet ikonundaki sayıyı güncelle
    }
    
    fetchProducts();
});

// JSON dosyasından verileri çeken fonksiyon
async function fetchProducts() {
    try {
        const response = await fetch('products.json');
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error("Ürünler yüklenirken hata oluştu:", error);
    }
}

// Ürünleri ekrana yazdıran fonksiyon
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

// Sepete Ekle Butonu Çalıştığında Olacaklar
function addToCart(productId) {
    // Ürün ID'sini sepete ekle
    cart.push(productId);
    
    // Sepeti tarayıcının hafızasına kaydet (kullanıcı sayfayı yenilese bile silinmez)
    localStorage.setItem('darkpin_cart', JSON.stringify(cart));
    
    // Sağ üstteki sepet sayısını güncelle
    updateCartCount();
}

// Sağ üstteki kırmızı sepet sayacını güncelleyen fonksiyon
function updateCartCount() {
    const cartCountElement = document.querySelector('.cart-count');
    if(cartCountElement) {
        cartCountElement.textContent = cart.length;
    }
}
