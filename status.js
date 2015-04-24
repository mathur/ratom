module.exports = {
  display: function(text, timeout) {
    var span, statusBar, _ref;
    if (this.timeout != null) {
      clearTimeout(this.timeout);
    }
    if ((_ref = this.statusBarTile) != null) {
      _ref.destroy();
    }
    statusBar = document.querySelector("status-bar");
    span = document.createElement('span');
    span.textContent = text;
    if (statusBar != null) {
      this.statusBarTile = statusBar.addLeftTile({
        item: span,
        priority: 100
      });
    }
    if (timeout != null) {
      if (this.timeout != null) {
        clearTimeout(this.timeout);
      }
      return this.timeout = setTimeout((function(_this) {
        return function() {
          var _ref1;
          return (_ref1 = _this.statusBarTile) != null ? _ref1.destroy() : void 0;
        };
      })(this), timeout);
    }
  }
};
