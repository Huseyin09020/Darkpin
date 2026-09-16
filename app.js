document.addEventListener('DOMContentLoaded', () => {
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
    productList.innerHTML = ''; // İçeriği temizle

    products.forEach(product => {
        // Ürün kartı elementi oluştur
        const card = document.createElement('div');
        card.classList.add('product-card');

        // Stok durumu kontrolü
        const stockText = product.inStock ? '<span class="in-stock">Stokta Var</span>' : '<span class="out-stock">Stokta Yok</span>';
        const buttonDisabled = product.inStock ? '' : 'disabled';
        const buttonText = product.inStock ? 'Sepete Ekle' : 'Tükendi';

        // Kartın içindeki HTML yapısı
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

// Sepete Ekle butonuna basıldığında çalışacak taslak fonksiyon
function addToCart(productId) {
    alert("Ürün ID: " + productId + " sepete eklendi!");
}
