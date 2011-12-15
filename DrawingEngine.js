var border = 10;

LayoutHelper = {};
LayoutHelper.boundaries = function(context) {
    var width = context.measureText(this.indiv.name).width;
    return [ this.x - (width + border) + width / 2,
             this.y - border,
             this.x + border + width / 2,
             this.y + border
           ]
};

LayoutHelper.inBounds = function(x,y, context) {
    var bounds = this.boundaries(context);
    return x >= bounds[0] && x <= bounds[2] && y >= bounds[1] && y <= bounds[3]
} 

LayoutHelper.drawBox = function(context) {
    var width = context.measureText(this.indiv.name).width;
    context.beginPath();
    if (this.indiv.sex == "M") {
        context.rect(this.x - (width+border) + width /2, 
                     this.y-border,width + 2*border, border*2);
    } else {
        context.roundRect(this.x - (width+border) + width
        /2, this.y -border,width + 2*border, border*2);
    }
    if (this.indiv.yApprox) { context.fillStyle = "#ddddff"; context.fill() }
    context.stroke();
}

LayoutHelper.labelBox = function(context) {
    context.lineWidth = 1;
    context.strokeStyle = "black";
    context.fillStyle = "#000000";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(this.indiv.name, this.x, this.y);
}

LayoutHelper.drawMarriage = function(context) {
    var mother = this.indiv.mother.layoutObject;
    var father = this.indiv.father.layoutObject;
    var marriageY = mother.y < father.y ? father.y : mother.y;
    context.beginPath();
    context.moveTo(mother.x, mother.y+border);
    context.lineTo(mother.x, marriageY+2*border);
    context.lineTo(father.x, marriageY+2*border);
    context.lineTo(father.x, father.y+border);
    context.moveTo((mother.x + father.x)/2, marriageY+2*border);
    context.lineTo(this.x, this.y-border);
    context.stroke();
}

LayoutHelper.drawSingleParent = function(context) {
    var par = this.indiv.SPF();
    if (!par) return;
    par = par.layoutObject;
    context.beginPath();
    context.moveTo(this.x, par.y+border);
    context.lineTo(this.x, this.y-border);
    context.stroke();
}

function draw( fam, c, layout) {
    var context = c.getContext("2d");
    context.clearRect(0, 0, c.width, c.height);
    drawTimeline(c, layout);
    fam.forEach(function(i) {
        if (!(i.hasOwnProperty("x") && i.y)) return;
        i.layoutObject.drawBox(context);
        i.layoutObject.labelBox(context);
        if (i.father && i.mother) {
            i.layoutObject.drawMarriage(context);
            // Draw the marriage
        } else {
            i.layoutObject.drawSingleParent(context);
        }
    });

}

function drawTimeline ( canvas, layout) { 
    var context = canvas.getContext("2d");
    context.fillStyle = "#dee";
    context.beginPath();
    context.rect(0, 0, 20+context.measureText("1234").width, canvas.height);
    context.fill();
    context.fillStyle = "#000000";
    var y = layout.minY;
    context.textBaseline = "top";
    context.fillText(y, 15, 0);
    context.textBaseline = "middle";
    while (y < layout.maxY) {
        y += 1; 
        if (y % 10) continue;
        var point =  ((y - layout.minY) * canvas.height / layout.height);
        context.beginPath();
        context.moveTo(0, point);
        var length = !(y % 100) ? 10 : !(y % 50) ? 5 : 1;
        context.lineTo(length, point);
        context.stroke();
        if (!(y%100)) context.fillText(y, 15, point);
    }
    context.textBaseline = "bottom";
    context.fillText(y, 15, canvas.height);
    
}