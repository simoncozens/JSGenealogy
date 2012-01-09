FamilyTreeIndividual = {};

function xml2tree(url) {
    var doc = getXml(url); if (!doc) return;
    var indivs = {};
    var indList = doc.getElementsByTagName("individual");
    for (i=0; i < indList.length; i++) {
        var ind = indList[i];
        var F = function() {}; F.prototype = FamilyTreeIndividual;
        var node = new F();
        node.DOMNode = ind;
        indivs[ind.getAttribute("id")] = node;
    } 
    for (i in indivs) {
        var ind = indivs[i];
        ind.name = ind.DOMNode.getElementsByTagName("name")[0].textContent;
        ind.name = ind.name.replace(/\//g,"");
        ind.id = ind.DOMNode.getAttribute("id");

        var n = ind.DOMNode.getElementsByTagName("note");
        if (n && n[0]) { ind.note = n[0].textContent }

        var f = ind.DOMNode.getElementsByTagName("father");
        if (f && f[0]) { ind.father = indivs[f[0].getAttribute("ref")] }
        var m = ind.DOMNode.getElementsByTagName("mother");
        if (m && m[0]) { ind.mother = indivs[m[0].getAttribute("ref")] }
        var s = ind.DOMNode.getElementsByTagName("spouse");
        ind.spouses=[];
        for (var x=0; x< s.length; x++){ var spice = s[x];
            ind.spouses.push( indivs[spice.getAttribute("ref")] );
        }
        var s = ind.DOMNode.getElementsByTagName("sibling");
        ind.siblings=[];
        for (var x=0; x< s.length; x++){ var sib = s[x];
            ind.siblings.push( indivs[sib.getAttribute("ref")] );
        }
        ind.offspring=[];
        var c = ind.DOMNode.getElementsByTagName("child");
        for (var x=0; x< c.length; x++){ var child = c[x];
            ind.offspring.push( indivs[child.getAttribute("ref")] );
        }
        var b = ind.DOMNode.getElementsByTagName("born");
        if (b[0] && b[0].getAttribute("date")) {
            ind.born = b[0].getAttribute("date");
        }
        var d = ind.DOMNode.getElementsByTagName("died");
        if (d[0] && d[0].getAttribute("died")) {
            ind.born = b[0].getAttribute("date");
        }
        ind.sex = ind.DOMNode.getAttribute("sex");
    }
    return indivs;
}
