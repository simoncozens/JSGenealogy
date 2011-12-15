var border = 10;
var start;
function layout(url, canvas) {
    var lifeExpectancy = 60;
    var tree = xml2tree(url);
    start = tree["I2"];
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
        if (!genmap[i.generation]) genmap[i.generation] = []; 
        genmap[ i.generation ].push(i);
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
        var known = genmap[g].filter( 
            function(i) { return i.hasOwnProperty("y") }
        ).map( function(i) { return i.y } );
        if (!known.length) { continue }
        var avg = known.average();
        genmap[g].filter(
            function(i) { return !i.hasOwnProperty("y") }
        ).forEach(
            function (x) { x.y = avg; x.yApprox = 1 }
        );
    }
    interpolate(genmap); 
    // Compute X values for ancestors
    start.computeWidth();
    start.x = 0; // Set the target's x value to be the origin
    start.computeX();
    // Compute X values for siblings and spouse
    // Compute X values for descendents

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

    console.log(layout.width+ "  " + layout.height);
    console.log(canvas.width+ "  " + canvas.height);
    directFamily.forEach(function(i){
        var l = function() {}; l.prototype = LayoutHelper;
        i.layoutObject = new l(); 
        i.layoutObject.parent = i;
        if (!(i.hasOwnProperty("x") && i.y)) return;
        i.layoutObject.x =  ((i.x - layout.minX) * canvas.width / layout.width);
        i.layoutObject.y =  ((i.y - layout.minY) * canvas.height / layout.height);
    });

    // Now laying out is done, time to call draw on the directFamily
    draw(directFamily,canvas,layout); 
    return directFamily;
}

function interpolate (x) { } // A problem for another day.

FamilyTreeIndividual.SPF = function() {
    if (this.father && !this.mother) return this.father;
    if (this.mother && !this.father) return this.mother;
}
FamilyTreeIndividual.computeWidth = function () {
    if (!this.father && !this.mother) { return this.width = 1 }
    if (this.SPF()) { return this.width = this.SPF.computeWidth(); }
    this.width = 1+ this.mother.computeWidth() + this.father.computeWidth(); 
    return this.width;
}

FamilyTreeIndividual.computeX = function() { 
    if (this.father) { this.father.x = this.x - (this.width-1) / 2; this.father.computeX(); }
    if (this.mother) { this.mother.x = this.x + (this.width-1) / 2; this.mother.computeX(); }
}

FamilyTreeIndividual.childrenAndSpouses = function (gen) {
    var rv = [this];
    if (this.spouse) rv = rv.concat(this.spouse);
    rv.forEach(function(i) { i.generation = gen });
    this.offspring.forEach(function(i) { rv = rv.concat(i.childrenAndSpouses(gen+1)); });
    return rv;
}

FamilyTreeIndividual.parentsAndSpouses = function(gen) { 
    var rv = [this];
    if (this.spouse) rv = rv.concat(this.spouse);
    rv.forEach(function(i) { i.generation = gen });
    if (this.father) { rv = rv.concat(this.father.parentsAndSpouses(gen-1)) }
    if (this.mother) { rv = rv.concat(this.mother.parentsAndSpouses(gen-1)) }
    return rv;
}
