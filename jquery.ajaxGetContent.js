/**

 *	jQuery AjaxGetContent 1.8.2


 *
 *
 *	Copyright (c) 2016 Bartosz Sak
 *	www.implico.pl
 *
 *	Licensed under the MIT license.
 *	http://en.wikipedia.org/wiki/MIT_License
 *	
 *	@author Bartosz Sak <info@implico.pl>
 *
 *	More info at:
 *	@see http://www.implico.pl/en/ajaxgetcontent-dynamic-ajax-website,7
 *	
 */


(function($) {

	$.fn.ajaxGetContent = function( initOptions ) {

		
		options = $.extend( true, {
			
			//parameter set for requests
			requestParameter : 'ajax_get_standard_content',
			
			//base url for url checking
			baseUrl : '',
			
			//whether to use content cache
			useCache : false,
			
			//forced get params
			params : {},
			
			//attributes for elements not to be affected when matched
			excludeAttr : { 'rel' : 'lightbox', 'rel' : 'nofollow' },
			
			//invoked while target url checking
			onHrefCheck : function(href, hrefParams) {
				//avoid physical path to files
				return ((href.length > 0) || (hrefParams.length > 0)) && ((href == '.') || (href.indexOf('.') < 0) || (href.substr(href.length-5, 5) == '.html') || (href.substr(href.length-4, 4) == '.php')); 
			},
			
			//invoked while A element checking
			onElementCheck : function(element) {
				//avoid elements with no-ajax-load class
				return !element.hasClass('no-ajax-load'); 
			},
			
			//get forms
			formsGet : { 'form[method="get"]' : function() { return true; } },
			
			//post forms
			formsPost : null,
			
			//preset effects
			effect: {
				type: null,			//possible: none, fade,
				target: 'body',
				insertHead: false,
				insertTitle: true,
				timeoutBefore: 300,
				timeoutAfter: 300,
				callbackBeforePreAnimation: null,
				callbackBeforePostAnimation: null,
				callbackAfterPreAnimation: null,
				callbackAfterPostAnimation: null,
				loadScripts: true
			},
			
			//invoked after sending request
			onSend : function(url) {
				
				if ($.fn.ajaxGetContent.lastClickedElement) {
					$.fn.ajaxGetContent.scrollTo(0, true, options.effect.timeoutBefore);
				}
				
				if ($.fn.ajaxGetContent.animationDeferred)
				{
					//cancel previous animation
					$.fn.ajaxGetContent.animationDeferred.cancelled = true;
					options.effect.target.stop('ajaxGetContent');
				}
				
				if (options.effect.callbackBeforePreAnimation)
					options.effect.callbackBeforePreAnimation();
					
				$.fn.ajaxGetContent.animationDeferred = new $.Deferred(function(d)
				{
				
					d.cancelled = false;
					var p1;
					
					if (options.effect.type == 'fade') {
						p1 = options.effect.target.stop('ajaxGetContent').animate( {'opacity' : 0.2}, {
							duration: options.effect.timeoutBefore,
							queue: 'ajaxGetContent'
						}).promise();
						
						options.effect.target.dequeue('ajaxGetContent');
						
					}
					else p1 = new $.Deferred().resolve();
					
					//possible to add more Deferreds
					
					$.when(p1).then(function()
					{
						if (d.cancelled)
							d.reject();
						else { 
							d.resolve();
							if (options.effect.callbackBeforePostAnimation)
								options.effect.callbackBeforePostAnimation();
						}
					});
				});
			},
			
			//invoked after receiving request
			onReceive : function(data, status, isFromCache) {
				
				$.when($.fn.ajaxGetContent.animationDeferred).then(function()
				{
					data = (status == 'success' ? data : data.responseText);
					
					if (!data)
						return;
					
					if (options.effect.insertHead || options.effect.insertTitle) {
						dataHead = data.replace(/\<\!doctype[.\s\S]*\<head((\s[^\>]*\>)|(\>))/im, '').replace(/\<\/head\>[.\s\S]*/, '');
						if (dataHead) {
							if (options.effect.insertHead)
								$('head').html(dataHead);
							else {
								var title = /\<title\>([^\<]*)/.exec(dataHead);
								if (title[1])
									$('head title').text(title[1]);
							}
						}
					}
					
					data = data.replace(/\<\!doctype[.\s\S]*\<\/head\>/im, '').replace(/\<\/html\>/im, '');


					//get body class
					$body = $($.parseHTML(data.replace('<body', '<bodyReplaced').replace('</body>', '</bodyReplaced>')));
					var bodyAttrs = [];
					$body.each(function() {
						var $this = $(this),
								tagName = $this.prop('tagName');

						if (tagName && tagName.toLowerCase() == 'bodyreplaced') {
							bodyAttrs = $this[0].attributes;
							return false;
						}
					});

					data = data.replace(/\<body[^\>]*\>/im, '').replace(/\<\/body\>/im, '');

					//data = data.replace(/\<\!doctype[.\s\S]*\<\/head\>/im, '').replace(/\<\/html\>/im, '').replace(/\<body[^\>]*\>/im, '<div class="main-wrap-ajax">').replace(/\<\/body\>/im, '</div>');
					
          data = $($.parseHTML(data, document, options.effect.loadScripts));
          
          var body = $('body');
          
          body.data('ajaxGetContent', null);
          body.html(data);
          $.each(bodyAttrs, function() {
          	body.attr(this.nodeName, this.nodeValue);
          });
          
          if (!options.effect.loadScripts)
          	$('a').ajaxGetContent(options);
		            
					//Google Analytics
					if (window._gaq)
						_gaq.push(['_trackPageview', $.fn.ajaxGetContent.getCurrentUrl()]);
					
					
					if (options.effect.callbackAfterPreAnimation)
						options.effect.callbackAfterPreAnimation();
						
					$.fn.ajaxGetContent.animationDeferred = new $.Deferred(function(d)
					{
						d.cancelled = false;
						
						
						var p1;
						
						if (options.effect.type == 'fade') {
							p1 = options.effect.target.stop('ajaxGetContent').animate( {'opacity' : 1}, {
								duration: options.effect.timeoutAfter,
								queue: 'ajaxGetContent'
							}).promise();
							
							options.effect.target.dequeue('ajaxGetContent');
							
						}
						else p1 = new $.Deferred().resolve();
						//possible to add more Deferreds
						
						$.when(p1).then(function()
						{
							if (d.cancelled)
								d.reject();
							else d.resolve();
						});
					});
					
					$.fn.ajaxGetContent.animationDeferred.done(function()
					{
						$.fn.ajaxGetContent.animationDeferred = null;
						
						if (options.effect.callbackAfterPostAnimation)
							options.effect.callbackAfterPostAnimation();
					});
					
				});
			}
			
		}, initOptions);

		var $w = $(window),
				$d = $(document),
				wasInitialized = $('body').data('ajaxGetContent');


		var isSupported = !!history.pushState;
		if (!wasInitialized && isSupported)
		{
			//Android < 4.3 does not handle pushState properly
			var ua = navigator.userAgent.toLowerCase(),
    			match = ua.match(/android\s([0-9\.]*)/);

    	isSupported = !(match && (parseFloat(match[1]) < 4.3));
		}

		if (initOptions.formsGet || (initOptions.formsGet === null))
			options.formsGet = initOptions.formsGet;
		
		if (initOptions.formsPost || (initOptions.formsPost === null))
			options.formsPost = initOptions.formsPost;
		
		if (typeof options.effect.target != 'object')
			options.effect.target = $(options.effect.target);
		
		$.fn.ajaxGetContent.lastClickedElement = null;
		
		if (!wasInitialized) {
			$.fn.ajaxGetContent.isSupported = isSupported;
			$.fn.ajaxGetContent.cache = new Array();
			$.fn.ajaxGetContent.lastChangeUrlElement = null;	//last clicked element, removed on url change by history nav
			$.fn.ajaxGetContent.lastLoadedUrl = null;

			$.fn.ajaxGetContent.prevUrl = null;
			$.fn.ajaxGetContent.prevFullUrl = null;

			$.fn.ajaxGetContent.ajaxHandler = null;
			$.fn.ajaxGetContent.history = [location.href];
			$.fn.ajaxGetContent.animationDeferred = null;
		}
		
		//indicates whether the plugin is ready (in Chrome & Safari popstate is fired also when entering a website)
		wasLoaded = true;
		
		var sendReceive = function (bool_data, url_status, isFromCache)
		{
			if (typeof bool_data == 'boolean')
			{
				if ($.fn.ajaxGetContent.ajaxHandler)
				{
					$.fn.ajaxGetContent.ajaxHandler.abort();
					$.fn.ajaxGetContent.ajaxHandler = null;
				}
				
				$.fn.ajaxGetContent.lastLoadedUrl = url_status;
				$.fn.ajaxGetContent.prevUrl = $.fn.ajaxGetContent.getCurrentUrl();
				$.fn.ajaxGetContent.prevFullUrl = $.fn.ajaxGetContent.getCurrentUrl(true);
				
				$.fn.ajaxGetContent.history.push(url_status);
				
				if (options.useCache && (url_status in $.fn.ajaxGetContent.cache))
				{
					options.onSend(url_status);
					sendReceive($.fn.ajaxGetContent.cache[url_status], 'success', true);
					return;
				}
				
				var data = new Array();
				
				//adding get parameters
				var paramString = new String();
				var urlNoParams = url_status;
				
				/*if (url_status.indexOf('?') >= 0)
				{
					paramString = url_status.substr(url_status.indexOf('?') + 1);
					urlNoParams = url_status.substr(0, url_status.indexOf('?'));
				}
				var params = $.deparam(paramString);
				$.each(params, function(i, v){
					data.push ({ name: i, value: v });
				});*/

				//adding forced parameters
				var lastClickedElement = $.fn.ajaxGetContent.lastClickedElement;
				var opt = (lastClickedElement && lastClickedElement.data('options')) ? lastClickedElement.data('options') : options;
				
				$.each(opt.params, function(i, v){
					if (lastClickedElement.is(i))
						$.each(v, function(name, value){
							data.push ({ name: name, value: value });
						});
				});
				
				options.onSend(url_status);
				
				if (options.requestParameter)
					data.push ({ name: options.requestParameter, value: 'on'});
				
				$.fn.ajaxGetContent.ajaxHandler = $.ajax({ url: urlNoParams, data: data, type : 'GET', success : sendReceive, error : sendReceive, context : this });
			}
			else
			{
				$.fn.ajaxGetContent.ajaxHandler = null;
				
				if (url_status == 'success')
				{
					if (options.useCache && $.fn.ajaxGetContent.lastLoadedUrl)
					{
						$.fn.ajaxGetContent.cache[$.fn.ajaxGetContent.lastLoadedUrl] = bool_data;
					}
				}
				else
				{
				}
				
				options.onReceive(bool_data, url_status, isFromCache == true);
			}
		}

		//loads specified url or reloads page (for url = null)
		$.fn.ajaxGetContent.load = function(url)
		{
			if (url == null) {
				url = location.href;
			}

			if (isSupported) {
				history.pushState( {} , '', url);
				$w.trigger('popstate.ajaxGetContent', [true]);
			}
			else {
				location.href = url;
			}
		}
		
		//auxillary function for scrolling content
		$.fn.ajaxGetContent.scrollTo = function (selectorOrElementOrOffset, always, speed, ratio, cb)
		{
			var cancelEvents = 'wheel.agc DOMMouseScroll.agc mousewheel.agc keyup.agc touchmove.agc';
			if (typeof speed == 'undefined')
				speed = 500;
			
			var scrollPos = $('html').scrollTop();
			if (!scrollPos) {
				scrollPos = $('body').scrollTop();
			}
			
			var offset = $(window).scrollTop();
			if (typeof selectorOrElementOrOffset === 'number') {
				offset = selectorOrElementOrOffset;
			}
			else if (selectorOrElementOrOffset && (typeof selectorOrElementOrOffset === 'object') && selectorOrElementOrOffset.length) {
				offset = selectorOrElementOrOffset.offset().top;
			}
			else if (typeof selectorOrElementOrOffset === 'string') {
				offset = $(selectorOrElementOrOffset).offset().top;
			}
			
			if (always || (scrollPos > offset)) {
				if (ratio) {
					offset = ratio % 1 === 0 ? (offset - ratio) : Math.max(0, parseInt(offset - ratio * $w.height()));
				}
				$('html,body').stop(true).animate({
					scrollTop: offset
				}, speed, function() {
					$w.off(cancelEvents);
					if (cb)
						cb();
				});

				//cancel on mousewheel
				$w.on(cancelEvents, function() {
					$('html,body').stop(true);
					$w.off(cancelEvents);
					if (cb)
						cb();
				});
			}
			else {
				if (cb)
					cb();
			}
		}

		//gets current absolute url
		$.fn.ajaxGetContent.getCurrentUrl = function(full, leaveAnchor)
		{
			var url = '';
			url = new String(location.href);
			if (!full)
			{
				var startPos = url.indexOf('//');
				startPos = startPos >=0 ? startPos+2 : 0;
				url = url.substr(url.indexOf('/', startPos));
				if (url.length == 0)
					url = '/';
			}
			
			//remove anchor
			if (!leaveAnchor)
				url = url.indexOf('#') == -1 ? url : url.substr(0, url.indexOf('#'));
			
			return url;
			
		}
		
		//clears cache
		$.fn.ajaxGetContent.clearCache = function()
		{
			$.fn.ajaxGetContent.cache = new Array();
		}

  	if (isSupported) {
			//binds popstate event
			if (!$('body').data('ajaxGetContent')) {
				$w.on('popstate.ajaxGetContent', function(event, force)
				{
					var url = null;
					var block = false;
					
					//checking anchor
					url = $.fn.ajaxGetContent.getCurrentUrl(true, true);
					if (!force && $.fn.ajaxGetContent.prevFullUrl)// && (url.indexOf('#') >= 0))
					{
						block = ($.fn.ajaxGetContent.getCurrentUrl(true).substr(0) == $.fn.ajaxGetContent.prevFullUrl.substr(0))
										&& (!$.fn.ajaxGetContent.lastChangeUrlElement || (url.charAt(0) == '#'));//((url.indexOf('#') >= 0) || ($.fn.ajaxGetContent.getCurrentUrl(false) == ''));
					}
					
					if (!block && wasLoaded)
						sendReceive(true, url);

					$.fn.ajaxGetContent.lastChangeUrlElement = null;
				});
				
				$('body').data('ajaxGetContent', true);
			}
			
			//set the wasLoaded indicator to true after eventual popstate event is fired right after loading the page (Chrome&Safari)
			$w.load(function() {
				wasLoaded = false;
				setTimeout(function() {
					wasLoaded = true;
					
					//set last urls if not clicked before window load
					if (!$.fn.ajaxGetContent.prevUrl)
					{
						$.fn.ajaxGetContent.prevUrl = $.fn.ajaxGetContent.getCurrentUrl();
						$.fn.ajaxGetContent.prevFullUrl = $.fn.ajaxGetContent.getCurrentUrl(true);
					}
				}, 1);
			});

			
			//get forms - adding handlers
			if (options.formsGet != null) {
				$.each(options.formsGet, function(formSelector, callback)
				{
					$(formSelector).each(function(i, form)
					{
						form = $(form);
						if (form.data('ajaxGetContent'))
							return true;
						
						var f = function(context, prevFunc, callback)
						{
							return function()
							{
								//inline handler
								if (prevFunc && !prevFunc.call(context))
									return false;
								
								//callback
								if (callback && !callback.call(context))
									return false;
								
								$.fn.ajaxGetContent.lastClickedElement = $.fn.ajaxGetContent.lastChangeUrlElement = $(context);
								
								$.fn.ajaxGetContent.load(($(context).attr('action') || '') + '?' + $(context).serialize().replace('%5B%5D', '[]'));
								return false;
							}
						}
						
						var prevFunc = form.get(0).onsubmit;
						form.get(0).onsubmit = null;
						
						form.submit(f(this, prevFunc, callback));
						form.data('ajaxGetContent', true)
					});
				});
			}


			//hyperlinks - adding handlers
			this.each(function(index, element)
			{
				$this = $(element);
				
				var alreadyEnabled = $this.data('ajaxGetContent');

				var href = $this.attr('href');
				if (!href)
					return true;
				var hrefParams = new String();
				
				var ssl = location.href.substr(0, 5) != 'http:';
				var fullUrl = new String((ssl ? 'https://' : 'http://') + window.location.hostname);
				if (href.indexOf(fullUrl) == 0)
					href = href.substr(fullUrl.length);

				//extract get query params
				if (href.indexOf('?') >= 0)
				{
					hrefParams = href.substr(href.indexOf('?'));
					href = href.substr(0, href.indexOf('?'));
				}
				
				
				/*
				 *  checking conditions
				 */
				
				//validating url
				var targetAttr = $this.attr('target');
				var invalidUrl = 	/*(href.substr(0,1) != '/') || */(href.charAt(0) == '#') || (typeof targetAttr !== 'undefined' && targetAttr !== false);
									

				//checking onUrlCheck callback
				var onHrefCheck = options.onHrefCheck(href, hrefParams);
					
				//checking onElementCheck callback
				var onElementCheck = options.onElementCheck($this);
				
				//checking excluding element attributes
				var excludeAttr = false;
				$.each(options.excludeAttr, function(i, v)
				{
					if ($this.attr(i) && ($this.attr(i).indexOf(v) == 0))
					{
						excludeAttr = true;
						return;
					}
				});
				
				//block when element has onclick event
				var hasOnClick = $this.get(0).onclick != null;
				
				
				/*
				 *  end of checking conditions
				 */
						
				
				if (!alreadyEnabled && !invalidUrl && onHrefCheck && onElementCheck && !excludeAttr && !hasOnClick)
				{
					$this.data('ajaxGetContent', true);
					$this.click(function(event)
					{
						var $this = $(this);
						href = $(this).attr('href');
						if (href.indexOf('?') >= 0)
						{
							hrefParams = href.substr(href.indexOf('?'));
							href = href.substr(0, href.indexOf('?'));
						}
						
						//checking onUrlCheck callback
						if (!options.onHrefCheck(href, hrefParams))
							return true;
							
						//checking onElementCheck callback
						if (!options.onElementCheck($this))
							return true;
						
						if (event && event.which && event.which != 1)
							return true;
						
						//check if url is a base url, if not - load baseUrl page with ajax link
						var hrefNoAnchor = new String(window.location.href);
						if (hrefNoAnchor.indexOf('#') >= 0)
							hrefNoAnchor = hrefNoAnchor.substr(0, hrefNoAnchor.indexOf('#'));
						
						$this.data('options', options);
						$.fn.ajaxGetContent.lastClickedElement = $.fn.ajaxGetContent.lastChangeUrlElement = $this;
				
						$.fn.ajaxGetContent.load(href + hrefParams);
						
						return false;
					});
				}
			});
		}

		//post forms - adding handlers (if unsupported too)
		if (options.formsPost != null) {
			$.each(options.formsPost, function(formSelector, formInfo)
			{
				$(formSelector).each(function(i, form)
				{
					form = $(form);
					if (form.data('ajaxGetContent'))
						return true;
					
					var f = function(context, prevFunc, formInfo)
					{
						return function()
						{
							//update CKEditor if loaded
							if (typeof CKEDITOR !== 'undefined')
								for (var instanceName in CKEDITOR.instances)
								    CKEDITOR.instances[instanceName].updateElement();
							
							var form = $(context);
							
							//inline handler
							if (prevFunc && !prevFunc.call(context))
								return false;
							
							//callback
							if (formInfo.onSend && !formInfo.onSend.call(context))
								return false;
							
							//adding submitting button
							form.find('.submit-clicked-append').remove();
							var submit = form.find('.agc-submit-clicked');
							if (!submit.length)
								submit = form.find('input[type="submit"], button[type="submit"]').first();
							if (submit.length)
								form.append($('<input type="hidden" name="' + submit.attr('name') + '" value="' + submit.attr('value') + '" class="submit-clicked-append" style="display:none !important;" />'));
							
							$.fn.ajaxGetContent.lastClickedElement = $.fn.ajaxGetContent.lastChangeUrlElement = form;
							
							//sending data
							var callback = formInfo.onReceive ? formInfo.onReceive : function(){};
							$.ajax( { url: form.attr('action') || '', data: form.serializeArray(), type: 'POST', success: callback, error: callback, context: context } );
							
							return false;
						}
					}
					
					var prevFunc = form.get(0).onsubmit;
					form.get(0).onsubmit = null;
					
					//activate submit buttons - adds a submit-clicked class to clicked button
					form.find('input[type="submit"], button[type="submit"]').click(function()
					{
						$(this).parents('form').find('input[type="submit"], button[type="submit"]').removeClass('agc-submit-clicked');
						$(this).addClass('agc-submit-clicked');
					});
							
					form.submit(f(form.get(0), prevFunc, formInfo));
					form.data('ajaxGetContent', true)
				});
			});
		}
	};

})(jQuery);