function xml2tree(url) {
    var doc = getXml(url); if (!doc) return;
    var indivs = {};
    var indList = doc.getElementsByTagName("individual");
    for (i=0; i < indList.length; i++) {
        var ind = indList[i];
        indivs[ind.getAttribute("id")] = ind;
    } 
    for (i=0; i < indList.length; i++) {
        var ind = indList[i];
        ind.name = ind.getElementsByTagName("name")[0].textContent;
        ind.name = ind.name.replace(/\//g,"");
        ind.id = ind.getAttribute("id");

        var f = ind.getElementsByTagName("father");
        if (f && f[0]) { ind.father = indivs[f[0].getAttribute("ref")] }
        var m = ind.getElementsByTagName("mother");
        if (m && m[0]) { ind.mother = indivs[m[0].getAttribute("ref")] }
        var s = ind.getElementsByTagName("spouse");
        ind.spouses=[];
        for (var x=0; x< s.length; x++){ var spice = s[x];
            ind.spouses.push( indivs[spice.getAttribute("ref")] );
        }
        var s = ind.getElementsByTagName("sibling");
        ind.siblings=[];
        for (var x=0; x< s.length; x++){ var sib = s[x];
            ind.siblings.push( indivs[sib.getAttribute("ref")] );
        }
        ind.offspring=[];
        var c = ind.getElementsByTagName("child");
        for (var x=0; x< c.length; x++){ var child = c[x];
            ind.offspring.push( indivs[child.getAttribute("ref")] );
        }
    }
    return indivs;
}
