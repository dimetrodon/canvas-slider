"use strict";

var VimCanvasSlider = (function() {
  var defaultSettings = {
    current: 0,
    speed: 20,
    size:{
      height: 400,
      width: 1000
    },
    whiteSpace:20,
    waitCanvas:{
      num: 6,
      speed: .02,
      lineWidth: 15,
      segment: .8
    }
  };

  /**
    * @constructor
    * @param {Object}  settings
    * @param {Object}  settings.container
    * @param {Object}  settings.size
    * @param {?number} settings.size.height
    * @param {?number} settings.size.width
    * @param {Array}   settings.images
    * @param {?number} settings.current
    * @param {?number} settings.speed
    * @param {?number} settings.whiteSpace
    * @param {Object}  settings.waitCanvas
    * @param {?number} settings.waitCanvas.num
    * @param {?number} settings.waitCanvas.speed
    * @param {?number} settings.waitCanvas.lineWidth
    * @param {?number} settings.waitCanvas.segment

    */
  function VimCanvasSlider(settings) {

    this.container = document.querySelector(settings.container);
    if ( this.container === null || !Array.isArray(settings.images) || settings.images.length <= 0 ) return;

    this.images = settings.images;
    this.size = Object.assign({}, defaultSettings['size'], settings.size);

    this.current = settings.current || defaultSettings['current'];
    this.offset = false;

    this.speed = settings.speed || defaultSettings['speed'];
    this.whiteSpace = settings.whiteSpace !== undefined?settings.whiteSpace : defaultSettings['whiteSpace'];

    this.waitCanvas = Object.assign({}, defaultSettings['waitCanvas'], settings.waitCanvas);

    this._slides = initSlides.call(this);
    this._waitCanvas = {};

    this._control = {hover: 0, route: false};
    this._arrow = {offset:.03, width:.05};

    setTimeout( init.bind(this), 0 );
  }

  VimCanvasSlider.prototype.next = function(step) {
    this.changeCurrentSlide(1);
  };

  VimCanvasSlider.prototype.prev = function() {
    this.changeCurrentSlide(-1);
  };

  VimCanvasSlider.prototype.changeCurrentSlide = function(step) {
    this._control.route = step >= 0? -1: 1;
    this.current += step;
    this._checkCurrentSlide();
    if (!this._setOffset()) window.requestAnimationFrame(this._draw.bind(this));
  };

  VimCanvasSlider.prototype.initImages = function(images) {

    this._waitCanvas = new WaitCanvas(this.waitCanvas, this.canvas);

    if (images) this.images = images;

    if (this._slides.length > 0) this._slides.clear();

    this._slides._countUploadImages = this.images.length;

    for (let i = 0; i < this.images.length; i++){
      this._slides.addNewSlide.call(this, i);
    }
    return this;
  };

  VimCanvasSlider.prototype._initCanvas = function() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = this.size['width'];
    this.canvas.height = this.size['height'];
    this.container.appendChild(this.canvas);
    this._arrow.width = this._arrow.width * this.canvas.width;
    this._arrow.offset = this._arrow.offset * this.canvas.width;

    return this;
  };

  VimCanvasSlider.prototype._setPosition = function() {
    var center = this.canvas.width / 2;
    this._checkCurrentSlide();

    for (let i = 0; i < this._slides.length; i++ ) {
      this._slides[i].Xstart = (i === 0) ? 0 : this._slides[i - 1].Xend + this.whiteSpace;
      this._slides[i].Xcurrent = center - this._slides[i].img.width / 2 - this._slides[i].Xstart;
      this._slides[i].Xend = this._slides[i].Xstart + this._slides[i].img.width;
    }
  };

  VimCanvasSlider.prototype._checkCurrentSlide = function(){
    if ( this.current < 0 ) {
      this.current = 0;
    } else  if ( this.current >= this._slides.length ) {
      this.current = this._slides.length - 1;
    }
  };

  VimCanvasSlider.prototype._draw = function() {
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this._slides.length; i++) {
      if (this._slides[i].Xend + this.offset > 0 && this._slides[i].Xstart + this.offset < this.canvas.width){
        this.ctx.globalAlpha = ( i == this.current )? 1: 0.6;
        this.ctx.drawImage(this._slides[i].img, this._slides[i].Xstart + this.offset, 0);
      }
    }

    this.ctx.fillStyle = "#ccc";
    this.ctx.globalAlpha = (this._control.hover < 0) ? 0.9 : 0.5;
    this.ctx.beginPath();
    this.ctx.moveTo(this._arrow.offset + this._arrow.width, this._arrow.offset);
    this.ctx.lineTo(this._arrow.offset + this._arrow.width, this.canvas.height - this._arrow.offset);
    this.ctx.lineTo(this._arrow.offset, this.canvas.height / 2);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.globalAlpha = (this._control.hover > 0) ? 0.9 : 0.5;
    this.ctx.moveTo(this.canvas.width - this._arrow.offset - this._arrow.width, this._arrow.offset);
    this.ctx.lineTo(this.canvas.width - this._arrow.offset - this._arrow.width, this.canvas.height - this._arrow.offset);
    this.ctx.lineTo(this.canvas.width - this._arrow.offset, this.canvas.height / 2);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();

    if ( this._setOffset() ) return;

    window.requestAnimationFrame(this._draw.bind(this));
  }

  VimCanvasSlider.prototype._setOffset = function() {
    if (this.offset === false){
      this.offset = this._slides[this.current].Xcurrent;
      return;
    }

    if (this.offset === this._slides[this.current].Xcurrent) {
      return true;
    }

    this.offset += this._control.route * this.speed;

    switch (this._control.route) {
      case -1:
        if (this.offset < this._slides[this.current].Xcurrent){
          this.offset = this._slides[this.current].Xcurrent
        }
        break;
      case 1:
        if (this.offset > this._slides[this.current].Xcurrent){
          this.offset = this._slides[this.current].Xcurrent
        }
        break;
    }
  };

  VimCanvasSlider.prototype._setEvent = function(){
    new SetEvent(this);
    return this;
  }

  function init() {
    this._initCanvas().initImages()._setEvent();
  }

  /**********************ImageSlide****************************/
  function initSlides() {
    var slides = [];

    slides._countUploadImages = 0;

    slides.checkUploadImages = function() {
      if (this._slides._countUploadImages <= 0) {
        for (let i = 0; i < this._slides.length; i++) {
          if (this._slides[i].img === false) {
            this._slides.splice(i,1);
            i--;
          }
        }

        this._setPosition();
        this._waitCanvas.stop();
        this._setOffset();

        window.requestAnimationFrame(this._draw.bind(this));
      }
    }.bind(this);

    slides.clear = function(){
      while (this.length) {
        this.pop();
      }
    }.bind(slides);

    slides.addNewSlide = function(index){
      var slide = {};
      slide.img = new Image();
      slide.height = this.size.height;

      slide.img.onload = function(){
        this._countUploadImages--;
        this._createImageCanvas.call(this[index]);
        this.checkUploadImages();
      }.bind(this._slides);

      slide.img.onerror = function(){
        this[index].img = false;
        this._countUploadImages--;
        this.checkUploadImages();
      }.bind(this._slides);

      slide.img.src = this.images[index];
      slide.src = slide.img.src;

      this._slides.push(slide);
    }

    slides._createImageCanvas = function() {
      var width = this.img.width * this.height / this.img.height;
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");
      canvas.width = width;
      canvas.height = this.height;
      ctx.drawImage(this.img, 0, 0, width, this.height);
      this.img = canvas;
    };

    return slides;
  }

  /**********************WaitCanvas****************************/
  function WaitCanvas(settings, canvas) {
    this.canvas = canvas;

    this.num = settings['num'];
    this.speed = settings['speed'];
    this.lineWidth = settings['lineWidth'];
    this.segment = settings['segment'];

    this._ctx = this.canvas.getContext('2d');
    this._centerW = this.canvas.width/2;
    this._centerH = this.canvas.height/2;
    this._step = 2 / this.num;
    this._colorLine = getRandomColor(this.num);
    this._stop = false;

    this.draw();
  }

  WaitCanvas.prototype.stop = function(){
    this._stop = true;
  };

  WaitCanvas.prototype.draw = function(start) {
    if ( this._stop ) return;

    start = start || 0;

    this._ctx.save();
    this._ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
    this._ctx.lineWidth = this.lineWidth;

    var odd = 1;

    for (let i = 0; i < this.num ; i++){
      odd *= -1;

      this._ctx.beginPath();
      this._ctx.strokeStyle = this._colorLine[i];
      this._ctx.arc(this._centerW, this._centerH, (i + 1) * this.lineWidth,
        odd * (start + this._step * i) * Math.PI,
        odd * (start + this.segment + this._step * i) * Math.PI, (odd < 0) );
      this._ctx.stroke();
    }

    this._ctx.restore();

    start += this.speed;
    if  (start > 2 ) start -= 2;

    window.requestAnimationFrame(this.draw.bind(this, start));
  };

  function getRandomColor(num) {
    num = num || 1;
    var letters = '0123456789ABCDEF', colors = [];

    for (let j = 0; j < num; j++){
      let color = '#';

      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }

      colors.push(color);
    }

    return colors;
  }

  /**********************Events****************************/
  function SetEvent(_slider){
    this._slider = _slider;
    this.canvas = this._slider.canvas;
    this.arrow = this._slider._arrow;

    this.сoordinates = {};

    this.init = function(){
      this.canvas.addEventListener('mouseout', this.evMouseOut.bind(this));
      this.canvas.addEventListener('click', this.evMouseClick.bind(this));
      this.canvas.onmousemove = this.mouseShadowing.bind(this);
    }

    this.init();
  }

  SetEvent.prototype.mouseShadowing = function(event) {
    this.coordinates = {
      x:event.offsetX==undefined?event.layerX:event.offsetX,
      /*y:event.offsetX==undefined?event.layerY:event.offsetY*/
    };
    this.setReal().checkPosition();
  };

  SetEvent.prototype.setReal = function() {
    if (this.canvas.scrollWidth != this.canvas.width){
      this.coordinates.x = Math.round(this.coordinates.x * this.canvas.width / this.canvas.scrollWidth);
      /*this.coordinates.y = Math.round(this.coordinates.y * this.canvas.height / this.canvas.scrollHeight);*/
    }

    return this;
  }

  SetEvent.prototype.checkPosition = function() {
    var hover = 0;

    switch (true) {
      case this.coordinates.x <= this.arrow.offset + this.arrow.width:
        hover = -1;
        break;
      case this.coordinates.x >= this.canvas.width - (this.arrow.offset + this.arrow.width):
        hover = 1;
        break;
    }

    if (this._slider._control.hover != hover){
      this._slider._control.hover = hover;

      window.requestAnimationFrame(this._slider._draw.bind(this._slider));
    }

    return this;
  }

  SetEvent.prototype.evMouseOut = function() {
    this._slider._control.hover = 0;
    window.requestAnimationFrame(this._slider._draw.bind(this._slider));
  }

  SetEvent.prototype.evMouseClick = function (event) {
    this._slider.changeCurrentSlide(this._slider._control.hover);
  }

  return VimCanvasSlider;
})();

if (typeof Object.assign != 'function') {
  Object.assign = function(target, varArgs) { // .length of function is 2
    'use strict';
    if (target == null) { // TypeError if undefined or null
      throw new TypeError('Cannot convert undefined or null to object');
    }

    var to = Object(target);

    for (var index = 1; index < arguments.length; index++) {
      var nextSource = arguments[index];

      if (nextSource != null) { // Skip over if undefined or null
        for (var nextKey in nextSource) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }

    return to;
  };
}
