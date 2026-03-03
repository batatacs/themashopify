/* action-condition.js */
if (!customElements.get("action-condition")) {
    class ActionCondition extends HTMLElement {
        constructor() {
            super();
            this.onMutation = this.onMutation.bind(this);
        }
        connectedCallback() {
            this.load();
            this.observer = new MutationObserver(this.onMutation);
            this.observer.observe(this, {
                childList: true,
                subtree: true
            });
        }
        disconnectedCallback() {
            this.observer.disconnect();
        }

        load() {
            var self = this,
                condition = this.querySelector('input[type="checkbox"]'),
                action = this.querySelector('.action');
            if (condition && action) {
                if(!condition.checked){
                    action.classList.add('disabled');
                }else{
                    action.classList.remove('disabled');
                }
                condition.addEventListener('change', function (event) {
                    if (event.currentTarget.checked) {
                        action.classList.remove('disabled');
                    } else {
                        action.classList.add('disabled');
                    }
                });
            }
        }
        onMutation(mutations) {
            this.load();
        }
    }

    customElements.define("action-condition", ActionCondition);
}
/* End action-condition.js */
 

/* ajax-recommendations.js */
if (!customElements.get("ajax-recommendations")) {
    class AjaxRecommendations extends HTMLElement {
        constructor() {
            super();
        }
        connectedCallback() {
            this.closeX();
            this.getProduct();
        }
        closeX() {
            this.addEventListener("click", function (event) {
                var target = event.target,
                    open = target.closest(".open-recommendations");
                if (open) {
                    if (target.matches(".close-x") || target.closest(".close-x")) {
                        open.classList.remove("open-recommendations");
                    }
                }

            });
        }
        getProduct() {
            var self = this,
                url = self.dataset.url,
                sectionId = self.dataset.sectionId,
                productId = self.dataset.productId;
            self.classList.add("init");
            fetch(`${url}&section_id=${sectionId}&product_id=${productId}`)
                .then((response) => response.text())
                .then((responseText) => {
                    var html = new DOMParser().parseFromString(responseText, "text/html"),
                        source = html.querySelector(self.tagName.toLowerCase());
                    if (source) self.innerHTML = source.innerHTML;
                });
        }
    }

    customElements.define("ajax-recommendations", AjaxRecommendations);
    customElements.define("minicart-recommendations", class extends AjaxRecommendations {});
}
/* End ajax-recommendations.js */

if (!customElements.get("shop-compare")) {
    class ShopStorage extends HTMLElement {
        constructor() {
            super();
            this.namespace = this.tagName.toLowerCase();
        }
        connectedCallback() {
            this.load()
        }

        load() {
            let self = this;
            this.storage =  window?.theme?.customer ? `${this.namespace}-customer-'${window.theme.customer.id}` : `${this.namespace}-guest`;
            self.addEventListener('click',  function (e) {
                e.preventDefault();
                var handle = self.dataset.handle;
                self.classList.add('loading');
                if (self.dataset.status === 'added') {
                    self.removeItem(handle);
                    self.dataset.status = 'none';
                    self.classList.remove('loading');
                } else {
                    self.addItem(handle);
                    self.dataset.status = 'added';
                    self.classList.remove('loading');
                }
                self.dialogModal();
            });
        }

          addItem(id, handle) {
              var storage = localStorage.getItem(this.current_storage),
                  items = storage ? JSON.parse(storage) : [],
                  item = {},
                  exist = false;
              $.each(items, function () {
                  $.each(this, function (k, v) {
                      if (v == handle) exist = true;
                  });
              });
              item[id] = handle;
              if (!exist) items.push(item);
              localStorage.setItem(this.current_storage, JSON.stringify(items));
              this.checkProductStatus();
              this.updateHeaderCount();
              var $popup = $('[data-js-popup-ajax]');
              this.update($popup);
              $('[data-js-' + this.namespace + '-count]').first().parent().trigger('click');
          }
          removeItem(id, handle) {
              var storage = localStorage.getItem(this.current_storage),
                  items = storage ? JSON.parse(storage) : [];
              $.each(items, function (i, item) {
                  $.each(item, function (k, v) {
                      if (v == handle){
                          items.splice(i, 1);
                      };
                  });
              });
              localStorage.setItem(this.current_storage, JSON.stringify(items));
              this.checkProductStatus();
              $(this.selectors.has_items)[items.length > 0 ? 'removeClass' : 'addClass']('d-none');
              $(this.selectors.dhas_items)[items.length > 0 ? 'addClass' : 'removeClass']('d-none');
              this.updateHeaderCount();
              var $popup = $('[data-js-popup-ajax]');
              this.update($popup);
          }
      
        update($popup, callback) {
              var _ = this,
                  storage = localStorage.getItem(this.current_storage),
                  items   = storage ? JSON.parse(storage) : [],
                  $content = $popup.find('.popup-' + this.namespace + '_content'),
                  $empty  = $popup.find('.popup-' + this.namespace + '_empty'),
                  $items  = $popup.find('.popup-' + this.namespace + '_items'),
                  $count  = $popup.find('[data-js-popup-' + this.namespace + '-count]');
              $content[items.length > 0 ? 'removeClass' : 'addClass']('d-none');
              $empty[items.length > 0 ? 'addClass' : 'removeClass']('d-none');
              if (items.length) {
                  var data = this._getProducts(items, function (data) {
                      _._resultToHTML($items, data, callback);
                  });
              } else {
                  $items.html('');
                  if (callback) {
                      callback();
                  }
              }
        }
        dialogModal() {
              var namespace = this.namespace,
                  storage = localStorage.getItem(theme.StoreLists.lists[namespace].current_storage),
                  items = storage ? JSON.parse(storage) : [],
                  query = [];
              for (var i = 0; i < items.length; i++) {
                Object.entries(items[i]).forEach(entry => {
                  query.push('handle' + ':' + entry[1]);
                });
              }
              query = query.join(' OR ');
              var params = {
                      q: query,
                      type: 'product',
                      'options[unavailable_products]': 'last',
                      view: namespace
                  },
                  queryString = Object.keys(params).map(key => {
                      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key])
                  }).join('&');
              fetch(`${Shopify.routes.root}search?${queryString}`)
                .then((response) => response.text())
                .then(responseText => {
                   var html = new DOMParser().parseFromString(responseText, 'text/html');
                  document.body.insertAdjacentHTML("beforeend", `
                    <dialog-modal>
                        <dialog data-autoplay modal-mode="mega" data-destroy="true" class="${namespace}-modal">
                            ${responseText}
                        </dialog>
                    </dialog-modal>
                  `);
              }).catch(err => {
                    console.log(err);
              });
          }
      
    }
    customElements.define("shop-compare", ShopStorage);
    customElements.define("shop-wishlist", class extends ShopStorage { });
}

