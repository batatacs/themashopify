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
    modal_title: "Ver opções de parcelamento",
    pix_icon_url: ""
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
    // 1. Só executa se estiver na página do produto
    if (!document.body.classList.contains('template-product')) return;

    // 2. Seletores de preço
    // Removi seletores genéricos para focar apenas no preço principal do produto
    var selectors = [
    '#js-product-price',           // ID exato do seu arquivo main-product.liquid
    '.product-info .price .current',
    '.product-single__meta .price'
];

    var priceElements = document.querySelectorAll(selectors.join(', '));
    
    priceElements.forEach(function(el) {
      // 3. Evita locais indesejados (relacionados, carrinho, etc)
      if (el.closest('.product-item') || el.closest('.mini_cart_content') || el.closest('.cart-item')) return;

      // Determina o container real do preço para inserção (evita quebrar a linha do preço + badge nativo)
      var targetEl = el;
      if (el.classList.contains('current') || el.tagName === 'SPAN' || el.classList.contains('price-item')) {
          targetEl = el.parentElement;
      }
      if (targetEl.classList.contains('price')) targetEl = targetEl.parentElement;
      
      // 4. Pega o preço atual e limpa
      var priceText = el.innerText;
      const currentPriceEl = el.querySelector('.current, .price-item--sale, .special-price, ins');
      if (currentPriceEl) priceText = currentPriceEl.innerText;
      var price = parsePrice(priceText);
      if (isNaN(price) || price <= 0) return;

      // 5. Lógica Anti-Duplicação e Atualização de Variante
      // Verificamos no targetEl para ser consistente com a inserção
      if (targetEl.getAttribute('data-last-price') == price && targetEl.nextElementSibling?.classList.contains('installment-wrapper')) {
          return;
      }
      
      if (targetEl.nextElementSibling?.classList.contains('installment-wrapper')) {
          targetEl.nextElementSibling.remove();
      }
      targetEl.setAttribute('data-last-price', price);

      // --- Tenta encontrar o preço "De" (Compare Price) para o Desconto ---
      var comparePrice = 0;
      // Busca o preço "De" no mesmo container ou no pai para garantir que o badge de % apareça
      var compareElement = el.parentElement.querySelector('.price-item--regular, .compare-price, s, del, .old-price') || 
                           el.closest('.product-info, .detail-price, .product-group-price')?.querySelector('.price-item--regular, .compare-price, s, del');
      
      if (compareElement) {
          comparePrice = parsePrice(compareElement.innerText);
      }

      // 7. Monta o HTML
      var html = '<div class="installment-wrapper">';

      // --- PIX ---
      if (config.show_pix) {
        var pixIcon = config.pix_icon_url ? '<img src="' + config.pix_icon_url + '" class="pix-icon" style="width:18px; height:18px; vertical-align:middle; margin-right:5px; margin-top:-2px;">' : '';
        html += '<div class="price-pix">' + pixIcon + '<strong>' + config.pix_discount + '% de Desconto</strong> ' + config.pix_text + '</div>';
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
      
      // 8. Insere logo após o preço encontrado
      targetEl.insertAdjacentHTML('afterend', html);
    });
  }

  // Executa ao carregar
  renderInstallments();
  
  // Executa periodicamente para pegar mudanças de variante (quando o preço muda via AJAX)
  setInterval(renderInstallments, 1000);
});