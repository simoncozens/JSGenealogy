var border = 10;
var start;
function layout(url, canvas, startId) {
    var lifeExpectancy = 60;
    var tree = xml2tree(url);
    start = tree[startId];
    //var 
    directFamily = [ start ];
    if ( start.spouses.length ) { directFamily = directFamily.concat(start.spouses) };
    directFamily.forEach( function(i) { i.generation = 0; });
    start.siblings.forEach( function(s){ directFamily.push(s); s.generation = 0; });
    directFamily = 
        directFamily.concat(start.childrenAndSpouses(0))
        .concat(start.parentsAndSpouses(0)).unique("id"); 
    // Organise into generations
    var genmap = {};
    directFamily.forEach( function(i) {
        if (!genmap[i.generation]) genmap[i.generation] = { members: [] }; 
        genmap[ i.generation ].members.push(i);
        // Scan for date clues
        var b = i.born;
        var year;
        if (b) {
            year = b.match(/\d\d\d\d/); // hack
            if (year && year[0]) { i.y = parseInt(year[0]); }
        } else {
            var d  = i.died;
            if (d) { 
                year = d.match(/\d\d\d\d/); // hack
                if (year && year[0]) { 
                    i.y = parseInt(year[0]) - lifeExpectancy;
                    i.yApprox = 1;
                } 
            }
        }
    });
    // Approximate unknowns by setting them to the generational average
    for (g in genmap) { 
        var known = genmap[g].members.filter( 
            function(i) { return i.hasOwnProperty("y") }
        ).map( function(i) { return i.y } );
        if (!known.length) { continue }
        genmap[g].avg = known.average();
        genmap[g].members.forEach(
            function (x) { if (x.hasOwnProperty("y")) return;
                x.y = genmap[g].avg;
                x.yApprox = 1 
            }
        );
    }
    interpolate(genmap); 
    // Compute X values for ancestors
    start.computeWidthUpwards();
    start.x = 0; // Set the target's x value to be the origin
    start.computeXUpwards();
    // Compute X values for siblings and spouse
    if (start.spouses[0]) start.spouses[0].x = 1;
    // Compute X values for descendents
    start.computeWidthDownwards();
    start.computeXDownwards();

    // Find lowest/highest x and y values, scale drawing accordingly.
    var layout = { minX: 0, minY: 4000, maxX: 0, maxY: 0};
    directFamily.forEach(function(i){
        if (!(i.hasOwnProperty("x") && i.y)) return;
        if (i.x < layout.minX) layout.minX = i.x;
        if (i.y < layout.minY) layout.minY = i.y;
        if (i.x > layout.maxX) layout.maxX = i.x;
        if (i.y > layout.maxY) layout.maxY = i.y;
    });
    layout.maxY += 3; layout.maxX += 3;
    layout.minY -= 3; layout.minX -= 6;
    
    layout.width = layout.maxX - layout.minX;
    layout.height = layout.maxY - layout.minY;

    directFamily.forEach(function(i){
        var l = function() {}; l.prototype = LayoutHelper;
        i.layoutObject = new l(); 
        i.layoutObject.indiv = i;
        if (!(i.hasOwnProperty("x") && i.y)) return;
        i.layoutObject.x =  ((i.x - layout.minX) * canvas.width / layout.width);
        i.layoutObject.y =  ((i.y - layout.minY) * canvas.height / layout.height);
    });

    // Now laying out is done, time to call draw on the directFamily
    draw(directFamily,canvas,layout); 
    return directFamily;
}

function interpolate (genmap) {
    var x = []; var y = [];
    for (g in genmap) { x.push(parseInt(g)); y.push(genmap[g].avg); }
    var regress = findLineByLeastSquares(x,y);
    var regmap = {};
    for (var i = 0; i <= regress[0].length; i++) {
        regmap[regress[0][i]] = regress[1][i];
    }
    console.log(regmap);
    for (g in genmap) { 
        genmap[g].members.forEach(
            function (x) { if (x.hasOwnProperty("y")) return;
                x.y = regmap[g].toFixed(0);
                x.yApprox = 1 
            }
        );
    }
}

