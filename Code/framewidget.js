function wcFrameWidget($container, parent, isFloating) {
  this.$container = $container;
  this._parent = parent;
  this._isFloating = isFloating;

  this.$frame   = null;
  this.$title   = null;
  this.$center  = null;
  this.$close   = null;
  this.$dock    = null;
  this.$top     = null;
  this.$bottom  = null;
  this.$left    = null;
  this.$right   = null;
  this.$corner1 = null;
  this.$corner2 = null;
  this.$corner3 = null;
  this.$corner4 = null;

  this.$tabList = [];

  this._curTab = -1;
  this._widgetList = [];

  this._pos = {
    x: 0.5,
    y: 0.5,
  };

  this._size = {
    x: 400,
    y: 400,
  };

  this._anchorMouse = {
    x: 0,
    y: 0,
  };

  this._init();
};

wcFrameWidget.prototype = {
  _init: function() {
    this.$frame   = $('<div class="wcFrameWidget wcWide wcTall">');
    this.$title   = $('<div class="wcFrameTitle">');
    this.$center  = $('<div class="wcFrameCenter wcWide">');
    this.$close   = $('<div class="wcFrameCloseButton">X</div>');
    this.$frame.append(this.$title);
    this.$frame.append(this.$close);

    this.$title.attr('contextmenu', 'wcDocker_Title_Menu');

    if (this._isFloating) {
      this.$dock    = $('<div class="wcFrameDockButton"></div>');
      this.$top     = $('<div class="wcFrameEdgeH wcFrameEdge"></div>').css('top', '-6px').css('left', '0px').css('right', '0px');
      this.$bottom  = $('<div class="wcFrameEdgeH wcFrameEdge"></div>').css('bottom', '-6px').css('left', '0px').css('right', '0px');
      this.$left    = $('<div class="wcFrameEdgeV wcFrameEdge"></div>').css('left', '-6px').css('top', '0px').css('bottom', '0px');
      this.$right   = $('<div class="wcFrameEdgeV wcFrameEdge"></div>').css('right', '-6px').css('top', '0px').css('bottom', '0px');
      this.$corner1 = $('<div class="wcFrameCornerNW wcFrameEdge"></div>').css('top', '-6px').css('left', '-6px');
      this.$corner2 = $('<div class="wcFrameCornerNE wcFrameEdge"></div>').css('top', '-6px').css('right', '-6px');
      this.$corner3 = $('<div class="wcFrameCornerNW wcFrameEdge"></div>').css('bottom', '-6px').css('right', '-6px');
      this.$corner4 = $('<div class="wcFrameCornerNE wcFrameEdge"></div>').css('bottom', '-6px').css('left', '-6px');

      this.$frame.append(this.$dock);
      this.$frame.append(this.$top);
      this.$frame.append(this.$bottom);
      this.$frame.append(this.$left);
      this.$frame.append(this.$right);
      this.$frame.append(this.$corner1);
      this.$frame.append(this.$corner2);
      this.$frame.append(this.$corner3);
      this.$frame.append(this.$corner4);
    }

    this.$frame.append(this.$center);

    // Floating windows have no container.
    this.container(this.$container);

    if (this._isFloating) {
      this.$frame.addClass('wcFloating');
    }
  },

  // Updates the size of the frame.
  _update: function() {
    var width = this.$container.width();
    var height = this.$container.height();

    // Floating windows manage their own sizing.
    if (this._isFloating) {
      this.$frame.css('left', (this._pos.x * width) - this._size.x/2 + 'px');
      this.$frame.css('top', (this._pos.y * height) - this._size.y/2 + 'px');
      this.$frame.css('width', this._size.x + 'px');
      this.$frame.css('height', this._size.y + 'px');
    }

    var widget = this.widget();
    if (widget) {
      var scrollable = widget.scrollable();
      this.$center.toggleClass('wcScrollableX', scrollable.x);
      this.$center.toggleClass('wcScrollableY', scrollable.y);

      if (widget.moveable()) {
        this.$frame.prepend(this.$title);
        this.$center.css('top', '21px');
      } else {
        this.$title.remove();
        this.$center.css('top', '0px');
      }

      if (widget.closeable()) {
        this.$frame.append(this.$close);
      } else {
        this.$close.remove();
      }

      widget._update();
    }
  },

  // Gets, or Sets the position of the frame.
  // Params:
  //    x, y    If supplied, assigns the new position.
  //    pixels  If true, the coordinates given will be treated as a
  //            pixel position rather than a percentage.
  pos: function(x, y, pixels) {
    var width = this.$container.width();
    var height = this.$container.height();

    if (typeof x === 'undefined') {
      if (pixels) {
        return {x: this._pos.x*width, y: this._pos.y*height};
      } else {
        return {x: this._pos.x, y: this._pos.y};
      }
    }

    if (pixels) {
      this._pos.x = x/width;
      this._pos.y = y/height;
    } else {
      this._pos.x = x;
      this._pos.y = y;
    }
  },

  // Gets the desired size of the widget.
  size: function() {
    var size = {
      x: -1,
      y: -1,
    };

    for (var i = 0; i < this._widgetList.length; ++i) {
      if (size.x < this._widgetList[i].size().x) {
        size.x = this._widgetList[i].size().x;
      }
      if (size.y < this._widgetList[i].size().y) {
        size.y = this._widgetList[i].size().y;
      }
    }
    return size;
  },

  // Gets the minimum size of the widget.
  minSize: function() {
    var size = {
      x: 0,
      y: 0,
    };

    for (var i = 0; i < this._widgetList.length; ++i) {
      size.x = Math.max(size.x, this._widgetList[i].minSize().x);
      size.y = Math.max(size.y, this._widgetList[i].minSize().y);
    }
    return size;
  },

  // Gets the minimum size of the widget.
  maxSize: function() {
    var size = {
      x: Infinity,
      y: Infinity,
    };

    for (var i = 0; i < this._widgetList.length; ++i) {
      size.x = Math.min(size.x, this._widgetList[i].maxSize().x);
      size.y = Math.min(size.y, this._widgetList[i].maxSize().y);
    }
    return size;
  },

  // Adds a given widget as a new tab item.
  // Params:
  //    widget    The widget to add.
  //    index     An optional index to insert the tab at.
  addWidget: function(widget, index) {
    var found = this._widgetList.indexOf(widget);
    if (found !== -1) {
      this._widgetList.splice(found, 1);
    }

    if (typeof index === 'undefined') {
      this._widgetList.push(widget);
    } else {
      this._widgetList.splice(index, 0, widget);
      if (this._curTab >= index) {
        this._curTab++;
      }
    }

    this._size = this.size();

    if (this._curTab === -1 && this._widgetList.length) {
      this._curTab = 0;
      this._widgetList[this._curTab].layout().container(this.$center);
      this._widgetList[this._curTab].container(this.$center);
      this.$title.text(this._widgetList[this._curTab].title());
      this._pos = this._widgetList[this._curTab].pos();
    }
    widget.parent(this);
  },

  // Remvoes a given widget from the tab item.
  // Params:
  //    widget      The widget to remove.
  removeWidget: function(widget) {
    for (var i = 0; i < this._widgetList.length; ++i) {
      if (this._widgetList[i] === widget) {
        if (this._curTab >= i) {
          this._curTab--;
        }

        this._widgetList[i].layout().container(null);
        this._widgetList[i].container(null);
        this._widgetList[i].parent(null);

        this._widgetList.splice(i, 1);
        break;
      }
    }

    if (this._curTab === -1 && this._widgetList.length) {
      this._curTab = 0;
      this._widgetList[this._curTab].layout().container(this.$center);
      this._widgetList[this._curTab].container(this.$center);
    }
  },

  // Retrieves the currently visible widget.
  widget: function() {
    if (this._curTab > -1 && this._curTab < this._widgetList.length) {
      return this._widgetList[this._curTab];
    }
    return false;
  },

  // Moves the widget based on mouse dragging.
  // Params:
  //    mouse     The current mouse position.
  move: function(mouse) {
    var width = this.$container.width();
    var height = this.$container.height();

    this._pos.x = (mouse.x + this._anchorMouse.x) / width;
    this._pos.y = (mouse.y + this._anchorMouse.y) / height;
  },

  // Sets the anchor position for moving the widget.
  // Params:
  //    mouse     The current mouse position.
  anchorMove: function(mouse) {
    var width = this.$container.width();
    var height = this.$container.height();

    this._anchorMouse.x = (this._pos.x * width) - mouse.x;
    this._anchorMouse.y = (this._pos.y * height) - mouse.y;
  },

  // Checks if the mouse is in a valid anchor position for docking a widget.
  // Params:
  //    mouse     The current mouse position.
  //    same      Whether the moving frame and this one are the same.
  checkAnchorDrop: function(mouse, same, ghost) {
    var widget = this.widget();
    if (widget && widget.moveable()) {
      return widget.layout().checkAnchorDrop(mouse, same, ghost, this._isFloating, this.$frame);
    }
    return false;
  },

  // Resizes the widget based on mouse dragging.
  // Params:
  //    edges     A list of edges being moved.
  //    mouse     The current mouse position.
  resize: function(edges, mouse) {
    var width = this.$container.width();
    var height = this.$container.height();
    var offset = this.$container.offset();

    mouse.x -= offset.left;
    mouse.y -= offset.top;

    var minSize = this.minSize();
    var maxSize = this.maxSize();

    var pos = {
      x: (this._pos.x * width) - this._size.x/2,
      y: (this._pos.y * height) - this._size.y/2,
    };

    for (var i = 0; i < edges.length; ++i) {
      switch (edges[i]) {
        case 'top':
          this._size.y += pos.y - mouse.y;
          pos.y = mouse.y;
          if (this._size.y < minSize.y) {
            pos.y += this._size.y - minSize.y;
            this._size.y = minSize.y;
          }
          if (this._size.y > maxSize.y) {
            pos.y += this._size.y - maxSize.y;
            this._size.y = maxSize.y;
          }
          break;
        case 'bottom':
          this._size.y = mouse.y - pos.y;
          if (this._size.y < minSize.y) {
            this._size.y = minSize.y;
          }
          if (this._size.y > maxSize.y) {
            this._size.y = maxSize.y;
          }
          break;
        case 'left':
          this._size.x += pos.x - mouse.x;
          pos.x = mouse.x;
          if (this._size.x < minSize.x) {
            pos.x += this._size.x - minSize.x;
            this._size.x = minSize.x;
          }
          if (this._size.x > maxSize.x) {
            pos.x += this._size.x - maxSize.x;
            this._size.x = maxSize.x;
          }
          break;
        case 'right':
          this._size.x = mouse.x - pos.x;
          if (this._size.x < minSize.x) {
            this._size.x = minSize.x;
          }
          if (this._size.x > maxSize.x) {
            this._size.x = maxSize.x;
          }
          break;
      }

      this._pos.x = (pos.x + this._size.x/2) / width;
      this._pos.y = (pos.y + this._size.y/2) / height;
    }
  },

  // Turn off or on a shadowing effect to signify this widget is being moved.
  // Params:
  //    enabled       Whether to enable shadow mode.
  shadow: function(enabled) {
    if (enabled) {
      this.$frame.stop().animate({
        opacity: 0.3,
      }, 300);
    } else {
      this.$frame.stop().animate({
        opacity: 1.0,
      }, 300);
    }
  },

  // Retrieves the bounding rect for this frame.
  rect: function() {
    var offset = this.$frame.offset();
    var width = this.$frame.width();
    var height = this.$frame.height();

    return {
      x: offset.left,
      y: offset.top,
      w: width,
      h: height,
    };
  },

  // Gets, or Sets a new container for this layout.
  // Params:
  //    $container          If supplied, sets a new container for this layout.
  //    parent              If supplied, sets a new parent for this layout.
  // Returns:
  //    JQuery collection   The current container.
  container: function($container) {
    if (typeof $container === 'undefined') {
      return this.$container;
    }

    this.$frame.remove();
    this.$container = $container;
    if (this.$container) {
      this.$container.append(this.$frame);
    }
    return this.$container;
  },

  // Gets, or Sets the parent item for this layout.
  // Params:
  //    parent        If supplied, sets a new parent for this layout.
  // Returns:
  //    object        The current parent.
  parent: function(parent) {
    if (typeof parent === 'undefined') {
      return this._parent;
    }

    this._parent = parent;
    return this._parent;
  },

  // Disconnects and prepares this widget for destruction.
  destroy: function() {
    this._curTab = -1;
    for (var i = 0; i < this._widgetList.length; ++i) {
      this._widgetList[i].layout().container(null);
      this._widgetList[i].container(null);
      this._widgetList[i].parent(null);
    }

    this._widgetList = [];
    this.container(null);
    this.parent(null);
  },
};