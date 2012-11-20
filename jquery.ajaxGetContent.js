/*	
 *	jQuery AjaxGetContent 1.2

 *  Requires: jQuery BBQ, http://benalman.com/projects/jquery-bbq-plugin/
 *	
 *	More info at:
 *  www.implico.pl/lang-en/ajaxgetcontent_dynamic_ajax_website,7.html
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
			
			//url fragments not affected when found
			excludeUrl : [],
			
			//selectors for elements not to be affected when matched
			excludeSelector : [],
			
			//attributes for elements not to be affected when matched
			excludeAttr : { 'rel' : 'lightbox', 'rel' : 'nofollow' },
			
			//invoked while target url checking
			onHrefCheck : function(href, hrefParams) {
				//avoid files
				return (href.length == 0) || (href.substr(href.length-1, 1) == '/') || (href.substr(href.length-5, 5) == '.html'); 
			},
			
			//invoked after sending request
			onSend : function(url) {},
			
			//invoked after receiving request
			onReceive : function(data, status) {}
			
		}, options);
		
		var usePushState = !options.forceBookmarkLinking && history.pushState;
		
		var cache = new Array();
		
		var mainElement = this;
		
		$.fn.ajaxGetContent.lastClickedElement = null;
		$.fn.ajaxGetContent.lastClickedUrl = null;
		$.fn.ajaxGetContent.ajaxHandler = null;
		
		//indicates whether there was any click since plugin started
		wasClicked = $('body').data('ajaxGetContent');
		
		var sendReceive = function (bool_data, url_status)
		{
			if (typeof bool_data == 'boolean')
			{
				if (options.useCache && (url_status in cache))
				{
					options.onSend(url_status);
					sendReceive(cache[url_status], 'success');
					return;
				}
				$.fn.ajaxGetContent.lastClickedUrl = url_status;
				
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
				
				data.push ({ name: options.requestParameter, value:'on'});
				if ($.fn.ajaxGetContent.ajaxHandler)
					$.fn.ajaxGetContent.ajaxHandler.abort();
				$.fn.ajaxGetContent.ajaxHandler = $.ajax({ url: url_status, data: data, type : 'GET', success : sendReceive, error : sendReceive, context : this });
				options.onSend(url_status);
			}
			else
			{
				$.fn.ajaxGetContent.ajaxHandler = null;
				
				if (url_status == 'success')
				{
					if (options.useCache && $.fn.ajaxGetContent.lastClickedUrl)
					{
						cache[$.fn.ajaxGetContent.lastClickedUrl] = bool_data;
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
			
			if (usePushState)
			{
				if (url == null)
					url = href.location;
				
				history.pushState( {} , '', url);
				wasClicked = true;
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
		$.fn.ajaxGetContent.getCurrentUrl = function()
		{
			if (usePushState)
			{
				var url = new String(location.href);
				var startPos = url.indexOf('//');
				startPos = startPos >=0 ? startPos+2 : 0;
				url = url.substr(url.indexOf('/', startPos));
				if (url.length == 0)
					url = '/';
				
				return url;
			}
			else return $.param.fragment();
		}
		
		//binds hashchange event
		if (!$('body').data('ajaxGetContent'))
		{
			$(window).bind( usePushState ? 'popstate' : 'hashchange', function( event )
			{
				if (!(usePushState && !wasClicked))	//in Chrome & Safari popstate is fired also when entering a website
					sendReceive(true, usePushState ? location.href : event.fragment);
			});
			
			$('body').data('ajaxGetContent', true);
		}

		
		
		return this.each(function(index, element)
		{
			$this = $(element);
			
			var alreadyEnabled = $this.data('ajaxGetContent');

			var href = $this.attr('href');
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
			
			//checking excluding selectors
			var excludeSelector = false;
			$.each(options.excludeSelector, function(i, v)
			{
				if ($this.is(v))
				{
					excludeSelector = true;
					return;
				}
			});
			
			//validating url
			var invalidUrl = 	(href.substr(0,1) != '/') || (href.indexOf('#') >= 0); 
								

			//checking excluding url fragments
			var excludeUrl = false
			$.each(options.excludeUrl, function(i, v)
			{
				if (href.indexOf(v) >= 0)
				{
					excludeUrl = true;
					return;
				}
			});
			
			//checking onUrlCheck callback
			var onHrefCheck = options.onHrefCheck(href, hrefParams);
				
			
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
					
			
			if (!alreadyEnabled && !excludeSelector && !invalidUrl && !excludeUrl && onHrefCheck && !excludeAttr && !hasOnClick)
			{
				
				$this .data('ajaxGetContent', true);
				$this .click(function()
				{
					//check if url is a base url, if not - load baseUrl page with ajax link
					var hrefNoAnchor = new String(window.location.href);
					if (hrefNoAnchor.indexOf('#') >= 0)
						hrefNoAnchor = hrefNoAnchor.substr(0, hrefNoAnchor.indexOf('#'));
					
					if (!usePushState)
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
					
					wasClicked = true;
					
					if (usePushState)
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