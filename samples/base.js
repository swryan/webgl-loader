'use strict';

// TODO: namespace.

function Never() {
  return false;
}

function Clamp(val, minVal, maxVal) {
  return (val < minVal) ? minVal : ((val > maxVal) ? maxVal : val);
}

// DOM.

function ID(id) {
  return document.getElementById(id);
}

function PreventDefaultAction(evt) {
  evt.preventDefault();
}

function PreventSelection(dom) {
  // TODO: Use PreventDefaultAction?
  dom.onselectstart = Never;
  dom.onmousedown = Never;
}

function AddListeners(dom, listeners) {
  // TODO: handle event capture, object binding.
  for (var key in listeners) {
    dom.addEventListener(key, listeners[key]);
  }
}

function RemoveListeners(dom, listeners) {
  // TODO: handle event capture, object binding.
  for (var key in listeners) {
    dom.removeEventListener(key, listeners[key]);
  }
}

// drag(dx, dy, evt)
function AddDragHandler(dom, drag) {
  var prevX_, prevY_;

  var LISTENERS = {
    mousemove: function(evt) {
      drag(evt.screenX - prevX_, evt.screenY - prevY_, evt);
      prevX_ = evt.screenX;
      prevY_ = evt.screenY;
    },
    mouseup: function() {
      RemoveListeners(document, LISTENERS);
    }
  };

  dom.addEventListener('mousedown', function(evt) {
    prevX_ = evt.screenX;
    prevY_ = evt.screenY;
    AddListeners(document, LISTENERS);
  });
}

// wheel(dx, dy, evt)
function AddWheelHandler(dom, wheel) {
  if (dom.onmousewheel !== undefined) {
    dom.addEventListener('mousewheel', function(evt) {
      if (evt.wheelDeltaX !== undefined) {
        wheel(evt.wheelDeltaX, evt.wheelDeltaY, evt);
      } else {
        wheel(0, evt.wheelDelta, evt);
      }
    });
  } else {  // Gecko
    dom.addEventListener('MozMousePixelScroll', function(evt) {
      var detail = evt.detail;
      if (evt.axis === evt.HORIZONTAL_AXIS) {
        wheel(detail, 0, evt);
      } else {
        wheel(0, -detail, evt);
      }
    });
  }
};

// Shim layer with setTimeout fallback, adapted from:
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  function(cb, dom) {
    window.setTimeout(callback, 16);  // 16ms ~ 60Hz
  };

// XMLHttpRequest stuff.
function GetHttpRequest(url, onload, opt_onprogress) {
  // TODO: onprogress
  var req = new XMLHttpRequest();
  req.onload = function() { onload(req); };
  req.open('GET', url, true);
  req.send(null);
};
