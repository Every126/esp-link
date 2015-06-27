//===== 140medley.min.js with mods

var p=function(a,b,c,d){c=c||document;d=c[b="on"+b];a=c[b]=function(e){d=d&&d(e=e||c.event);return(a=a&&b(e))?b:d};c=this},
m=function(a,b,c){b=document;c=b.createElement("p");c.innerHTML=a;for(a=b.createDocumentFragment();b=
c.firstChild;)a.appendChild(b);return a},
$=function(a,b){a=a.match(/^(\W)?(.*)/);return(b||document)["getElement"+(a[1]?a[1]=="#"?"ById":"sByClassName":"sByTagName")](a[2])},
j=function(a){for(a=0;a<4;a++)try{return a?new ActiveXObject([,"Msxml2","Msxml3","Microsoft"][a]+".XMLHTTP"):new XMLHttpRequest}catch(b){}};
e=function(a){return document.createElement(a);}

// chain onload handlers
function onLoad(f) {
  var old = window.onload;
  if (typeof old != 'function') {
    window.onload = f;
  } else {
    window.onload = function() {
      old();
      f();
    }
  }
}

//===== helpers to add/remove/toggle HTML element classes

function addClass(el, cl) {
  el.className += ' ' + cl;
}
function removeClass(el, cl) {
  var cls = el.className.split(/\s+/),
      l = cls.length;
  for (var i=0; i<l; i++) {
    if (cls[i] === cl) cls.splice(i, 1);
  }
  el.className = cls.join(' ');
  return cls.length != l
}
function toggleClass(el, cl) {
  if (!removeClass(el, cl)) addClass(el, cl);
}

//===== AJAX

function ajaxReq(method, url, ok_cb, err_cb) {
  var xhr = j();
  xhr.open(method, url, true);
  var timeout = setTimeout(function() {
    xhr.abort();
    console.log("XHR abort:", method, url);
    xhr.status = 599;
    xhr.responseText = "request time-out";
  }, 9000);
  xhr.onreadystatechange = function() {
    if (xhr.readyState != 4) { return; }
    clearTimeout(timeout);
    if (xhr.status >= 200 && xhr.status < 300) {
      console.log("XHR done:", method, url, "->", xhr.status);
      ok_cb(xhr.responseText);
    } else {
      console.log("XHR ERR :", method, url, "->", xhr.status, xhr.responseText, xhr);
      err_cb(xhr.status, xhr.responseText);
    }
  }
  console.log("XHR send:", method, url);
  try {
    xhr.send();
  } catch(err) {
    console.log("XHR EXC :", method, url, "->", err);
    err_cb(599, err);
  }
}

function dispatchJson(resp, ok_cb, err_cb) {
  var j;
  try { j = JSON.parse(resp); }
  catch(err) {
    console.log("JSON parse error: " + err + ". In: " + resp);
    err_cb(500, "JSON parse error: " + err);
    return;
  }
  ok_cb(j);
}

function ajaxJson(method, url, ok_cb, err_cb) {
  ajaxReq(method, url, function(resp) { dispatchJson(resp, ok_cb, err_cb); }, err_cb);
}

function ajaxSpin(method, url, ok_cb, err_cb) {
  $("#spinner").removeAttribute('hidden');
  ajaxReq(method, url, function(resp) {
      $("#spinner").setAttribute('hidden', '');
      ok_cb(resp);
    }, function(status, statusText) {
      $("#spinner").setAttribute('hidden', '');
      //showWarning("Error: " + statusText);
      err_cb(status, statusText);
    });
}

function ajaxJsonSpin(method, url, ok_cb, err_cb) {
  ajaxSpin(method, url, function(resp) { dispatchJson(resp, ok_cb, err_cb); }, err_cb);
}

//===== main menu, header spinner and notification boxes

