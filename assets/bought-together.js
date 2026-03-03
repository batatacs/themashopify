if (!customElements.get("bought-together")) {
  class BoughtTogether extends HTMLElement {
    constructor() {
      super();
      this.settings = {
        MainRequire: true,
      };
      var self = this;
      document.addEventListener("DOMContentLoaded", function (event) {
        self.init();
      });
      document.addEventListener("BoughtTogetherUpdated", function (event) {
        self.init();
      });
      document.dispatchEvent(
        new CustomEvent("BoughtTogetherReady", { detail: self })
      );
    }

    uniqid(length) {
      length = length || 10;
      var result = "",
        characters = "abcdefghijklmnopqrstuvwxyz0123456789",
        charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }

      return result;
    }

    init() {
      var self = this;
      if (this.classList.contains("bought-together-init")) return;
      this.classList.add("bought-together-init");
      this.renderElement();
      var checkbox = self.querySelectorAll(
          'input[name="bought-together-checkbox"]'
        ),
        number = checkbox.length;
      checkbox.forEach((checbox) => {
        checbox.addEventListener("click", function (e) {
          if (event.currentTarget.checked) {
            number++;
            this.closest(".item-product").classList.add("selected-product");
          } else {
            number--;
            this.closest(".item-product").classList.remove("selected-product");
          }
          self.renderDiscountAnnouncement(number);
          self.renderPrice();
        });
      });
      document.body.addEventListener("afterVariantUpdated", function (e) {
        self.renderPrice();
      });
    }

    datasetToObject(dataset) {
      return JSON.parse(JSON.stringify(dataset), (key, value) => {
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      });
    }

    renderElement() {
      var self = this,
        data = this.datasetToObject(this.dataset);
      this.querySelector(".add-bought-together").addEventListener(
        "click",
        function () {
          this.classList.add("loading");
          var _self = this,
            items = [];
          self.querySelectorAll(".product-item").forEach((product) => {
            let boughtTogether = product.querySelector('input[name="bought-together-checkbox"]');
            if(boughtTogether && boughtTogether.checked){
              let addToCartForm = product.querySelector('form[action$="/cart/add"]'),
                formData = new FormData(addToCartForm);
              items.push(Object.fromEntries(formData));
            }
          });
          if (!items.length) {
            return;
          }
          fetch(window.Shopify.routes.root + "cart/add.js", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: `application/json`,
            },
            body: JSON.stringify({
              items: items,
            }),
          })
            .then((response) => response.json())
            .then((product) => {
              _self.classList.remove("loading");
              document.body.dispatchEvent(
                new CustomEvent("update:miniCart", {
                  bubbles: true,
                })
              );
            })
            .catch((error) => {});
          document.body.addEventListener(
            "contentUpdated",
            function () {
              document
                .querySelector('.push_side[data-id="#js_cart_popup"]')
                .click();
            },
            { once: true }
          );
        }
      );
    }

    renderPrice() {
      var self = this,
        totalPrice = 0,
        totalComparePrice = 0;
      self.querySelectorAll(".product-item").forEach((product) => {
        var addToCartForm = product.querySelector('form[action$="/cart/add"]'),
          formData = new FormData(addToCartForm);
        if (!formData.get("bought-together-checkbox")) return;
        var dataJson = product.querySelector(".data-json-product"),
          jsonProduct = dataJson
            ? JSON.parse(dataJson.innerHTML)
            : product.querySelector("[data-js-product]").dataset.jsonProduct,
          productId = formData.get("id");
        jsonProduct.variants.forEach((variant) => {
          if (productId == variant.id) {
            totalPrice = totalPrice + parseFloat(variant.price);
            totalComparePrice = variant.compare_at_price
              ? totalComparePrice + variant.compare_at_price
              : totalComparePrice + variant.price;
          }
        });
      });
      if (totalComparePrice <= totalPrice) {
        self
          .querySelector(".info-bought-together")
          .classList.add("hidden-save");
      } else {
        self
          .querySelector(".info-bought-together")
          .classList.remove("hidden-save");
      }

      self.querySelector(".special-price").innerHTML = Shopify.formatMoney(
        totalPrice,
        theme.moneyFormat
      );
      self.querySelector(".compare-price").innerHTML = Shopify.formatMoney(
        totalComparePrice,
        theme.moneyFormat
      );
      self.querySelector(".save-price").innerHTML = Shopify.formatMoney(
        totalComparePrice - totalPrice,
        theme.moneyFormat
      );
    }

    renderDiscountAnnouncement(number) {
      var announcement = this.querySelector(".alo-discount-announcement");
      if (!announcement) return;
      var aloDiscount = announcement.querySelectorAll(".alo-discount"),
        msg = announcement.querySelector(".qty_item_" + number);
      for (let discount of aloDiscount) {
        if (discount !== msg) discount.classList.add("hidden");
      }
      if (msg) {
        msg.classList.remove("hidden");
      }
    }

    appendStyle(css) {
      var style = document.createElement("style");
      style.setAttribute("type", "text/css");
      style.textContent = css;
      document.head.appendChild(style);
    }
  }

  customElements.define("bought-together", BoughtTogether);
}
