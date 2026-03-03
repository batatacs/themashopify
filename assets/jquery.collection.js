var CollectionReference = (function Alo($){
    "use strict";
    var Shopify   = window.Shopify || {},
        aloShopify= window.aloShopify || {},
        Jc = window.Jc || {},
        theme     = window.theme || {},
        $window   = window.$window || $(window),
        $html     = window.$html || $('html'),
        $body     = window.$body || $html.find('body'),
        cms_js    = $html.find('#cms_js'),
        mobileScreen = window.mobileScreen || 768,
        isCollection = $body.hasClass('template-collection');

    aloShopify.priceSlider = function () {
        if(!cms_js.data('nouislider')) return;
        $script([cms_js.data('nouislider')], function () {
            $window.on('collectionUpdated contentUpdated filterUpdated', function(event){
                var $priceRange = document.getElementsByTagName("price-range");
                if(!$priceRange.length) return;
                var style = document.createElement('link');
                    style.rel  = 'stylesheet';
                    style.type = 'text/css';
                    style.href = cms_js.data('nouislider-style');
                    style.media = 'all';
                    document.head.appendChild(style);
                Array.from($priceRange).forEach(function (element) {
                    if(element.classList.contains('price-slider-init')){
                        return;
                    }
                    element.classList.add('price-slider-init');
                    var $min = element.querySelector('[name="filter.v.price.gte"]'),
                        $max = element.querySelector('[name="filter.v.price.lte"]'),
                        min = parseInt($min.getAttribute('min')),
                        max = parseInt($max.getAttribute('max')),
                        minStart = ($min.value !== '') ? parseInt($min.value) : min,
                        maxStart = ($max.value !== '') ? parseInt($max.value) : max,
                        step = parseFloat($max.getAttribute('step')),
                        divSlider = document.createElement('div');
                    divSlider.setAttribute('id', 'price-slider');
                    element.parentNode.insertBefore(divSlider, element);
                    var priceSlider = element.parentNode.querySelector('#price-slider'),
                        direction = $body.hasClass('rtl') ? 'rtl' : 'ltr';
                    noUiSlider.create(priceSlider, {
                        start: [minStart, maxStart],
                        step: isNaN(step) ? 1 : step,
                        connect: true,
                        direction: direction,
                        range: {
                          'min': min,
                          'max': max
                        }
                    });
                    priceSlider.noUiSlider.on('change', function (values, handle) {
                        if (handle) {
                            $max.value = parseFloat(values[handle]).toFixed();
                            $max.dispatchEvent(new Event('input', { bubbles: true }));
                        }else {
                            $min.value = parseFloat(values[handle]).toFixed();
                            $min.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    });
                    $min.addEventListener('input', function (e) {
                        priceSlider.noUiSlider.set([this.value, null]);
                    });
                    $max.addEventListener('input', function (e) {
                        priceSlider.noUiSlider.set([null, this.value]);
                    });
                });
            });
            var ctor = customElements.get("price-range");

            $body.trigger('contentUpdated');
            document.querySelectorAll('#FacetFiltersForm, #FacetFiltersFormMobile, #FacetFiltersPillsForm, #CollectionFiltersForm').forEach((facetFilters) => {
                facetFilters.addEventListener('DOMSubtreeModified', function () {
                    $('body').trigger('filterUpdated');
                }, false); 
            });
        });
    }();

    aloShopify.changeView = function () {
        var categoriesContent = $('.js_categories_content');
        var holder = categoriesContent.find('.js_products_arrivals');
        var productLayout = $.cookie('category_product_layout');
        var buttonView = $('.js_cat_view');
        if (!$('html').hasClass('js-focus-visible')) {
            if (productLayout) {
                holder.removeClass("two-column-style grid-2-style grid-3-style grid-4-style grid-5-style grid-style list-style").addClass(productLayout + '-style');
                if(productLayout != 'list'){
                    holder.addClass('grid-style');
                }
                buttonView.removeClass("active");
                $.each(buttonView, function () {
                    if ($(this).hasClass(productLayout + '-button')) {
                        $(this).addClass('active');
                    }
                });
            }
        }
        var _current_col = $(".js_products_holder .product-item").data('col');
        $(document).on('click', '.js_cat_view', function (e) {
            e.preventDefault();
            var _this = $(this),
                _col = _this.data('col'),
                _parent = _this.closest('div');

            _parent.find('a').removeClass('active');
            _this.addClass('active');

            if (_col == 2) {
                productLayout = 'two-column-style grid-2';
            } else if (_col == 3) {
                productLayout = 'grid-3';
            } else if (_col == 4) {
                productLayout = 'grid-4';
            } else if (_col == 5) {
                productLayout = 'grid-5';  
            } else {
                productLayout = _this.hasClass('list-button') ? 'list' : 'grid';
            }
            holder.removeClass("two-column-style grid-2-style grid-3-style grid-4-style grid-5-style grid-style list-style").addClass(productLayout + '-style');
            $.cookie('category_product_layout', productLayout, 1);
            if(productLayout != 'list'){
                holder.addClass('grid-style');
            }
            if (holder.hasClass('js_isotope')) {
                holder.isotope('layout');
            }
        });

        $(categoriesContent).on('click', '.filter-title', function (e) {
            $(this).toggleClass('active');
            categoriesContent.find('.js_filter.sidebar-top').slideToggle().toggleClass('active');
        });

        $(document).on('click', '.top-sidebar.style2 .layer-filter .name', function (e) {
            var layer = $(this).closest('.layer-navigation').toggleClass('active');
            layer.siblings().removeClass('active');
        });

        $(document).on('click', function (e) {
            var target = e.target;
            if (!$(target).is('.top-sidebar.style2 .layer-navigation') && !$(target).parents().is('.top-sidebar.style2 .layer-navigation')) {
                $('.top-sidebar.style2 .layer-navigation').removeClass('active');
            }
        });

    }();
}(window.$$ || jQuery));