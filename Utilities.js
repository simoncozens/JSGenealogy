
Array.prototype.sum = function () { 
    var sum = 0; this.forEach(function(x) { sum += x; }); return sum;
}

Array.prototype.average = function() { return this.sum() / this.length; }

Array.prototype.unique = function (uniquifier) { 
    var seen = {};
    return this.filter( function(x) { if(!seen[x[uniquifier]]) { seen[x[uniquifier]]=1; return x; } } );
};

function getXml(url) { 
    var req = new XMLHttpRequest();
    req.open("GET", url, false);
    req.send(null);
    if (req.status != 0 && req.status != 200) { return }
    var t = req.responseText;
    var d = new DOMParser();
    doc = d.parseFromString(t, "text/xml").firstChild;
    return doc;
}


CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
  if (typeof radius === "undefined") {
    radius = 5;
  }
  this.beginPath();
  this.moveTo(x + radius, y);
  this.lineTo(x + width - radius, y);
  this.quadraticCurveTo(x + width, y, x + width, y + radius);
  this.lineTo(x + width, y + height - radius);
  this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  this.lineTo(x + radius, y + height);
  this.quadraticCurveTo(x, y + height, x, y + height - radius);
  this.lineTo(x, y + radius);
  this.quadraticCurveTo(x, y, x + radius, y);
  this.closePath();
}

