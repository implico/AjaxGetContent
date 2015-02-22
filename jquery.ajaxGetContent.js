/**

 *	jQuery AjaxGetContent 1.6


 *
 *
 *	Requires: jQuery BBQ, http://benalman.com/projects/jquery-bbq-plugin/
 *	
 *	Copyright (c) 2012 Implico Group
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


(function( $ ) {

	$.fn.ajaxGetContent = function( initOptions ) {

		
		options = $.extend( true, {
			
			//parameter set for requests
			requestParameter : 'ajax_get_standard_content',
			
			//base url for url checking
			baseUrl : '',
			
			//whether to use content cache
			useCache : true,
			
			//force bookmark linking
			forceBookmarkLinking : false,
			
			//forced get params
			params : {},
			
			//attributes for elements not to be affected when matched
			excludeAttr : { 'rel' : 'lightbox', 'rel' : 'nofollow' },
			
			//invoked while target url checking
			onHrefCheck : function(href, hrefParams) {
				//avoid physical path to files
				return (href.length > 0) && ((href.indexOf('.') < 0) || (href.substr(href.length-5, 5) == '.html') || (href.substr(href.length-4, 4) == '.php')); 
			},
			
			//invoked while A element checking
			onElementCheck : function(element) {
				//avoid elements with no-ajax-load class
				return !element.hasClass('no-ajax-load') && (element.attr('rel') != 'nofollow'); 
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
					
					data = data.replace(/\<\!doctype[.\s\S]*\<\/head\>/im, '').replace(/\<\/html\>/im, '').replace(/\<body[^\>]*\>/im, '').replace(/\<\/body\>/im, '');
					//data = data.replace(/\<\!doctype[.\s\S]*\<\/head\>/im, '').replace(/\<\/html\>/im, '').replace(/\<body[^\>]*\>/im, '<div class="main-wrap-ajax">').replace(/\<\/body\>/im, '</div>');
					data = data;
					
		            data = $($.parseHTML(data, document, options.effect.loadScripts));
		            
		            var body = $('body');
		            
		            //save body attrs
		            /*var attrs = body.get(0).attributes,
		            	saveAttrs = [],
		            	i;
		            for (i = 0; i < attrs.length; i++) {
		            	saveAttrs = { name: attrs[i].nodeName, value: attrs[i].nodeValue ? attrs[i].nodeValue : attrs[i].value }
		            */
		            
		            body.data('ajaxGetContent', null);
		            body.html(data);
		            
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
		
		if (initOptions.formsGet || (initOptions.formsGet === null))
			options.formsGet = initOptions.formsGet;
		
		if (initOptions.formsPost || (initOptions.formsPost === null))
			options.formsPost = initOptions.formsPost;
		
		if (typeof options.effect.target != 'object')
			options.effect.target = $(options.effect.target);
		
		if (!$('body').data('ajaxGetContent'))
		{
			//Android does not handle pushState properly
			var isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1
			
			$.fn.ajaxGetContent.usePushState = Boolean(!options.forceBookmarkLinking && history.pushState && !isAndroid);
		}
		
		if (!$('body').data('ajaxGetContent'))
			$.fn.ajaxGetContent.cache = new Array();
		
		var mainElement = this;
		
		$.fn.ajaxGetContent.lastClickedElement = null;
		$.fn.ajaxGetContent.lastClickedUrl = null;
		$.fn.ajaxGetContent.ajaxHandler = null;
		$.fn.ajaxGetContent.history = $.fn.ajaxGetContent.history || [];
		$.fn.ajaxGetContent.animationDeferred = $.fn.ajaxGetContent.animationDeferred || null;
		
		//indicates whether the plugin is ready (in Chrome & Safari popstate is fired also when entering a website)
		wasLoaded = true;//$('body').data('ajaxGetContent');
		
		var sendReceive = function (bool_data, url_status, isFromCache)
		{
			if (typeof bool_data == 'boolean')
			{
				if ($.fn.ajaxGetContent.ajaxHandler)
				{
					$.fn.ajaxGetContent.ajaxHandler.abort();
					$.fn.ajaxGetContent.ajaxHandler = null;
				}
				
				$.fn.ajaxGetContent.lastClickedUrl = url_status;
				$.fn.ajaxGetContent.lastUrl = $.fn.ajaxGetContent.getCurrentUrl();
				$.fn.ajaxGetContent.lastFullUrl = $.fn.ajaxGetContent.getCurrentUrl(true);
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
				
				$.fn.ajaxGetContent.history.push(url_status);
			}
			else
			{
				$.fn.ajaxGetContent.ajaxHandler = null;
				
				if (url_status == 'success')
				{
					if (options.useCache && $.fn.ajaxGetContent.lastClickedUrl)
					{
						$.fn.ajaxGetContent.cache[$.fn.ajaxGetContent.lastClickedUrl] = bool_data;
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
			
			if ($.fn.ajaxGetContent.usePushState)
			{
				if (url == null)
					url = location.href;
				
				history.pushState( {} , '', url);
				$(window).trigger('popstate');
			}
			else
			{
				if (url == null)
					url = $.param.fragment();
				
				if ($.param.fragment() != url)
					jQuery.bbq.pushState(url, 2);
				else sendReceive(true, url);
			}
			
		}
		
		//auxillary function for scrolling content
		$.fn.ajaxGetContent.scrollTo = function (id, always, speed)
		{
			if (typeof speed == 'undefined')
				speed = 500;
			
			var scrollPos = $('html').scrollTop();
			if (!scrollPos)
				scrollPos = $('body').scrollTop();
			
			var isNumber = typeof id == 'number';
			
			if (always || (scrollPos > (isNumber ? id : $(id).offset().top)))
			{
				$('html,body').stop().animate(
				{
					scrollTop: isNumber ? id : $(id).offset().top
				}, speed);
			}
		}

		//gets current absolute url
		$.fn.ajaxGetContent.getCurrentUrl = function(full, leaveAnchor)
		{
			var url = '';
			if ($.fn.ajaxGetContent.usePushState)
			{
				url = new String(location.href);
				if (!full)
				{
					var startPos = url.indexOf('//');
					startPos = startPos >=0 ? startPos+2 : 0;
					url = url.substr(url.indexOf('/', startPos));
					if (url.length == 0)
						url = '/';
				}
			}
			else url = $.param.fragment();
			
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
		
		//binds url change event
		var bindUrlChangeEvent = function()
		{
			$(window).bind( $.fn.ajaxGetContent.usePushState ? 'popstate' : 'hashchange', function( event )
			{
				var url = null;
				var block = false;
				
				//checking anchor
				if ($.fn.ajaxGetContent.usePushState)
				{
					url = $.fn.ajaxGetContent.getCurrentUrl(true, true);
					if ($.fn.ajaxGetContent.lastFullUrl && (url.indexOf('#') >= 0))
					{
						block = ($.fn.ajaxGetContent.getCurrentUrl(true) == $.fn.ajaxGetContent.lastFullUrl);	//does not work without substr (?)
					}
				}
				else
				{
					url = $.fn.ajaxGetContent.getCurrentUrl();
					urlCheck = url;
					if (urlCheck.indexOf('?') >= 0)
						urlCheck = urlCheck.substr(0, urlCheck.indexOf('?'));
					block = !(urlCheck == '') && !options.onHrefCheck(urlCheck);
				}
				
				if (!block)
					if (!($.fn.ajaxGetContent.usePushState && !wasLoaded))
						sendReceive(true, url);
			});
			
			$('body').data('ajaxGetContent', true);
		}
		
		//binds popstate/hashchange event
		if (!$('body').data('ajaxGetContent'))
			bindUrlChangeEvent();
		
		//set the wasLoaded indicator to true after eventual popstate event is fired right after loading the page (Chrome&Safari)
		//fire hashchange event for bookmark linking
		$(window).load(function() {
			wasLoaded = false;
			setTimeout(function() {
				wasLoaded = true;
				
				if (!$.fn.ajaxGetContent.usePushState && ($.param.fragment() != ''))
				{
					$(window).trigger('hashchange');
				}
				
				//set last urls if not clicked before window load
				if (!$.fn.ajaxGetContent.lastUrl)
				{
					$.fn.ajaxGetContent.lastUrl = $.fn.ajaxGetContent.getCurrentUrl();
					$.fn.ajaxGetContent.lastFullUrl = $.fn.ajaxGetContent.getCurrentUrl(true);
				}
			}, 1);
		});

		
		//get form action for bookmark linking
		var formBookmarkGetAction = function(action) {
			var loc = location.href;
			
			if (!action && !$.fn.ajaxGetContent.usePushState) {
				var hashPos = loc.indexOf('#');
				if (hashPos >= 0) {
					loc = loc.substr(hashPos);
					var questPos = loc.indexOf('?');
					if (questPos >= 0)
						loc = loc.substr(0, questPos);
					
					action = loc;
				}
			}
			
			return action;
		}
		
		
		//get forms - adding handlers
		if (options.formsGet != null)
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
							
							$.fn.ajaxGetContent.lastClickedElement = $(context);
							
							$.fn.ajaxGetContent.load(formBookmarkGetAction($(context).attr('action')) + '?' + $(context).serialize().replace('%5B%5D', '[]'));
							return false;
						}
					}
					
					var prevFunc = form.get(0).onsubmit;
					form.get(0).onsubmit = null;
					
					form.submit(f(this, prevFunc, callback));
					form.data('ajaxGetContent', true)
				});
			});
		
		
		//post forms - adding handlers
		if (options.formsPost != null)
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
							
							$.fn.ajaxGetContent.lastClickedElement = form;
							
							//sending data
							var callback = formInfo.onReceive ? formInfo.onReceive : function(){};
							$.ajax( { url: formBookmarkGetAction(form.attr('action')), data: form.serializeArray(), type: 'POST', success: callback, error: callback, context: context } );
							
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
		
		
		//hyperlinks - adding handlers
		return this.each(function(index, element)
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
			var invalidUrl = 	/*(href.substr(0,1) != '/') || */(href.indexOf('#') >= 0) || (typeof targetAttr !== 'undefined' && targetAttr !== false);
								

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
					
					//checking onUrlCheck callback
					if (!options.onHrefCheck(href, hrefParams))
						return true;
						
					//checking onElementCheck callback
					if (!options.onElementCheck($this))
						return true;
					
					if (event && event.which && event.which != 1)
						return true;
					
					//block loading when the target address is same as current, unless the user clicks 2 times
					/*if ($.fn.ajaxGetContent.lastUrl == (href + hrefParams))
					{
						var cc = $this.data('ajaxGetContent_clickCount');
						cc = cc ? (parseInt(cc) + 1) : 1;
						$this.data('ajaxGetContent_clickCount', cc);
						if (cc % 2 == 1)
							return false;
					}*/
					
					//check if url is a base url, if not - load baseUrl page with ajax link
					var hrefNoAnchor = new String(window.location.href);
					if (hrefNoAnchor.indexOf('#') >= 0)
						hrefNoAnchor = hrefNoAnchor.substr(0, hrefNoAnchor.indexOf('#'));
					
					if (!$.fn.ajaxGetContent.usePushState)
					{
						var baseUrl = options.baseUrl;
						if (baseUrl != '')
						{
							if (hrefNoAnchor != baseUrl)
							{
								location.href = baseUrl + '#' + href + hrefParams;
								return false;
							}
						}
					}
					
					$this.data('options', options);
					$.fn.ajaxGetContent.lastClickedElement = $this;
			
					$.fn.ajaxGetContent.load(href + hrefParams);
					
					return false;
				});
			}
		});
	
	};


})( jQuery );