onLoad(function() {
  var l = $("#layout");
  var o = l.childNodes[0];
  // spinner
  l.insertBefore(m('<div id="spinner" class="spinner" hidden></div>'), o);
  // notification boxes
  l.insertBefore(m(
    '<div id="messages"><div id="warning" hidden></div><div id="notification" hidden></div></div>'), o);
  // menu hamburger button
  var ml = m('<a href="#menu" id="menuLink" class="menu-link"><span></span></a>');
  l.insertBefore(ml, o);
  // menu left-pane
  var mm = m(
   '<div id="menu">\
      <div class="pure-menu">\
        <a class="pure-menu-heading" href="https://github.com/jeelabs/esp-link">\
        <img src="/favicon.ico">&nbsp;esp-link</a>\
        <ul id="menu-list" class="pure-menu-list"></ul>\
      </div>\
    </div>\
    ');
  l.insertBefore(mm, o);

  // make hamburger button pull out menu
  ml.onclick = function (e) {
      var active = 'active';
      e.preventDefault();
      toggleClass(l, active);
      toggleClass(mm, active);
      toggleClass(ml, active);
  };

  // populate menu via ajax call
  var getMenu = function() {
    ajaxJson("GET", "/menu", function(data) {
      var html = "";
      for (var i=0; i<data.menu.length; i+=2) {
        html = html.concat(" <li class=\"pure-menu-item\"><a href=\"" + data.menu[i+1] +
            "\" class=\"pure-menu-link\">" + data.menu[i] + "</a></li>");
      }
      $("#menu-list").innerHTML = html;

      v = $("#version");
      if (v != null) { v.innerHTML = data.version; }
    }, function() { setTimeout(getMenu, 1000); });
  };
  getMenu();
});

//===== Console page

function showRate(rate) {
    rates.forEach(function(r) {
      var el = $("#"+r+"-button");
      el.className = el.className.replace(" button-selected", "");
    });

    var el = $("#"+rate+"-button");
    if (el != null) el.className += " button-selected";
  }

function baudButton(baud) {
  $("#baud-btns").appendChild(m(
    ' <a id="'+baud+'-button" href="#" class="pure-button">'+baud+'</a>'));

  $("#"+baud+"-button").addEventListener("click", function(e) {
    e.preventDefault();
    ajaxSpin('POST', "/console/baud?rate="+baud,
      function(resp) { showNotification("" + baud + " baud set"); showRate(baud); },
      function(s, st) { showWarning("Error setting baud rate: ", st); }
    );
  });
}

//===== Wifi info

function showWifiInfo(data) {
  Object.keys(data).forEach(function(v) {
    el = $("#wifi-" + v);
    if (el != null) {
      if (el.nodeName === "INPUT") el.value = data[v];
      else el.innerHTML = data[v];
    }
  });
  $("#wifi-spinner").setAttribute("hidden", "");
  $("#wifi-table").removeAttribute("hidden");
  currAp = data.ssid;
}

function getWifiInfo() {
  ajaxJson('GET', "/wifi/info", showWifiInfo,
      function(s, st) { window.setTimeout(getWifiInfo, 1000); });
}

//===== Notifications

function showWarning(text) {
  var el = $("#warning");
  el.innerHTML = text;
  el.removeAttribute('hidden');
}
function hideWarning() {
  el = $("#warning").setAttribute('hidden', '');
}
var notifTimeout = null;
function showNotification(text) {
  var el = $("#notification");
  el.innerHTML = text;
  el.removeAttribute('hidden');
  if (notifTimeout != null) clearTimeout(notifTimeout);
  notifTimout = setTimeout(function() {
      el.setAttribute('hidden', '');
      notifTimout = null;
    }, 4000);
}

//===== GPIO Pin mux card

var currPin;
// pin={reset:12, isp:13, LED_conn:0, LED_ser:2}
function createInputForPin(pin) {
  var input = document.createElement("input");
  input.type = "radio";
  input.name = "pins";
  input.data = pin.name;
	input.className = "pin-input";
  input.value= pin.value;
  input.id   = "opt-" + pin.value;
  if (currPin == pin.name) input.checked = "1";

	var descr = m('<label for="opt-'+pin.value+'"><b>'+pin.name+":</b>"+pin.descr+"</label>");
	var div = document.createElement("div");
	div.appendChild(input);
	div.appendChild(descr);
	return div;
}

function displayPins(resp) {
	var po = $("#pin-mux");
	po.innerHTML = "";
	currPin = resp.curr;
	resp.map.forEach(function(v) {
		po.appendChild(createInputForPin(v));
	});
	var i, inputs = $(".pin-input");
	for (i=0; i<inputs.length; i++) {
		inputs[i].onclick = function() { setPins(this.value, this.data) };
	};
}

function fetchPins() {
  ajaxJson("GET", "/pins", displayPins, function() {
		window.setTimeout(fetchPins, 1000);
	});
}

function setPins(v, name) {
  ajaxSpin("POST", "/pins?map="+v, function() {
		showNotification("Pin assignment changed to " + name);
	}, function() {
		showNotification("Pin assignment change failed");
		window.setTimeout(fetchPins, 100);
	});
}
