document.addEventListener("DOMContentLoaded", function() {
  // --- MODO DEBUG ---
  // Mude para true para ver mensagens de depuração no console do navegador (F12)
  var debugMode = false;

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
    } else {
      // Se só tem ponto (ex: 1.200), remove se parecer milhar (mais de 3 digitos ou seguido de 3 digitos)
      // Mas por segurança, vamos assumir que se não tem virgula, o parseFloat resolve.
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
    if (debugMode) console.log('[Installments] Executando renderInstallments...');

    // Seletores ESPECÍFICOS para evitar duplicidade (focando no container principal do produto)
    var selectors = [
        '.product-info .price',          
        '.detail-price .price',
        '.product-single__meta .price',
        '.product-group-price .price',
        '.product-single__price',
        '[data-product-price]', // Seletor moderno comum
        '.product-price',       // Outro seletor comum
        '.price__container .price',
        '.product__price'
    ];

    // Tenta encontrar pelos seletores específicos primeiro
    var priceElements = document.querySelectorAll(selectors.join(', '));
    if (debugMode && priceElements.length === 0) console.log('[Installments] Nenhum elemento de preço encontrado com seletores específicos.');
    
    // Se não achar nada (fallback), usa um seletor mais genérico mas tenta filtrar
    if(priceElements.length === 0) {
         priceElements = document.querySelectorAll('.price:not(.price--compare)');
         if (debugMode) console.log('[Installments] Usando seletor de fallback. Encontrados:', priceElements.length);
    }
    
    priceElements.forEach(function(el) {
      // 0. Otimização: Verifica se o elemento está visível na página
      // REMOVIDO: A verificação abaixo impedia a exibição em temas com Preloader ativo.
      /*
      if (el.offsetParent === null) {
        if (debugMode) console.log('[Installments] Elemento de preço pulado pois está invisível:', el);
        return;
      }
      */

      // 1. Evita duplicidade e re-renderização desnecessária (anti-flicker)
      var existingWrapper = el.nextElementSibling;
      if (existingWrapper && existingWrapper.classList.contains('installment-wrapper')) {
          var oldPrice = existingWrapper.getAttribute('data-price');
          var currentPriceText = (el.querySelector('.current, .price-item--sale, .special-price, ins') || el).innerText;
          var currentPriceValue = parsePrice(currentPriceText);
          // Se o preço não mudou, não faz nada.
          if (oldPrice && parseFloat(oldPrice) === currentPriceValue) {
              return; 
          }
          // Se o preço mudou, remove o wrapper antigo para recriar.
          existingWrapper.remove();
      }
      // Adicionado para evitar re-renderização dentro de si mesmo
      if (el.closest('.installment-wrapper')) return;

      // 2. Evita locais indesejados (cards de coleção, carrinho lateral, etc)
      // if (el.closest('.product-item')) return; 
      if (el.closest('.mini_cart_content')) return;
      if (el.closest('.cart-item')) return;

      // 3. Pega o preço
      var priceText = el.innerText;
      
      // Se tiver preço promocional ("De R$ 100 Por R$ 80"), pega o "Por"
      var currentPrice = el.querySelector('.current, .price-item--sale, .special-price, ins');
      if (currentPrice) priceText = currentPrice.innerText;

      var price = parsePrice(priceText);

      if (debugMode) {
        console.log('[Installments] Elemento encontrado:', el);
        console.log('[Installments] Texto do preço:', priceText, 'Preço parseado:', price);
      }

      if (isNaN(price) || price <= 0) return;

      // --- Tenta encontrar o preço "De" (Compare Price) para o Desconto ---
      var comparePrice = 0;
      // Procura o container de preço/produto mais próximo
      var priceWrapper = el.closest('.product-info, .price, .price-container, .product-price, .product__price, [data-price-wrapper], .product-single__meta, .detail-price, .grid-view-item, .product-card, .product-item, .product-block, .product-card__info, .product-item-info') || el.parentElement;

      if (priceWrapper) {
        // Busca mais agressiva por qualquer elemento que pareça um preço antigo
        var compareSelectors = 's, del, .price-item--regular, .compare-price, .price--compare, .old-price, .price--was, .price--line-through, [data-compare-price]';
        var potentialElements = priceWrapper.querySelectorAll(compareSelectors);
        
        potentialElements.forEach(function(compEl) {
            // Ignora o próprio elemento de preço atual
            if (compEl === el || el.contains(compEl)) return;
            
            var text = compEl.innerText || compEl.textContent;
            // Verifica se tem números
            if (!/[0-9]/.test(text)) return;
            
            var val = parsePrice(text);
            // Se o valor encontrado for MAIOR que o preço atual, é o preço "De"
            if (val > price) {
                comparePrice = val;
            }
        });
      }

      // 4. Monta o HTML
      var html = '<div class="installment-wrapper" data-price="' + price + '">';

      // --- Desconto Personalizado (agora ao lado do preço) ---
      // Primeiro, remove qualquer span de desconto existente para evitar duplicação
      var existingDiscountSpan = (el.parentNode || el).querySelector('.premium-discount-badge');
      if (existingDiscountSpan) {
        existingDiscountSpan.remove();
      }
      if (config.show_custom_discount && comparePrice > price) {
          var discountValue = comparePrice - price;
          var discountPercent = Math.round((discountValue / comparePrice) * 100);

          if (discountPercent > 0) {
              if (debugMode) console.log('[Installments] Desconto de ' + discountPercent + '% encontrado. Criando badge.');
              var discountSpan = document.createElement('span');
              discountSpan.className = 'premium-discount-badge';
              // Estilo de destaque similar ao "Envio Prioritário" (Vermelho para desconto)
              discountSpan.style.cssText = 'background: #FF3B30; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; margin-left: 6px; vertical-align: middle; display: inline-block; visibility: visible; opacity: 1; letter-spacing: 0.5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);';
              discountSpan.innerText = discountPercent + '% OFF';
              // Tenta inserir dentro do elemento de preço de venda para ficar na mesma linha
              var targetForBadge = currentPrice || el;
              if (debugMode) console.log('[Installments] Alvo para o badge:', targetForBadge);
              targetForBadge.insertAdjacentElement('afterend', discountSpan);
          } else {
              if (debugMode) console.log('[Installments] Desconto percentual é 0 ou menor, não criando badge.');
          }
      } else {
        if (debugMode) console.log('[Installments] Condições para badge de desconto não atendidas.', { show: config.show_custom_discount, compare: comparePrice, price: price });
      }

      // --- PIX ---
      if (config.show_pix) {
        var iconHtml = '';
        if (config.pix_icon_url) {
             iconHtml = '<img src="' + config.pix_icon_url + '" alt="PIX" class="pix-icon" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 5px;">';
        }
        // Badge de destaque para Envio Prioritário
        var highlightStyle = 'background: #25D366; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; margin-left: 4px; vertical-align: middle; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);';
        html += '<div class="price-pix">' + iconHtml + '<span><strong>' + config.pix_discount + '% OFF</strong> no PIX + <span style="' + highlightStyle + '">ENVIO PRIORITÁRIO</span></span></div>';
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

  // --- Lógica de Execução e Observação de Mudanças ---

  // Função Debounce para evitar execuções excessivas e repetidas do renderInstallments
  // durante uma única atualização de variante, que pode disparar múltiplas mutações no DOM.
  let debounceTimer;
  const debounce = (func, delay) => {
    return function(...args) {
      const context = this;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    }
  };
  const debouncedRender = debounce(renderInstallments, 200);

  // Observador de Mutações (MutationObserver) para performance.
  // Esta é a forma moderna e eficiente de detectar mudanças na página (como troca de variantes)
  // sem usar o `setInterval`, que executa constantemente e pode ser pesado.
  function setupObserver() {
    if (debugMode) console.log('[Installments] Configurando MutationObserver...');

    // O alvo da observação. Pode ser o body, ou um container mais específico do produto.
    // Usar 'main' ou um seletor de produto principal é mais performático que 'body'.
    const targetNode = document.querySelector('main.main-content') || document.body;

    const observerConfig = { childList: true, subtree: true };

    const observer = new MutationObserver((mutationsList, observer) => {
      // Para cada mutação, chamamos a renderização com debounce.
      // O debounce garante que, mesmo com muitas pequenas mudanças rápidas,
      // a função de renderização só execute uma vez após as mudanças pararem.
      for(const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          debouncedRender();
          break; // Sai do loop após a primeira detecção para evitar chamadas redundantes.
        }
      }
    });

    observer.observe(targetNode, observerConfig);
    if (debugMode) console.log('[Installments] MutationObserver está ativo no elemento:', targetNode);
  }

  // Execução inicial ao carregar a página
  renderInstallments();

  // Configura o observador para atualizações dinâmicas (troca de variantes, etc.)
  setupObserver();
});