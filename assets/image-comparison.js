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