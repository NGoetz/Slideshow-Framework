/*

Slideshow-Framework to create image-changes

*/



var SlideFramework = {

	// "options"
	className: "slide",		 

	// standard options
	viewTime: 5000,			 // time for showing pictures in ms
	sliStep: 0.5,			  // percent-step for fading
	random: false,			  // random order
	autostart: true,			// start immediatly the slideshow

	// automatic options
	baseURL: "",				// path for scripts.
	oldWinOnLoad: null,		// saved function
	inits: new Array(),		 // initialisations for later points in time
	slides: new Object(),	   // place for slides


	// initialising function, starts while loading
	start: function () {
		
		this.oldWinOnLoad = window.onload; // save old onload-function

		
		window.onload = function () {
			
			if (typeof(SlideFramework.oldWinOnLoad) == "function") {
				
				SlideFramework.oldWinOnLoad(); // start saved onload-function
			}

			SlideFramework.onload(); // start our onload-function
		};
	},


	
	onload: function () {
		

		var i, slide, css, scripts = document.getElementsByTagName("script");

		// get baseURL for other scripts
		for (i = 0; i < scripts.length; i++) {
			if (scripts[i].src && scripts[i].src.match(/slideshow-framework\.js/)) {
				this.baseURL = scripts[i].src.replace(/(^|\/)slideshow-framework\.js$/, "");
			}
		}

		// use other components
		if (this.baseURL) {
			// use our CSS-configurations 
			css = document.createElement("link");
			css.rel = "stylesheet";
			css.type = "text/css";
			css.href = this.baseURL + "/slideshow-framework.css";
			// <link />-Element im <head> hinten anfügen
			document.getElementsByTagName("head")[0].appendChild(css);
		}

		// create saved slides
		slide = this.inits;
		delete this.inits; 

		for (i = 0; i < slide.length; i++) {
			this.init(slide[i]);
		}
	},


	// function to create a slide
	init: function (options) {
		/* options is a object with the following configurations
			{
				id: "id-of-HTML-element",				   // unique!!
				images: ["pfad/image1.jpg", "pfad/image2.jpg"], // more possible
				// optional
				viewTime: 20000,
				sliStep: 1,
				random: true,
				autostart: false
			}
		*/

		var slide;
		
		if (this.inits) {
			this.inits[this.inits.length] = options; // save for later

		} else {
			slide = new this.Slide(options); // this.Slide is a constructer-function!

			
			if (slide != false && !this.slides[options.id]) {
				this.slides[slide.id] = slide;

				if (slide.autostart) {
					
					window.setTimeout(function () {	slide.start(); }, slide.viewTime); 
				}
			}
		}
	},


	
	Slide: function (options) {
	

		
		if (
			// no ID
			!options.id
			||
			// no HTML-element with this ID
			!document.getElementById(options.id)
			||
			// existing slide
			SlideFramework.slides[options.id]
			||
			// less than two pictures
			options.images.length < 2
		) {
			// no slide for this init call
			
			return new Boolean(false);
		}

		this.id = options.id;
		this.images = new Array(); 
		this.random = (typeof options.random != "undefined") ? options.random : SlideFramework.random;
		this.autostart = (typeof options.autostart != "undefined") ? options.autostart : SlideFramework.autostart;
		this.viewTime = options.viewTime || SlideFramework.viewTime;
		this.sliStep = options.sliStep || SlideFramework.sliStep;
		this.stopped = false; // stop slideshow
		this.playList = new Array(); 
		this.counter = 0; // counter for playlist
		this.dir = ""; // direction
		this.fading = false; // blocks next-function


		// <span>-element as container
		this.element = document.createElement("span");
		this.element.className = SlideFramework.className;

		// correct opera
		if (window.opera) {
			this.element.style.display = "inline-table";
		}

		// replace image
		var i;
		i = document.getElementById(this.id); // old image
		i.parentNode.replaceChild(this.element, i);

		// realise images from list and put them into <span>
		for (i = 0; i < options.images.length; i++) {
			this.images[i] = document.createElement("img");
			this.images[i].src = options.images[i];
			this.images[i].alt = "";

			// just first image
			if (i == 0) {
				this.element.appendChild(this.images[i]);
			}
		}


		/*
			define methods of slide
		*/


		// generate playlist
		this.createPlayList = function () {
			var i, r;
			
			this.playList = new Array();

			if (this.random) {
				// random order
				while (this.playList.length < this.images.length) {
					existing = false; // existing number
					r = Math.floor(Math.random() * (this.images.length));
					for (i = 0; i < this.playList.length; i++) {
						if (r == this.playList[i]) {
							existing = true;
						}
					}

					if (!existing) {
						this.playList[this.playList.length] = r;
					}
				}

			} else {
				// normal order
				for (i = 0; i < this.images.length; i++) {
					this.playList[i] = i;
				}
			}
		};


		// function for starting slide
		this.start = function () {
			this.stopped = false;
			
			this.next();
		
		};

		// function for stopping slide
		this.stop = function () {
			this.stopped = true; // hinders starting of window.setTimeout-functions
		};


		// functions for showing the next images
		this.next = function (single, dir) {
			// "single" is true or false and triggers one-time-change
			if (single) {
				this.stopped = true;
			}

			// direction change
			if (typeof dir == "string") {
				this.dir = dir;
			}

			// stopped?
			if ((this.stopped && !single) || this.fading) {
				return; // yes -> no change
			}

			// count on (or default)
			if (this.dir != "backwards") {
				this.counter = (this.counter < this.playList.length -1) ? this.counter +1 : 0;
				// new playlist?
				if  (this.counter == 0) {
					// generate
					this.createPlayList(); 
				}
			} else {
				this.counter = (this.counter > 0) ? this.counter -1 : this.playList.length -1;
				
				if  (this.counter == this.playList.length -1) {
					
					this.createPlayList(); 
				}
			}


			// new picture
			this.element.appendChild(this.images[this.playList[this.counter]]);
			this.images[this.playList[this.counter]].className = "next";

			// start fading
			this.sli();
		};

		// fade-function for changing image
		this.sli = function (step) {
			var slide = this, imgs = this.element.getElementsByTagName("img");

			// stop change of image for preventing problems
			this.fading = true;

			// without value, restart
			step = step || 0;

			// new image
			imgs[1].style.opacity = step/100;
			imgs[1].style.filter = "alpha(opacity=" + step + ")"; // IE?

			step += this.sliStep;

			if (step <= 100) {
				window.setTimeout(function () { slide.sli(step); }, 1);
			} else {
				
				this.fading = false;

				// stop position of image
				imgs[1].className = "";
				// remove old image
				this.element.removeChild(imgs[0]);
				// after pause new image
				window.setTimeout(function () { slide.next(); }, this.viewTime);
			}
		};

		// slide initialise
		this.createPlayList();
	
	}
}

SlideFramework.start();
