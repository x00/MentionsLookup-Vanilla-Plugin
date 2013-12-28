jQuery(document).ready(function($){
  rangy.init();
  RegExp.escape = function(value) {
    return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
  }

  $.fn.disappear = function(speed, callback) {
    $(this).trigger('disappear');
    return $.fn.hide.apply(this,arguments);
  }

  $.fn.bindFirst = function(event,data,handler){
    var bindEvents = event.split(/\s+/);
    var elements = this;
    $.each(bindEvents, function(i,event){
      var hasNameSpace = event.indexOf(".");
      var nameSpace = hasNameSpace > 0 ? event.substring(hasNameSpace) : "";

      event = hasNameSpace > 0 ? event.substring(0, hasNameSpace) : event;
      handler = handler == undefined ? data : handler;
      data = typeof data == "function" ? {} : data;

      return elements.each(function(){
        var element = $(this);
        var currentHandler = this["on" + event];

        if (currentHandler){
            element.bind(eventType, function(e){
                return currentHandler(e.originalEvent); 
            });
            this["on" + event] = null;
        }

        element.bind(event + nameSpace, data, handler);

        var allEvents = element.data("events");
        var eventEvents = allEvents[event];
        var currentEvent = eventEvents.pop();
        eventEvents.unshift(currentEvent);
     });
  });
  }



  var mentionsCache = function() {
    this.cache = {};
    this.cacheBlank = [];
    this.textBuffer = '';
    this.bufferActive = false;
    this.currentKey = 0;
  }

  mentionsCache.maxLookup = 10,
  mentionsCache.maxChars = 8,


  mentionsCache.prototype = {

    get: function(lookup,noBlank) {
      lookup = lookup.toLowerCase();

      return lookup in this.cache ? this.cache[lookup] : (!noBlank && this.checkBlank(lookup) ? [] : false);
    },

    set: function(lookup, mentions) {
      lookup = lookup.toLowerCase();
      this.cache[lookup] = mentions;
      this.populateCache(lookup, mentions);
      return mentions;
    },
    
    checkBlank: function(lookup){
      var x = 0;
      var isBlank = false;
      for(x=lookup.length; x >= 2;x--){
        $.each(this.cacheBlank,function(i,blank){
           if(lookup.search(new RegExp('^'+blank))>-1){
             isBlank = true;
             return false;
           }
            
        });
        if(isBlank)
          break;
      }
      return isBlank;
    },
    
    populateCache: function(lookup, mentions){
      var s = '';
      for (var i=32; i<=127;i++) s += String.fromCharCode(i);
      var x = 0;
      for(x=0;x<s.length-1;x++){
        var lookupPlusChar = lookup+RegExp.escape(s.charAt(x));
        if(this.get(lookupPlusChar,true))
          continue;
        
        var partMentions = [];
        var y = 0;
        var forwardLookup = false;
        

        $.each(mentions,function(i,mention){
          forwardLookup = (x==25 || i+1<mentions.length && mentions[i+1].search(new RegExp('^'+lookup+'['+RegExp.escape(s)+']','i'))>-1);
          if(mention.search(new RegExp('^'+lookupPlusChar,'i'))>-1 
            && ((!forwardLookup && mentions.length<mentionsCache.maxLookup) || forwardLookup)){
            partMentions[y++]=mention;
          }
        });
        
        if(partMentions.length && partMentions.length<mentionsCache.maxLookup && mentions.length<mentionsCache.maxLookup){
          this.cache[lookupPlusChar] = partMentions;
          if(lookupPlusChar.length<mentionsCache.maxChars)
            this.populateCache(lookupPlusChar, partMentions);
        }else if(mentions.length<mentionsCache.maxLookup && !this.checkBlank(lookup)){
          this.cacheBlank.push(lookup);
        }

      }
    }
  };

  var cache = new mentionsCache();

  $(document.body).append($('<div class="MentionsLookup ac_results" />').css({'position':'absolute','z-index':10000000}).append('<ul style="max-height: 220px; overflow: auto;" />'));
  $('.MentionsLookup').disappear();
  $('.MentionsLookup').bind('disappear',function(){
    $('.TextBox').css({'position':'static'});
    
  });

  var arrowKey = false;
  var pressing = false;
  var indexPos = -1;
  function renderMentions(mentions,mention,context,caretpos,caretoffset,frame){
    $('.MentionsLookup ul').html('');
    mentions = $.grep(mentions,function(mention){ return $.trim(mention)});

    $.each(mentions,function(i,v){
      if(v){
        $('.MentionsLookup ul').append('<li class="'+(i%2==0?'ac_even':'ac_odd')+(mentions.length-1==i?' ac_last':'')+'">'+v.replace(new RegExp('('+mention+')','gi'),'<strong>$1</strong>')+'</li>');
        if(indexPos != -1){
          $('.MentionsLookup ul li:eq('+indexPos+')').addClass('ac_over');
        }
      }
    });
    
    $(context).keyup(function(e){
      pressing = false;
    });
    
    $(context).keydown(function(e){
        if(!pressing && $('.MentionsLookup').is(':visible') && $('.MentionsLookup ul li').length){
         switch(e.which){
          case 38://up
            if($('.MentionsLookup ul li.ac_over').length && !$('.MentionsLookup ul li:first').is('ac_over')){
              $('.MentionsLookup ul li.ac_over').removeClass('ac_over').prev().addClass('ac_over');
            }else{
              $('.MentionsLookup ul li:last').addClass('ac_over');
            }
            indexPos = $('.MentionsLookup ul li.ac_over').index();
            arrowKey = true;
            e.preventDefault();
            pressing = true;
            break;
          case 40://down
            if($('.MentionsLookup ul li.ac_over').length && !$('.MentionsLookup ul li:last').is('ac_over')){
              $('.MentionsLookup ul li.ac_over').removeClass('ac_over').next().addClass('ac_over');
            }else{
              $('.MentionsLookup ul li:first').addClass('ac_over');
            }
            indexPos = $('.MentionsLookup ul li.ac_over').index();
            arrowKey = true;
            e.preventDefault();
            pressing = true;
            break;
          case 10:
          case 13://enter
            if(arrowKey){
              arrowKey = false;
              $('.MentionsLookup ul li.ac_over').trigger('mousedown');
              e.preventDefault();
            }
            if(e.ctrlKey){// Ctrl+Enter Complete
              $('.MentionsLookup ul li:first').trigger('mousedown');
              e.preventDefault();
            }
            indexPos = -1;
            break;
          default:
            break;
         }
         
       }
    });
    $('.MentionsLookup ul li').mouseover(function(){arrowKey = false;indexPos = -1;$(this).addClass('ac_over')});
    $('.MentionsLookup ul li').mouseout(function(){if(!arrowKey){$(this).removeClass('ac_over');}});
    var ww = typeof window.innerWidth == 'number' ? (window.innerWidth<$(window).width()?window.innerWidth:$(window).width()):$(window).width();
    var wh = typeof window.innerHeight == 'number' ? (window.innerHeight<$(window).height()?window.innerHeight:$(window).height()):$(window).height();
    if($(context).is('textarea')){
      $('.MentionsLookup').show();
      var w = $(context).offset().left+$(context).outerWidth();
      w = w<ww?w:ww;
      if(w>600){
        var t = $(context).offset().top;
      }else{
        if($(context).offset().top>wh-($(context).offset().top+$(context).height())){
          if($(context).offset().top<$(context).height()){
            $(context).height($(context).offset().top);
          }
          t=$(context).offset().top-$('.MentionsLookup').height();
        }else{
          if(wh-($(context).offset().top+$(context).height())<$(context).height()){
            $(context).height(wh-($(context).offset().top+$(context).height()));
          }
          t = $(context).offset().top+$(context).height();
        }
        
      }
      $('.MentionsLookup').css({'left':w-$('.MentionsLookup').width(),'top':t});
    }else if(caretoffset==null){
      $('.MentionsLookup').show();
      var w = $(frame).offset().left+$(frame).outerWidth();
      w = w<ww?w:ww;
      if(w>600){
        var t = $(frame).offset().top;
      }else{
        if($(frame).offset().top>wh-($(frame).offset().top+$(frame).height())){
          if($(frame).offset().top<$(frame).height()){
            $(frame).height($(frame).offset().top);
          }
          t=$(frame).offset().top-$('.MentionsLookup').height();
        }else{
          if(wh-($(frame).offset().top+$(frame).height())<$(frame).height()){
            $(frame).height(wh-($(frame).offset().top+$(frame).height()));
          }
          t = $(frame).offset().top+$(frame).height();
        }
      }
      $('.MentionsLookup').css({'left':w-$('.MentionsLookup').width(),'top':t});

    }else{
      $('.MentionsLookup').css({'left':caretoffset.left+5,'top':caretoffset.top+5});
    }
    $('.MentionsLookup ul li').mousedown(function(e){
      e.preventDefault();
      try{
        if($(context).is('textarea')){
          inputCaretInsertMention(context,$(this).text(),mention);
        }else{
          frameCaretInsertMention(context,$(this).text(),mention);
        }
        $('.MentionsLookup').disappear();
      }catch(err){
        keyLogInsertMention(context,$(this).text(),mention,frame);
      }
      
      
    });
    $('.MentionsLookup').show();
    
    if($(context).is('textarea')){
      $(context).css({'z-index':'100!important'});
    }

    
  }

  function lookupMentions(mention,context,caretpos,framedoc,frame){
    try{
      var caretoffset = frameCaretOffset(framedoc,frame);
    }catch(err){
      var caretoffset=null;
    } 
    var mentions = cache.get(mention);
    if(mentions){
      renderMentions(mentions,mention,context,caretpos,caretoffset,frame);
    }else{
      $.get(gdn.url('/dashboard/user/autocomplete/'),{
          'q':mention,
          'limit': mentionsCache.maxLookup,
          'timestamp':+new Date()
        },
        function(data){
          result = data.split(/\|[0-9]+\n/);
          cache.set(mention, result);
          renderMentions(result,mention,context,caretpos,caretoffset,frame);
          
        }
      );
    }
  }

  function txtBlocks(context){
    if($(context).is('textarea')){
      var txtblocks = $(context).val().replace(/((<[^>]+>)|\n)/g,'|').split(/\|/g);
    }else{
      var txtblocks = $('<div>'+$(context).find('body').html().toString().replace(/((<[^>]+>)|\n)/g,'|')+'</div>').text().split(/\|/g);
    }
    
    return txtblocks;
  }

  function getBoundaries(txtblocks){

    var boundaries = [0];
    var x = 1;
    var boundarylast = 0;
    
    $.each(txtblocks,function(i,txtblock){
      boundarylast += txtblock.length;
      boundaries[x++] = boundarylast;
    });
    
    return boundaries;
  }

  function getMentions(context,caretpos,framedoc,frame){
    $('.MentionsLookup').disappear();
    var txt = $(context).is('textarea') ? $(context).val() : $(context).text();
    var txtblocks = txtBlocks(context);
    var boundaries = getBoundaries(txtblocks);
    txt = txtblocks.join('').substring(0,caretpos);
    
    if(txt.charAt(txt.length-1)=='@'){
      txt = txt.substring(0,txt.length-1);
      caretpos-=1;
    }
    mentionpos = txt.lastIndexOf('@');
    if(mentionpos < 0) return;
    mention=txt.substring(mentionpos?mentionpos-1:0);
    if(mention.search(/@[^\s]+$/) > -1){
      if(mention.charAt(0)!=' '){
        if($.inArray(mentionpos,boundaries)!=-1){
          mention = mention.substring(1);
        }else{
          return;
        }
      }
      
      mention = mention.replace(/^\s?@/,'');
      mentionendpos = mention.search(/\s/);
      if(mentionendpos > -1){
        mention = mention.substring(0,mentionendpos);
      }
      if(mention.length>1)
        lookupMentions(mention,context,caretpos,framedoc,frame);
    }
  }

  function frameCaret(frame){
    var caretOffset = 0;
    var sel = rangy.getSelection(frame);
    if (sel.rangeCount) {
      var range = sel.getRangeAt(0);
      var preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(frame);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretOffset = preCaretRange.toString().length;
    }
    return caretOffset;

  }

  function keyLogInsertMention(context,mention,mentionold,frame){
    $('.MentionsLookup').show();
    $('.MentionsLookup ul').html('<li class="ac_odd ac_last">Copy & Paste <input value=" @'+mention+' " style="width:150px;"/></li>');
    
    if($(context).is('textarea')){
      $('.MentionsLookup').css({'left':$(context).offset().left+$(context).outerWidth()-$('.MentionsLookup').width(),'top':$(context).offset().top});
    }else{
      $('.MentionsLookup').css({'left':$(frame).offset().left+$(frame).outerWidth()-$('.MentionsLookup').width(),'top':$(frame).offset().top});
    }
    
    $('.MentionsLookup ul input').click(function(){this.focus(); this.select();});
    $('.MentionsLookup ul input').trigger('click');
  }

  function inputCaretInsertMention(context,mention,mentionold){
    var caretpos = $(context).getSelection().end;
    // snap to @
    while($(context).getSelection().text.charAt(0)!='@' && $(context).getSelection().start>0){
      $(context).setSelection($(context).getSelection().start-1,caretpos);
    }
    $(context).replaceSelectedText('@'+mention+' ');
    $(context).collapseSelection(false);
    
  }

  function frameCaretInsertMention(frame, mention, mentionold){
    var sel = rangy.getSelection(frame);
    var range = sel.getRangeAt(0);
    range.setStart(range.endContainer,range.endOffset);
    // snap to @
    while($(range.extractContents()).text().charAt(0)!='@' && range.endOffset>0){
      range.setStart(range.endContainer,range.endOffset-1);
    }
    
    range.deleteContents();
    range.collapse(false);
    var insert =  document.createTextNode('@'+mention+' ');
    range.insertNode(insert);
    range.collapseAfter(insert)
    sel.setSingleRange(range);
    range.collapse(false);
  }

  function frameCaretOffset(frame,outer){
    var sel = rangy.getSelection(frame);
    var range = sel.getRangeAt(0);
    var holder = document.createElement("span");
    var holderid = 'MentionsLookupHolder' + (new Date()).getTime();
    $(holder).attr('id',holderid);
    range.insertNode(holder);
    holder = $(frame).find('#'+holderid);
    var offset = holder.offset();
    frameoffset = $(outer).offset();
    offset.left +=frameoffset.left;
    offset.left -= $(frame).scrollLeft();
    offset.top += holder.height()+frameoffset.top;
    offset.top -= $(frame).scrollTop();
    
    return offset
  }

  function keyLogBufferCaret(charCode,context){
    var txt = $(context).is('textarea') ? $(context).val() : $(context).text();		
    var char = String.fromCharCode(charCode);
    var pos=-1;
    var txtCmp1 = txt;
    var txtCmp2 = cache.bufferText ? cache.bufferText : '';
    if(txtCmp1.length>txtCmp2.length){
      txtCmp2 + Array(txtCmp1.length-txtCmp2.length).join(" ");
    }else{
      txtCmp1 + Array(txtCmp2.length-txtCmp1.length).join(" ");
    }
    
    for(x=0;x<txtCmp1.length;x++){
      if(txtCmp1.charAt(x)!=txtCmp2.charAt(x)){
        pos=x
        break;
      }
    }
    cache.bufferText=txt;
    return pos+1;
  }

   $('textarea').livequery(function(){
    $(this).bind('keypress keyup',function(event){
      if(event.type=='keypress'){
        cache.currentKey = event.which;
      }else{
        try{
          var caretpos = $(this).getSelection().end;
        }catch(err){
          var caretpos = keyLogBufferCaret(cache.currentKey,this);
        }
        getMentions(this,caretpos,null);
      }
    });
    
    
  });


  $('.TextBoxWrapper iframe').livequery(function(){
    $('.MentionsLookup').disappear();
    var frame = this;
    var context = rangy.dom.getIframeDocument(this);

    
    mentionsEvent = function(event){
      if(event.type=='keypress'){
        cache.currentKey = event.which;
      }else{
        try{
          var caretpos = frameCaret(context);
          var frameDoc = context;
        }catch(err){
          var caretpos = keyLogBufferCaret(cache.currentKey,context);
          var frameDoc = null;
        } 
        getMentions(context,caretpos,frameDoc,frame);
      }
    }

    $(context).find('body').livequery(function(){;           
      $(context).find('body').bind('kepress keyup', mentionsEvent);
    });

  });

});
