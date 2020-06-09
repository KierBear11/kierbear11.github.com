/* ---------------------------------------- *
 * GLOBAL VARIABLES
 * ---------------------------------------- */

// Card suit enum
var SUIT = {
	SPADES : 0,
	HEARTS : 1,
	DIAMONDS : 2,
	CLUBS : 3,

	BLACK : false,
	RED : true
}

// Orientation enum
var ORIENT = {
	UP : 0,
	RIGHT : 0.5,
	DOWN : 1,
	LEFT : 1.5
}

// Suit characters
var sch = '\u2660';
var hch = '\u2665';
var dch = '\u2666';
var cch = '\u2663';
var soleEmblem = '\u2606';

// Card dimensions
var w = 40;		// Width 50
var h = 70;		// Height 90
var r = 7.5;		// Corner Radius 10
var fontSize = 10;
var lineWidth = 2;

var fullWidth = (w + 2 * r) + lineWidth;
var fullHeight = (h + 2 * r) + lineWidth;

// Other global variables
var scale = window.devicePixelRatio;
var baseWidth = 800;
var baseHeight = 600;
var currentCard = {
	index: null,
	selected: false
}

// Global objects
var canvas;
var ctx;
var touchTimeDiff = {
	delayFunc: null,
	touchCount: 0,
	milli: 0,
	pos: {
		x: 0,
		y: 0
	}
};

var cards = [];

/* ---------------------------------------- *
 * OBJECTS
 * ---------------------------------------- */

// Card object
function card(num, suit, x, y, orient, back, inHand){
	this.num = num;
	this.suit = suit;
	this.suitColor = function(){
		if(this.suit == SUIT.SPADES || 
			this.suit == SUIT.CLUBS)
			return SUIT.
		BLACK;
		return SUIT.RED;
	}
	this.numDisplay = function(){
		switch(this.num){
		case 1:
			return "A";
			break;
		case 11:
			return "J";
			break;
		case 12:
			return "Q";
			break;
		case 13:
			return "K";
			break;
		default:
			return this.num + "";
			break;
		}
	}
	this.suitDisplay = function(){
		switch(this.suit){
		case 0:
			return sch;
			break;
		case 1:
			return hch;
			break;
		case 2:
			return dch;
			break;
		case 3:
			return cch;
			break;
		default:
			break;
		}
	}
	this.displayFull = function(){
		return this.numDisplay() + " " + this.suitDisplay();
	}
	this.x = x;
	this.y = y;

	this.lastX = x;
	this.lastY = y

	this.update = true;

	this.orient = orient || ORIENT.UP;
	this.back = back || false;
	this.inHand = inHand || false;
}

/* ---------------------------------------- *
 * INITIAL CALLS
 * ---------------------------------------- */

// Move element in array function
Array.prototype.move = function (old_index, new_index) {
    if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
};

// Remove element
Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}

/* ---------------------------------------- *
 * FUNCTIONS
 * ---------------------------------------- */

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect(),
      scaleX = canvas.width / rect.width,
      scaleY = canvas.height / rect.height;

  return {
    x: Math.round(((evt.clientX - rect.left) * scaleX) / scale),
    y: Math.round(((evt.clientY - rect.top) * scaleY) / scale)
  }
}

function getTouchPos(e) {
    if (!e)
        var e = event;

    if (e.touches) {
        if (e.touches.length == 1) {	// Only deal with one finger
            var touch = e.touches[0];	// Get the information for finger #1
            return{
            	x: touch.pageX-touch.target.offsetLeft,
            	y: touch.pageY-touch.target.offsetTop
            }
        }
    }
}

// Event handlers
function initEventListeners(){
	canvas.addEventListener("mousemove", function(evt){
		motoMove(getMousePos(canvas, evt));
	}, false);

	canvas.addEventListener("mousedown", function(evt){
		motoDown(getMousePos(canvas, evt));
	}, false);

	canvas.addEventListener("mouseup", function(evt){
		motoUp();
	}, false);

	canvas.addEventListener("touchstart", function(evt){
		motoDown(getTouchPos(evt));
	}, false);

	canvas.addEventListener("touchmove", function(evt){
		motoMove(getTouchPos(evt));
	});

	canvas.addEventListener("touchend", function(evt){
		motoUp();
	});

	document.body.addEventListener("touchstart", function (e) {
	  if (e.target == canvas) {
	    e.preventDefault();
	  }
	}, false);
	document.body.addEventListener("touchend", function (e) {
	  if (e.target == canvas) {
	    e.preventDefault();
	  }
	}, false);
	document.body.addEventListener("touchmove", function (e) {
	  if (e.target == canvas) {
	    e.preventDefault();
	  }
	}, false);
}

