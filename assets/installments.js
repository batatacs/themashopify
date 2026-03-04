document.addEventListener("DOMContentLoaded", function() {
  // 1. Tenta ler as configurações globais do theme.liquid
  // Se não encontrar, usa valores padrão de segurança
  var config = window.installmentSettings || {
    show_installments: true,
    max_installments: 12,
    max_installments_free: 6,
    interest_rate: 0,
    show_pix: true,
    pix_discount: 5,
    pix_text: "no PIX com desconto",
    modal_title: "Ver opções de parcelamento"
  };

  // Função para formatar dinheiro (BRL)
  function formatMoney(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // Função para limpar e converter o preço (R$ 1.000,00 -> 1000.00)
  function parsePrice(str) {
    if (!str) return 0;
    // Remove tudo que não é número, ponto ou vírgula
    let clean = str.replace(/[^0-9.,]/g, '');
    // Se tiver vírgula, assume formato BR (milhar.centena,centavos)
    if (clean.indexOf(',') > -1) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    }
    return parseFloat(clean);
  }

  // --- Lógica do Modal (Tabela de Parcelas) ---
  window.openInstallmentsModal = function(priceValue) {
    const modal = document.getElementById('jc-installments-modal');
    const tableDiv = document.getElementById('jc-installments-table');
    
    if (!modal || !tableDiv) return;

    let html = '<table class="installments-table"><thead><tr><th>Parcelas</th><th>Valor</th><th>Total</th></tr></thead><tbody>';
    
    for (let i = 1; i <= config.max_installments; i++) {
        let installmentValue, totalValue, label;
        
        // Regra: Sem juros até X parcelas OU se a taxa for 0
        if (i <= config.max_installments_free || config.interest_rate === 0) {
            installmentValue = priceValue / i;
            totalValue = priceValue;
            label = 'Sem Juros';
        } else {
            // Cálculo Price (Juros Compostos)
            const rate = config.interest_rate / 100;
            installmentValue = priceValue * ( (rate * Math.pow(1 + rate, i)) / (Math.pow(1 + rate, i) - 1) );
            totalValue = installmentValue * i;
            label = `(${config.interest_rate}% a.m.)`;
        }
        
        html += `<tr>
                    <td><strong>${i}x</strong> ${label}</td>
                    <td>${formatMoney(installmentValue)}</td>
                    <td>${formatMoney(totalValue)}</td>
                 </tr>`;
    }
    html += '</tbody></table>';
    
    tableDiv.innerHTML = html;
    modal.style.display = 'flex';
  };

  // Fechar Modal
  const closeBtn = document.querySelector('.installments-close');
  if(closeBtn) {
      closeBtn.addEventListener('click', function() {
        document.getElementById('jc-installments-modal').style.display = 'none';
      });
  }
  window.addEventListener('click', function(event) {
    const modal = document.getElementById('jc-installments-modal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
  });

  // --- Renderização na Página ---
  function renderInstallments() {
    // Seletores ESPECÍFICOS para evitar duplicidade (focando no container principal do produto)
    var selectors = [
        '.product-info .price',          
        '.detail-price .price',
        '.product-single__meta .price',
        '.product-group-price .price'
    ];

    // Tenta encontrar pelos seletores específicos primeiro
    var priceElements = document.querySelectorAll(selectors.join(', '));
    
    // Se não achar nada (fallback), usa um seletor mais genérico mas tenta filtrar
    if(priceElements.length === 0) {
         priceElements = document.querySelectorAll('.price:not(.price--compare)');
    }
    
    priceElements.forEach(function(el) {
      // 1. Evita duplicidade (se já tiver o wrapper logo depois, pula)
      if (el.nextElementSibling && el.nextElementSibling.classList.contains('installment-wrapper')) return;
      if (el.closest('.installment-wrapper')) return;

      // 2. Evita locais indesejados (cards de coleção, carrinho lateral, etc)
      if (el.closest('.product-item')) return; 
      if (el.closest('.mini_cart_content')) return;
      if (el.closest('.cart-item')) return;

      // 3. Pega o preço
      var priceText = el.innerText;
      
      // Se tiver preço promocional ("De R$ 100 Por R$ 80"), pega o "Por"
      const currentPrice = el.querySelector('.current, .price-item--sale, .special-price, ins');
      if (currentPrice) priceText = currentPrice.innerText;

      var price = parsePrice(priceText);
      
      if (isNaN(price) || price <= 0) return;

      // 4. Monta o HTML
      var html = '<div class="installment-wrapper">';

      // --- PIX ---
      if (config.show_pix) {
        var pixPrice = price * (1 - config.pix_discount / 100);
        html += '<div class="price-pix"><strong>' + formatMoney(pixPrice) + '</strong> ' + config.pix_text + '</div>';
      }

      // --- Parcelamento ---
      if (config.show_installments) {
        var max = config.max_installments;
        var free = config.max_installments_free;
        var installmentValue;
        var text;

        // Prioriza mostrar a maior parcela sem juros na frase de destaque
        if (free > 1) {
            installmentValue = price / free;
            text = 'ou ' + free + 'x de ' + formatMoney(installmentValue) + ' sem juros';
        } else {
            // Se tudo tem juros, mostra em max vezes (cálculo simples para display rápido)
            installmentValue = price / max; 
            text = 'ou ' + max + 'x de ' + formatMoney(installmentValue);
        }
        
        html += '<div class="installment-text">' + text + '</div>';
        // Link que abre o modal com ÍCONE e TEXTO CORRETO
        html += '<a class="price-card" href="javascript:void(0)" onclick="window.openInstallmentsModal('+price+')"><i class="fa fa-credit-card" style="margin-right:5px;"></i> ' + config.modal_title + '</a>';
      }

      html += '</div>';
      
      // 5. Insere logo após o preço encontrado
      el.insertAdjacentHTML('afterend', html);
    });
  }

  // Executa ao carregar
  renderInstallments();
  
  // Executa periodicamente para pegar mudanças de variante (quando o preço muda via AJAX)
  setInterval(renderInstallments, 1000);
});