/*!
  jQuery Wookmark plugin
  @name jquery.wookmark.js
  @author Christoph Ono (chri@sto.ph or @gbks)
  @author Sebastian Helzle (sebastian@helzle.net or @sebobo)
  @version 1.1.0
  @date 1/27/2013
  @category jQuery plugin
  @copyright (c) 2009-2013 Christoph Ono (www.wookmark.com)
  @license Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
*/
(function($){

  var Wookmark, defaultOptions, __bind;

  __bind = function(fn, me) {
    return function() {
      return fn.apply(me, arguments);
    };
  };

  // Wookmark default options
  defaultOptions = {
    align: 'center',
    container: $('body'),
    offset: 2,
    autoResize: false,
    itemWidth: 0,
    flexibleWidth: 0,
    resizeDelay: 50
  };

  Wookmark = (function(options) {

    function Wookmark(handler, options) {
      this.handler = handler;

      // Layout variables.
      this.columns = null;
      this.containerWidth = null;
      this.resizeTimer = null;

      $.extend(true, this, defaultOptions, options);

      // Bind methods
      this.update = __bind(this.update, this);
      this.onResize = __bind(this.onResize, this);
      this.getItemWidth = __bind(this.getItemWidth, this);
      this.layout = __bind(this.layout, this);
      this.layoutFull = __bind(this.layoutFull, this);
      this.layoutColumns = __bind(this.layoutColumns, this);
      this.clear = __bind(this.clear, this);

      // Listen to resize event if requested.
      if (this.autoResize) {
        $(window).bind('resize.wookmark', this.onResize);
        this.container.bind('refreshWookmark', this.onResize);
      };
    };

    // Method for updating the plugins options
    Wookmark.prototype.update = function(options) {
      $.extend(true, this, options);
    };

    // This timer ensures that layout is not continuously called as window is being dragged.
    Wookmark.prototype.onResize = function() {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(this.layout, this.resizeDelay);
    };

    // Method to get the standard item width
    Wookmark.prototype.getItemWidth = function() {
      return this.itemWidth === undefined || this.itemWidth === 0 ? this.handler.eq(0).outerWidth() : this.itemWidth;
    };

    // Method to get the flexible item width
    Wookmark.prototype.getFlexibleWidth = function() {
      var containerWidth = this.container.width(), columns = 1, columnWidth = containerWidth;
      for (; columnWidth > this.flexibleWidth; columns++) {
          columnWidth = (containerWidth - (columns - 1) * this.offset)/(columns);
      }
      return Math.floor(columnWidth);
    };

    // Main layout methdd.
    Wookmark.prototype.layout = function() {
      // Do nothing if container isn't visible
      if(!this.container.is(":visible")) {
        return;
      }

      // Calculate flexible item width if option is set
      if (this.flexibleWidth) {
        this.itemWidth = this.getFlexibleWidth();
        // Stretch items to fill calculated width
        this.handler.css('width', this.itemWidth);
      }

      // Calculate basic layout parameters.
      var columnWidth = this.getItemWidth() + this.offset,
          containerWidth = this.container.width(),
          columns = Math.floor((containerWidth + this.offset) / columnWidth),
          offset = 0,
          bottom = 0;

      // Calculate the offset based on the alignment of columns to the parent container
      switch (this.align) {
        case 'left':
        case 'right':
          offset = Math.floor((columns / columnWidth + this.offset) / 2);
          break;
        case 'center':
        default:
          offset = Math.round((containerWidth - (columns * columnWidth - this.offset)) / 2);
      }

      // If container and column count hasn't changed, we can only update the columns.
      if(this.columns != null && this.columns.length == columns) {
        bottom = this.layoutColumns(columnWidth, offset);
      } else {
        bottom = this.layoutFull(columnWidth, columns, offset);
      }

      // Set container height to height of the grid.
      this.container.css('height', bottom);
    };

    /**
     * Perform a full layout update.
     */
    Wookmark.prototype.layoutFull = function(columnWidth, columns, offset) {
      // Loop over items.
      var item, top, left, i = 0, k = 0 , j = 0,
          length = this.handler.length,
          shortest = null,
          shortestIndex = null,
          bottom = 0,
          itemCSS = {position: 'absolute'},
          sideOffset,
          heights = [];

      this.columns = [];

      // Prepare arrays to store height of columns and items.
      while (heights.length < columns) {
        heights.push(0);
        this.columns.push([]);
      }

      for(; i < length; i++ ) {
        item = this.handler.eq(i);

        // Find the shortest column.
        shortest = heights[0];
        shortestIndex = 0;
        for (k = 0; k < columns; k++) {
          if (heights[k] < shortest) {
            shortest = heights[k];
            shortestIndex = k;
          }
        }

        // Postion the item.
        itemCSS.top = shortest;

        // stick to left side if alignment is left and this is the first column
        if (shortestIndex == 0 && this.align == 'left') {
            sideOffset = 0;
        } else {
            sideOffset = shortestIndex * columnWidth + offset;
        }
        if (this.align == 'right') {
          itemCSS.right = sideOffset;
        } else {
          itemCSS.left = sideOffset;
        }
        item.css(itemCSS);

        // Update column height.
        heights[shortestIndex] = shortest + item.outerHeight() + this.offset;
        bottom = Math.max(bottom, heights[shortestIndex]);

        this.columns[shortestIndex].push(item);
      }
      return bottom;
    };

    /**
     * This layout method only updates the vertical position of the
     * existing column assignments.
     */
    Wookmark.prototype.layoutColumns = function(columnWidth, offset) {
      var heights = [],
          length = this.columns.length,
          i = 0, column, k = 0, kLength, item,
          bottom = 0, itemCSS, sideOffset;

      while (heights.length < length) {
        heights.push(0);
      }

      for (; i < length; i++) {
        column = this.columns[i];
        kLength = column.length;
        for (k = 0; k < kLength; k++) {
          item = column[k];
          itemCSS = {
            top: heights[i]
          };

          sideOffset = i * columnWidth + offset;
          if (this.align == 'right') {
            itemCSS.right = sideOffset;
          } else {
            itemCSS.left = sideOffset;
          }
          item.css(itemCSS);

          heights[i] += item.outerHeight() + this.offset;
          bottom = Math.max(bottom, heights[i]);
        }
      }
      return bottom;
    };

    /**
     * Clear event listeners and time outs.
     */
    Wookmark.prototype.clear = function() {
      clearTimeout(this.resizeTimer);
      $(window).unbind('resize.wookmark', this.onResize);
      this.container.unbind('refreshWookmark', this.onResize);
    };

    return Wookmark;
  })();

  $.fn.wookmark = function(options) {
    // Create a wookmark instance if not available
    if (!this.wookmarkInstance) {
      this.wookmarkInstance = new Wookmark(this, options || {});
    } else {
      this.wookmarkInstance.update(options || {});
    }

    // Apply layout
    this.wookmarkInstance.layout();

    // Display items (if hidden) and return jQuery object to maintain chainability
    return this.show();
  };
})(jQuery);