/*
 * jQuery BBQ: Back Button & Query Library - v1.2.1 - 2/17/2010
 * http://benalman.com/projects/jquery-bbq-plugin/
 * 
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
(function(e,t){"$:nomunge";function N(e){return typeof e==="string"}function C(e){var t=r.call(arguments,1);return function(){return e.apply(this,t.concat(r.call(arguments)))}}function k(e){return e.replace(/^[^#]*#?(.*)$/,"$1")}function L(e){return e.replace(/(?:^[^?#]*\?([^#]*).*$)?.*/,"$1")}function A(r,o,a,f,l){var c,h,p,d,g;if(f!==n){p=a.match(r?/^([^#]*)\#?(.*)$/:/^([^#?]*)\??([^#]*)(#?.*)/);g=p[3]||"";if(l===2&&N(f)){h=f.replace(r?S:E,"")}else{d=u(p[2]);f=N(f)?u[r?m:v](f):f;h=l===2?f:l===1?e.extend({},f,d):e.extend({},d,f);h=s(h);if(r){h=h.replace(x,i)}}c=p[1]+(r?"#":h||!p[1]?"?":"")+h+g}else{c=o(a!==n?a:t[y][b])}return c}function O(e,t,r){if(t===n||typeof t==="boolean"){r=t;t=s[e?m:v]()}else{t=N(t)?t.replace(e?S:E,""):t}return u(t,r)}function M(t,r,i,o){if(!N(i)&&typeof i!=="object"){o=i;i=r;r=n}return this.each(function(){var n=e(this),u=r||h()[(this.nodeName||"").toLowerCase()]||"",a=u&&n.attr(u)||"";n.attr(u,s[t](a,i,o))})}var n,r=Array.prototype.slice,i=decodeURIComponent,s=e.param,o,u,a,f=e.bbq=e.bbq||{},l,c,h,p=e.event.special,d="hashchange",v="querystring",m="fragment",g="elemUrlAttr",y="location",b="href",w="src",E=/^.*\?|#.*$/g,S=/^.*\#/,x,T={};s[v]=C(A,0,L);s[m]=o=C(A,1,k);o.noEscape=function(t){t=t||"";var n=e.map(t.split(""),encodeURIComponent);x=new RegExp(n.join("|"),"g")};o.noEscape(",/");e.deparam=u=function(t,r){var s={},o={"true":!0,"false":!1,"null":null};e.each(t.replace(/\+/g," ").split("&"),function(t,u){var a=u.split("="),f=i(a[0]),l,c=s,h=0,p=f.split("]["),d=p.length-1;if(/\[/.test(p[0])&&/\]$/.test(p[d])){p[d]=p[d].replace(/\]$/,"");p=p.shift().split("[").concat(p);d=p.length-1}else{d=0}if(a.length===2){l=i(a[1]);if(r){l=l&&!isNaN(l)?+l:l==="undefined"?n:o[l]!==n?o[l]:l}if(d){for(;h<=d;h++){f=p[h]===""?c.length:p[h];c=c[f]=h<d?c[f]||(p[h+1]&&isNaN(p[h+1])?{}:[]):l}}else{if(e.isArray(s[f])){s[f].push(l)}else if(s[f]!==n){s[f]=[s[f],l]}else{s[f]=l}}}else if(f){s[f]=r?n:""}});return s};u[v]=C(O,0);u[m]=a=C(O,1);e[g]||(e[g]=function(t){return e.extend(T,t)})({a:b,base:b,iframe:w,img:w,input:w,form:"action",link:b,script:w});h=e[g];e.fn[v]=C(M,v);e.fn[m]=C(M,m);f.pushState=l=function(e,r){if(N(e)&&/^#/.test(e)&&r===n){r=2}var i=e!==n,s=o(t[y][b],i?e:{},i?r:2);t[y][b]=s+(/#/.test(s)?"":"#")};f.getState=c=function(e,t){return e===n||typeof e==="boolean"?a(e):a(t)[e]};f.removeState=function(t){var r={};if(t!==n){r=c();e.each(e.isArray(t)?t:arguments,function(e,t){delete r[t]})}l(r,2)};p[d]=e.extend(p[d],{add:function(t){function i(e){var t=e[m]=o();e.getState=function(e,r){return e===n||typeof e==="boolean"?u(t,e):u(t,r)[e]};r.apply(this,arguments)}var r;if(e.isFunction(t)){r=t;return i}else{r=t.handler;t.handler=i}}})})(jQuery,this);(function(e,t,n){"$:nomunge";function c(e){e=e||t[s][u];return e.replace(/^[^#]*#?(.*)$/,"$1")}var r,i=e.event.special,s="location",o="hashchange",u="href",a=document.documentMode,f=navigator.appVersion.indexOf("MSIE")!=-1&&parseFloat(navigator.appVersion.split("MSIE")[1])<8,l="on"+o in t&&!f;e[o+"Delay"]=100;i[o]=e.extend(i[o],{setup:function(){if(l){return false}e(r.start)},teardown:function(){if(l){return false}e(r.stop)}});r=function(){function h(){a=l=function(e){return e};if(f){i=e('<iframe src="javascript:0"/>').hide().insertAfter("body")[0].contentWindow;l=function(){return c(i.document[s][u])};a=function(e,t){if(e!==t){var n=i.document;n.open().close();n[s].hash="#"+e}};a(c())}}var n={},r,i,a,l;n.start=function(){if(r){return}var n=c();a||h();(function i(){var f=c(),h=l(n);if(f!==n){a(n=f,h);e(t).trigger(o)}else if(h!==n){t[s][u]=t[s][u].replace(/#.*/,"")+"#"+h}r=setTimeout(i,e[o+"Delay"])})()};n.stop=function(){if(!i){r&&clearTimeout(r);r=0}};return n}()})(jQuery,this)