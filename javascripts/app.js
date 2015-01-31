;(function ($, window, undefined) {
  'use strict';

  var $doc = $(document),
      Modernizr = window.Modernizr,
      lt_ie9 = false;

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

    $("body").iealert({
      support: 'ie7'
    });

    prettyPrint();

    if($('html').hasClass('lt-ie9')) {
      lt_ie9 = true;
    }

    //Just the map
    var simple = new Maplace().Load();

    //Simple Example, dropdown on map
    var dropdown = new Maplace({
      map_div: '#gmap-2',
      controls_title: 'Choose a location:',
      locations: LocsA
    });

    //Simple Example, menu on map
    var ullist = new Maplace({
      map_div: '#gmap-3',
      controls_type: 'list',
      controls_title: 'Choose a location:',
      locations: LocsBv2
    });

    //Simple Example, external menu
    var menu = new Maplace({
      map_div: '#gmap-4',
      controls_type: 'list',
      controls_cssclass: 'side-nav',
      controls_on_map: false,
      locations: LocsAB
    });

    //Tabs Example
    var tabs = new Maplace({
      map_div: '#gmap-5',
      controls_div: '#controls-5',
      start: 1,
      controls_type: 'list',
      controls_on_map: false,
      show_infowindows: false,
      view_all: false,
      locations: LocsB,
      afterShow: function(index, location, marker) {
        $('#info').html(location.html);
      }
    });

    //Polyline Example
    var polyline = new Maplace({
      map_div: '#gmap-6',
      controls_div: '#controls-6',
      controls_cssclass: 'side-nav',
      controls_type: 'list',
      controls_on_map: false,
      show_infowindows: true,
      view_all_text: 'Start',
      locations: LocsAv2,
      type: 'polyline',
      editable: true
    });

    //Polygon Example
    var polygon = new Maplace({
      map_div: '#gmap-7',
      controls_div: '#controls-7',
      controls_type: 'list',
      show_markers: false,
      locations: LocsAv2,
      type: 'polygon',
      editable: true
    });

    //Directions route Example
    var directions = new Maplace({
      map_div: '#gmap-8',
      generate_controls: false,
      locations: LocsD,
      type: 'directions',
      draggable: true,
      editable: true,
      directions_panel: '#route',
      afterRoute: function(distance) {
        $('#km').text((distance/1000)+'km');
      }
    });

    //Styled Example
    var styled = new Maplace({
      map_div: '#gmap-12',
      locations: LocsAB,
      start: 1,
      styles: styles,
      map_options: {
          zoom: 5
      }
    });

    //Mixed / Ajax Example
    var mixed = new Maplace({
      map_div: '#gmap-9',
      controls_div: '#controls-9',
      controls_type: 'list',
      controls_on_map: false
    });

    function showGroup(index) {
      var el = $('#g'+index);
      $('#mixed li').removeClass('active');
      $(el).parent().addClass('active');
      $.getJSON('data/ajax.php', { type: index }, function(data) {
        mixed.Load({
          locations: data.locations,
          view_all_text: data.title,
          type: data.type,
          force_generate_controls: true
        });
      });
    }

    $('#mixed a').click(function(e) {
      e.preventDefault();
      var index = $(this).attr('data-load');
      showGroup(index);
    });

    //Fusion
    var fusion = new Maplace({
      map_div: '#gmap-11',
      type: 'fusion',
      map_options: {
        zoom: 2,
        set_center: [31.1, -39.4]
      },
      fusion_options: {
        query: {
          from: '423292',
          select: 'location'
        },
        heatmap: {
          enabled: true
        },
        suppressInfoWindows: true
      }
    });

    //Big Data Example
    var bigdata = new Maplace({
      map_div: '#gmap-10',
      locations: big4k,
      type: 'circle',
      shared: {
        zoom: 5,
        html: '%index',
        radius: 10000,
      }
    });

    $('#load_bigdata').click(function(e) {
      e.preventDefault();
      $('#panel').fadeOut(10, function() {
        $('#gmap-10').fadeIn(10);
        bigdata.Load();
      });
    });

    //Circles Example
    var circles = new Maplace({
      locations: Circles,
      controls_type: 'list',
      map_div: '#gmap-circles',
      start: 4,
      view_all_text: 'Points of interest',
      type: 'circle',
      shared: {
        zoom: 16,
        html: '%index'
      },
      circleRadiusChanged: function(index, point, marker) {
          $('#radiusInfo').text(
            ' - point #' + (index + 1) + ' size: ' + parseInt(marker.getRadius()) + 'mt.'
          );
      }
    });


    $('#simple').one('inview', function(event, isInView) {
      if (isInView) {
        simple.Load();
      } 
    });

    $('#markers').one('inview', function(event, isInView) {
      if (isInView) {
        dropdown.Load();
        ullist.Load();
      } 
    }); 

    $('#menu').one('inview', function(event, isInView) {
      if (isInView) {
        menu.Load();
      } 
    }); 

    $('#dtabs').one('inview', function(event, isInView) {
      if (isInView) {
        tabs.Load();
      } 
    }); 

    $('#polyline').one('inview', function(event, isInView) {
      if (isInView) {
        polyline.Load();
      } 
    }); 

    $('#polygon').one('inview', function(event, isInView) {
      if (isInView) {
        polygon.Load();
      } 
    }); 

    $('#directions').one('inview', function(event, isInView) {
      if (isInView) {
        directions.Load();
      } 
    }); 

    $('#styled').one('inview', function(event, isInView) {
      if (isInView) {
        styled.Load();
      } 
    });

    $('#dmixed').one('inview', function(event, isInView) {
      if (isInView) {
        showGroup(0);
      } 
    }); 

    $('#fusion').one('inview', function(event, isInView) {
      if (isInView) {
        fusion.Load();
      } 
    });

    $('#circles').one('inview', function(event, isInView) {
      if (isInView) {
        circles.Load();
      } 
    });


    if(lt_ie9) {
      simple.Load();
      dropdown.Load();
      ullist.Load();
      menu.Load();
      tabs.Load();
      polyline.Load();
      polygon.Load();
      directions.Load();
      styled.Load();
      showGroup(0);
      fusion.Load();
      circles.Load();
    }



  });//ready

})(jQuery, this);