/* count-down.js */
if (!customElements.get('count-down')) {
    class CountDown extends HTMLElement {

        constructor() {
            super();
            this.settings = {
                layout: '<span class="box-count day"><span class="number">0</span><span class="text">Days</span></span><span class="box-count hrs"><span class="number">0</span><span class="text">Hrs</span></span><span class="box-count min"><span class="number">0</span><span class="text">Mins</span></span><span class="box-count secs"><span class="number">0</span> <span class="text">Secs</span></span>',
                leadingZero: true,
                countStepper: -1, // s: -1 // min: -60 // hour: -3600
                timeout: '<span class="timeout">Time out!</span>',
            }
            var $this = this;
            document.addEventListener("CountDownUpdated", function (event) {
                $this.init();
            });
            document.dispatchEvent(new CustomEvent('CountDownReady', {detail:$this}));
        }

        connectedCallback() {
             this.init();
        }

        uniqid(length) {
            length = length || 10;
            var result = "",
                characters = "abcdefghijklmnopqrstuvwxyz0123456789",
                charactersLength = characters.length;
            for (var i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }

            return result;
        }

        init() {
            if (this.classList.contains("count-down-init")) return;
            var data  = this.datasetToObject(this.dataset);
            Object.assign(this.settings, data);
            this.classList.add('count-down-init');
            this.renderTimer();
        }

        datasetToObject(dataset) {
            return JSON.parse(JSON.stringify(dataset), (key, value) => {
                if (value === "null") return null;
                if (value === "true") return true;
                if (value === "false") return false;
                if (!isNaN(value)) return Number(value);
                try {
                return JSON.parse(value);
                } catch (e) {
                return value;
                }
            });
        }
      
        renderTimer() {
            var data  = this.datasetToObject(this.dataset);
            if(!data.timer){
                var date = new Date(),
                    year = ('y' in data) ? Number(data.y.toString().replace("yyyy", date.getFullYear())) : date.getFullYear(),
                    mm   = ('m' in data) ? Number(data.m.toString().replace("mm", date.getMonth() + 1)) : date.getMonth() + 1,
                    dd   = ('d' in data) ? Number(data.d.toString().replace("dd", date.getDate() + 1)) : date.getDate() + 1,
                    hh   = ('h' in data) ? Number(data.h.toString().replace("hh", date.getHours())) : date.getHours(),
                    ii   = ('i' in data) ? Number(data.i.toString().replace("ii", date.getMinutes())) : date.getMinutes(),
                    ss   = ('s' in data) ? Number(data.s.toString().replace("ss", date.getSeconds())) : date.getSeconds(),
                    newDate = new Date(year, mm -1, dd, hh, ii, ss); // the month is 0-indexed

                    if('plusHour' in data) newDate.setHours(newDate.getHours() + Number(data.plusHour));
                    if('plusMin' in data) newDate.setMinutes(newDate.getMinutes() + Number(data.plusMin));
                    if('plusSec' in data) newDate.setSeconds(newDate.getSeconds() + Number(data.plusSec));

                data.timer = newDate;
            }
            var gsecs = data.timer;
            if (typeof gsecs === 'string') gsecs = gsecs.replace(/-/g, '/');
            if (isNaN(gsecs) || typeof gsecs === 'object') {
                var start = Date.parse(new Date());
                var end = isNaN(gsecs) ? Date.parse(gsecs) : gsecs;
                var end = (typeof gsecs === 'object') ? gsecs : Date.parse(gsecs);
                gsecs = (end - start) / 1000;
            }
            if (gsecs > 0) {
                var isLayout = this.querySelector('.min .number');
                if (!isLayout) {
                    this.innerHTML = this.settings.layout;                                   
                }
                this.CountBack(gsecs);
            } else {
                this.classList.add('the-end');
                if(this.settings.timeout) this.innerHTML = this.settings.timeout;
            }
        }

        calcage(secs, num1, num2) {
            var s = ((Math.floor(secs / num1) % num2)).toString();
            if (this.settings.leadingZero && s.length < 2) s = "0" + s;
            return "<b>" + s + "</b>";
        }

        CountBack(secs) {
            var $this = this,
                countStepper = this.settings.countStepper,
                setTimeOutPeriod = (Math.abs(countStepper) - 1) * 1000 + 990;
            var count = setInterval(function timer() {
                if (secs < 0) {
                    clearInterval(count);
                    $this.classList.add('the-end');
                    if($this.settings.timeout) $this.innerHTML = $this.settings.timeout;
                    return;
                }
                var day  = $this.querySelector('.day .number'),
                    hour = $this.querySelector('.hour .number, .hrs .number'),
                    min  = $this.querySelector('.min .number'),
                    sec  = $this.querySelector('.sec .number, .secs .number');
                if(day)  day.innerHTML  = $this.calcage(secs, 86400, 100000);
                if(hour) hour.innerHTML = $this.calcage(secs, 3600, 24);
                if(min)  min.innerHTML  = $this.calcage(secs, 60, 60);
                if(sec)  sec.innerHTML  = $this.calcage(secs, 1, 60);
                secs += countStepper;
                return timer;
            }(), setTimeOutPeriod);
        }

        appendStyle(css) {
            var style = document.createElement('style');
                style.setAttribute('type', 'text/css');
                style.textContent = css;
            document.head.appendChild(style);
        }

    }

    customElements.define("count-down", CountDown);
}
/* End count-down.js */
 

