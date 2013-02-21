var locate, bigdata;

//Mixed / Ajax Example
function showGroup(index) {
  var el = $('#g'+index);
  $('#mixed li').removeClass('active');
  $(el).parent().addClass('active');
  $.getJSON('data/ajax.php', { type: index }, function(data) {
    locate.Load({
      locations: data.points,
      view_all_text: data.title,
      type: data.type
    });
  });
}

;(function ($, window, undefined) {
  'use strict';

  var $doc = $(document),
      Modernizr = window.Modernizr;

  $(document).ready(function() {
    $.fn.foundationMediaQueryViewer ? $doc.foundationMediaQueryViewer() : null;
    $.fn.foundationTabs             ? $doc.foundationTabs() : null;

    if (Modernizr.touch && !window.location.hash) {
      $(window).load(function () {
        setTimeout(function () {
          window.scrollTo(0, 1);
        }, 0);
      });
    }

    prettyPrint();


    //Just the map
    new Locate().Load();

    //Simple Example, dropdown on map
    new Locate({
      map_div: '#gmap-2',
      controls_title: 'Choose a location:',
      locations: LocsA
    }).Load();

    //Simple Example, menu on map
    new Locate({
      map_div: '#gmap-3',
      controls_type: 'list',
      controls_title: 'Choose a location:',
      locations: LocsB
    }).Load();

    //Simple Example, external menu
    new Locate({
      map_div: '#gmap-4',
      controls_type: 'list',
      controls_cssclass: 'side-nav',
      controls_on_map: false,
      locations: LocsAB
    }).Load();
    
    //Tabs Example
    new Locate({
      map_div: '#gmap-5',
      controls_div: '#controls-5',
      start: 1,
      controls_type: 'list',
      controls_on_map: false,
      show_infowindows: false,
      view_all: false,
      locations: LocsB,
      afterShowCurrent: function(index, location, marker) {
        $('#info').html(location.html);
      }
    }).Load();

    //Polyline Example
    new Locate({
      map_div: '#gmap-6',
      controls_div: '#controls-6',
      controls_cssclass: 'side-nav',
      controls_type: 'list',
      controls_on_map: false,
      show_infowindows: true,
      view_all_text: 'Start',
      locations: LocsA,
      type: 'polyline'
    }).Load();

    //Directions route Example
    new Locate({
      map_div: '#gmap-7',
      generate_controls: false,
      show_markers: false,
      locations: LocsD,
      type: 'directions',
      draggable: true,
      directions_panel: '#route',
      afterRoute: function(distance) {
        $('#km').text(': '+(distance/1000)+'km');
      }
    }).Load();

    //Polygon Example
    new Locate({
      map_div: '#gmap-8',
      controls_div: '#controls-8',
      generate_controls: false,
      show_markers: false,
      locations: LocsC,
      type: 'polygon',
      draggable: true
    }).Load();

    //Mixed / Ajax Example
    $('#mixed a').click(function(e) {
      e.preventDefault();
      var index = $(this).attr('data-load');
      showGroup(index);
    });
    locate = new Locate({
      map_div: '#gmap-9',
      controls_div: '#controls-9',
      controls_type: 'list',
      controls_on_map: false
    });
    showGroup(0);

    //Big Data Example
    bigdata = new Locate({
      map_div: '#gmap-10',
      show_infowindows: false,
      locations: big4k
    });
    $('#load_bigdata').click(function(e) {
      e.preventDefault();
      $('#panel').fadeOut(200, function() {
        $('#gmap-10').fadeIn(200);
        bigdata.Load();
      });
    });

  });


})(jQuery, this);
