
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

/* Regression algorithm from
http://dracoblue.net/dev/linear-least-squares-in-javascript/159/ */
function findLineByLeastSquares(values_x, values_y) {
var sum_x = 0;
var sum_y = 0;
var sum_xy = 0;
var sum_xx = 0;
var count = 0;

/*
* We'll use those variables for faster read/write access.
*/
var x = 0;
var y = 0;
var values_length = values_x.length;

if (values_length != values_y.length) {
throw new Error('The parameters values_x and values_y need to have same size!');
}

/*
* Nothing to do.
*/
if (values_length === 0) {
return [ [], [] ];
}

/*
* Calculate the sum for each of the parts necessary.
*/
for (var v = 0; v < values_length; v++) {
x = values_x[v];
y = values_y[v];
if (y == undefined) continue;
sum_x += x;
sum_y += y;
sum_xx += x*x;
sum_xy += x*y;
count++;
}

/*
* Calculate m and b for the formular:
* y = x * m + b
*/
var m = (count*sum_xy - sum_x*sum_y) / (count*sum_xx - sum_x*sum_x);
var b = (sum_y/count) - (m*sum_x)/count;

/*
* We will make the x and y result line now
*/
var result_values_x = [];
var result_values_y = [];

for (var v = 0; v < values_length; v++) {
x = values_x[v];
y = x * m + b;
result_values_x.push(x);
result_values_y.push(y);
}

return [result_values_x, result_values_y];
}