/* count-up.js */
if (!customElements.get('count-up')) {
    class CountUp extends HTMLElement {

        constructor() {
            super();
            this.settings = {
                min: 0,
                max: 100,
                step: 1,
                speed: 1,
                infinite: true
            }
        }

        connectedCallback() {
             this.init();
        }

        init() {
            if (this.classList.contains("count-up-init")) return;
            var self = this,
                data  = this.datasetToObject(this.dataset);
                Object.assign(this.settings, data);
            this.classList.add('count-up-init');
            if ("IntersectionObserver" in window) {
                let counterObserver = new IntersectionObserver(function(entries, observer) {
                    entries.forEach(function(entry) {
                        if (entry.isIntersecting) {
                            self.renderCounter();
                            self.classList.add('inView');
                            if(!data.infinite) counterObserver.unobserve(entry.target);
                        }else{
                            self.classList.remove('inView');
                        }
                    });
                });
                counterObserver.observe(self);                                  
            } else {
                self.renderCounter();
            }
        }

        datasetToObject(dataset) {
            return JSON.parse(JSON.stringify(dataset), (key, value) => {
                if (value === "null") return null;
                if (value === "true") return true;
                if (value === "false") return false;
                if (!isNaN(value)) return Number(value);
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return value;
                }
            });
        }

        renderCounter(counter){
            var self = this,
                min = this.settings.min,
                max = this.settings.max,
                step = this.settings.step,
                speed = this.settings.speed,
                counter = counter || min,
                element = this.querySelector('.counter');
            counter = counter + step;
            if (counter <= max) {
                element.innerHTML = counter.toString();
                setTimeout(function(){
                    self.renderCounter(counter);
                }, speed)    
            }else{
                element.innerHTML = max.toString();
            } 
        }

    }

    customElements.define("count-up", CountUp);
}
/* End count-up.js */

if (!customElements.get("customer-visitors")) {
    customElements.define("customer-visitors", class extends HTMLElement {
        constructor() {
            super();
        }
        connectedCallback() {
            this.load()
        }

        randomInteger(min, max) {
            return Math.round(min - 0.5 + Math.random() * (max - min + 1));
        };

        load() {
            var self = this,
                counter = self.querySelector('[data-js-counter]'),
                min = self.dataset.min,
                max = self.dataset.max,
                interval_min = self.dataset.intervalMin,
                interval_max = self.dataset.intervalMax,
                stroke = +self.dataset.stroke,
                current_value,
                new_value;
            self.classList.add('visitors--processing');
            function update() {
                setTimeout(function () {
                    if (!self.classList.contains('visitors--processing')) {
                        return;
                    }
                    current_value = +counter.textContent;
                    new_value = self.randomInteger(min, max);
                    if (Math.abs(current_value - new_value) > stroke) {
                        new_value = new_value > current_value ? current_value + stroke : current_value - stroke;
                        new_value = self.randomInteger(current_value, new_value);
                    }
                    counter.textContent = new_value;
                    update();
                }, self.randomInteger(interval_min, interval_max) * 1000);
            };
            update();
        }
    });
}

