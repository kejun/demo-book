(function(doc){

var CSS_CONTAINER = '#dr-container',
CSS_PAGE = '.page',
EVENT_TOUCH_START = 'touchablestart',
EVENT_TOUCH_MOVE = 'touchablemove',
EVENT_TOUCH_END = 'touchableend',
EVENT_TOUCH_TAP = 'tap',
EVENT_TRANS_END = 'webkitTransitionEnd',
resetStyle = {
   'z-index': 1,
   '-webkit-transition-property': 'none',
   '-webkit-transition-duration': '0s',
   '-webkit-transition-timing-function': ''
},
drContainer,
currentPage,
firstPageCopy,
currentIndex = 0,
hasPrev = 0,
hasNext = 1,
isLock = 0,
direction = '',
rollback,
pages,
outX,
inX,
pageRegion,

setTranslateValue = function(x, y) {
  return ('translate3d({x}px, {y}px, 0)').replace('{x}', x).replace('{y}', y);
},

isInPageRegion = function(pos) {
  return 1;
  return pos.x >= pageRegion.left && 
         pos.x <= pageRegion.right &&
         pos.y >= pageRegion.top && 
         pos.y <= pageRegion.bottom;
},

movePage = function(node, x) {
  node.css('-webkit-transform', setTranslateValue(x, 0));
},

moveOut = function(node, t) {
  $(doc).bind(EVENT_TRANS_END, function(e){
      $(doc).unbind(EVENT_TRANS_END);
      if (currentIndex > 0) {
        node.css('-webkit-transform', setTranslateValue(0, 0));
      }
      node.css(resetStyle);
      // 2和3轮流显示
      currentIndex = (currentIndex + 1 > 2)? 1 : currentIndex + 1;
      initPagePos(pages.eq(currentIndex));
      updatePageContent();
  });

  node.css({
      '-webkit-transition-property': '-webkit-transform',
      '-webkit-transition-duration': t || '350ms',
      '-webkit-transition-timing-function': 'cubic-bezier(0,0,0.25,1)',
      '-webkit-transform': setTranslateValue(-1 * (Math.abs(outX) + inX), 0)
  });
},

moveIn = function(node, t) {
  $(doc).bind(EVENT_TRANS_END, function(e){
      $(doc).unbind(EVENT_TRANS_END);
      firstPageCopy.remove();
      initPagePos(pages.eq(currentIndex));
      updatePageContent();
  });

  setTimeout(function(){
  node.css({
      '-webkit-transition-property': '-webkit-transform',
      '-webkit-transition-duration': t || '350ms',
      '-webkit-transition-timing-function': 'cubic-bezier(0,0,0.25,1)',
      '-webkit-transform': setTranslateValue(0, 0)
  });
  }, 0);
},

touchHandler = {
  touchEnd: function(e, t) {
    if (isLock || !currentPage || !direction) {
      return;
    }
    
    ({
      right: function() {
        if (!hasPrev) {
          return;
        }
        currentPageNum--;
        moveIn(currentPage);
      },

      left: function() {
        if (!hasNext) {
          return;
        }
        currentPageNum++;
        moveOut(currentPage);
      }
     })[direction]();

    t.startTouch = {x:0, y:0};
    t.currentTouch = {x:0, y:0};      
    t.previousTouch = {x:0, y:0};
    t.currentDelta = {x:0, y:0};
    t.currentStartDelta = {x:0, y:0};   
    t.currentPosition = {x:0, y:0};
    direction = '';
    rollback = 0;
  },

  touchStart: function(e, t) {
  },

  touchMove: function(e, t) {
    if (isLock || !currentPage || !isInPageRegion(t.currentTouch)) {
      return;
    }

    e.preventDefault();

    if (!direction) {
      direction = t.currentStartDelta.x > 0 ? 'right' : 'left';
    }

    ({
      right: function() {
        if (!hasPrev) {
          return;
        }

        if (!rollback) {
          if (currentPageNum === 1) {
            // 拉回第一页，恢复0页
            pages.eq(0).css(resetStyle).css('-webkit-transform', setTranslateValue(0, 0));
            currentIndex = 0;
          }
          t.currentPosition.x = outX - inX;
          firstPageCopy = pages.eq(0).clone();
          firstPageCopy.appendTo(drContainer);
          currentPage = firstPageCopy;
          currentPage.css('z-index', 4);
          rollback = 1;
        }
        movePage(currentPage, t.currentPosition.x);
      },

      left: function() {
        if (!hasNext) {
          return;
        }
        movePage(currentPage, t.currentPosition.x);
      }
     })[direction]();
  }
},

initPagePos = function(node) {
  currentPage = node;
  node.css({
    'z-index': 3,
    '-webkit-transition-property': '',
    '-webkit-transition-duration': 0,
    '-webkit-transition-timing-function': '',
    '-webkit-transform': setTranslateValue(0,0)
  });
},

initPage = function(){
  var page;

  drContainer = $(CSS_CONTAINER).Touchable();
  drContainer.bind(EVENT_TOUCH_END, touchHandler.touchEnd).
             bind(EVENT_TOUCH_START, touchHandler.touchStart).
             bind(EVENT_TOUCH_MOVE, touchHandler.touchMove);

  pages = drContainer.find(CSS_PAGE);
  initPagePos(pages.eq(0));

  pageRegion = currentPage.offset();
  $.extend(pageRegion, {
      right: pageRegion.left + currentPage.width(),
      bottom: pageRegion.top + currentPage.height()
  });

  outX = drContainer.offset().left - currentPage.width() - currentPage.css('padding-left').replace('px', '') * 1;
  inX = currentPage.offset().left;
},


//content section.
CSS_CHAPTER_CONTENT = '#dr-content',
CSS_CHAPTER_CONTENT_BD = '#dr-content .content',
totalPageNum = 0,
currentPageNum = 0,
columnWidth = 600,
pageWidth,
pageHeight,

switchContent = function(id) {
  $(CSS_CHAPTER_CONTENT_BD).html($(id).html());
  pages.eq(0).css('z-index', 2).html('');
  pages.eq(1).css('z-index', 1).html('');
  pages.eq(2).css('z-index', 0).html('');
  setTimeout(function(){
    initContent();
  }, 100);
},

goToPage = function(pageNum) {
  var turnPage = {
    'out': function(){
      var nextIndex = currentIndex + 1 > 2 ? 1 : currentIndex + 1;
      fillContent(pages.eq(nextIndex), pageNum - 1);
      moveOut(pages.eq(currentIndex), '100ms');
    },
    'in': function(){
      if (currentIndex === 0) {
        updatePageContent();
        return;
      }
      firstPageCopy = pages.eq(0).clone();
      firstPageCopy.appendTo(drContainer);
      currentPage = firstPageCopy;
      currentPage.css('z-index', 4);
      if (currentPageNum === 0) {
        currentIndex = 0;
      }
      fillContent(currentPage, currentPageNum);
      moveIn(currentPage, '100ms');
    }
  }, 
  direction;

  if (pageNum - 1 < 0 || pageNum > totalPageNum || pageNum - 1 === currentPageNum ) {
    return;
  }


  direction = pageNum - 1 > currentPageNum ? 'out' : 'in';

  if (!direction) {
    return;
  }

  currentPageNum = pageNum - 1;
  turnPage[direction]();
},

updatePageContent = function() {
  var change = [
    function() {
      // 拉回第一页，重置每页
      fillContent(pages.eq(0).css(resetStyle).css('zIndex', 2), currentPageNum);
      fillContent(pages.eq(1).css(resetStyle).css('zIndex', 1), currentPageNum + 1);
      fillContent(pages.eq(2).css(resetStyle).css('zIndex', 0), currentPageNum + 2);
    },

    function() {
      fillContent(pages.eq(0), currentPageNum - 1);
      fillContent(pages.eq(1), currentPageNum);
      fillContent(pages.eq(2), currentPageNum + 1);
    },

    function() {
      fillContent(pages.eq(0), currentPageNum - 1);
      fillContent(pages.eq(1), currentPageNum + 1);
      fillContent(pages.eq(2), currentPageNum);
    }
  ];

  change[currentIndex]();

  $('body').trigger('ebook:pagechange', [currentPageNum, totalPageNum, drContainer]);

  if (currentPageNum > 0 && currentPageNum < (totalPageNum - 1)) {
    hasNext = 1;
    hasPrev = 1;
    return;
  }

  if (currentPageNum === totalPageNum - 1) {
    hasNext =  0;
    hasPrev =  1;
    return;
  }

  if (currentPageNum === 0) {
    hasNext =  1;
    hasPrev =  0;
    return;
  }

},

fillContent = function(node, pageNum) {
  var page_bd = node.find('.bd');
  if (page_bd.length === 0) {
    node.html($(CSS_CHAPTER_CONTENT).html()).find('.bd').css('left', (-1 * pageNum * pageWidth) + 'px');
  } else {
    page_bd.css('left', (-1 * pageNum * pageWidth) + 'px');
  }
},

initContent = function() {
  var content_bd = $('.bd', CSS_CHAPTER_CONTENT),
  page = $(CSS_PAGE, CSS_CONTAINER);

  pageWidth = $('.content', CSS_CHAPTER_CONTENT).width();
  pageHeight = content_bd.height();
  totalPageNum = Math.floor(content_bd[0].scrollWidth / pageWidth);

  if (totalPageNum === 2) {
    if (content_bd.css({'width': '100%', '-webkit-column-width': 'inherit'})[0].scrollHeight === pageHeight) {
      totalPageNum = 1;
    } 
    content_bd.css({'width': '200%', '-webkit-column-width': columnWidth + 'px'});
  }


  hasNext = (totalPageNum === 1)? 0 : 1;

  pageWidth = page.width() + page.css('padding-left').replace('px', '') * 2;

  pages.eq(currentIndex).css(resetStyle);
  pages.each(function(i){ 
      this.style.zIndex = 2 - i;
  });
  currentIndex = 0;
  currentPageNum = 0;
  hasPrev = 0;
  initPagePos(pages.eq(0));

  fillContent(currentPage, 0);

  if (hasNext) {
    fillContent(pages.eq(1), 1);
  }

  if (totalPageNum > 2) {
    fillContent(pages.eq(2), 2);
  }

  //初始化滑块状态
  if (pageSlider) {
    pageSlider.reset();
    pageSlider.updateThumbLabel(1);
  }
},

//分页滑块部分
CSS_PAGESLIDER = '#dr-page-slider',
CSS_PAGESLIDER_THUMB = '#dr-page-slider .page-thumb',
CSS_PAGESLIDER_THUMB_LABEL = '#dr-page-slider .page-thumb-label',

pageSlider, 

initPageSlider = function() {
  var PageSlider = function() {
    // 10 is slider thumb's width
    this.node = $(CSS_PAGESLIDER_THUMB);
    this.track = $(CSS_PAGESLIDER);
    this.sliderTrackLength = $(CSS_PAGESLIDER).width() - $(CSS_PAGESLIDER_THUMB).width() - 10;
    this.node.css('-webkit-transform', 'translate3d(0,0,0)').Touchable().
      bind(EVENT_TOUCH_START, $.proxy(this.handlePageSliderTouchStart, this)).
      bind(EVENT_TOUCH_MOVE, $.proxy(this.handlePageSliderTouchMove, this)).
      bind(EVENT_TOUCH_END, $.proxy(this.handlePageSliderTouchEnd, this));
  };

  PageSlider.prototype.reset = function() {
    this.node.css('-webkit-transform', 'translate3d(0,0,0)');
  };

  PageSlider.prototype.updateThumbLabel = function(pageNum) {
    if (pageNum > totalPageNum) {
      return;
    }
    $(CSS_PAGESLIDER_THUMB_LABEL).html(pageNum + '/' + totalPageNum);
  };

  PageSlider.prototype.setPosByPageNum = function(pageNum) {
    if (pageNum > totalPageNum) {
      return;
    }
    var x;
    x = (pageNum / totalPageNum) * this.sliderTrackLength;
    this.node.css('-webkit-transform', 'translate3d(' + x + 'px,0,0)');
  };

  PageSlider.prototype.handlePageSliderTouchStart = function(e, t) {
    isLock = true;
    var x = this.node.offset().left - this.track.offset().left;
    t.currentDelta = {x:x, y:0};
    t.currentPosition = {x:x, y:0};
  };

  PageSlider.prototype.handlePageSliderTouchMove = function(e, t) {
    e.preventDefault();
    var x = t.currentPosition.x, pageNum, o = this;
    if (x < 0) {
      t.currentDelta = {x:0, y:0};
      t.currentPosition = {x:0, y:0};
      return;
    }

    if (x > this.sliderTrackLength) {
      t.currentDelta = {x:this.sliderTrackLength, y:0};
      t.currentPosition = {x:this.sliderTrackLength, y:0};
      return;
    }

    pageNum = ~~(totalPageNum * (t.currentPosition.x/this.sliderTrackLength));

    $(e.currentTarget).css('-webkit-transform', 'translate3d(' + t.currentPosition.x + 'px,0,0)');
    if (this.delayTurnPage) {
      window.clearTimeout(this.delayTurnPage);
    }
    this.pageNum = pageNum;
    this.delayTurnPage = window.setTimeout(function(){
      goToPage(pageNum + 1);
      console.log((pageNum + 1) + '/' + totalPageNum);
      o.updateThumbLabel(pageNum + 1);
    }, 50);
  };

  PageSlider.prototype.handlePageSliderTouchEnd = function(e, t) {
    isLock = false;
    //this.setPosByPageNum(this.pageNum);
  };

  pageSlider = new PageSlider();
  eBook.bind('ebook:pagechange', function(){
    // 拖动滑块时略过
    if (!isLock) {
      pageSlider.setPosByPageNum(arguments[1]);
      pageSlider.updateThumbLabel(arguments[1] + 1);
    }
  });
};


//初始化
$(function(){
  initPage();
  initPageSlider();
  //initContent();
});

// 公共方法
eBook = $('body');
eBook.initContent = initContent;
eBook.goto = goToPage;
eBook.switchContent = switchContent;

})(document);