FamilyTreeIndividual.birthYear = function() {

}

FamilyTreeIndividual.layoutSiblings = function(flag) {
    var tmp = this.x; 
    // Include siblings' spouses
    if (!this.siblings.length) { return }
    var local = [this].concat(this.siblings).sort(function (a,b) {
        return a.y - b.y
    });
    if (flag) tmp -= local.length / 2;
    // Which one am I?
    var whoamI; 
    for (var i=0; i< local.length; i++) { if (local[i]==this) whoamI = i} 
    for (var i=0; i< local.length; i++) { local[i].x = (i - whoamI)+tmp }

}

FamilyTreeIndividual.SPF = function() {
    if (this.father && !this.mother) return this.father;
    if (this.mother && !this.father) return this.mother;
}

FamilyTreeIndividual.computeWidthUpwards = function () {
    if (!this.father && !this.mother) { return this.width = 1 }
    if (this.SPF()) { return this.width = this.SPF().computeWidthUpwards(); }
    this.width = 1+ this.mother.computeWidthUpwards() + this.father.computeWidthUpwards(); 
    return this.width;
}

FamilyTreeIndividual.computeWidthDownwards = function () {
    // Sum of children's widths
    var that = this;
    var desccount  = 0;
    this.offspring.forEach(function(x) {
        desccount += x.computeWidthDownwards();
    });
    var descwidth = (desccount+1)/2;
    this.width = descwidth > 1 + this.spouses.length ? descwidth : 1+this.spouses.length;
    return this.width;
}

FamilyTreeIndividual.computeXUpwards = function() { 
    if (this.father) { this.father.x = this.x - (this.width-1) / 2; this.father.computeXUpwards(); }
    if (this.mother) { this.mother.x = this.x + (this.width-1) / 2; this.mother.computeXUpwards(); }
}

FamilyTreeIndividual.myselfSpousesAndSiblings = function () {
    var rv = [];
    var brethren = [this].concat(this.siblings).sort(function (a,b) {
        return a.y - b.y
    });
    brethren.forEach(function(x) { 
        rv = rv.concat(x);
        var wives = x.spouses.sort(function(a,b){return a.y-b.y});
        rv = rv.concat(wives);
    });
    return rv;
}

FamilyTreeIndividual.computeXDownwards = function() { 
    var base;
    if (this.SPF()) { base = this.SPF().x }
    else if (!this.father && !this.mother) { base = 0 }
    else            { base = (this.father.x+this.mother.x)/2 }
    //if (!this.hasOwnProperty("x")) { 
        var start = base;
        var thisline = this.myselfSpousesAndSiblings();
        var twidth = 0;
        thisline.forEach(function(x){ if (x.width) { twidth += x.width } 
            else { twidth += 1 } 
        });
        start -= (twidth-1) /2;
        thisline.forEach(function(x){
            x.x  = start; 
            if (x.width > 1) x.x += (x.width-1)/2; 
            start = x.x + 1;
        });
    //}
    this.offspring.forEach(function(i) { 
        i.computeXDownwards();
    });
}

FamilyTreeIndividual.childrenAndSpouses = function (gen) {
    var rv = [this];
    if (this.spouses) rv = rv.concat(this.spouses);
    rv.forEach(function(i) { i.generation = gen });
    this.offspring.forEach(function(i) { rv = rv.concat(i.childrenAndSpouses(gen+1)); });
    return rv;
}

FamilyTreeIndividual.parentsAndSpouses = function(gen) { 
    var rv = [this];
    if (this.spouses) rv = rv.concat(this.spouses);
    rv.forEach(function(i) { i.generation = gen });
    if (this.father) { rv = rv.concat(this.father.parentsAndSpouses(gen-1)) }
    if (this.mother) { rv = rv.concat(this.mother.parentsAndSpouses(gen-1)) }
    return rv;
}