if (!customElements.get("dialog-modal")) {

    customElements.define("dialog-modal", class extends HTMLElement {
        constructor() {
            super();
        }
        connectedCallback() {
            var self = this;
            this.dialog = this.querySelector('dialog');
            if(this.dialog){
                if (this.dialog.hasAttribute('data-autoplay')) {
                    var autoplay = this.dialog.dataset.autoplay || 0;
                    this.dialog.classList.add('opening');
                    setTimeout(function () {
                        self.load();;
                    }, autoplay);
                }
            }else{
                let trigger = this.querySelectorAll('[dialog-trigger]');
                if(trigger.length){
                    trigger.forEach(element => {
                        element.addEventListener('click', (event) => {
                            event.preventDefault();
                            self.renderTemplate();
                            if(!element.classList.contains('init')){
                                self.renderTrigger(element);
                                element.classList.add('init');
                            }
                            self.load();
                        })
                    })
                }else{
                    let template = this.querySelector('template'),
                        dialog = template.content.querySelector('dialog');
                    if (dialog.hasAttribute('data-autoplay')) {
                        var autoplay = dialog.dataset.autoplay || 0;
                        dialog.classList.add('opening');
                        setTimeout(function () {
                            self.renderTemplate()
                            self.load();;
                        }, autoplay);
                    }
                }
            }
        }

        renderTrigger(element)
        {
            let self = this;
            self.dialog = self.querySelector('dialog');
            let src = element.getAttribute('href');
            if(src){
                if (src.includes('youtube.com/')) {
                    let videoId = self.getYoutubeID(src);
                    src = `//www.youtube.com/embed/${videoId}?autoplay=1`;
                    self.dialog.insertAdjacentHTML('afterbegin', `<iframe class="dialog-iframe" src="${src}" frameborder="0" allowfullscreen></iframe>`);
                } else if (src.includes('vimeo.com/')) {
                    let videoId = self.getVimeoID(src);
                    src = `//player.vimeo.com/video/${videoId}?autoplay=1`
                    self.dialog.insertAdjacentHTML('afterbegin', `<iframe class="dialog-iframe" src="${src}" frameborder="0" allowfullscreen></iframe>`);
                } else {
                    if(!self.dialog){
                        let template = this.querySelector(src) || document.querySelector(src);
                        self.dialog = template.content.querySelector('dialog')
                        self.append(self.dialog)
                    }
                }
            }

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

        /* Create open event */
        createOpenEvent(dialog) {
            var self = this;
            const observer = new MutationObserver(records => {
                records.forEach(async record => {
                    if (record.attributeName !== "open") { return; }
                    if (record.target.hasAttribute("open")) {
                        const dialog = record.target
                        dialog.removeAttribute('inert');
                        dialog.dispatchEvent(new Event('open'));
                        await self.animationsComplete(dialog);
                        dialog.classList.remove('opening');
                        dialog.dispatchEvent(new Event('opened'));
                    }
                });
            });

            observer.observe(dialog, { attributes: true });
        }

        dialogRender(events) {
            
        }

        getVimeoID(url) {
            var regExp = /^.*vimeo.com\/(\d+)($|\/)/;
            var match = url.match(regExp);
            return match ? match[1] : false;
        }

        getYoutubeID(url) {
            var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
            var match = url.match(regExp);
            return (match && match[7].length == 11) ? match[7] : false;
        }

        load() {
            var self = this,
                dialog = this.querySelector('dialog');

            if(!dialog) return;
            if(!dialog.classList.contains('init')){
                dialog.append(this.renderButtonX());
                dialog.classList.add('init');
            }
            if (dialog.hasAttribute('data-match-media') && !window.matchMedia(dialog.dataset.matchMedia).matches) return;
            self.cookie = (dialog.dataset.cookie && typeof Cookies !== 'undefined');
            if (self.cookie && Cookies.get(dialog.dataset.cookie) == 'true') return;

            this.createOpenEvent(dialog);
            dialog.addEventListener("open", () => {
                self.onOpen();
            });
            dialog.addEventListener("opened", () => {
                self.afterOpen();
            });

            dialog.showModal();

            dialog.addEventListener('click', function (event) {
                var rect = dialog.getBoundingClientRect(),
                    isInDialog = (rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
                        rect.left <= event.clientX && event.clientX <= rect.left + rect.width);
                if (!isInDialog) {
                    dialog.close();
                }
            });
            dialog.querySelectorAll(".close-x").forEach((element) => {
                element.addEventListener("click", (event) => {
                    dialog.close();
                });
            });
            dialog.addEventListener("close", (event) => {
                if (dialog.querySelector('.do-not-show-again input:checked')) {
                    dialog.dataset.expires = 365;
                }
                if (self.cookie) {
                    Cookies.set(dialog.dataset.cookie, 'true', { expires: Number(dialog.dataset.expires), path: '/' });
                }
                self.dialogClose(event);
            });
        }

        // wait for all dialog animations to complete their promises
        async animationsComplete(dialog) {
            await Promise.allSettled(
                dialog.getAnimations().map(animation =>
                    animation.finished));
        }

        async dialogClose({ target: dialog }) {
            dialog.setAttribute('inert', '');
            dialog.classList.add('closing');
            await this.animationsComplete(dialog);
            dialog.classList.remove('closing');
            dialog.dispatchEvent(new Event('closed'));
            if (dialog.dataset.destroy) {
                this.destroy();
            }
        }

        renderButtonX()
        {
            let button = document.createElement("span");
            button.classList.add('close-x', 'close');
            button.textContent = 'x';
            return button;
        }

        renderTemplate() {
            /* reuiqre in template must exist tag dialog */
            let template = this.querySelector('template');
            if (template){
                template.parentNode.replaceChild(template.content, template);
            }
        }

        destroy() {
            this.remove();
        }

        onOpen() {

        }

        afterOpen() {

        }

    });
}

/* filter-search.js */
if (!customElements.get('filter-search')) {
    class FilterSearch extends HTMLElement {
        constructor() {
            super();
        }

        connectedCallback() {
            if(!this.classList.contains('ajax')) this.initialized();
        }

        uniqid(length) {
            length = length || 10;
            var result = "",
            characters = "abcdefghijklmnopqrstuvwxyz0123456789",
            charactersLength = characters.length;
            for (var i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            return result;
        }

        datasetToObject(dataset) {
            return JSON.parse(JSON.stringify(dataset), (key, value) => {
                if (value === "null") return null;
                if (value === "true") return true;
                if (value === "false") return false;
                if (!isNaN(value)) return Number(value);
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return value;
                }
            });
        }

        initialized() {
            let groups = this.querySelectorAll(".group"),
                config = this.datasetToObject(this.dataset);
            this.querySelector(".search").addEventListener("keyup" , function(event){
                let filterValue = event.target.value.toUpperCase();
                groups.forEach(group => {
                    let items = group.querySelectorAll('.item a'),
                        show = config.showEmpty;
                    items.forEach(item => {
                        if (item.textContent.toUpperCase().indexOf(filterValue) > -1) {
                            item.parentElement.style.display = "";
                            show = true;
                        } else {
                            item.parentElement.style.display = "none";
                        }
                    })
                    if(show){
                        group.style.display = "";
                    }else{
                        group.style.display = "none";
                    }
                });
            });
        }
    }
    customElements.define("filter-search", FilterSearch);
}
/* End filter-search.js */
 

/* image-comparison.js */
if (!customElements.get('image-comparison')) {
  class ImageComparison extends HTMLElement {
    clicked = 0;
    img;
    slider;
    width;
    height;
    constructor() {
      super();
      var $this = this;
      document.addEventListener("DOMContentLoaded", function (event) {
        if(!$this.classList.contains('ajax')) $this.initialized();
      });
      document.addEventListener("ImageComparisonUpdated", function (event) {
        $this.initialized();
      });
    }

    uniqid(length) {
      length = length || 10;
      var result = "",
        characters = "abcdefghijklmnopqrstuvwxyz0123456789",
        charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    }
  
    initialized() {
      var $this = this;
      this.img = this.querySelector('.img-comp-overlay');
      /* Get the width and height of the img element */
      this.width = this.img.offsetWidth;
      this.height = this.img.offsetHeight;
      /* Set the width of the img element to 50%: */
      this.img.style.width = (this.width / 2) + "px";
      /* Create slider: */
      this.slider = document.createElement("DIV");
      this.slider.setAttribute("class", "img-comp-slider");
      /* Insert slider */
      this.img.parentElement.insertBefore(this.slider, this.img);
      /* Position the slider in the middle: */
      this.slider.style.top = (this.height / 2) - (this.slider.offsetHeight / 2) + "px";
      this.slider.style.left = (this.width / 2) - (this.slider.offsetWidth / 2) + "px";
      /* Execute a function when the mouse button is pressed: */
      this.slider.addEventListener("mousedown", function(e){
        $this.slideReady(e);
      });
      /* And another function when the mouse button is released: */
      this.addEventListener("mouseup", function(e){
        $this.slideFinish();
      });
      /* Or touched (for touch screens: */
      this.slider.addEventListener("touchstart", function(e){
        $this.slideReady(e);
      });
       /* And released (for touch screens: */
      this.addEventListener("touchend", function(e){
        $this.slideFinish();
      });
    }

    slideReady(e) {
      e.preventDefault();
      var $this = this;
      /* The slider is now clicked and ready to move: */
      this.clicked = 1;
      /* Execute a function when the slider is moved: */
      this.addEventListener("mousemove", function(e){
          $this.slideMove(e);
      });
      this.addEventListener("touchmove", function(e){
          $this.slideMove(e);
      });
    }
    slideFinish() {
      /* The slider is no longer clicked: */
      this.clicked = 0;
    }
    slideMove(e) {
      var pos;
      /* If the slider is no longer clicked, exit this function: */
      if (this.clicked == 0) return false;
      /* Get the cursor's x position: */
      pos = this.getCursorPos(e);
      /* Prevent the slider from being positioned outside the image: */
      if (pos < 0) pos = 0;
      if (pos > this.width) pos = this.width;
      /* Execute a function that will resize the overlay image according to the cursor: */
      this.slide(pos);
    }
    getCursorPos(e) {
      var a, x = 0;
      e = (e.changedTouches) ? e.changedTouches[0] : e;
      /* Get the x positions of the image: */
      a = this.img.getBoundingClientRect();
      /* Calculate the cursor's x coordinate, relative to the image: */
      x = e.pageX - a.left;
      /* Consider any page scrolling: */
      x = x - window.pageXOffset;
      return x;
    }
    slide(x) {
      /* Resize the image: */
      this.img.style.width = x + "px";
      /* Position the slider: */
      this.slider.style.left = this.img.offsetWidth - (this.slider.offsetWidth / 2) + "px";
    }  
  }
  
  customElements.define("image-comparison", ImageComparison);
}
/* End image-comparison.js */
 

/* magic-accordion.js */
if (!customElements.get('magic-accordion')) {
    class MagicAccordion extends HTMLElement {
        constructor() {
            super();
            var self = this;
            this.defaults = {
                accordion: true,
                mouseType: false,
                leveltop: true,
                speed: 300,
                closedSign: 'collapse',
                openedSign: 'expand',
                openedActive: false,
            };
            this.settings = {};
            document.addEventListener("MagicAccordion", function (event) {
                self.initialized();
            });
        }

        connectedCallback() {
            if (!this.classList.contains('ajax')) this.initialized();
        }
        datasetToObject(dataset) {
            var object = Object.assign({}, dataset);
            for (var property in object) {
                var value = object[property];
                switch (value) {
                    case null:
                        value = null;
                        break;
                    case false:
                        value = false;
                        break;
                    case true:
                        value = true;
                        break;
                    case !isNaN(value):
                        value = Number(value);
                        break;
                    default:
                        try {
                            value = JSON.parse(value);
                        } catch (e) {
                            // value = value;
                        }
                        try {
                            value = (0, eval)('(' + value + ')');
                        } catch (e) {
                            value = value;
                        }
                }
                object[property] = value;
            }
            return object;
        }
        extend(object1, object2) {
            let obj = Object.assign({}, object1);
            return Object.assign(obj, object2);
        }
        addEventListener(events, selector, fn) {
            events = events.split(",").map((e) => e.trim());
            this.querySelectorAll(selector).forEach(element => {
                events.forEach(event => {
                    element.addEventListener(event, fn.bind(element));
                })
            });
        }
        getSibling(element) {
            let siblings = [];
            for (let sibling of element.parentNode.children) {
                if (sibling !== element) siblings.push(sibling);
            }
            return siblings;
        }
        parents(selector, element) {
            if ((element instanceof NodeList)) {
                var parents = Array.from(element).map((item) => item.closest(selector))
                    .filter((el, index, array) => {
                        /* remove null value */
                        return el ? array.indexOf(el) === index : false;
                    });
                return parents;
            } else {
                var closest = element.closest(selector);
                return closest ? [closest] : [];
            }
        }
        slideUp(target, duration = 500) {
            target.style.transitionProperty = 'height, margin, padding';
            target.style.transitionDuration = duration + 'ms';
            target.style.boxSizing = 'border-box';
            target.style.height = target.offsetHeight + 'px';
            target.offsetHeight;
            target.style.overflow = 'hidden';
            target.style.height = 0;
            target.style.paddingTop = 0;
            target.style.paddingBottom = 0;
            target.style.marginTop = 0;
            target.style.marginBottom = 0;
            window.setTimeout(() => {
                target.style.display = 'none';
                target.style.removeProperty('height');
                target.style.removeProperty('padding-top');
                target.style.removeProperty('padding-bottom');
                target.style.removeProperty('margin-top');
                target.style.removeProperty('margin-bottom');
                target.style.removeProperty('overflow');
                target.style.removeProperty('transition-duration');
                target.style.removeProperty('transition-property');
                target.classList.remove('down');
            }, duration);
        }
        slideDown(target, duration = 500) {
            target.style.removeProperty('display');
            let display = window.getComputedStyle(target).display;

            if (display === 'none')
                display = 'block';
            target.style.display = display;
            let height = target.offsetHeight;
            target.style.overflow = 'hidden';
            target.style.height = 0;
            target.style.paddingTop = 0;
            target.style.paddingBottom = 0;
            target.style.marginTop = 0;
            target.style.marginBottom = 0;
            target.offsetHeight;
            target.style.boxSizing = 'border-box';
            target.style.transitionProperty = "height, margin, padding";
            target.style.transitionDuration = duration + 'ms';
            target.style.height = height + 'px';
            target.style.removeProperty('padding-top');
            target.style.removeProperty('padding-bottom');
            target.style.removeProperty('margin-top');
            target.style.removeProperty('margin-bottom');
            window.setTimeout(() => {
                target.style.removeProperty('height');
                target.style.removeProperty('overflow');
                target.style.removeProperty('transition-duration');
                target.style.removeProperty('transition-property');
                target.classList.add('down');
            }, duration);
        }
        slideToggle(target, duration = 500) {
            if (window.getComputedStyle(target).display === 'none') {
                return slideDown(target, duration);
            } else {
                return slideUp(target, duration);
            }
        }
        initialized() {
            var self = this,
                options = this.datasetToObject(this.dataset) || {};
            this.settings = this.extend(this.defaults, options);
            options = this.settings;
            if (this.classList.contains('init')) return;
            this.classList.add('init');
            if (!options.leveltop) {
                self.addEventListener('click', 'li.level0.hasChild a.level-top', function (e) {
                    e.preventDefault();
                    self.getSibling(this).filter(element => element.matches('.arrow')).forEach(element => {
                        element.click();
                    })
                });
            }
            self.querySelectorAll("li").forEach(element => {
                let ul = element.querySelectorAll('ul');
                if (ul.length) {
                    ul.forEach(el => {
                        // el.style.display = 'none';
                    });
                    let a = element.querySelector('a');
                    if (a) a.insertAdjacentHTML("afterend", `<span class="arrow ${options.closedSign}">${options.closedSign}</p>`);
                }
            });
            if (options.openedActive) {
                self.openedAllActive();
            }
            if (options.mouseType) {
                self.addEventListener('mouseenter', 'li a', function (e) {
                    self.menuAction(this);
                });
            } else {
                self.addEventListener('click', 'li .arrow', function (e) {
                    self.menuAction(this);
                });
            }
        }

        menuAction(item) {
            var self = this,
                options = this.settings,
                parent = item.closest('li'),
                parentUl = parent.querySelectorAll('ul');
            if (parentUl.length) {
                if (options.accordion) {
                    var parentFirst = parent.querySelector("ul"),
                        parents = self.parents('ul', parent),
                        visible = Array.from(self.querySelectorAll("ul")).filter(element => element.classList.contains('down'));
                    visible.forEach(function (element, visibleIndex) {
                        if (element == parentFirst) return;
                        var close = true;
                        parents.some(function (el, parentIndex) {
                            if (parents[parentIndex] == visible[visibleIndex]) {
                                close = false;
                                return false
                            }
                            return true;
                        });
                        if (close) {
                            self.slideUp(element, options.speed);
                            self.clossedActive(element);
                        }
                    });
                }
                if (parentFirst.classList.contains('down')) {
                    self.slideUp(parentFirst, options.speed);
                    self.clossedActive(parentFirst);
                } else {
                    self.slideDown(parentFirst, options.speed);
                    self.openedActive(parentFirst);
                }
            }
        }
        clossedActive(element) {
            var options = this.settings,
                arrow = element.closest("li").querySelector("a").nextElementSibling;
            arrow.classList.add(options.closedSign);
            arrow.classList.remove(options.openedSign);
            arrow.textContent = options.closedSign;
        }
        openedActive(element) {
            var options = this.settings,
                arrow = element.closest("li").querySelector("a").nextElementSibling;
            arrow.classList.add(options.openedSign);
            arrow.classList.remove(options.closedSign);
            arrow.textContent = options.openedSign;
        }
        openedAllActive() {
            var options = this.settings;
            this.querySelectorAll("li.active").forEach(element => {
                self.parents('ul', element).forEach(ul => {
                    self.slideDown(ul, options.speed);
                    self.openedActive(ul);
                });
                self.slideDown(element.querySelector('ul'), options.speed);
                self.openedActive(element);
            });
        }
    }

    customElements.define("magic-accordion", MagicAccordion);
}
/* End magic-accordion.js */
 
if (!customElements.get("products-recently")) {
    customElements.define("products-recently", class extends HTMLElement {
        constructor() {
            super();
        }
        connectedCallback() {
            this.load()
        }

        datasetToObject(dataset)  {
            var object  = Object.assign({}, dataset);
            for (var  property  in  object) {
                var value = object[property];
                switch(value) {
                    case  null:
                        value = null;
                        break;
                    case  false:
                        value = false;
                        break;
                    case  true:
                        value = true;
                        break;
                    case  !isNaN(value):
                        value = Number(value);
                        break;
                    default:
                        try {
                            value = JSON.parse(value);
                        } catch (e) {
                            //  value = value;
                        }
                        try {
                            value = (0, eval)('(' + value + ')');
                        } catch (e) {
                            value = value;
                        }
                }
                object[property]  = value;
            }
            return  object;
        }

        load() {
            let self = this,
                products        = this.querySelector('grid-slider'),
                config          = this.datasetToObject(products.dataset),
                storage         = localStorage.getItem('product-recently'),
                items           = storage ? JSON.parse(storage) : [],
                limit           = config.limit || 10,
                currentHandle   = '',
                productsHtml    = '',
                exist           = false, 
                num             = 0,
                product         = document.querySelector('#product-single');
            if(product){
                let dataJson = product.querySelector('.data-json-product'),
                jsonProduct = dataJson ? JSON.parse(dataJson.innerHTML) : product.dataset.jsonProduct;
                currentHandle = jsonProduct?.handle ? jsonProduct.handle : '';
            }
            Object.entries(items).forEach(function(entry){
                if(num == limit) return false;
                let handle = entry[1];
                if(handle == currentHandle){
                    exist = true;
                    return;
                };
                productsHtml += '<div data-lazy-product-load class="productLazyload swiper-slide lazyload" data-include="' + Shopify.routes.root + 'products/' + handle + '/?view=pr_lazy_load"></div>';
                num++;
            });
            if(productsHtml){
                var ctrlHtml    = '',
                    navigation = config.navigation,
                    pagination = config.pagination;
                if(navigation){
                    if(typeof navigation !== 'object') navigation = (0, eval)('(' + navigation + ')');
                    ctrlHtml += '<div class="' + navigation.nextEl.replace(/^\./, "") + '"></div><div class="' + navigation.prevEl.replace(/^\./, "") + '"></div>';
                }
                if(pagination){
                    if(typeof pagination !== 'object') pagination = (0, eval)('(' + pagination + ')');
                    ctrlHtml += '<div class="' + pagination.el.replace(/^\./, "") + '"></div>';
                }
                products.innerHTML = '<div class="swiper iSwiper"><div class="swiper-wrapper">' + productsHtml + '</div>' + ctrlHtml + '</div>'
                products.classList.add('grid-slider');
                products.querySelectorAll(':scope .swiper-wrapper > *').forEach( elemnt => {
                    elemnt.classList.add('swiper-slide');
                })
                document.dispatchEvent(new Event('GridSliderUpdated'));
                self.style.display = 'block';
            }
            if(!currentHandle || exist) return;
            if(items.length > limit + 1){
                items.pop();
            }
            items.unshift(currentHandle);
            localStorage.setItem('product-recently', JSON.stringify(items));
        }
    });
}

/* product-tab.js */
if (!customElements.get("product-tab")) {
    class ProductTab extends HTMLElement {
        constructor() {
            super();
            this.settings = {
                tabSelector: ".item",
                control: '[data-control]',
                products: 'grid-slider'
            };
        }
        connectedCallback() {
            this.load();
        }
        getSibling(element) {
            let siblings = [];
            for (let sibling of element.parentNode.children) {
                if (sibling !== element) siblings.push(sibling);
            }
            return siblings;
        }
        load() {
            var self = this,
                control = this.querySelector(self.settings.control),
                products = this.querySelector(self.settings.products),
                tabActive = control.querySelector('.item.active'),
                type = tabActive.dataset.collection,
                jsTxt = control.querySelector('.js_sr_txt');
            tabActive.classList.add('loaded');
            products.querySelector('.swiper').dataset.collection = type;
            console.log(jsTxt)
            if (jsTxt) {
                jsTxt.innerHTML = control.querySelector('.active').innerHTML;
                jsTxt.addEventListener('click', (e) => {
                    control.classList.toggle('active');
                })
            }
            control.querySelectorAll('.item').forEach(element => {
                var type = element.dataset.collection;
                element.addEventListener('click', (e) => {
                    if (element.classList.contains('active')) return;
                    element.classList.add('active');
                    self.getSibling(element).forEach(el => {
                        el.classList.remove('active');
                    });
                    if (element.classList.contains('loaded')) {
                        var productCollection = products.querySelector('.swiper[data-collection="' + type + '"]');
                        self.getSibling(productCollection).forEach(el => {
                            el.classList.add('hidden');
                            el.classList.remove('active');
                        });
                        productCollection.classList.remove('hidden');
                        productCollection.classList.add('active');
                    } else {
                        self.loadProducts(type);
                        element.classList.add('loaded');
                    }
                });
            });
        }
        loadProducts(type) {
            var self = this,
                products = this.querySelector(self.settings.products),
                limit = products.dataset.limit,
                grid_classes = products.dataset.grid,
                first_col_50 = "false",
                slider = "false";
            if (!products) return;
            if (limit == undefined) limit = 10;
            if (grid_classes == undefined) grid_classes = '';
            if (products.dataset.slider != undefined) {
                slider = "true";
            }
            if (products.dataset.first50 != undefined) {
                first_col_50 = "true";
            }
            var url = Shopify.routes.root + 'collections/' + type,
                params = {
                    view: 'sorting',
                    count_limit: limit,
                    grid_classes: encodeURIComponent(grid_classes),
                    first_col_50: first_col_50,
                    slider: slider
                },
                viewAll = this.querySelectorAll('.bn_button.viewall a') || [];
            self.classList.add('loadding');
            params = Object.entries(params).map(([key, val]) => `${key}=${val}`).join('&');
            fetch(`${url}?${params}`)
                .then((response) => response.text())
                .then((responseText) => {
                    var ctrlHtml = '',
                        navigation = products.dataset.navigation,
                        pagination = products.dataset.pagination;
                    viewAll.forEach(element => {
                        element.href = url
                    });
                    if (navigation?.nextEl) {
                        if (typeof navigation !== 'object') navigation = (0, eval)('(' + navigation + ')');
                        ctrlHtml += '<div class="' + navigation.nextEl.replace(/^\./, "") + '"></div><div class="' + navigation.prevEl.replace(/^\./, "") + '"></div>';
                    }
                    if (pagination?.el) {
                        if (typeof pagination !== 'object') pagination = (0, eval)('(' + pagination + ')');
                        ctrlHtml += '<div class="' + pagination.el.replace(/^\./, "") + '"></div>';
                    }
                    products.lastElementChild.insertAdjacentHTML('afterend', '<div class="swiper iSwiper" data-collection="' + type + '" ><div class="swiper-wrapper">' + responseText + '</div>' + ctrlHtml + '</div>');
                    var productCollection = products.querySelector('.swiper[data-collection="' + type + '"]'),
                        items = productCollection.querySelector('.swiper-wrapper'),
                        count = 0;
                    for (const item of items.children) {
                        count++;
                        if (count > limit) {
                            item.remove();
                        } else {
                            item.classList.add('swiper-slide', 'alo-item');
                            grid_classes.split(' ').forEach(classes => {
                                if (classes) item.classList.add(classes);
                            });
                        }
                    }
                    productCollection.classList.remove('hidden');
                    productCollection.classList.add('active');
                    productCollection.querySelectorAll('.lazyload').forEach(element => {
                        lazySizes.loader.unveil(element);
                    });
                    // self.style.cssText = `display: block; height: ${ self.offsetHeight}px;`;
                    Object.assign(self.style, { display: "block", height: `${self.offsetHeight}px` });
                    self.getSibling(productCollection).forEach(el => {
                        el.classList.add('hidden');
                        el.classList.remove('active');
                    });
                    document.dispatchEvent(new Event('GridSliderUpdated'));
                    setTimeout(function () {
                        self.classList.remove('loadding');
                        Object.assign(self.style, { display: "", height: "" });
                    }, 1000);

                });
        }
    }

    customElements.define("product-tab", ProductTab);
}
/* End product-tab.js */

if (!customElements.get('quick-view')) {
    customElements.define("quick-view", class extends HTMLElement {

        constructor() {
            super();
        }

        connectedCallback() {
             this.init();
        }

        init() {
            var self = this,
            url = this.getAttribute('href');
            this.addEventListener('click', (e) => {
                e.preventDefault();
                self.classList.add('loading');
                document.dispatchEvent(new Event('MainProductLoadJs'));
                fetch(`${url}`)
                .then((response) => response.text())
                .then((responseText) => {
                    self.classList.remove('loading');
                    var product = new DOMParser().parseFromString(responseText, 'text/html').querySelector('#product-single');
                    document.body.insertAdjacentHTML("beforeend", `
                        <dialog-modal>
                            <dialog data-autoplay modal-mode="mega" data-destroy="true" id="quickview" class="modal-quickview">
                                ${product.outerHTML}
                            </dialog>
                        </dialog-modal>
                    `);
                    quickview.addEventListener('open', (e) => {
                        document.documentElement.classList.add('open-popup');
                        Shopify.PaymentButton.init();
                    },{once : true});
                    quickview.addEventListener('close', (e) => {
                        document.documentElement.classList.remove('open-popup');                    
                    },{once : true});
                });
            });
        }

    })
}

if (!customElements.get("translate-xy")) {
    customElements.define("translate-xy", class extends HTMLElement {
        constructor() {
            super();
            this.onMutation = this.onMutation.bind(this);
        }
        connectedCallback() {
            this.load();
            this.observer = new MutationObserver(this.onMutation);
            this.observer.observe(this, {
                childList: true,
                subtree: true
            });
        }
        disconnectedCallback() {
            this.observer.disconnect();
        }
        load() {
            let self = this,
                translatexy       = JSON.parse(self.dataset.translatexy) || {},
                translatexySort   = Object.keys(translatexy).sort().reverse().reduce((r, k) => (r[k] = translatexy[k], r), {});
            Object.entries(translatexySort).forEach(entry => {
                var originalStr  = entry[0],
                    translateStr = entry[1];
                var regex     = new RegExp(originalStr, 'g');
                var elements = self.getElementsByTagName('*');
                for (var i = 0; i < elements.length; i++) {
                    var element = elements[i];
                
                    for (var j = 0; j < element.childNodes.length; j++) {
                        var node = element.childNodes[j];
                
                        if (node.nodeType === 3) {
                            var text = node.nodeValue;
                            var replacedText = text.replace(regex,translateStr);
                
                            if (replacedText !== text) {
                                element.replaceChild(document.createTextNode(replacedText), node);
                            }
                        }
                    }
                }
            });
        }
        onMutation(mutations) {
            this.load();
        }
    })
}

/* XHTMLElement.js */
if (!customElements.get('x-htmlelement')) {
  class XHTMLElement extends HTMLElement {
    constructor() {
      super();
    }

    uniqid(length) {
      length = length || 10;
      var result = "",
        characters = "abcdefghijklmnopqrstuvwxyz0123456789",
        charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    }

    datasetToObject(dataset) {
      var object = Object.assign({}, dataset);
      for (var property in object) {
        var value = object[property];
        switch(value) {
          case null:
            value = null;
            break;
          case false:
            value = false;
            break;
          case true:
            value = true;
            break;
          case !isNaN(value):
            value = Number(value);
            break;
          default:
            try {
              value = JSON.parse(value);
            } catch (e) {
              // value = value;
            }
            try {
              value = (0, eval)('(' + value + ')');
            } catch (e) {
              value = value;
            }
        }
        object[property] = value;
      }
      return object;
    }


  }

  customElements.define("x-htmlelement", XHTMLElement);
}
/* End XHTMLElement.js */
 

