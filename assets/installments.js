document.addEventListener("DOMContentLoaded", function() {
  // Configurações Padrão (serão sobrescritas se o tema passar variáveis)
  var config = {
    show_installments: true,
    max_installments: 12,
    max_installments_free: 6,
    interest_rate: 1.99,
    show_pix: true,
    pix_discount: 5,
    pix_text: "no PIX com desconto"
  };

  function formatMoney(cents) {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function renderInstallments() {
    // Seletores comuns de preço no Shopify
    var priceElements = document.querySelectorAll('.price:not(.price--compare), .product-single__price, .product-price, .price__regular .price-item--regular');
    
    priceElements.forEach(function(el) {
      // Evita duplicidade
      if (el.closest('.installment-wrapper') || el.nextElementSibling?.classList.contains('installment-wrapper')) return;

      var priceText = el.innerText.replace(/[^\d,]/g, '').replace(',', '.');
      var price = parseFloat(priceText);
      
      if (isNaN(price) || price <= 0) return;

      var html = '<div class="installment-wrapper">';

      // Lógica do PIX
      if (config.show_pix) {
        var pixPrice = price * (1 - config.pix_discount / 100);
        html += '<div class="price-pix"><strong>' + formatMoney(pixPrice * 100) + '</strong> ' + config.pix_text + '</div>';
      }

      // Lógica do Parcelamento
      if (config.show_installments) {
        var max = config.max_installments;
        var free = config.max_installments_free;
        
        var installmentValue;
        var text;

        // Prioriza mostrar a maior parcela sem juros
        if (free > 1) {
            installmentValue = price / free;
            text = 'ou ' + free + 'x de ' + formatMoney(installmentValue * 100) + ' sem juros';
        } else {
            installmentValue = price / max; // Cálculo simples sem juros compostos para visualização
            text = 'ou ' + max + 'x de ' + formatMoney(installmentValue * 100);
        }
        
        html += '<div class="installment-text">' + text + '</div>';
        html += '<a class="price-card">Ver parcelas</a>';
      }

      html += '</div>';
      
      // Insere o HTML logo após o elemento de preço
      el.insertAdjacentHTML('afterend', html);
    });
  }

  // Executa ao carregar e observa mudanças (para variantes)
  renderInstallments();
  setInterval(renderInstallments, 1000); // Verifica periodicamente mudanças de preço via AJAX
});