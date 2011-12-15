use Gedcom;
use Template;
 my $ged = Gedcom->new("test.ged");
 $ged->write_xml("test.xml");
my $temp = do { undef $/; <DATA> };
my $tt = Template->new();
print "<family>\n";
for ($ged->individuals) {
    $tt->process(\$temp, { i => $_ }) or die $tt->error;
}
print "</family>\n";

__DATA__
  <individual id="[% i.xref %]" sex="[%i.sex%]">
    <name>[% i.name %]</name>
    [% IF i.get_value("birth date")%]<born date="[%i.get_value("birth date")%]"/>[%END%]
    [% IF i.get_value("death date")%]<died date="[%i.get_value("death date")%]"/>[%END%]
    <father ref="[% i.father.xref %]"/>
    [% IF i.mother %]<mother ref="[% i.mother.xref %]"/>[%END%]
    [% FOR s = i.spouse %]<spouse ref="[% s.xref %]"/>[%END%]
    [% FOR s = i.siblings %]<sibling ref="[% s.xref %]"/>[%END%]
    [% FOR c = i.children %]<child ref="[% c.xref %]"/>[%END%]
  </individual>
