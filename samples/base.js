'use strict';

// TODO: namespace.

function Never() {
  return false;
}

// DOM.

function ID(id) {
  return document[id] || document.getElementById(id);
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

function AddDragHandler(dom, drag) {
  var prevX_, prevY_;

  var LISTENERS = {
    mousemove: function(evt) {
      drag(evt.screenX - prevX_, evt.screenY - prevY_);
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
