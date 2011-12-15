var border = 10;
function draw( fam, c, layout) {
    var context = c.getContext("2d");
    context.clearRect(0, 0, c.width, c.height);
    drawTimeline(c, layout);
    fam.forEach(function(i) {
        if (!(i.hasOwnProperty("x") && i.y)) return;
        var width = context.measureText(i.name).width;
        context.beginPath();
        if (i.name.match(/[a-zA-Z]/)) {
        if (i.sex == "M") {
            context.rect(i.x - (width+border) + width /2, i.y-border,width + 2*border, border*2);
        } else {
            context.roundRect(i.x - (width+border) + width /2, i.y -border,width + 2*border, border*2);
        }
        if (i.yApprox) { context.fillStyle = "#ddddff"; context.fill() }
        }
        context.lineWidth = 1;
        context.strokeStyle = "black";
        context.fillStyle = "#000000";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(i.name, i.x, i.y);
        context.stroke();
        if (i.father && i.mother) {
            // Draw the marriage
            var marriageY = i.mother.y < i.father.y ? i.father.y : i.mother.y;
            context.beginPath();
            context.moveTo(i.mother.x, i.mother.y+border);
            context.lineTo(i.mother.x, marriageY+2*border);
            context.lineTo(i.father.x, marriageY+2*border);
            context.lineTo(i.father.x, i.father.y+border);
            context.moveTo((i.mother.x + i.father.x)/2, marriageY+2*border);
            context.lineTo(i.x, i.y-border);
            context.stroke();
        } else {
            var par = i.mother || i.father;
            if (par) {
                context.beginPath();
                context.moveTo(i.x, par.y+border);
                context.lineTo(i.x, i.y-border);
                context.stroke();
                
            }
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
