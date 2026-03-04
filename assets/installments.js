document.addEventListener("DOMContentLoaded", function() {
  // 1. Tenta ler as configurações globais do theme.liquid
  // Se não encontrar, usa valores padrão de segurança
  var config = window.installmentSettings || {
    show_installments: true,
    max_installments: 12,
    max_installments_free: 6,
    interest_rate: 0,
    interest_table: "", // String: "0, 0, 2.5, 3.0"
    show_pix: true,
    pix_discount: 5,
    show_custom_discount: true,
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

  // Função para pegar a taxa de juros de uma parcela específica
  function getInterestRateForInstallment(installmentNumber) {
    // Se tiver tabela personalizada
    if (config.interest_table && config.interest_table.trim() !== "") {
        var rates = config.interest_table.split(',').map(function(r) { return parseFloat(r.trim()); });
        // O array começa em 0 (que seria 1x), então index = installmentNumber - 1
        var index = installmentNumber - 1;
        if (index < rates.length && !isNaN(rates[index])) {
            return rates[index];
        }
    }
    
    // Fallback para lógica simples
    if (installmentNumber <= config.max_installments_free) return 0;
    return config.interest_rate;
  }

  // --- Lógica do Modal (Tabela de Parcelas) ---
  window.openInstallmentsModal = function(priceValue) {
    const modal = document.getElementById('jc-installments-modal');
    const tableDiv = document.getElementById('jc-installments-table');
    
    if (!modal || !tableDiv) return;

    let html = '<table class="installments-table"><thead><tr><th>Parcelas</th><th>Valor</th><th>Total</th></tr></thead><tbody>';
    
    for (let i = 1; i <= config.max_installments; i++) {
        let installmentValue, totalValue, label;
        let rate = getInterestRateForInstallment(i);
        
        if (rate === 0) {
            installmentValue = priceValue / i;
            totalValue = priceValue;
            label = 'Sem Juros';
        } else {
            // Cálculo Price (Juros Compostos)
            const rateDecimal = rate / 100;
            installmentValue = priceValue * ( (rateDecimal * Math.pow(1 + rateDecimal, i)) / (Math.pow(1 + rateDecimal, i) - 1) );
            totalValue = installmentValue * i;
            label = `(${rate}% a.m.)`;
        }
        
        html += `<tr>
                    <td><strong>${i}x</strong> ${label}</td>
                    <td>${formatMoney(installmentValue)}</td>
                    <td>${formatMoney(totalValue)}</td>
                 </tr>`;
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

      // --- Tenta encontrar o preço "De" (Compare Price) para o Desconto ---
      var comparePrice = 0;
      var compareElement = el.closest('.product-info, .detail-price, .product-group-price')?.querySelector('.price-item--regular, .compare-price, s, del');
      
      if (compareElement) {
          comparePrice = parsePrice(compareElement.innerText);
      }

      // --- Ocultar texto nativo de desconto (Discount: ...) ---
      // Procura por elementos irmãos ou próximos que contenham "Discount:" ou "%"
      var parent = el.parentElement;
      if(parent) {
          var siblings = parent.querySelectorAll('*');
          siblings.forEach(function(sib) {
              if(sib.innerText.includes('Discount:') || sib.innerText.includes('Economize:')) {
                  sib.style.display = 'none';
              }
          });
      }

      // 4. Monta o HTML
      var html = '<div class="installment-wrapper">';

      // --- Desconto Personalizado ---
      if (config.show_custom_discount && comparePrice > price) {
          var discountValue = comparePrice - price;
          var discountPercent = Math.round((discountValue / comparePrice) * 100);
          
          if (discountPercent > 0) {
              html += '<div class="custom-discount-badge"><i class="fa fa-arrow-down"></i> <span>' + discountPercent + '% OFF</span> - Economize ' + formatMoney(discountValue) + '</div>';
          }
      }

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

        // Verifica se a parcela MAX tem juros na tabela personalizada
        var maxRate = getInterestRateForInstallment(max);
        
        // Se a maior parcela (max) for sem juros, mostra ela.
        // Se tiver juros, tentamos mostrar a maior parcela SEM juros (free).
        // Se free for 1, então mostra a max com juros mesmo.
        
        if (maxRate === 0) {
             installmentValue = price / max;
             text = 'ou ' + max + 'x de ' + formatMoney(installmentValue) + ' sem juros';
        } else if (free > 1) {
             installmentValue = price / free;
             text = 'ou ' + free + 'x de ' + formatMoney(installmentValue) + ' sem juros';
        } else {
             // Mostra com juros
             const rateDecimal = maxRate / 100;
             installmentValue = price * ( (rateDecimal * Math.pow(1 + rateDecimal, max)) / (Math.pow(1 + rateDecimal, max) - 1) );
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