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
        if (this.indiv.yApprox) { context.fillStyle = "#f0f0ff"; }
        else { context.fillStyle = "#c0c0ff"; }
    } else {
        context.roundRect(this.x - (width+border) + width
        /2, this.y -border,width + 2*border, border*2);
        if (this.indiv.yApprox) { context.fillStyle = "#fff0f0" }
        else { context.fillStyle = "#ffc0c0"; }
    }
    context.fill()
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
    if (!(mother && father)) return;
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
    context.moveTo(par.x, par.y+border);
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
    context.font = "9pt Arial";
    context.textBaseline = "middle";
    while (y < layout.maxY) {
        y += 1; 
        if (y % 10) continue;
        var point =  ((y - layout.minY) * canvas.height / layout.height);
        context.beginPath();
        context.moveTo(0, point);
        context.strokeStyle = y%50 ? "#000000": "#c0c0c0";
        var length = !(y % 50) ? canvas.width : 5;
        context.lineTo(length, point);
        context.stroke();
        context.font = "9pt Arial";
        context.fillStyle = "#000000";
        if (!(y%50)) context.fillText(y, 15, point);
        if (!(y%50)) {
            context.font = "bold "+(22*canvas.height/layout.height)+"px Arial";
            context.textAlign="center";
            context.fillStyle = "#eaeaea";
            context.fillText((y-50)+"s", canvas.width/2, point-(25*canvas.height/layout.height));
        }

    }
    context.textBaseline = "bottom";
    context.fillText(y, 15, canvas.height);
    
}
