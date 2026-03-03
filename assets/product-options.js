if (!customElements.get("product-options")) {
  class ProductOptions extends HTMLElement {
    constructor() {
      super();
      this.settings = {
        optionSelector: ".product-options__value",
      };
    }
    connectedCallback() {
      this.load();
    }
    load() {
      var self = this;
      /* Switch option event support click touchstart mouseenter */
      this.querySelectorAll(self.settings.optionSelector).forEach(option => {
        option.addEventListener('click', self.onProcess.bind(self));
        option.addEventListener('touchstart', self.onProcess.bind(self));
      });
      this.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', function(event){
          let target = event.target,
          option = target.options[target.selectedIndex];
          if(option) option.click();
        });
      });

      var product = self.closest("[data-js-product]");
      if (product) {
        self.product = product;
        self.productSingle = (product.id === 'product-single');
        var dataJson = product.querySelector(".data-json-product");
          self.jsonProduct = dataJson
            ? JSON.parse(dataJson.innerHTML)
            : product.dataset.jsonProduct;
        if(!self.jsonProduct) return;
        var urlParams = new URLSearchParams(window.location.search),
          variantId = urlParams.get("variant");
        if (!variantId) {
          let slideNav = document.body.querySelector("div[data-slide-nav] .thumb_img");
          if(slideNav) slideNav.click();
          variantId = product.querySelector('select[name="id"], input[name="id"]').value;
        } else {
            var variant = self.getVariantById(variantId);
            document.body.dispatchEvent(
              new CustomEvent("afterVariantUpdated", { detail: variant })
            );
        }
        var qty = product.querySelector("input.js_qty")
        if(qty) qty.dataset.max = self.getQuantity(variantId);
      }
    }

    getQuantity(variantId) {
      var quantity,
        variantsQuantity = this.jsonProduct.variants_quantity ? this.jsonProduct.variants_quantity : [];
      variantsQuantity.forEach(function (variant) {
        if (variant.id == variantId) {
          quantity = +variant.quantity;
        }
      });

      return quantity;
    }

    setElementVisibility(element, status, important) {
        important = important ? '-important' : '';
        if(status){
          element.classList.remove(`d-none${important}`);
        }else{
          element.classList.add(`d-none${important}`);
        }      
    }

    onProcess(event) {
      var self = this;
      document.body.dispatchEvent(new Event('beforeVariantUpdated'));
      var target = event.target,
        option = target.closest(self.settings.optionSelector),
        optionValue = target.matches("option")
          ? target.value
          : target.matches("input")
          ? target.value
          : option.querySelector("input").value;
      if (option.matches("option")) option.selected = "selected";
      var optionItem = option.closest(".cms-option-item"),
        labelSelected = optionItem.querySelector(".label-selected"),
        position = parseInt(optionItem.dataset.position) - 1,
        current_values = [],
        update_variant;
      if (option.classList.contains("disabled")) return;
      option.classList.add('active');
      for (let sibling of option.parentNode.children) {
          if (sibling !== option) sibling.classList.remove('active');
      }
      if (labelSelected) {
        labelSelected.innerHTML = optionValue;
      }

      self.querySelectorAll(`${self.settings.optionSelector}.active`).forEach(function(element){
        current_values.push(
          element.matches("option")
            ? element.value
            : element.querySelector("input").value
        );
      });
      self.jsonProduct.variants.forEach(function(variant){
        if (!variant.available) return;
        if (
          current_values[position] == variant.options[position] &&
          current_values.toString() === variant.options.toString()
        ) {
          update_variant = variant;
          return false;
        }
      });
      var inventoryQty = self.product.querySelector(".inventory_qty");
      if (update_variant) {
        self.updatePossibleVariants({
          update_variant: update_variant,
          json: self.jsonProduct,
        });
        self.updateAddToCart({
          update_variant: update_variant,
          json: self.jsonProduct,
        });
        if(inventoryQty) inventoryQty.style.display = 'block';
        self.switchVariant({
          update_variant: update_variant,
          json: self.jsonProduct,
          has_unselected_options: self.product.querySelector("[data-disable-auto-select]") ? true : false,
        });
        var variantId = update_variant.id;
        self.product.querySelectorAll("[data-js-product-variants] option").forEach(function(element){
          if (element.getAttribute('value') == variantId) {
            element.setAttribute("selected", true);
            element.classList.add('selected');
          } else {
            element.setAttribute("selected", false);
            element.classList.remove('selected');
          }
        });
      } else {
        if(inventoryQty) inventoryQty.style.display = 'none';
      }
      if (!document.body.classList.contains("initSwatch")) {
        option.classList.add('active');
        for (let sibling of option.parentNode.children) {
            if (sibling !== option) sibling.classList.remove('active');
        }
        document.body.classList.add("initSwatch");
        optionValue = self.addslashes(optionValue);
        if (option.closest(".sticky_variant_content")) {
          let singleOption = document.body.querySelector(`#product-single [data-position="${optionItem.dataset.position}"] [value="${optionValue}"]`);
          if(singleOption) singleOption.click();
        } else if (option.closest("#product-single")) {
          let stickyOption = document.body.querySelector(`.sticky_variant_content [data-position="${optionItem.dataset.position}"] [value="${optionValue}"]`);
          if(stickyOption) stickyOption.click();
        }
      }
      document.body.classList.remove("initSwatch");
      if (update_variant) {
        document.body.dispatchEvent(
          new CustomEvent("afterVariantUpdated", { detail: update_variant })
        );
      }
    }

    addslashes( str ) {
        return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
    }

    updatePossibleVariants(data) {
      var self = this;
      const selectedOptionOneVariants = data.json.variants.filter((variant) => {
        return (
          self.querySelector(
            '.cms-option-item[data-position="1"] .product-options__value.active > input, .cms-option-item[data-position="1"] option.active'
          ).value === variant.option1
        );
      });
      function setInputAvailability(elementList, availableValuesList) {
        elementList.forEach((element) => {
          const value = element.matches('select,option,input') ? element.value: element.querySelector('input').value;
          const availableElement = availableValuesList.includes(value);
          element.classList.toggle("disabled", !availableElement);
          if (element.matches("option")) {
            if (availableElement) {
              element.removeAttribute("disabled");
            } else {
              element.setAttribute("disabled", !availableElement);
            }
          }
        });
      }
      const inputWrappers = [...self.querySelectorAll(".cms-option-item")];
      inputWrappers.forEach((option, index) => {
        if (index === 0) return;
        const optionInputs = [
          ...option.querySelectorAll(self.settings.optionSelector),
        ];
        const previousOptionSelected = inputWrappers[index - 1].querySelector(
          ".active > input, option.active"
        ).value;
        const availableOptionInputsValue = selectedOptionOneVariants
          .filter(
            (variant) =>
              variant.available &&
              variant[`option${index}`] === previousOptionSelected
          )
          .map((variantOption) => variantOption[`option${index + 1}`]);
        setInputAvailability(optionInputs, availableOptionInputsValue);
      });
    }
    switchVariant(data) {
      data.update_variant.metafields = Object.assign({}, data.json.metafields);
      data.json.variants_metafields.forEach(function(variant){
        if (+variant.variant_id === +data.update_variant.id) {
          data.update_variant.metafields = Object.assign(
            true,
            data.update_variant.metafields,
            variant.metafields
          );
        }
      });
      this.updateContent(data);
    }
    getDefaultVariant(json) {
      var defaultVariant = {};
      json.variants.forEach(function(variant){
        if (+variant.id === +json.default_variant_id) {
          Object.assign(defaultVariant, variant);
          return false;
        }
      });
      return defaultVariant;
    }
    getVariantById(variantId) {
      var variantX = {};
      if (this.jsonProduct.hasOwnProperty("variants")) {
        this.jsonProduct.variants.forEach(function(variant){
          if (variant.hasOwnProperty("id") && variant.id == variantId) {
            variantX = variant;
            return false;
          }
        });
      }
      return variantX;
    };
    updateContent(data) {
      this.product.setAttribute('data-product-variant-id', data.update_variant.id);
      this.updateFormVariantInput(data);
      this.updatePrice(data);
      this.updateLabel(data);
      this.updateDynamicCheckout(data);
      this.updateSKU(data);
      this.updateLinks(data);
      this.switchImage(data);
      if (!data.dontUpdateVariantsSelect) {
        this.updateVariantsSelect(data);
      }
      if(!this.productSingle) return;
      this.updateAvailability(data);
      this.updateBarcode(data);
      this.updateHistory(data);
      this.updateCountdown(data);
      this.updateInStockOutStock(data);
      this.updateStockCountdown(data);
    }
    updateFormVariantInput(data) {
      var input = this.product.querySelector("[data-js-product-variant-input]");
      if(input){
        input.value = data.update_variant.id;
        input.dispatchEvent(new Event('input'));
      }
    }
    updateVariantsSelect(data) {
      var select = this.product.querySelector("[data-js-product-variants]");
      if (select) {
        select.value = data.update_variant.id;
        select.dispatchEvent(new Event('change'));
      }
    }
    updateAddToCart(data) {
      var buyitnow = this.product.querySelector("[data-buyitnow-button]"),
        quantity = this.product.querySelector("[data-product-quantity]"),
        buttonsoldout = this.product.querySelector("[data-js-product-button-sold-out]"),
        buttonCart = this.product.querySelector(".add-to-cart, .js_edit_cart_button"),
        qtyNum = this.getQuantity(data.update_variant.id),
        qtyInput = this.product.querySelector("input.js_qty");
      if (buttonCart && !data.update_variant) {
        buttonCart.setAttribute("disabled", "disabled");
        var textCart = buttonCart.querySelector(".text, .txt_add_to_cart");
        if(textCart) textCart.innerHTML = window.products.out_of_stock;
        if(qtyInput) qtyInput.dataset.max = 0;
        return;
      }
      var textCart = this.product.querySelector(".add-to-cart .text, .txt_add_to_cart"),
          textInCart;
      if (qtyNum > 0) {
        if(qtyInput){
          /* Shopify exist value < 0 */
          if (parseInt(qtyInput.value) > parseInt(qtyNum)) qtyInput.value = qtyNum;
          qtyInput.dataset.max = qtyNum;
        }
        textInCart = window.products.add_to_cart;
      } else if (data.update_variant.available) {
        textInCart = window.products.pre_order;
        if(qtyInput) qtyInput.dataset.max = '';
      } else {
        textInCart = window.products.out_of_sockt;
        if(qtyInput) qtyInput.dataset.max = 0;
      }
      if(textCart) textCart.innerHTML = textInCart;
      if (buttonCart && !data.has_unselected_options) {
        buttonCart.dataset.pid = data.update_variant.id;
        this.setElementVisibility(buttonCart, data.update_variant.available);
        if(buyitnow) this.setElementVisibility(buyitnow, data.update_variant.available);
        if(quantity) this.setElementVisibility(quantity, data.update_variant.available);
        if(buttonsoldout) this.setElementVisibility(buttonsoldout, !data.update_variant.available);
        if(data.update_variant.available){
          buttonCart.removeAttribute("disabled");
          buttonCart.removeAttribute("data-button-status");
        }else{
          buttonCart.setAttribute("disabled", "disabled");
          buttonCart.setAttribute("data-button-status", "sold-out");
        }
      }
    }
    updateDynamicCheckout(data) {
      var button = this.product.querySelector("[data-js-product-button-dynamic-checkout]");
      if (button && !data.has_unselected_options) {
        this.setElementVisibility(button, data.update_variant.available);
      }
    }
    updatePrice(data) {
      var price = this.product.querySelector('[data-js-product-price]'),
        saleDetails = this.product.querySelector('[data-js-product-price-sale-details]'),
        details = '';
      if (price) {
        this.setPrice(
          price,
          data.update_variant.price,
          data.update_variant.compare_at_price
        );
      }
      if (saleDetails) {
        var variantsDetail = data.json.variants_price_sale_details ? data.json.variants_price_sale_details : [];
        variantsDetail.forEach(function(variant){
          if (+variant.id === +data.update_variant.id) {
            details = variant.details;
          }
        });
        saleDetails.innerHTML = details;
        this.setElementVisibility(saleDetails, details);
      }
    }
    setPrice(element, price, compare_at_price) {
      price = +price;
      compare_at_price = +compare_at_price;
      var html = '',
          sale = (compare_at_price && compare_at_price > price);
      if(element){
        element.classList.add('price--sale');
      }else {
        element.classList.remove('price--sale');
      }
      html += Shopify.formatMoney(price, theme.moneyFormat);
      if (sale) {
        html += `<span class="compare">${Shopify.formatMoney(compare_at_price, theme.moneyFormat)}</span>`;
      }
      element.innerHTML = html;
      var priceHtml = element.closest(".price");
      if(!priceHtml) return;
      var spanLast = priceHtml.querySelector("span:last-child");
      if (spanLast && spanLast.classList.contains('compare')) {
        spanLast.style.display = 'none';
      }
    }
    switchImage(data) {
        var imageContainer = this.product.querySelector('[data-js-product-image]');
        if(!imageContainer) return;
        var image = imageContainer.querySelector('[data-image-lazy], .default_media'),
          imageHover = imageContainer.querySelector('[data-image-effect], .secondary_image'),
          featuredImage = data.update_variant.featured_image;
        if (!featuredImage || !featuredImage.src) {
            if (data.json.images[0]) {
                featuredImage = data.json.images[0];
            }
        }
        if (featuredImage && featuredImage.src && +featuredImage.id !== +image.getAttribute('data-image-id')) {
            var width = imageContainer.offsetWidth,
              masterSrc = Shopify.resizeImage(featuredImage.src, 'grande'),
              src = Shopify.resizeImage(featuredImage.src, Math.ceil(width) + 'x') + ' 1x, ' + Shopify.resizeImage(featuredImage.src, Math.ceil(width) * 2 + 'x') + ' 2x';
            this.changeSrc(image, imageHover, src, featuredImage.id, masterSrc);
        }
    }
    changeSrc(image, imageHover, srcset, id, masterSrc) {
        var id = id || 'null';
        image.setAttribute('srcset', srcset);
        image.setAttribute('data-image-id', id);
        if(imageHover && imageHover.matches('img') && masterSrc){
            image.setAttribute('src', masterSrc);
        }
        if(!imageHover) return;
        imageHover.style.display = 'none';
        if(imageHover.matches('img')){
          imageHover.setAttribute('src', masterSrc);
        }else{
          imageHover.style.setProperty('background-image', `url(${masterSrc})`);
          imageHover.style.display = 'block';
        }
    }
    updateLabel(data) {
      /* Sale Label */
      var labelSale = this.product.querySelector("[data-js-product-label-sale]");
      if (labelSale) {
        let html = "",
          isSale = (data.update_variant.compare_at_price && data.update_variant.compare_at_price > data.update_variant.price);
        if (isSale) {
          var percent = Math.ceil(
            100 -
              (data.update_variant.price * 100) /
                data.update_variant.compare_at_price
          );
          html += window.products.label.sale;
          html = Shopify.addValueToString(html, {
            percent: percent,
          });
        }
        this.setElementVisibility(labelSale, isSale, 'important');
        labelSale.innerHTML = html;
      }
      /* Hot Label */
      var labelHot = this.product.querySelector("[data-js-product-label-hot]"),
          isHot = (data.update_variant.metafields.labels && data.update_variant.metafields.labels.hot);
      if (labelHot) {
        this.setElementVisibility(labelHot, isHot, 'important');
      }
      /* New Label */
      var labelNew = this.product.querySelector("[data-js-product-label-new]"),
          isNew = (data.update_variant.metafields.labels && data.update_variant.metafields.labels.new);
      if (labelNew) {
        this.setElementVisibility(labelNew, isNew, 'important');
      }

    }
    updateInStockOutStock(data) {
      let available = this.product.querySelector("#js-pr-available");
      if (available) {
        this.setElementVisibility(available, data.update_variant.available);
      }
      /* Unavailable Label */
      let unavailable = this.product.querySelector("#js-pr-unavailable");
      if (unavailable) {
        this.setElementVisibility(unavailable, !data.update_variant.available);
      }
    }
    updateCountdown(data) {
      var countdown = this.product.querySelector("[data-js-product-countdown]"),
        date = (data.update_variant.metafields.countdown && data.update_variant.metafields.countdown.date) ? data.update_variant.metafields.countdown.date : false;
      if (countdown) {
        var countdown_init = countdown.querySelector(".js-countdown");
          need_coundown = (date && data.update_variant.compare_at_price && data.update_variant.compare_at_price > data.update_variant.price);
        if (need_coundown && countdown_init.dataset.date !== date) {
            /* code update countdown here */
        }
        if (!need_coundown) {
          countdown.classList.add("d-none-important");
        }
      }
    }
    updateSKU(data) {
      var sku = this.product.querySelector("[data-js-product-sku]");
      if (sku) {
        sku.querySelector("span").innerHTML = data.update_variant.sku;
        this.setElementVisibility(sku, data.update_variant.sku, 'important');
      }
    }
    updateBarcode(data) {
      var barcode = this.product.querySelector("[data-js-product-barcode]");
      if (barcode) {
        barcode.querySelector("span").innerHTML = data.update_variant.barcode;
        this.setElementVisibility(barcode, data.update_variant.barcode, 'important');
      }
    }
    updateAvailability(data) {
      var self = this,
        availability = this.product.querySelector("[data-js-product-availability]");
      if (availability) {
        var html = "",
          quantity = self.getQuantity(data.update_variant.id);
        if (data.update_variant.available) {
          html += Shopify.addValueToString(window.products.value_in_stock_html, { count: quantity });
        } else {
          html += window.product.out_of_sockt;
        }
        availability.dataset.availability = data.update_variant.available;
        var span = availability.querySelector("span");
        if(span) span.innerHTML = html;
      }
    }
    updateStockCountdown(data) {
      var stock_countdown = this.product.querySelector('[data-js-product-info-stock]');
      if(!stock_countdown) return;
      var title = stock_countdown.querySelector('[data-js-product-info-stock-title]'),
        progress = stock_countdown.querySelector('[data-js-product-info-stock-progress]'),
        min = +stock_countdown.dataset.min,
        quantity = this.getQuantity(data.update_variant.id);
      if (title) {
        title.innerHTML = Shopify.addValueToString(window.products.stock_countdown_html, {quantity: '<span class="qty">' + quantity + "</span>"});
      }
      if (progress) {
        progress.style.width = quantity / (min / 100) + "%";
      }
      this.setElementVisibility(stock_countdown, (quantity > 0 && quantity < min), 'important');
    }
    updateLinks(data) {
      var origin = decodeURIComponent(window.location.origin), 
        url =`${origin}/products/${data.json.handle}?variant=${data.update_variant.id}`;
      this.product.querySelectorAll('a[href*="products/' + data.json.handle + '"]').forEach(element => {
          element.href = url;
      });
    }
    updateHistory(data) {
      if (!data.has_unselected_options) {
        var url = `${window.location.href.split("?")[0]}?variant=${data.update_variant.id}`;
        history.replaceState({ foo: "product" }, url, url);
      }
    }
  }

  customElements.define("product-options", ProductOptions);
}