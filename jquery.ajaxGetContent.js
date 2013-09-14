/*	

 *	jQuery AjaxGetContent 1.3.3


 *
 *
 *	Requires: jQuery BBQ, http://benalman.com/projects/jquery-bbq-plugin/
 *	
 *	More info at:
 *	www.implico.pl/lang-en/ajaxgetcontent-dynamic-ajax-website,7.html
 *	info@implico.pl
 *	
 *	Copyright (c) 2012 Implico Group
 *	www.implico.pl
 *
 *	Licensed under the MIT license.
 *	http://en.wikipedia.org/wiki/MIT_License
 */

(function( $ ) {

	$.fn.ajaxGetContent = function( options ) {

		
		options = $.extend( {
			
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
				//avoid files
				return (href.length > 0) && ((href.substr(href.length-1, 1) == '/') || (href.substr(href.length-5, 5) == '.html') || (href.substr(href.length-4, 4) == '.php')); 
			},
			
			//invoked while A element checking
			onElementCheck : function(element) {
				//avoid elements with no-ajax-load class
				return !element.hasClass('no-ajax-load') && (element.attr('rel') != 'nofollow'); 
			},
			
			
			//invoked after sending request
			onSend : function(url) {},
			
			//invoked after receiving request
			onReceive : function(data, status) {}
			
		}, options);
		
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
		
		//indicates whether the plugin is ready (in Chrome & Safari popstate is fired also when entering a website)
		wasLoaded = true;//$('body').data('ajaxGetContent');
		
		var sendReceive = function (bool_data, url_status)
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
					sendReceive($.fn.ajaxGetContent.cache[url_status], 'success');
					return;
				}
				
				var data = new Array();
				
				//adding get parameters
				var paramString = new String();
				if (url_status.indexOf('?') >= 0)
					paramString = url_status.substr(url_status.indexOf('?'));
				var params = $.deparam(paramString);
				$.each(params, function(i, v){
					data.push ({ name: i, value: v });
				});

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
				
				data.push ({ name: options.requestParameter, value:'on'});
				$.fn.ajaxGetContent.ajaxHandler = $.ajax({ url: url_status, data: data, type : 'GET', success : sendReceive, error : sendReceive, context : this });
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
				
				options.onReceive(bool_data, url_status);
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
		$.fn.ajaxGetContent.scrollTo = function (id, always)
		{
			var scrollPos = $('html').scrollTop();
			if (!scrollPos)
				scrollPos = $('body').scrollTop();
			
			if (always || (scrollPos > $(id).offset().top))
			{
				$('html,body').animate(
				{
					scrollTop: $(id).offset().top
				}, 500);
			}
		}

		//gets current absolute url
		$.fn.ajaxGetContent.getCurrentUrl = function(full)
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
					url = $.fn.ajaxGetContent.getCurrentUrl(true);
					if ($.fn.ajaxGetContent.lastFullUrl)
					{
						var urlNoAnchor = url.indexOf('#') == -1 ? url : url.substr(0, url.indexOf('#'));
						block = (urlNoAnchor.substr(0) == $.fn.ajaxGetContent.lastFullUrl.substr(0));	//does not work without substr (?)
					}
				}
				else
				{
					url = $.fn.ajaxGetContent.getCurrentUrl();
					if (url.indexOf('?') >= 0)
						url = url.substr(0, url.indexOf('?'));
					block = !(url == '') && !options.onHrefCheck(url);
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
				$.fn.ajaxGetContent.lastUrl = $.fn.ajaxGetContent.getCurrentUrl();
				$.fn.ajaxGetContent.lastFullUrl = $.fn.ajaxGetContent.getCurrentUrl(true);
			}, 1);
		});

		
		
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
				$this .data('ajaxGetContent', true);
				$this .click(function(event)
				{
					if (event && event.which && event.which != 1)
						return true;
					
					if ($.fn.ajaxGetContent.lastUrl == (href + hrefParams))
						return false;
					
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
					
					var $this = $(this);
					
					$this.data('options', options);
					$.fn.ajaxGetContent.lastClickedElement = $this;
					
					if ($.fn.ajaxGetContent.usePushState)
					{
						history.pushState( {} , '', href + hrefParams);
						$(window).trigger('popstate');
					}
					else jQuery.bbq.pushState(href + hrefParams, 2);
					
					return false;
				});
			}
		});
	
	};


})( jQuery );