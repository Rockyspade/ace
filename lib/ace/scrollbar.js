define(function(require, exports, module) {
"use strict";

var oop = require("ace/lib/oop");
var dom = require("ace/lib/dom");
var event = require("ace/lib/event");
var EventEmitter = require("ace/lib/event_emitter").EventEmitter;


dom.importCssString(
'.ace_editor>.ace_sb {\
  position: absolute;\
  overflow: hidden!important;\
  right: 0;\
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAHCAIAAABPxRC5AAAAPElEQVQImVWLwRGAMBCElou5/vuLtQQfPoz8GAbutWb3Ncacs7tLTaJSpVaSJIB7AwXkoE5Rv//X3wt4ACQ3F9lopNWrAAAAAElFTkSuQmCC) transparent 50% 0 repeat-y;\
  border-radius:5px;\
}\
\
.ace_editor>.ace_sb>div {\
  position: absolute; \
  left: 0px;  \
  background:#c5c5c4;\
  background: -moz-linear-gradient(left top 0grad, #f9f9f9, #e6e6e6);background:-webkit-gradient(linear, left top, right top, from(#f9f9f9), to(#e6e6e6));\
  border-radius:4px;\
  border:1px solid #d3d2d2;\
  -moz-box-shadow:0 1px 1px rgba(0,0,0,0.1);\
}'


)


var ScrollBar = function(parent) {
    this.element = document.createElement("div");
    this.element.className = "ace_sb";

    this.inner = document.createElement("div");
    this.element.appendChild(this.inner);

    parent.appendChild(this.element);

    this.width = dom.scrollbarWidth(document);
    this.element.style.width = this.width + 'px';	
	this.buttonSize = Math.max(this.width-4, 4)
    
	this.inner.style.width = this.buttonSize +'px';
	this.inner.style.left = '1px'
	
	var scrollButton=this.inner.cloneNode(false)
	scrollButton.style.top = '0px'
	scrollButton.style.height = this.buttonSize-2 +'px'
	this.element.appendChild(scrollButton);
	
	scrollButton=this.inner.cloneNode(false)
	scrollButton.style.bottom = '0px'
	scrollButton.style.height = this.buttonSize-2 +'px'
	this.element.appendChild(scrollButton);

    event.addMultiMouseDownListener(this.element, [500, 300, 300], this, "onMouseDown");
};

(function() {
    oop.implement(this, EventEmitter);
    
	this.onMouseDown = function(eType, e) {
        if (eType == "dblclick")
            this.onMouseDoubleClick(e);
            
        if (eType != "mousedown")
            return
        
        if (event.getButton(e) != 0 || e.detail == 2) {
            return;
        }
		
		if (e.target == this.inner) {
			this.onMouseDown2(e)
            return;
        }

        var self = this;
        var  mouseY = e.clientY;
		
		var correction = this.element.getBoundingClientRect().top+this.buttonSize


        var onMouseMove = function(e) {
            mouseY = e.clientY;
        };

        var onMouseUp = function() {
            clearInterval(timerId);
        };

        var onScrollInterval = function() {
            if (mouseY === undefined)
                return;
			var desiredPos = mouseY-correction-self.thumbHeight/2
			var delta = desiredPos - self.thumbTop
			var speed = 2
			if(delta > speed)
				desiredPos = self.thumbTop + speed
			else if(delta<-speed)
				desiredPos = self.thumbTop - speed
			else
				desiredPos = self.thumbTop
			
			var scrollTop = self.scrollTopFromThumbTop(desiredPos)			
			if(scrollTop==self.scrollTop)
				return
            self._emit("scroll", {data: scrollTop});
        };

        event.capture(this.inner, onMouseMove, onMouseUp);
        var timerId = setInterval(onScrollInterval, 20);

        return event.preventDefault(e);
    };
	
	this.onMouseDown2 = function(e) {       
        var startY = e.clientY;
		var startTop = this.thumbTop;        

        var self = this;
        var  mousePageY;

        var onMouseMove = function(e) {
            mousePageY = e.clientY;
        };

        var onMouseUp = function() {
            clearInterval(timerId);
        };

        var onScrollInterval = function() {
            if (mousePageY === undefined)
                return;
			var scrollTop = self.scrollTopFromThumbTop(startTop+mousePageY-startY)			
			if(scrollTop==self.scrollTop)
				return
            self._emit("scroll", {data: scrollTop});
        };

        event.capture(this.inner, onMouseMove, onMouseUp);
        var timerId = setInterval(onScrollInterval, 20);

        return event.preventDefault(e);
    };

	this.onMouseDoubleClick = function(e) {
		var top = e.clientY - this.element.getBoundingClientRect().top-this.buttonSize
		if(top>this.thumbTop+this.thumbHeight)
			top-=this.thumbHeight
        this._emit("scroll", {data: this.scrollTopFromThumbTop(top)});
    }; 
	
    this.getWidth = function() {
        return this.width;
    };
	
	this.scrollTopFromThumbTop = function(thumbTop) {
		var scrollTop = thumbTop*(this.pageHeight-this.viewHeight)/(this.slideHeight-this.thumbHeight)
		scrollTop=scrollTop>>0
		if(scrollTop<0)
			scrollTop = 0
		else if(scrollTop >  this.pageHeight-this.viewHeight)
			scrollTop = this.pageHeight-this.viewHeight;	
		return scrollTop
	};

    this.setHeight = function(height) {
		this.height=Math.max(0, height ) 
        this.element.style.height = this.height + "px";
		this.slideHeight = this.height - 2*this.buttonSize
		this.viewHeight=this.height	

		// force setInnerHeight updating
		// this.pageHeight = -1
		this.setInnerHeight(this.pageHeight, true)
    };

    this.setInnerHeight = function(height, force) {
		if(this.pageHeight == height && !force)
			return
		this.pageHeight = height
		this.thumbHeight = this.slideHeight * this.viewHeight/this.pageHeight
		
		if(this.thumbHeight < this.buttonSize)
			this.thumbHeight = this.buttonSize
		else if(this.thumbHeight > this.slideHeight)
			this.thumbHeight = this.slideHeight
		
        this.inner.style.height=this.thumbHeight + "px";
		
		if(this.scrollTop>(this.pageHeight-this.viewHeight+2)){
			this.scrollTop=(this.pageHeight-this.viewHeight)
			if(this.scrollTop<0)this.scrollTop = 0
			this._emit("scroll", {data: this.scrollTop});
		}
		
		
    };

    // TODO: on chrome 17+ after for small zoom levels after this function
    // this.element.scrollTop != scrollTop which makes page to scroll up.
    this.setScrollTop = function(scrollTop) {
	//	if(this.scrollTop == scrollTop)
	//		return
		this.scrollTop = scrollTop
		if(scrollTop<0)scrollTop=0
		this.thumbTop=scrollTop*(this.slideHeight-this.thumbHeight)/(this.pageHeight-this.viewHeight)
		this.inner.style.top=(this.thumbTop+this.buttonSize)+"px";
    };

}).call(ScrollBar.prototype);

exports.ScrollBar = ScrollBar;
});
