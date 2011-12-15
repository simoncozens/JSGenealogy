use XML::Simple;

use strict;
our $family = XMLin("family.xml", KeyAttr=> {individual => "+id"},
    ForceArray => [qw/spouse sibling child father mother/]
    )->{individual};
layout($family->{"I2"});
my %genmap;

sub g ($) {  map { $family->{$_->{ref}} } @{ $_[0] || [] }  }
sub assign_gen { my ($i, $g) = @_; $i->{generation} = $g; $genmap{$g}{members}{$i->{id}} = $i }

sub layout {
    my $individual = shift;
    
    # Collate direct family information 
    my @direct_family = ( $individual, g $individual->{sibling});
    for (@direct_family) { assign_gen($_, 0); }
    push @direct_family,
        children_and_spouses_of($individual,0),
        parents_and_spouses_of($individual,0),
    ;
    @direct_family = uniq(@direct_family);
    for (values %genmap) { $_->{members} = [ values %{$_->{members}} ] }

    # Scan for date clues
    for (@direct_family) {
        if ($_->{born}{date} =~ /(\d{4})/) { $_->{y} = $1; } # Regex is hack
        elsif ($_->{died}{date} =~ /(\d{4})/) { $_->{y} = $1 - 60; $_->{yapprox} = 1 } # Even hackier
    }
    for my $gen (values %genmap) {
        my @known = (map {$_->{y}} grep { exists $_->{y} } @{$gen->{members}} );
        next unless @known;
        my $avg = int avg(@known);
        for (@{$gen->{members}}) { if (!exists $_->{y}) {
            $_->{y} = $avg; $_->{yapprox} = 1;
        }}
        $gen->{avgy} = $avg;
    }
    interpolate();
    # Now the Y values are set, try to find X values.
    # First go up from the individual
    compute_width($individual); 
    $individual->{x} = 0;
    compute_x($individual);
    use SVG;
    my $svg = SVG->new(width => 1000, height=>1000); 
    my $y=$svg->group(id    => 'group_y', style => { stroke=>'red', fill=>'green' });
    for (sort { $a->{generation} <=> $b->{generation} }@direct_family) {
        next unless exists $_->{y} and exists $_->{x};
        warn "$_->{generation}) $_->{name}: $_->{y}, $_->{x} ($_->{width})\n";
        $svg->text(x=>500 + 40*$_->{x}, y=>1.5*($_->{y}-1700), id=>
        $_->{id})->cdata($_->{name});
    }
    print $svg->xmlify(-namespace=>'svg');


}

sub compute_width {
    my $self = shift;
    my @parents = (g $self->{father}, g $self->{mother});
    if (@parents == 0) { return $self->{width} = 1; } 
    if (@parents == 1) { return $self->{width} = compute_width($parents[0]) }
    return $self->{width} = (1 + sum(map { compute_width($_) } @parents));
}

sub compute_x { 
    my $self = shift;
    my ($father) = g $self->{father};
    my ($mother) = g $self->{mother};
    if ($father) { $father->{x} = $self->{x} - $self->{width} / 2; compute_x($father) } 
    if ($mother) { $mother->{x} = $self->{x} + $self->{width} / 2 ; compute_x($mother) } 
}

sub interpolate {
    use Statistics::LineFit;
    my $lf = Statistics::LineFit->new();
    $lf->setData([ map {
         exists $genmap{$_}{avgy} ?  [ $_ => $genmap{$_}{avgy} ] : () 
         } sort keys %genmap]);
    die "Couldn't fit" unless $lf->rSquared;
    my ($intercept, $slope) = $lf->coefficients();
    for (keys %genmap) { 
        next if exists $genmap{$_}{avgy};
        my $int = $genmap{$_}{avgy} = $intercept + $_ * $slope;
        for (@{$genmap{$_}{members}}) {
            next if $_->{y};
            $_->{y} = $int; $_->{yapprox} = 1;
        }
    }
}
sub avg { use List::Util qw(sum); sum(@_)/@_ }
sub children_and_spouses_of {
    my $individual = shift;
    my $generation = shift;
    my @rv = ($individual, g $individual->{spouse});
    for (@rv) { assign_gen($_, $generation); }

    for (g $individual->{child}) {
        push @rv, children_and_spouses_of($_, $generation + 1); 
    }
    uniq(@rv);
}

sub parents_and_spouses_of {
    my $individual = shift;
    my $generation = shift;
    my @rv = ($individual, g $individual->{spouse});
    for (@rv) { assign_gen($_, $generation); }
    for (g $individual->{father}, g $individual->{mother}) {
        push @rv, parents_and_spouses_of($_, $generation - 1); 
    }
    uniq(@rv);
}

sub uniq { my %tmp = map { $_->{id} => $_ } @_ ; values %tmp }
