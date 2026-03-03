var ProductReference = (function Alo($){
  var Shopify   = window.Shopify || {},
      aloShopify= window.aloShopify || {},
      Jc = window.Jc || {},
      theme     = window.theme || {},
      $window   = window.$window || $(window),
      $html     = window.$html || $('html'),
      $body     = window.$body || $html.find('body'),
      cms_js    = $html.find('#cms_js'),
      mobileScreen = window.mobileScreen || 768,
      isProduct = $body.hasClass('template-product'),
      $product  = $('#product-single');
  
  Jc.getFeatureImageByOptions = function (jsonProduct, options) {
      var $variant = {};
      if (jsonProduct.hasOwnProperty('variants')) {
          $.each(jsonProduct.variants, function(index, variant){
              if(variant.hasOwnProperty('featured_image') && variant.featured_image){
                  if( variant.options.toString() === options.toString() || variant.options.toString().indexOf(options.toString()) > -1){
                      $variant = variant;
                      return false;
                  }
              }
          })
      }
      return $variant;
  };
    
  aloShopify.mainProduct = function () {
      $(document).on('click', '.write-review', function () {
          $('[href="#tab_review"]').trigger('click');
          $(".spr-summary-actions-newreview").trigger('click');
      });
  
      $(document).on('click', '.compoare-color-value', function (e) {
          var $product = $('#product-single'),
              dataJson = $product.find('.data-json-product'),
              jsonProduct = dataJson.length ? JSON.parse(dataJson.html()) : $product.data('json-product'),
              color = $(this).data('value');
          var variant = Jc.getFeatureImageByOptions(jsonProduct, [color]);
          if(Object.keys(variant).length){
              var colorImage = $(this).closest('.compare-color-popup-content').find('.compare-color-image');
              var colorSpecial = colorImage.find('[data-color="' + color + '"]');
              if(!colorSpecial.length){
                  colorImage.append('<div class="color-img"><span class="close">X</span><img data-color="' + color + '" src="' + variant.featured_image.src + '" ><span class="color-text">' + color + '</span></div>');
              }else {
                  colorSpecial.closest('.color-img').removeClass('hidden');
              }
          }  
      });
      $(document).on('click', '.compare-color-image .close', function (e) {
          $(this).closest('.color-img').addClass('hidden');
      });
    
      /* click on tab of product detail page */
      $(document).on('click','.cms-tab a[data-toggle="pill"]',function(e){ 
          e.preventDefault();
          var tab_id = $(this).attr('href');
          $(this).closest('ul').find("li").removeClass("active");
          $(this).closest('li').addClass("active");
          var class_st = $(tab_id).attr("class");
          $("."+class_st).removeClass("active");
          $(tab_id).addClass("active");
      });   
  
      /* CLick slick arrow button */
      $(document).on('click','div[data-slide-nav] .slick-arrow', function(){
          if ($("div[data-slide-nav] .thumb_img.slick-active").length > 0){      
              $("div[data-slide-nav] .thumb_img.slick-current").trigger('click');
          }
      });
  }();
  
  aloShopify.fotoramaGallery = function () {
      $body.on('fotorama:Gallery', function (e, data) {
          var $product = data.product || $('#product-single');
          /* Init fotoraman */   
          $script([cms_js.data('fotorama')], function () {
              var fotoramaElement = $product.find('div[data-fotorama]'),
                  images = fotoramaElement.children().clone(),
                  startIndex = 0;         
              $product.find("[data-js-gallery]").click(function (event, data) {
                  if(!fotoramaElement.hasClass('init')){
                      fotoramaElement.children().each(function() {
                          var lazy = $(this).data('src');
                          if(lazy){
                              $(this).attr('src', lazy);
                          }
                      });
                      fotoramaElement.addClass('init');
                  }
                  if(data && data.imageId){
                      var imageId = data.imageId
                  } else {
                      var currentSlide = $product.find("div[data-slide-main]").find('.slick-current');
                      if(currentSlide.length){
                          var imageId  = currentSlide.data('image-id');
                      }
                  }
                  images.each(function( index ) {
                      if($(this).data('image-id') == imageId){
                          startIndex = index;
                          return false;
                      }
                  });
                  var fotorama = fotoramaElement.fotorama({allowfullscreen: true, nav: 'thumbs'}).data('fotorama');
                  fotorama.show({index: startIndex, time: 0});
                  fotorama.requestFullScreen();
              });
              $product.find('div[data-fotorama]').on('click', function (e, fotorama) {
                  if ($(e.target).hasClass("fotorama__stage__frame")) {
                      $product.find('div[data-fotorama]').data('fotorama').cancelFullScreen();
                      $product.find('div[data-slide-nav]').find(".slick-track").css("transform","none");
                  }
              });          
          });
      });
  }();
  
  aloShopify.ProductGallery = function () {
  
      function ProductGallery() {
          this.selectors = {
              main: '.main-image',
              nav: '[data-thumb-id]'
          };
          this.load();
      };
      ProductGallery.prototype = $.extend({}, ProductGallery.prototype, {
          load: function () {
              this.init();
          },
          init: function () {
              if(!$body.hasClass('template-product')) return;
              var detailsThumb = $('#product-single .cms-wrap-main-slider');
              if(detailsThumb.hasClass('grid_1_column') || detailsThumb.hasClass('grid_2_column') ){
                  this.gridGallery();
              }else {
                  var zoomImage = $(this.selectors.main);
                  var zoomConfig = this.zoomConfig();
                  if (!$("div[data-thumb-id]").length) {
                      $(this.selectors.main).ezPlus(zoomConfig);
                  }
                  this.sliderGallery();
              }
              $body.trigger('fotorama:Gallery', {product: $product});
          },
          gridGallery: function () {
              var _      = this,
              slideMain = $("div[data-slide-main]"),
              slideMainHtml = slideMain.clone().html();
              slideMain.on('click', 'img', function(){
                  var imageId = $(this).closest('[data-image-id]').data('image-id');
                  $("[data-js-gallery]").trigger('click', {imageId : imageId});
              });
              $body.on('contentDesktopMode', function(){
                  if(slideMain.hasClass('slick-initialized')){
                      slideMain.slick("unslick").html(slideMainHtml);
                  }
                  if(slideMain.data('enable-zoom')){
                      var zoomConfig = _.zoomConfig();
                      delete zoomConfig.zoomContainerAppendTo;
                      /*
                      zoomConfig = $.extend(zoomConfig, {
                          zoomType: 'inner',
                          cursor: 'crosshair'
                      });
                      */
                      $(_.selectors.main).each(function(){
                          $(this).ezPlus(zoomConfig);
                      });
                  }
                  $body.on('afterVariantUpdated', function (event) {
                      var $variant = event.originalEvent.detail;
                      var featuredMedia = $variant.featured_media;
                      if(!$.isEmptyObject(featuredMedia)){
                          var img  = document.querySelector('#main_img_' + featuredMedia.id);
                          if(img){
                              img.scrollIntoView({block: "center", inline: "nearest", behavior: 'smooth'});                  
                          }
                      }
                  });
              });
              $body.on('contentMobileMode', function(){
                  if(slideMain.hasClass('slick-initialized')) return;
                  var isRTL  = $body.hasClass('rtl'),
                  responsive = [{breakpoint: 991, settings: {dots: true, arrows: false }}];
                  slideMain.data($.extend({
                      'arrows'        : true,
                      'dots'          : true,
                      'fade'          : true,
                      'infinite'      : true,
                      'rtl'           : isRTL,
                      'appendArrows'  : '.main_appendArrows',
                      'responsive'    : responsive,
                      'slidesToShow'  : 1
                  }, slideMain.data()));
                  slideMain.slick(slideMain.data());
  
                  $body.on('afterVariantUpdated', function (event) {
                      var $variant = event.originalEvent.detail;
                      var featuredMedia = $variant.featured_media;
                      if(!$.isEmptyObject(featuredMedia)){
                          var img  = slideMain.find('.js-image-' + featuredMedia.id),
                              idx = img.closest('.slick-slide').data('slick-index');
                          slideMain.slick('slickGoTo', idx);
                      }
                  });
              });
          },
          sliderGallery: function () {
              var _         = this,
                  initSlide = true,
                  initSwipe = true,
                  isRTL     = $body.hasClass('rtl'),
                  slideMain = $("div[data-slide-main]").not('.slick-initialized'),
                  slideNav  = $("div[data-slide-nav]").not('.slick-initialized'),
                  responsive = [{breakpoint: 991, settings: {dots: true, arrows: false }}];
              slideMain.on('click', 'img', function(){
                  var imageId = $(this).closest('[data-image-id]').data('image-id');
                  $('div[data-js-gallery]').trigger('click', {imageId : imageId});
              });
              slideMain.data($.extend({
                'arrows'        : true,
                'dots'          : false,
                'fade'          : true,
                'infinite'      : true,
                'rtl'           : isRTL,
                'appendArrows'  : '.main_appendArrows',
                'responsive'    : responsive,
                'slidesToShow'  : 1
              }, slideMain.data()));
              slideMain.on('beforeChange', function(event, slick, currentSlide, nextSlide){
                  var video = $(slick.$slides.get(currentSlide)).find('video');
                  if(video.length) video.get(0).pause();
              });
              slideMain.on('init afterChange', function (event, slick, currentSlide, nextSlide) {
                  if(event.type == 'init'){
                      initSwipe = slick.options.swipe;
                  }
                  var slickCurrent = $(slick.$slides.get(currentSlide)),
                      slickNext    = $(slick.$slides.get(nextSlide)),
                      imageId      = slickCurrent.data('image-id'),
                      mediaType    = slickCurrent.data('media_type'),
                      video        = slickCurrent.find('video');
                  if(video.length) video.get(0).play();
                  if(!mediaType || mediaType == 'image'){
                      slick.options.swipe = initSwipe;
                      _.zoomCreate(slickCurrent);
                  }else {
                      _.zoomDestroy();
                      if(mediaType == 'model'){
                          var modelViewer = $(event.target).find('model-viewer');
                          if(!modelViewer.hasClass('shopify-model-viewer-ui__disabled')){
                              slick.options.swipe = false;
                          }
                      }else {
                          slick.options.swipe = initSwipe;                   
                      }
                  }
                  $html.removeClass (function (index, className) {
                      return (className.match (/(^|\s)media_type-\S+/g) || []).join(' ');
                  }).addClass('media_type-' + mediaType);
                  if(!initSlide && slideNav.hasClass('slick-initialized')){
                      var idx        = slickCurrent.data('slick-index'),
                          slideCount = slideNav.slick('getSlick').slideCount;
                      if(slideCount > slideNav.data('slidesToShow')){
                          if(idx < 0){
                              idx += slideCount;
                          }
                          slideNav.slick('slickGoTo', idx);
                      } else {
                          slideNav.find('.slick-slide').each(function(){
                            if(idx == $(this).data('slick-index')){
                                $(this).addClass('slick-current');
                            }else{
                                $(this).removeClass('slick-current');
                            }
                          });
                      }
                  }
                  var disableAutoSwatchMatchImage = ( '' == 'true' );
                  if(!disableAutoSwatchMatchImage && !initSlide){
                      var $product           = $('#product-single');
                      if($product.length){
                          var dataJson      = $product.find('.data-json-product'),
                              json          = dataJson.length ? JSON.parse(dataJson.html()) : $product.data('json-product'),
                              variants      = json.variants,
                              options       = $product.find('.cms-option-item'),
                              currentOption = [];
                          $.each(options, function () {
                              var active = $(this).find('.product-options__value.active');
                              if(active.length){
                                  currentOption.push(active.data('value'));
                              }
                          });
                          currentOption.shift();
                          var matchOne = [];
                          $.each(variants, function () {
                              if(this.featured_image && this.featured_image.id == imageId){
                                  var optionsHandleize = this.options.map(x => Shopify.handleize(x));
                                  optionsHandleize.shift();
                                  var isMatch = (currentOption.join() == optionsHandleize.join());
                                  if(matchOne.length == 0 || isMatch){
                                      matchOne = this.options;
                                  }
                                  if(isMatch){
                                      return false;
                                  }
                              }
                          });
                          if(!initSlide){
                              $.each(matchOne, function (index, value) {
                                  options.eq(index).find('[data-value="' + Shopify.handleize(value) + '"]').trigger('click');
                              });
                          }
                      }
                  }
                  initSlide = false;
              });
              slideMain.slick(slideMain.data());
              $body.on('afterVariantUpdated', function (event) {
                  var $variant = event.originalEvent.detail;
                  var featuredMedia = $variant.featured_media;
                  if(!$.isEmptyObject(featuredMedia)){
                      var img  = slideMain.find('.js-image-' + featuredMedia.id),
                          idx = img.closest('.slick-slide').data('slick-index');
                      slideMain.slick('slickGoTo', idx);
                      initSlide = true;
                  }
              });
              if(!slideNav.length) return;
              var responsive = [{breakpoint: 1025, settings: {vertical: false, slidesToShow: 4, slidesToScroll: 1, dots: false, arrows: true }}];
              slideNav.data($.extend({ 
                'arrows'          : true,
                'dots'            : false,
                'infinite'        : true,
                'centerMode'      : false,
                'verticalSwiping' : slideNav.data("vertical"),
                'slidesToShow'    : slideNav.data("slidestoshow"),
                'responsive'      : responsive
              }, slideNav.data()));
              slideNav.slick(slideNav.data());
              var urlParams = new URLSearchParams(window.location.search),
                  variant   = urlParams.get('variant');
              if(!variant){
                  slideNav.slick('slickGoTo', 0); /* go to main image */
              }else {
                  /* go to swatch image */
              }
              $(document).on('Jc:SwitchRTL:reload', function (event) {
                  if($('body').hasClass('rtl')){
                    slideMain.attr('dir', 'rtl').data('rtl', true );
                    if(!slideNav.data('vertical')){
                      slideNav.attr('dir', 'rtl').data('rtl', true );
                    }
                  }else {
                    slideMain.attr('dir', 'ltr').data('rtl', false );  
                    slideNav.attr('dir', 'ltr').data('rtl', false );            
                  }
                  slideMain.slick("unslick").slick(slideMain.data());
                  slideNav.slick("unslick").slick(slideNav.data());
                  _.zoomDestroy();
                  $('.slick-current ' + _.selectors.main).ezPlus(_.zoomConfig());;
              });
              $body.on('afterVariantUpdated', function (event) {
                  var $variant = event.originalEvent.detail;
                  var featuredMedia = $variant.featured_media;
                  if(!$.isEmptyObject(featuredMedia)){
                      var img        = slideNav.find('[data-thumb-id="' + featuredMedia.id + '"]'),
                          idx        = img.closest('.slick-slide').data('slick-index'),
                          slideCount = slideNav.slick('getSlick').slideCount;
                      if(slideCount > slideNav.data('slidesToShow')){
                          if(idx < 0){
                              idx += slideCount;
                          }
                          slideNav.slick('slickGoTo', idx);
                      } else {
                          img.closest('.slick-slide').addClass('slick-current').siblings().removeClass('slick-current');
                      }
                  }
              });
              slideNav.on('click', '.slick-slide', function () {
                  if(!slideMain.length) return;
                  slideMain.slick('slickGoTo', $(this).data('slick-index'));
                  $(this).addClass('slick-current').siblings().removeClass('slick-current');
                  initSlide = true;
              });
              $body.trigger('slideMain-init');
          },
          zoomConfig: function () {
              var zoomImage = $(this.selectors.main),
                  $img = $('.full-item img'),
                  slideMain = $('div[data-slide-main]'),
                  zoomWidth  = slideMain.data("width-zoom"),
                  zoomHeight = slideMain.data("height-zoom"),
                  zoomStyle  = zoomImage.data("style-zoom"),
                  zoomEffect = zoomImage.data("effect") ? zoomImage.data("effect") : 'flyOutWindow',
                  effectDuration = zoomImage.data("effect-duration") ? zoomImage.data("effect-duration") : '500',
                  zoomLevel  = (zoomStyle == 2 || zoomStyle == 4) ? 1 : zoomImage.data("zoomLevel") ? zoomImage.data("zoomLevel") : '1',
                  zoomContainerAppendTo = '#product-single .zoomContainerAppendTo',
                  zoomTypeMap = {'1':'window', '2':'inner', '3':'lens', '4':'mousewheel'},
                  zoomConfig,
                  /* default effect flyOutImageToWindow */
                  effect = [
                      { transform: $('body').hasClass('rtl') ? 'translate3d(100%, 0, 0) scale(0)' : 'translate3d(-100%, 0, 0) scale(0)' },
                      { transform: 'translate3d(0, 0, 0) scale(1)' },
                      { transition: 'all 0.8s linear both' }
                  ],
                  timing = { duration: parseInt(effectDuration), iterations: 0.5 };
                  switch (zoomEffect) {
                      case 'flyOutWindow':
                          effect = [
                            { transform: 'translate3d(0%, 0, 0) scale(0)' },
                            { transform: 'translate3d(0, 0, 0) scale(1)' },
                            { transition: 'all .8s linear both' }
                          ];
                          break;
                      case 'flySpinningWindow':
                          effect = [
                            { transform: 'scale(0) rotateZ(0)' },
                            { transform: 'scale(1) rotateZ(-360deg)' },
                            { transition: 'all 0.5s linear both' }
                          ];
                          break;
                      case 'flySpinningImageToWindow':
                          effect = [
                            { transform: $('body').hasClass('rtl') ? 'translate3d(100%, 0, 0) scale(0) rotateZ(0)' : 'translate3d(-100%, 0, 0) scale(0) rotateZ(0)' },
                            { transform: 'translate3d(0, 0, 0) scale(1) rotateZ(360deg)' },
                            { transition: 'all 0.5s linear both' }
                          ];
                          break;
                      default:
                  }
              var defaults = {
                  borderSize: 1,
                  lensFadeIn: 500,
                  lensFadeOut: 500,
                  zoomLevel: zoomLevel,
                  easing: false,
                  easingAmount: 10,
                  gallery: 'slider-nav',
                  galleryActiveClass: "slick-current",
                  zoomContainerAppendTo: zoomContainerAppendTo,
                  zoomWindowWidth: parseInt(zoomWidth) ? zoomWidth : $img.width(),
                  zoomWindowHeight: parseInt(zoomHeight) ? zoomHeight : $img.height(),
                  onZoomedImageLoaded: function(img){
                      $(zoomContainerAppendTo).css({position: "absolute", top: 0, left: 0});
                      $(zoomContainerAppendTo).find('.zoomContainer').css({position: "static"});
                  },
                  onShow: function (ez){
                      if(ez.options.zoomType !== 'window'){
                          return;
                      };
                      var AloZoom = window.AloZoom || {},
                          uuid = ez.options.zoomId,
                          zoomWindow = document.querySelector('[uuid="' + uuid + '"] .zoomWindow');
                      if(zoomWindow){
                          if(AloZoom && AloZoom[uuid]){
                              AloZoom[uuid].cancel();
                          }
                          AloZoom[uuid] = zoomWindow.animate(effect, timing);
                      }
                  }
              };
              switch (zoomStyle) {
                  case 1:
                      zoomConfig = defaults;
                      $body.addClass('productzoom-window');
                      break;
                  case 2:
                      zoomConfig = $.extend(defaults, {
                          zoomType: 'inner',
                          cursor: 'crosshair',
                      });
                      $body.addClass('productzoom-inner');
                      break;
                  case 3:
                      zoomConfig = $.extend(defaults, {
                          zoomType: 'lens',
                          lensShape: 'round',
                          lensSize: 200,
                      });
                      $body.addClass('productzoom-lens');
                      break;
                  case 4:
                      zoomConfig = $.extend(defaults, {
                          scrollZoom: true,
                      });
                      $body.addClass('productzoom-mousewheel');
                      break;
                  default:
                      zoomConfig = defaults;
              };
  
              return zoomConfig;
          },
          zoomCreate: function ($el) {
              if( $window.width() < mobileScreen ) return;
              var zoomImage = $(this.selectors.main);
              if(!zoomImage.data("style-zoom")){
                  /* disable zoom */
                  return;
              }
              var zoomConfig = this.zoomConfig();
              $('div.zoomContainer').remove();
              zoomImage.removeData('elevateZoom');
              var id = $el.data('image-id');
              var currentImage = zoomImage.parent().find('.js-image-' + id);
              currentImage.attr('src', $(this).data('image'));
              currentImage.data('zoom-image', $(this).data('z-image'));
              $script([cms_js.data('ez')], function () {
                  currentImage.ezPlus(zoomConfig);
              });
          },
          zoomDestroy: function () {
              var zoomImage = $(this.selectors.main);
              $('div.zoomContainer').remove();
              zoomImage.removeData('elevateZoom');
          }
      });
  
      return new ProductGallery();
  }();
  
  aloShopify.stickyAddToCart = function () {
      var $stickyCart = $('.js_sticky_atc_wrapper');
      if(!$product.length || !$stickyCart.length){
          return;
      }
      var dataJson = $stickyCart.find('.data-json-product'),
          json = dataJson.length ? JSON.parse(dataJson.html()) : $stickyCart.data('json-product'),
          variants = json.variants,
          $trigger   = $('.details-info .group-button');
      if (!$stickyCart.length || !$trigger.length || ($(window).width() < mobileScreen && $stickyCart.hasClass('mobile_false'))) return;
      var summaryOffset = $trigger.offset().top + $trigger.outerHeight(),
          slpr_wrap = $('div[data-popup-crossell]'),
          _footer = $('.footer'),
          off_footer = 0,
          ck_footer = _footer.length > 0;
  
      var stickyAddToCartToggle = (function fn() {
          var windowScroll = $(window).scrollTop(),
              windowHeight = $(window).height(),
              documentHeight = $(document).height();
          if (ck_footer) {
              off_footer = _footer.offset().top - _footer.height();
          } else {
              off_footer = windowScroll;
          }
  
          if (windowScroll + windowHeight == documentHeight || summaryOffset > windowScroll || windowScroll > off_footer) {
              $body.removeClass('show-sticky');
              $stickyCart.removeClass('sticky_atc_shown');
              slpr_wrap.removeClass('sticky_atc_shown');
          } else if (summaryOffset < windowScroll && windowScroll + windowHeight != documentHeight) {
              $body.addClass('show-sticky');
              $stickyCart.addClass('sticky_atc_shown');
              slpr_wrap.addClass('sticky_atc_shown');
          }
          return fn;
      }());
      if(variants){
          $stickyCart.find('.popup_variant').on('click', function(){
              $(this).closest('.wrap_variant').toggleClass('active');
          });
          var optionsItem = $stickyCart.find('.cms-option-item'),
              selectItem  = $('.js_sticky_atc_wrapper .js_sticky_sl'),
              selectSticky = selectItem.closest('.select-sticky');
          $(window).on('click', function(e){
              var elTarget = $(e.target);
              if(elTarget.is(selectItem) && !selectItem.closest('.select-sticky').hasClass('open')){
                  selectItem.closest('.select-sticky').addClass('open');
              }else {
                  selectItem.closest('.select-sticky').removeClass('open');
              }
          });
          selectItem.on('change', function () {
              $(this).closest('.select-sticky').removeClass('open');
              var variantId = $(this).val();
              $.each(variants, function(index, value){
                  if(value && value.id == variantId){
                      /* $product.find('[name="id"]').val(variantId); */
                      var options = value.options;
                      $.each(options, function(idx, val){
                          optionsItem.eq(idx).find('[data-value="' + Shopify.handleize(val) + '"]').trigger('click');
                      });
                  }
              });
          });
          $product.find('[name="id"]').on('input', function () {
              var selectVal = selectItem.val(),
                  idVal = $(this).val();
              if(selectVal != idVal){
                  selectItem.val(idVal);
              }
          });
      }
      $(window).on('scroll', stickyAddToCartToggle);
      $(document).on('change', '.js_sticky_atc_wrapper .js_sticky_qty', function() {
          $('#Quantity .js_qty').val($(this).val())
      });
      $(document).on('change', '#Quantity .js_sticky_qty', function() {
          $('.js_sticky_atc_wrapper .js_qty').val($(this).val());
      });
      $(document).on('click', '.sticky_atc_js', function (e) {
          if(!$product.length) return;
          var qty = parseInt($('.js_sticky_qty').val());
          $product.find('input[name="quantity"]').val(qty);
          $product.find('.js_add_to_cart_button').trigger('click');
      });
  }();
}($$));