// Click events
function motoDown(pos){
	if(currentCard.selected){
		currentCard.selected = false;
		return;
	}

	var card = getCardAtPos(pos);
	if(card != null){
		currentCard.index = card;
		currentCard.selected = true;
	}

	touchTimeDiff.milli = Date.now();
	touchTimeDiff.pos = pos;
}

function motoMove(pos){
	if(currentCard.selected){
		cards.move(currentCard.index, 0);
		currentCard.index = 0;

		cards[0].update = true;

		cards[0].lastX = cards[0].x;
		cards[0].lastY = cards[0].y;

		cards[0].x = pos.x;
		cards[0].y = pos.y;

		requestAnimationFrame(draw);
	}
	var iPos = touchTimeDiff.pos;

	if(touchTimeDiff.delayFunc == null)
		return;
	if((iPos.x < pos.x + 5 && iPos.x > pos.x - 5) && 
		(iPos.x < pos.x + 5 && iPos.x > pos.x - 5)){

	}else{
		//console.log("CANCELLED TAP");
		clearTimeout(touchTimeDiff.delayFunc);
		touchTimeDiff.delayFunc = null;
		touchTimeDiff.touchCount = 0;
	}
}

function motoUp(){
	currentCard.selected = false;
	var delay = Date.now() - touchTimeDiff.milli;
	//console.log(delay)
	if(delay < 200){
		touchTimeDiff.touchCount++;

		if(touchTimeDiff.delayFunc != null){
			clearTimeout(touchTimeDiff.delayFunc);
			touchTimeDiff.delayFunc = null;
		}

		touchTimeDiff.delayFunc = setTimeout(function(){
			tap(touchTimeDiff.touchCount, touchTimeDiff.pos);

			touchTimeDiff.delayFunc = null;
			touchTimeDiff.touchCount = 0;
		}, 200);
		
	}
}

// Tap function
function tap(count, pos){
	switch(count){
	case 1:
		var card = getCardAtPos(pos);
		if(card == null)
			return;

		if(!cards[card].inHand){
			cards[card].back = cards[card].back ? false : true;

			cards[card].update = true;
			requestAnimationFrame(draw);
		}
		break;
	case 2:
		var card = getCardAtPos(pos);
		if(card == null)
			return;

		cards[card].inHand = cards[card].inHand ? false : true;
		cards[card].back = false;

		cards[card].update = true;
		requestAnimationFrame(draw);
		break;
	default:
		break;
	}
}

function getCardAtPos(pos){
	var cardFound = false;
	for(var i = 0; i < cards.length; i++){		// FIX WITH REAL CARD DECK
		var x = cards[i].x - (r + 0.5 * w);
		var y = cards[i].y - (r + 0.5 * h);

		if((pos.x >= x && pos.x < (x + 2 * r + w)) && 
		   (pos.y >= y && pos.y < (y + 2 * r + h))){
			return i;
		}
	}

	return null;
}

// onLoad Function - initializer
function onLoad(){
	// Initialise canvas + retina fix
	canvas = document.getElementById("maincanvas");
	ctx = canvas.getContext('2d');

	initEventListeners();

	canvas.width = baseWidth * scale;
	canvas.height = baseHeight * scale;
	canvas.style.width = baseWidth + "px";
	canvas.style.height = baseHeight + "px";
	ctx.scale(scale, scale);
	resize();
	//console.log(cards);
	for(var i = 0; i < 13; i++){
		cards.unshift(new card(i + 1, Math.floor(Math.random() * 4), 
			40 + (60 * i), 200 + (10 * i), ORIENT.UP));
	}

	/*
	for(var i = 1; i <= 13; i++){
		for(var j = 0; j < 4; j++){
			cards.unshift(new card(i, j, 
				canvas.width * 0.25 + (Math.random() - 0.5) * 0, 
				canvas.height * 0.25 + (Math.random() - 0.5) * 0, 
				(Math.random() - 0.5) * 0.025, true
			));
		}
	}
	*/

	shuffle(cards);

	requestAnimationFrame(draw);
}

