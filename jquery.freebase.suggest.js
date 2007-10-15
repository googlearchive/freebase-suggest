/**
 * jQuery Freebase Autocomplete Plugin
 * 
 * @requires (>=jquery-1.2.js)
 *
 ******************************************************************************
 * Copyright (c) 2007, Metaweb Technologies, Inc.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 *       copyright notice, this list of conditions and the following
 *       disclaimer in the documentation and/or other materials provided
 *       with the distribution.
 * 
 * THIS SOFTWARE IS PROVIDED BY METAWEB TECHNOLOGIES ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL METAWEB TECHNOLOGIES BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR
 * BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN
 * IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 ******************************************************************************
 *
 * TODO:
 *      - handle timeout/errors
 * 
 * @author daepark (metaweb.com)
 */
(function($) {

/**
 * freebaseSuggest() provides a way to attach Freebase suggestion behavior to a
 * text input using the Freebase.com autocomplete service.
 * 
 * freebaseSuggest accepts a single argument which is an options Object with
 * the following attributes:
 *
 * width:       This is the width of the suggestion list and the flyout in
 *              pixels. Default is 275.
 * 
 * soft:        Soft suggestion. If true, DO NOT auto-select first item
 *              in the suggestion list. Otherwise, select first item. 
 *              Default is false.
 * 
 * suggest_new:  To enable a suggest new option, set text to a non-null string.
 *              This is the string displayed for the suggest new option
 *              (eg, "Create new topic"). Default is null.
 * 
 * flyout:      To enable flyout to show additional information for the 
 *              currently highlighted item including a thumbnail and blurb.
 *              Default is true.
 * 
 * service_url: This the base url to all the api services like autocomplete,
 *              blurbs and thumbnails. Default is "http://www.freebase.com".
 * 
 * ac_path:     The path to the autcomplete service. Default is "/api/service/search".
 * 
 * ac_param:    A dicionary of query parameters to the autocomplete service. 
 *              Currently, the supported parameters are 
 *              query (required) - the string to do an auto-complete on. See ac_qstr
 *              type  (optional) - type of items to match for (ie, "/film/film")
 *              limit (optional) - the maximum number of results to return, default is 20
 *              start (optional) - offset from which to start returning results, default is 0
 * 
 * ac_qstr:     This is the parameter name to be passed to the autocomplete
 *              service for the string to autocomplete on. The value will
 *              be what the user typed in the input. Default is "query".
 * 
 * blurb_path:  The path to the blurb service for the description to be shown
 *              in the flyout. Default is "/api/trans/blurb".
 * 
 * blurb_param: The query parameters to the blurb service.
 *              Default is { maxlength: 300 }.
 * 
 * thumbnail_path:  The path to the thumbnail service to be shown in the flyout. 
 *                  Default is "/api/trans/image_thumb".
 * 
 * thumbnail_param: The query paramters to the thumbnail service. Default is {}.
 * 
 * filter:      Specify a filter function if you want to filter any of the items
 *              returned by ac_path service. The function is called with one
 *              arugment representing an item from the ac_path result. The function
 *              should return TRUE to include the item or FALSE to exclude. 
 *              Default is a function that returns TRUE.
 *              @see fbs.filter
 * 
 * transform:   Specify a transform function if you want to transform the default
 *              display of the suggest list item.
 *              @see fbs.transform
 *              
 * 
 * In addition, freebaseSuggest will trigger the following events on behalf of
 * the input it's attached to. They include:
 * 
 * suggest          Triggered when something is selected from the suggestion
 *                  list. The data object will contain id and name fields:
 *                  { id: aString, name: aString }.
 * 
 * suggest-new:    	Triggered when the suggest_new option is selected. 
 *                  The data object will only contain a name field: { name: aString }.
 * 
 * suggest-submit   Triggered when user presses enter key after selecting from
 *                  list or when nothing is highlighted from the list (soft).
 *                  The data object will contain a name and/or id field.
 * 
 *
 * @example
 * $('#myInput')
 *      .freebaseSuggest()
 *      .bind('suggest', function(e, data) { console.log('suggest: ', data.id); })
 * 
 * @desc Attach Freebase suggestion behavior to #myInput with default options and on
 *          'suggest', output the selected id the console.
 *
 *
 * @example
 * var options = {
 *      soft: true,
 *      suggest_new: 'Create new Film',
 *      ac_param: {
 *          type: '/film/film',
 *      }
 * };
 * $('#myInput')
 *      .freebaseSuggest(options)
 *      .bind('suggest', function(e, data) { console.log('suggest: ', data.id); })
 *      .bind('suggest-new', function(e, data) { console.log('suggest new: ', data.name); });
 * 
 * @desc Soft suggestion on instances of '/film/film' with a suggest new option and
 *          output the various events to the console.
 *
 * @name   freebaseSuggest
 * @param  options  object literal containing options which control the suggestion behavior
 * @return jQuery
 * @cat    Plugins/Freebase
 * @type   jQuery
 */
$.fn.freebaseSuggest = function(options) {
    if (!options) options = {};
    var fbs = window.freebase.suggest;
    return this
        .attr("autocomplete", "off")
        .each(function() {
            fbs.release(this);
            //$(this).unbind("focus", fbs.on_focus).focus(fbs.on_focus); 
            removeEvent(this, "focus", fbs.on_focus);
            addEvent(this, "focus", fbs.on_focus);
            // we might be just resetting the options
            if (typeof this['fbs_id'] == 'undefined')
                this.fbs_id = fbs.counter++;
            // flush cache
            fbs.cache[this.fbs_id] = null;
            // store options in hash
            var o = {};
            $.extend(o, fbs.default_options, options);
            fbs.option_hash[this.fbs_id] = o;            
        });
};


/**
 * freebase namespace
 */
if (!("freebase" in window && window.freebase))
    window.freebase = {};
var fb = window.freebase;

/**
 * firebug's console.log if it exists
 */
fb.log = fb.error = fb.debug = function() {};
if (typeof console != "undefined" && console.log && console.error) {
    fb.log = console.log;
    fb.error = console.error;
    fb.debug = console.debug;
};


/**
 * fb.suggest namespace
 */
fb.suggest = {
    // default options you can overide
    default_options: {
        width: 275,   // width of list and flyout
        soft: false,  // if true, DO NOT auto-select first item, otherwise select first item by default
        suggest_new: null, // to show suggest new option, set text to something (eg, "Create new topic")
        flyout: true,  // show flyout on the side of highlighted item
        service_url: "http://www.freebase.com",
        ac_path: "/api/service/search",
        ac_param: {
            type: "/common/topic",
            start: 0,
            limit: 20
        },
        ac_qstr: "query",  // this will be added to the ac_param ...&prefix=str
        blurb_path: "/api/trans/blurb",
        blurb_param: {
            maxlength: 300
        },
        thumbnail_path: "/api/trans/image_thumb",
        thumbnail_param: {},
        filter: null,
        transform: null,
        fudge: 8
    },
    // internal variables - PLEASE DO NOT TOUCH!!!
    counter: 0,
    cache: {},
    option_hash: {},
    manage_delay: 200,
    release_delay: 100, 
    flyout_delay: 0,
    loadmsg_delay: 500
};

/**
 * shorthand for fb.suggest
 */
var fbs = fb.suggest;

fbs.manage = function(input) {//fb.log("manage", input);    
    fbs.release(input);
//    $(input)
//        .blur(fbs.on_blur)
//        .keypress(fbs.on_keypress)
//        .keyup(fbs.on_keyup);
    addEvent(input, "blur", fbs.on_blur);
    addEvent(input, "keydown", fbs.on_keydown);
    addEvent(input, "keypress", fbs.on_keypress);
    addEvent(input, "keyup", fbs.on_keyup);
    fbs.sm.transition("start");        
    fbs.sm.handle({id:"TEXTCHANGE", input:input});
};

fbs.release = function(input) {//fb.log("release", input); 
//    $(input)
//        .unbind("blur")
//        .unbind("keypress")
//        .unbind("keyup");
    removeEvent(input, "blur", fbs.on_blur);
    removeEvent(input, "keydown", fbs.on_keydown);
    removeEvent(input, "keypress", fbs.on_keypress);
    removeEvent(input, "keyup", fbs.on_keyup);
    fbs.list_hide();
    fbs.sm.transition("start"); 
};

fbs.options = function(input) {//fb.log("fbs.options", input);
    var o = fbs.option_hash[input.fbs_id];
    if (!o) 
        throw "Unknown input";
    return o;  
};

fbs.on_focus = function(e) {//fb.log("on_focus", e);
    window.clearTimeout(fbs.manage_timeout);
    var input = e.target;    
    try {
        fbs.options(input);              
    }
    catch(e) {
        return;   
    }
    fbs.manage_timeout = window.setTimeout(delegate(fbs.manage, null, [input]), fbs.manage_delay);     
};

fbs.on_blur = function(e) {//fb.log("on_blur", this); 
    window.clearTimeout(fbs.release_timeout);
    var input = e.target;
    if (fbs.list_focused) {
        // the current input we are losing focus on
        // because we've clicked on the list/listitem
        fbs._input = input;
        return;
    }
    fbs.release_timeout = window.setTimeout(delegate(fbs.release, null, [input]), fbs.release_delay);
};

fbs.on_uparrow = function(e) {
    fbs.sm.handle({id:"UPARROW", input:e.target});    
};

fbs.on_downarrow = function(e) {
    fbs.sm.handle({id:"DOWNARROW", input:e.target});
};

fbs.on_enterkey = function(e) {
    fbs.sm.handle({id:"ENTERKEY", input:e.target, domEvent:e});
};

fbs.on_escapekey = function(e) {
    fbs.sm.handle({id:"ESCAPEKEY", input:e.target});
};

fbs.on_textchange = function(e) {//fb.log("on_textchange", e.target); 
    window.clearTimeout(fbs.textchange_timeout);
    var txt = fbs.val(e.target);
    var delay = fbs.delay(txt.length);
    fbs.textchange_timeout = window.setTimeout(delegate(fbs.on_textchange_delay, null, [e.target]), delay);
};

fbs.on_textchange_delay = function(input){//fb.log("on_textchange_delay", input);    
    fbs.sm.handle({id:"TEXTCHANGE", input:input});
};

fbs.on_keydown = function(e) {//fb.log("on_keydown", e.keyCode);
    switch(e.keyCode) {
    	case 38: // up
    	case 40: // down
    	   // prevents cursor/caret from moving (in Safari)
    	   e.preventDefault();
    	   break;    
    	default:
    	   break;
    }
};

fbs.on_keypress = function(e) {//fb.log("on_keypress", e.keyCode);
    switch(e.keyCode) {
    	case 38: // up
    	case 40: // down
    	   // prevents cursor/caret from moving
    	   e.preventDefault();
    	   break;
    	case 13: // return
            fbs.on_enterkey(e);
    		break ;
        case 27: // escape
            fbs.on_escapekey(e);
            break;    	   	   
    	default:
    	   break;
    } 
};

fbs.on_keyup = function(e) {//fb.log("on_keyup", e.keyCode);
    switch(e.keyCode) {
    	case 38: // up
    		e.preventDefault();
    		fbs.on_uparrow(e);
    		break;
    	case 40: // down
    		e.preventDefault();
    		fbs.on_downarrow(e);
    		break;
        case  9: // tab    		
        case 13: // enter
        case 16: // ctrl
        case 17: // shift
        case 18: // option/alt
        case 27: // escape
        case 37: // left
        case 39: // right
        case 224:// apple/command
            break;
    	default:
    	   fbs.on_textchange(e);
    	   break;
    } 
};

fbs.on_click_listitem = function(li) {//fb.log("on_click_listitem", li, fbs._input);
    fbs.sm.handle({id:"LISTITEM_CLICK", item:li, input:fbs._input});
};

fbs.on_mousedown_list = function(e) {//fb.log("on_mousedown_list", e);
    // hack in IE/safari to keep suggestion list from disappearing when click/scrolling
    fbs.list_focused = true;    
};

fbs.on_mouseup_list = function(e) {//fb.log("on_mouseup_list", e);
    // hack in IE/safari to keep suggestion list from disappearing when click/scrolling
    if (fbs._input) {
        //$(fbs._input).unbind("focus", fbs.on_focus);
        removeEvent(fbs._input, "focus", fbs.on_focus);  
        $(fbs._input).focus();
        //$(fbs._input).focus(fbs.on_focus);
        window.setTimeout(addEvent, 0, fbs._input, "focus", fbs.on_focus);
        //addEvent(fbs._input, "focus", fbs.on_focus);
    }
    fbs.list_focused = false; 
};

fbs.ac_error = function(errtype, messages, o) {
    // TODO: handle errors from the autocomplete service
    fb.error("ac_error", errtype, messages, o);
};

fbs.ac_receive = function(input, query, o) {
    // handle errors
    if (o.status !== '200 OK') {
        fbs.ac_error(o.code, o.messages, o);
        return;
    }

    // currently, ac_receive recognizes results from 
    // /api/service/textsearch and /api/service/autocomplete. 
    // In the near future, the two services will output the same results.
    //
    // Note that the current default transform works with the 
    // /api/service/autocomplete result list, therefore if you
    // use the /api/service/textsearch service, you will need
    // to provide your own transform. 
    //
    // For a sample result set of the textsearch service:
    // http://www.freebase.com/api/service/textsearch?query=arnold&limit=30&start=0&type=%2Fgovernment%2Fus_politician
    var result = [];
    if ("list" in o && "listItems" in o.list)
        result = o.list.listItems;
    else if ("result" in o)
        result = o.result;
    else if ("results" in o)
        result = o.results;    
    else {
        fbs.ac_error(o.code, "Unrecognized autocomplete result", o);
        return;
    }
   
    var qstr = null;
    if ("prefix" in o)
        qstr = o.prefix;
    else if("query" in o)
        if (typeof o.query == "object")
            qstr = o.query.query;
        else
            qstr = o.query;
    else
        qstr = query;

    // update cache
    if (!fbs.cache[input.fbs_id]) fbs.cache[input.fbs_id] = {};
    fbs.cache[input.fbs_id][o.prefix] = result;
    // handle result    
    fbs.sm.handle({id:"AUTOCOMPLETE_RESULT", input:input, result:result});
}

fbs.ac_load = function(input) {//fb.log("ac_load", input);
    if (!input) 
        return;
    if (!"fbs_id" in input) 
        return;
    var txt = $.trim(fbs.val(input));
    if (!txt.length) 
        return;

    // look in cache first
    if (!fbs.cache[input.fbs_id]) fbs.cache[input.fbs_id] = {};
    if (txt in fbs.cache[input.fbs_id]) {
        //fb.log("load from cache: ", txt);
        window.setTimeout(delegate(fbs.sm.handle, fbs.sm, [{id:"AUTOCOMPLETE_RESULT", input:input, result:fbs.cache[input.fbs_id][txt]}]), 0);
        return;
    }    
    var options = fbs.options(input);
    var txt = $.trim(fbs.val(input));
    var param = options.ac_param;
    param[options.ac_qstr] = txt;

    $.ajax({
        type: "GET",
		url: options.service_url + options.ac_path,
		data: param,
		success: delegate(fbs.ac_receive, null, [input, txt]),
		dataType: "jsonp",
		cache: true
	});
};

/**
 * The default filter
 * 
 * @param data - The individual item from the ac_path service.
 * @return TRUE to include in list or FALSE to exclude from list.
 */
fbs.filter = function(data) {
    return true;  
};

/**
 * The default transform
 * 
 * @param data - The individual item from the ac_path service
 * @param q - The query string
 * @param options - Options used for the input
 * @return a DOM element or html that will be appended to an <li/>
 */
fbs.transform = function(data, q, options) {
    var types = [];
    if (data.type)
        $.each(data.type, function(i,n){
            if (n.id != '/common/topic')
                types.push(fbs.name(n));
        });
    types = types.join(", ");

    var domains = [];
    if (data.domain)
        $.each(data.domain, function(i,n){
            domains.push(fbs.name(n));
        });
    domains = domains.join(", ");

    var aliases = [];
    if (data.alias)
        $.each(data.alias, function(i,n){
            aliases.push(n);
        });
    aliases = aliases.join(", ");

    var props = [];
    if (data.properties)
        $.each(data.properties, function(i,n){
            props.push(n);
        });
    props = props.join(", ");
    
    var div = document.createElement("div");
    $(div).append(
            '<div class="fbs-li-aliases"></div>' +
            '<div class="fbs-li-name"></div>' +
            '<div class="fbs-li-types"></div>' +
            '<div class="fbs-li-domains"></div>' +
            '<div class="fbs-li-props"></div>');
    if (aliases.length) {
        var text = $(".fbs-li-aliases", div).append(document.createTextNode("("+aliases+")")).text();
        if (q) 
            $(".fbs-li-aliases", div).empty().append(fbs.em_text(text, q));
    }
    else
        $(".fbs-li-aliases", div).remove();
     
    var text = $(".fbs-li-name", div).append(document.createTextNode(fbs.name(data))).text();
    if (q) 
        $(".fbs-li-name", div).empty().append(fbs.em_text(text, q));

    if (types.length)
        $(".fbs-li-types", div).append(document.createTextNode(types));
    else
        $(".fbs-li-types", div).remove();

    if (domains.length)
        $(".fbs-li-domains", div).append(document.createTextNode(domains));
    else
        $(".fbs-li-domains", div).remove();        
          
    if (props.length)
        $(".fbs-li-props", div).append(document.createTextNode(props));
    else
        $(".fbs-li-props", div).remove();
    
    return div.innerHTML;    
};

fbs.create_list_item = function(data, q, options) {

    var frag = document.createDocumentFragment();
    $(frag).append('<li class="fbs-li"></li>');
    var li = $("> li", frag);
    
    var trans = fbs.transform;
    if (typeof options.transform == "function")
        trans = options.transform;

    var html = trans.apply(null, [data, q, options]); 
   
    $(li).append(html);

    // sometimes data contains text and/or name
    if ("text" in data)
        data.name = data.text;
    
    li[0].fb_data = data;
    autoclean(li, li_clean);
    
    return li
        .mouseover(function(e) { 
            fbs.list_select(null, this, options); 
        })
        .click(function(e) { 
            fbs.on_click_listitem(this); 
        });
};

/**
 * show loading message
 */
fbs.loading_show = function(input) {
    fbs.list_hide();
    if (!$("#fbs_loading").length) {
        $(document.body)        
            .append(
                '<div style="display:none;position:absolute" id="fbs_loading" class="fbs-topshadow">' +
                    '<div class="fbs-bottomshadow">'+
                        '<ul class="fbs-ul">' +
                            '<li class="fbs-li">'+ 
                                '<div class="fbs-li-name">loading...</div>' +
                            '</li>' +
                        '</ul>' +
                    '</div>' +
                '</div>');        
    }
    var options = fbs.options(input);
    var pos = $(input).offset({border: true, padding: true});
    
    var top = pos.top + input.clientHeight + options.fudge;
    $("#fbs_loading")
        .css({top:top, left:pos.left, width:options.width})
        .show();
};

/**
 * hide loading message
 */
fbs.loading_hide = function() {
    $("#fbs_loading").hide();     
};

fbs.list_show = function(input, result) {//fb.log("list_show", input, result);
    if (!input) 
        return;
    if (!result) 
        result = [];
    var options = fbs.options(input);  
    var txt = fbs.val(input);
    var list = null;
    if (!$("#fbs_list").length) {
        $(document.body)
            .append(
                '<div style="display:none;position:absolute" id="fbs_list" class="fbs-topshadow">' +
                    '<div class="fbs-bottomshadow">'+
                        '<ul class="fbs-ul"></ul>' +
                        '<div style="display:none;" class="fbs-suggestnew"></div>' +
                    '</div>' +
                '</div>');

        var p = $("#fbs_list > .fbs-bottomshadow")[0];
        $(p).mousedown(fbs.on_mousedown_list)
            .mouseup(fbs.on_mouseup_list)
            .scroll(fbs.on_mousedown_list);  
        list = $("> .fbs-ul")[0];
    }
    if (!list) 
        list = $("#fbs_list > .fbs-bottomshadow > .fbs-ul")[0];
    
    // unbind all li events and empty list
    $("li", list)
        .each(function(i,n) {
            $(n).unbind();
        });
    $(list).empty();
        
        
    var filter = fbs.filter;
    if (typeof options.filter == "function")
        filter = options.filter;
    
    if (!result.length)
        $(list).append(fbs.create_list_item({id:"NO_MATCHES", text:"no matches"}, null, options).addClass("fbs-li-nomatch"));
    $.each(result, function(i, n) { 
        if (filter.apply(null, [n]))       
            $(list).append(fbs.create_list_item(n, txt, options));
    });
    
    var suggest_new = $(list).next()[0];
    if (options.suggest_new) {
        $(suggest_new)
            .unbind()
            .empty()
            .append(options.suggest_new)
            .show()
            .mouseover(function(e) {
                $(e.target).addClass("fbs-suggestnew-selected");
                fbs.list_select(null);
                fbs.flyout_hide();   
            })
            .mouseout(function(e) {
                $(this).removeClass("fbs-suggestnew-selected");
            })
            .click(function(e) {
                $(input).trigger("suggest-new", [{name:fbs.val(input)}]);
                fbs.sm.transition("start"); 
            });
    }
    else
        $(suggest_new).unbind().hide();

    var pos = $(input).offset({border: true, padding: true});
    var top = pos.top + input.clientHeight + options.fudge;
    $("#fbs_list")
        .css({top:top, left:pos.left, width:options.width})
        .show();
};

fbs.list_hide = function() {//fb.log("list_hide");
    $("#fbs_list").hide();
    fbs.flyout_hide();
};

fbs.list_select = function(index, li, options) {
    var sli = null;
    $("#fbs_list > .fbs-bottomshadow > .fbs-ul > li").each(function(i,n) {
        if (i == index || li == n) {
            $(n).addClass("fbs-li-selected");
            sli = n;
        }
        else 
            $(n).removeClass("fbs-li-selected");
    });
    
    
    if (sli && options && options.flyout && sli.fb_data && sli.fb_data.id != "NO_MATCHES")
        fbs.flyout(sli, options);
        
    return sli;
};

fbs.list_length = function() {
    return $("#fbs_list > .fbs-bottomshadow > .fbs-ul > li").length;
};

fbs.list_selection = function(returnObj) {
    if (!returnObj) 
        returnObj = {};
    returnObj.index = -1;
    returnObj.item = null;
    $("#fbs_list > .fbs-bottomshadow > .fbs-ul > li").each(function(i,n){
        if (n.className.indexOf("fbs-li-selected") != -1) {
            returnObj.index = i;
            returnObj.item = n;
            return false;
        }
    });
    return returnObj;
}

fbs.list_select_next = function(options) {
    var len = fbs.list_length();
    var obj = fbs.list_selection();
    var index = obj.index+1;
    if (index >=0 && index < len)
        return fbs.list_select(index, null, options);
    else if (options.soft)
        return fbs.list_select(null, null, options);
    else if (len > 0)
        return fbs.list_select(0, null, options);
    return null;
};

fbs.list_select_prev = function(options) {
    var len = fbs.list_length();
    var obj = fbs.list_selection();
    var index = obj.index-1;
    if (index >=0 && index < len)
        return fbs.list_select(index, null, options);
    else if (options.soft) {
        if (index < -1 && len > 0) 
            return fbs.list_select(len - 1, null, options);
        else 
            return fbs.list_select(null, null, options);
    }
    else if (len > 0)
        return fbs.list_select(len - 1, null, options);
    return null;
};

fbs.scroll_into_view = function(elt, p) {
    if (elt) 
        elt.scrollIntoView(false);
};

fbs.flyout = function(li, options) { //fb.log("flyout", li);
    window.clearTimeout(fbs.flyout_timeout); 
    fbs.flyout_hide();
    fbs.flyout_timeout = window.setTimeout(delegate(fbs.flyout_resources, null, [li, options]), fbs.flyout_delay);        
};

/**
 * load flyout resources (thumbnail, blurb), don't show until
 * both thumbnail and blurb have been loaded.
 */
fbs.flyout_resources = function(li, options) {//fb.log("flyout_resources", li);
    if (!(li && li.fb_data && "id" in li.fb_data && "article" in li.fb_data && "image" in li.fb_data))
        return;
    var cb = function(data_type, data) {
        //fb.log("callback", data_type, data);
        switch (data_type) {
            case "image":
                arguments.callee.image = data;
                break;
            case "blurb":
                arguments.callee.blurb = data;
                break;
            default:
                break;    
        }
        if (arguments.callee.image && arguments.callee.blurb) {
            fbs.flyout_show(li, options, arguments.callee.image, arguments.callee.blurb);
            arguments.callee.image = null;
            arguments.callee.blurb = null;
        }
    };
    cb.image = null;
    cb.blurb = null;
    
    // load article
    if (li.fb_data.article)
        fbs.blurb_load(typeof li.fb_data.article == "object" ?  li.fb_data.article.id : li.fb_data.article, options, cb);
    else
        cb.apply(null, ["blurb", "&nbsp;"]);
    
    // load image
    if (li.fb_data.image)        
        fbs.image_load(typeof li.fb_data.image == "object"? li.fb_data.image.id : li.fb_data.image, options, cb);
    else
        cb.apply(null, ["image", "#"]);
};


fbs.flyout_hide = function() {//fb.log("flyout_hide");
    $("#fbs_flyout").hide();
};

fbs.flyout_show = function(li, options, img_src, blurb) {//fb.log("flyout_show", li, img_src, blurb);
    if ("none" == $("#fbs_list").css("display")) 
        return;
    if (li != fbs.list_selection().item) 
        return;

    if (!$("#fbs_flyout").length) {
        $(document.body)
            .append(
                '<div style="display:none;position:absolute" id="fbs_flyout" class="fbs-topshadow">' +
                    '<div class="fbs-bottomshadow">'+
                        '<div class="fbs-flyout-container">' +
                            // label
                            '<div class="fbs-flyout-name"></div>' +
                            // image
                            '<div class="fbs-flyout-image"></div>' +
                            // types
                            '<div class="fbs-flyout-types"></div>' +
                            // domains
                            '<div class="fbs-flyout-domains"></div>' +
                            // blurb
                            '<div class="fbs-flyout-blurb"></div>' +
                        '</div>' +                                              
                    '</div>' +
                '</div>');   
    }
    
    $("#fbs_flyout .fbs-flyout-name").empty().append('<a href="' + fbs.freebase_url(li.fb_data.id, options) + '">' + $(".fbs-li-name", li).text() + '</a>');
    $("#fbs_flyout .fbs-flyout-image").empty();
    if (img_src != "#")
        $("#fbs_flyout .fbs-flyout-image").append('<img src="' + img_src + '"/>');
    $("#fbs_flyout .fbs-flyout-types").empty().append($(".fbs-li-types", li).text());
    $("#fbs_flyout .fbs-flyout-domains").empty().append($(".fbs-li-domains", li).text());
    $("#fbs_flyout .fbs-flyout-blurb").empty().append(blurb);

    var pos = $("#fbs_list > .fbs-bottomshadow > .fbs-ul").offset();
    var left = pos.left + options.width;
    var sl = document.body.scrollLeft;
    var ww = $(window).width();
    if ((left+options.width) > (sl+ww))
        left = pos.left - options.width;
    //var pos = $(li).offset();
    $("#fbs_flyout")
        .css({top:pos.top, left:left, width:options.width})
        .show();
    
};

fbs.blurb_receive = function(id, cb, o) {
    // handle errors
    if (o.status !== '200 OK') {
        fbs.ac_error(o.code, o.messages, o);
        return;
    }
    var result = o.result.body
    // update cache
    fbs.cache[id] = result;
    // handle result    
    cb.apply(null, ["blurb", result]);    
};

fbs.blurb_load = function(id, options, cb, cb_args) {//fb.log("blurb_load", id, options, cb, cb_args);
    // look in cache
    if ("id" in fbs.cache) {
        cb.apply(null, cb_args.push(fbs.cache[id]));
        return;
    }
    $.ajax({
        type: "GET",
		url: options.service_url + fbs.blurb_path(id, options),
		data: options.blurb_param,
		success: delegate(fbs.blurb_receive, null, [id,cb]),
		dataType: "jsonp",
		cache: true
	});
};

fbs.image_load = function(id, options, cb) {//fb.log("image_load", id, options, cb);
    // look in cache
    if ("id" in fbs.cache) {
        cb.apply(null, ["image", fbs.cache[id]]);
        return;
    }    
    var i = new Image();
    var src = fbs.thumbnail_url(id, options);    
    i.onload = delegate(cb, null, ["image", src]);        
    i.onerror = delegate(cb, null, ["image", src]);  
    autoclean(i, image_clean);
    fbs.cache[id] = src;   
    i.src = src; 
};

fbs.caret_last = function(input) {
    var p = fbs.val(input).length;
    if (input.createTextRange) {
        // IE
        var range = input.createTextRange();;
        range.collapse(true);
        range.moveEnd("character", p);
        range.moveStart("character", p);
        range.select();
    }
    else if (input.setSelectionRange) {
        // mozilla
        input.setSelectionRange(p, p);
    }    
};

fbs.blurb_path = function(id, options) {
    return options.blurb_path + fbs.quote_id(id);    
};

fbs.thumbnail_url = function(id, options) {
    var url = options.service_url + options.thumbnail_path +
        fbs.quote_id(id);
    var qs = $.param(options.thumbnail_param);
    if (qs)
         url += "?" + qs;
    return url;
};

fbs.freebase_url = function(id, options) {
    var url = options.service_url + "/view" + fbs.quote_id(id);
    return url;
};

fbs.quote_id = function(id) {
    if (id.charAt(0) == '/')
        return id;
    else
        return ('/' + encodeURIComponent(id));
};

/**
 * emphasize part of the html text with <em/>
 */
fbs.em_text = function(text, em_str) {
    var em = text;
    var index = text.toLowerCase().indexOf(em_str.toLowerCase());
    if (index >= 0) {    
        em = text.substring(0, index) + 
        '<em class="fbs-em">' +
        text.substring(index, index+em_str.length) +
        '</em>' +
        text.substring(index + em_str.length);
    }  
    return em;
};

/**
 * get input value, if null, return empty string ("")
 */
fbs.val = function(input) {
    var v = $(input).val();
    if (v == null) 
        return "";
    return $.trim(v);
};

/**
 * get "name" or "text" field of an object. if none return "unknown"
 */
fbs.name = function(obj) {
    // backwards compatibility with data.text and data.name  
    if (obj.text != null)
        return obj.text;
    if (obj.name != null)
        return obj.name;
    return "unknown";
};

/**
 * text change delay variable to length of string
 */
fbs.delay = function(l) {
    var t = .3;
    if (l > 0)
        t = 1/(6 * (l-0.7)) + .3;
    return t * 1000;
};


/**
 * simple state object
 */
fb.state = function() {};
fb.state.prototype = {
    enter: function(data) {},
    exit: function(data) {},
    handle: function(data) {}
};

/**
 * simple state machine
 */
fb.state_machine = function(states) {
    // states: [["STATE_NAME_1", state_1],...,["STATE_NAME_n", state_n]]
    this.current_state = null;
    this.states = {};
    var owner = this;
    $.each(states, function(i,n) {
        n[1].sm = owner;
        owner.states[n[0]] = n[1];
        if (i==0) 
            owner.current_state = n[0];
    });
    if (!this.current_state) 
        throw "StateMachine must be initialized with at least one state";
    this.states[this.current_state].enter();     
};
fb.state_machine.prototype = {    
    transition: function(to_state, exit_data, enter_data, data) { //fb.log("state_machine.transition current_state: ", this.current_state, "to_state: ", to_state);
        // to_state: the target destination state
        // exit_data: the exit data for current state
        // enter_data: the enter data for to_state
        // data: the data for to_state.handle        
        var target = this.states[to_state];
        if (!target) 
            throw("Unrecongized state:" + to_state);
    
        var source = this.states[this.current_state];

        // exit current state
        source.exit(exit_data);
    
        // enter target state
        target.enter(enter_data);

        this.current_state = to_state;        
        
        // handle data
        this.handle(data);
    },    
    handle: function(data) {
        if (data) 
            this.states[this.current_state].handle(data);
    }
};


/**
 * state: start
 */
fbs.state_start = function() {
    fb.state.call(this);  
};
fbs.state_start.prototype = new fb.state();
fbs.state_start.prototype.handle = function(data) {//fb.log("state_start.handle", data);
    if (!data || !data.input) 
        return;
    var options = fbs.options(data.input);
    switch (data.id) {
        case "TEXTCHANGE":
        case "DOWNARROW":
            var txt = fbs.val(data.input);
            if (txt.length)
                this.sm.transition("getting", null, data);
            else 
                fbs.list_hide();
            break;
        case "ENTERKEY":    
            $(data.input).trigger("suggest-submit", [{name:fbs.val(data.input)}]);
            break;
        default:
            break;
    };
};

/**
 * state: getting
 */
fbs.state_getting = function() {
    fb.state.call(this);
};
fbs.state_getting.prototype = new fb.state();
fbs.state_getting.prototype.enter = function(data) {//fb.log("state_getting.enter", data); 
    if (!data || !data.input) 
        return;
    // show loading msg
    //fbs.loading_show(data.input);         
    fbs.loadmsg_timeout = window.setTimeout(fbs.loading_show, fbs.loadmsg_delay, data.input);    
    // request autocomplete url
    fbs.ac_load(data.input);
};
fbs.state_getting.prototype.exit = function(data) {//fb.log("state_getting.exit", data); 
    // hide loading msg
    window.clearTimeout(fbs.loadmsg_timeout);
    fbs.loading_hide();
};
fbs.state_getting.prototype.handle = function(data) {//fb.log("state_getting.handle", data);
    if (!data || !data.input) 
        return;
    var options = fbs.options(data.input);    
    switch (data.id) {
        case "TEXTCHANGE":
            this.sm.transition("start", null, null, data);
            break;
        case "AUTOCOMPLETE_RESULT":
            this.sm.transition("suggesting", null, data);
            break;
        case "ENTERKEY":      
            $(data.input).trigger("suggest-submit", [{name:fbs.val(data.input)}]);            
            break;
        case "ESCAPEKEY":
            fbs.list_hide();
            this.sm.transition("start");
            break;            
        default:
            break;
    };
};

/**
 * state: suggesting
 */
fbs.state_suggesting = function() {
    fb.state.call(this);
};
fbs.state_suggesting.prototype = new fb.state();
fbs.state_suggesting.prototype.enter = function(data) {//fb.log("state_suggesting.enter", data);    
    if (!data || !data.input || !data.result) 
        return;
    fbs.list_show(data.input, data.result);
    var options = fbs.options(data.input);
    if (!options.soft)
        fbs.list_select(0, null, options);
};
fbs.state_suggesting.prototype.exit = function(data) {//fb.log("state_suggesting.exit", data);    
    //fbs.list_hide();
    fbs.flyout_hide();
    fbs.list_select(null);
};
fbs.state_suggesting.prototype.handle = function(data) {//fb.log("state_suggesting.handle", data);
    if (!data || !data.input) 
        return;    
    var options = fbs.options(data.input);
    switch (data.id) {
        case "TEXTCHANGE":
            this.sm.transition("start", null, null, data);
            break;
        case "DOWNARROW":
            $("#fbs_list").show();
            var li = fbs.list_select_next(options);
            fbs.scroll_into_view(li);
            break;
        case "UPARROW":
            $("#fbs_list").show();        
            var li = fbs.list_select_prev(options);
            fbs.scroll_into_view(li);
            break;
        case "ENTERKEY":
            var s = fbs.list_selection();
            if (s.index == -1 || !s.item) {
                this.sm.transition("start", null, null, data);
                return;
            }
            if ($("#fbs_list").css("display") != "none")
                data.domEvent.preventDefault();
            else {              
                $(data.input).trigger("suggest-submit", [s.item.fb_data]);
                return;   
            }
             
            data.id = "LISTITEM_CLICK";
            data.item = s.item;
            // let it fall directly into
            // 'case "LISTITEM_CLICK":'
        case "LISTITEM_CLICK":
            if (!data.item) 
                return;
            switch(data.item.fb_data.id) {
                case "NO_MATCHES":
                    break;
                default:
                    var txt = $(".fbs-li-name", data.item).text();
                    $(data.input).val(txt);
                    fbs.caret_last(data.input);
                    $(data.input).trigger("suggest", [data.item.fb_data]);
                    fbs.list_hide();
                    break;
            }            
            break;
        case "ESCAPEKEY":
            fbs.list_hide();
            this.sm.transition("start");
            break;            
        default:
            break;
    };
};


/**
 * initialize the autocomplete state machine
 * 
 * states:
 *      start: 
 *      getting:
 *      suggesting:
 */
fbs.sm = new fb.state_machine([
    ["start", new fbs.state_start()],
    ["getting", new fbs.state_getting()],
    ["suggesting", new fbs.state_suggesting()]
]);

/*****************************************************************************
 * @param obj:Object - Context in which to run the function
 * @param func:Function - Function to run.
 * @param args:Array - extra arguments to be appended to func's own arguments.
 *          So if a callback invokes func with an eventObject, func will be called
 *          with: func(eventObject, arg1, arg2,..., argN)
 */
function delegate(func, obj, args)  {
    if (typeof args == "undefined") 
        args = [];
    var f = function(){
        // 'arguments' isn't technically an array, so we can't just use concat
        var f_args = [];
        for(var i=0, len=arguments.length; i<len; i++)
          	f_args.push(arguments[i]);
        if (arguments.callee && arguments.callee.func)
          return (arguments.callee.func.apply(arguments.callee.target, arguments.callee.args.concat(f_args)));
        return undefined;
    };

    f.target = obj;
    f.func = func;
    f.args = args;

    // clean up delegate on window.unload
    autoclean(f, delegate_clean);

    return (f);
};

function delegate_clean(f) {
    if (f) 
        f.target = f.func = f.args = null;      
};

function image_clean(i) {
    if (i)
        i.onload = i.onerror = null;
};

function li_clean(li) {
    if (li) 
        delete li.fb_data;        
}

// ---------------------------------------------------- autoclean
var AUTOCLEAN_HEAP = {};
var AUTOCLEAN_SERIAL_NO = 0;

function autoclean(obj, finalizer) {
    obj._autoclean_serial_no = AUTOCLEAN_SERIAL_NO++;
    if (finalizer)
        obj._autoclean_finalizer = finalizer;
    AUTOCLEAN_HEAP[obj._autoclean_serial_no] = obj;
};

function autoclean_gc() {
    for (var k in AUTOCLEAN_HEAP) {
        var obj = AUTOCLEAN_HEAP[k];
        if ('_autoclean_finalizer' in obj)
            obj._autoclean_finalizer(obj)
    }
    AUTOCLEAN_HEAP = {};
}

function finalize(obj) {
    if (!obj || !('_autoclean_serial_no' in obj))
        return;
    var serial_no = obj._autoclean_serial_no;
    delete AUTOCLEAN_HEAP[serial_no];
    if ('_autoclean_finalizer' in obj)
        obj._autoclean_finalizer(obj);
}


// written by Dean Edwards, 2005
// http://dean.edwards.name/

function addEvent(element, type, handler) {
    // assign each event handler a unique ID
    if (!handler.$$guid) handler.$$guid = addEvent.guid++;
    // create a hash table of event types for the element
    if (!element.events) element.events = {};
    // create a hash table of event handlers for each element/event pair
    var handlers = element.events[type];
    if (!handlers) {
        handlers = element.events[type] = {};
        // store the existing event handler (if there is one)
        if (element["on" + type]) {
            handlers[0] = element["on" + type];
        }
    }
    // store the event handler in the hash table
    handlers[handler.$$guid] = handler;
    // assign a global event handler to do all the work
    element["on" + type] = handleEvent;
};
// a counter used to create unique IDs
addEvent.guid = 1;

function removeEvent(element, type, handler) {
    // delete the event handler from the hash table
    if (element.events && element.events[type]) {
        delete element.events[type][handler.$$guid];
    }
};

function handleEvent(event) {
    var returnValue = true;
    // grab the event object (IE uses a global event object)
    event = event || fixEvent(window.event);
    // Fix target property, if necessary
	if (!event.target && event.srcElement)
	   event.target = event.srcElement;
    // get a reference to the hash table of event handlers
    var handlers = this.events[event.type];
    // execute each event handler
    for (var i in handlers) {
        this.$$handleEvent = handlers[i];
        if (this.$$handleEvent(event) === false) {
            returnValue = false;
        }
    }
    return returnValue;
};

function fixEvent(event) {
    // add W3C standard event methods
    event.preventDefault = fixEvent.preventDefault;
    event.stopPropagation = fixEvent.stopPropagation;
    return event;
};
fixEvent.preventDefault = function() {
    this.returnValue = false;
};
fixEvent.stopPropagation = function() {
    this.cancelBubble = true;
};

$(window).unload(autoclean_gc);

})(jQuery);



