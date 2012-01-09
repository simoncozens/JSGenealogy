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
        if (!genmap[i.generation]) genmap[i.generation] = { 
            members: [],
            marriages: [], baseTotal: 0, stretchTotal: 0 // Used later
        }; 
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
    var layout = { minX: 0, minY: 4000, maxX: 0, maxY: 0};
    directFamily.forEach(function(i){
        if (!(i.hasOwnProperty("x") && i.y)) return;
        if (i.x < layout.minX) layout.minX = i.x;
        if (i.x > layout.maxX) layout.maxX = i.x;
    });

    // Compute x values for each generation down from the root
    var avail = layout.maxX - layout.minX;
    if (avail < 30) avail = 30;
    start.fillGenmap(genmap, 0);
    for (var i = 0; genmap[i]; i++) { var thisGen = genmap[i];
        var multiplier;
        if (genmap[i].baseTotal + thisGen.stretchTotal < avail || thisGen.stretchTotal == 0) {
            multiplier = 1;
        } else {
            multiplier = (avail-thisGen.baseTotal) / thisGen.stretchTotal;
        }
        var finalWidth = thisGen.baseTotal + thisGen.stretchTotal * multiplier;
        var cursor = -(finalWidth)/2;
        thisGen.marriages.forEach(function(m) {
            m.left = cursor;
            m.right = cursor += (m.base + multiplier * m.stretch);
            var count = 1;
            m.members.forEach(function(mem) {
                mem.x = m.left + (count / m.base) * (m.right - m.left);
                count++;
            });
            console.log("Placing the following members between "+m.left+" and "+m.right);
            console.log(m.members);
        });
    }

    // Find lowest/highest x and y values, scale drawing accordingly.
    directFamily.forEach(function(i){
        if (!(i.hasOwnProperty("x") && i.y)) return;
        if (i.x < layout.minX) layout.minX = i.x;
        if (i.x > layout.maxX) layout.maxX = i.x;
        if (i.y < layout.minY) layout.minY = i.y;
        if (i.y > layout.maxY) layout.maxY = parseInt(i.y);
    });
    layout.maxY += 3; layout.maxX += 3;
    layout.minY -= 3; layout.minX -= 6;
    
    layout.width = layout.maxX - layout.minX;
    layout.height = layout.maxY - layout.minY;
    console.log(layout);

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

// The trick is to assign to each marriage/SPF two values: base width and
// stretch. Stretch is the size of the next generation down.
// In the next phase, available space is filled up proportionally by
// stretch a la TeX.

FamilyTreeIndividual.selfPlusSpouseCount = function() {
    return 1 + this.spouses.length;
}

FamilyTreeIndividual.fillGenmap = function (genmap, generation){
    var base = this.selfPlusSpouseCount();
    var stretch = 2;
    this.offspring.forEach(function(x) {
        stretch += x.selfPlusSpouseCount();
        x.fillGenmap(genmap, generation+1);
    });
    // If we have no spouses, compute directly.
    if (stretch < base) stretch = base;
    if (base == 1) {
        if (base < stretch) base = stretch;
        genmap[generation].marriages.push( { base:base, stretch: stretch, members: [ this ] });
    } else {
        var that = this;
        if (base < stretch) base = stretch;
        this.spouses.forEach(function(s) {
            if (s == that.spouses[0]) { 
                base = 2;
                genmap[generation].marriages.push( { base:2, stretch: stretch, members: [ that, s ] });
            } else {
                base = 1;
                genmap[generation].marriages.push( { base:1, stretch: stretch, members: [ s ] });
            }
        });
    }
    genmap[generation].baseTotal += base;
    genmap[generation].stretchTotal += stretch;
}

FamilyTreeIndividual.computeXUpwards = function() { 
    if (this.father) { this.father.x = this.x - (this.width-1) / 2; this.father.computeXUpwards(); }
    if (this.mother) { this.mother.x = this.x + (this.width-1) / 2; this.mother.computeXUpwards(); }
}

FamilyTreeIndividual.myselfSpousesAndSiblings = function () {
    var rv = [];
    var brethren = [this].concat(this.siblings).concat(this.spouses).sort(function (a,b) {
        return a.y - b.y
    });
    return brethren;
}

FamilyTreeIndividual.computeXDownwards = function(spaceToFill) { 
    var base;
    if (this.SPF()) { base = this.SPF().x }
    else if (!this.father && !this.mother) { base = 0 }
    else            { base = (this.father.x+this.mother.x)/2 }
    var start = base;
    var thisline = this.myselfSpousesAndSiblings();
    var twidth = 0;
    thisline.forEach(function(x){ if (x.width) { twidth += x.width } 
        else { twidth += 1 } 
    });
    if(!spaceToFill) spaceToFill = twidth;
    //console.log("Total width of this line is "+twidth);
    start -= spaceToFill/2;
    //console.log("Trying to fill "+spaceToFill+" for "+this.name);
    //console.log(thisline);
    thisline.forEach(function(x){
        if (!x.hasOwnProperty("width")) { x.width = 1 }
        if (x.x) return;
        //if (x.width > 1) x.x += (x.width-1)/2; 
        //console.log("1: "+x.name+" gets "+(x.width/twidth*100)+"% of "+spaceToFill);
        var mySpace = x.width/twidth*spaceToFill;
        x.x  = start + mySpace/2;
        //console.log("... "+mySpace);
        //console.log("Setting "+x.name+" X to "+x.x);
        start += mySpace;
        x.offspring.forEach(function(x){
            //console.log(x.name+"'s generation gets "+mySpace);
            x.computeXDownwards(mySpace);
        });

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