function draw(){
	for(var i = 0; i < cards.length; i++){
		/*console.log(cards[i].update);
		if(cards[i].update){
			var x = cards[i].lastX;
			var y = cards[i].lastY;

			ctx.fillStyle = "blue";
			ctx.clearRect(x - (0.5 * fullWidth), y - (0.5 * fullHeight), 
				fullWidth, fullHeight);

			createCard(canvas, cards[i]);

			cards[i].update = false;
		}*/
		/*
		if(cards[i].lastX != cards[i].x ||
			cards[i].lastY != cards[i].y){
			var x = cards[i].lastX;
			var y = cards[i].lastY;

			cards[i].lastX = cards[i].x;
			cards[i].lastY = cards[i].y;

			ctx.fillStyle = "blue";
			ctx.fillRect(x - (0.5 * fullWidth), y - (0.5 * fullHeight), 
				fullWidth, fullHeight);

			createCard(canvas, cards[i]);
		}*/
	}
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	/*
	for(var i = 0; i < cards.length; i++){
		var card = cards[cards.length - (i + 1)];

		if(!(card.x == card.lastX && card.y == card.lastY)){
			var tempCanvas = document.createElement("canvas");
			tempCanvas.width = canvas.width;
			tempCanvas.height = canvas.height;

			createCard(tempCanvas, card);

			//if(card.render != null)
			//	card.render.remove();
			card.render = tempCanvas
		}
	}
	*/
	
	for(var i = 0; i < cards.length; i++){
		createCard(canvas, cards[cards.length - (i + 1)]);
	}
	

	console.log("test");
	//requestAnimationFrame(draw);
}

// Resize canvas
window.addEventListener("resize", resize);
function resize(){
	var width = Math.min(window.innerWidth, 800);

	var ratio = canvas.width / canvas.height;
	var height = width / ratio;

	canvas.style.width = width + "px";
	canvas.style.height = height + "px";
}

// Draws a card on the canvas
function createCard(canv, card){
	// Initialise data
	var cx = canv.getContext("2d");
	var x = -1 * (r + 0.5 * w);
	var y = -1 * (r + 0.5 * h);

	// Canvas Rotation
	cx.save();
	cx.translate(card.x, card.y);
	cx.rotate(card.orient * Math.PI);

	// Card outline
	cx.beginPath();

	cx.moveTo(r + x, y);
	cx.lineTo((r + w) + x, y);
	cx.arc((r + w) + x, r + y, r, 1.5 * Math.PI, 0);
	cx.lineTo((2 * r + w) + x, (r + h) + y);
	cx.arc((r + w) + x, (r + h) + y, r, 0, 0.5 * Math.PI);
	cx.lineTo(r + x, (2 * r + h) + y);
	cx.arc(r + x, (r + h) + y, r, 0.5 * Math.PI, Math.PI);
	cx.lineTo(x, r + y);
	cx.arc(r + x, r + y, r, Math.PI, 1.5 * Math.PI);

	cx.closePath()
	cx.fillStyle = "white";
	cx.fill();

	if(card.back){
		cx.strokeStyle = "white";
		cx.lineWidth = lineWidth * 2;
		cx.stroke();

		var texture = document.getElementById("cardback");
		var pFill = cx.createPattern(texture, "repeat");
		cx.fillStyle = pFill;
		cx.fill();
	}else{
		cx.strokeStyle = "black";
		cx.lineWidth = lineWidth;
		cx.stroke();

		// Card text
		cx.font = "normal " + fontSize + "pt TimesNewRoman";
		cx.fillStyle = (card.suitColor() ? "red" : "black");
		cx.fillText(card.displayFull(), 0.5 * r + x, 1.75 * r + y);

		cx.save();
		cx.translate(canv.width, canv.height);
		cx.rotate(Math.PI);
		cx.fillText(card.displayFull(), 
			canvas.width - (x + w + 1.5 * r), 
			canvas.height - (y + h + 0.25 * r));
		cx.restore();
	}

	// Sole viewer emblem
	if(card.inHand){
		cx.beginPath();
		cx.arc(r + w + x, r + y, 1 * r, 0, 2 * Math.PI);
		cx.strokeStyle = "#ffc61a";
		cx.lineWidth = lineWidth;
		cx.closePath();
		cx.fillStyle = "white";
		cx.fill();
		cx.stroke()
		cx.font = "12pt Arial";
		cx.textAlign = "center";
		cx.fillStyle = "#ffc61a";
		cx.fillText("" + soleEmblem, r + w + x, 1.75 * r + y);
	}

	cx.restore();
}

// Fisher-Yates shuffle
function shuffle(array) {
  var m = array.length, t, i;

  // While there remain elements to shuffle...
  while (m) {

    // Pick a remaining element...
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}



































































