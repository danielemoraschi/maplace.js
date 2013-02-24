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

    var _oldShow = $.fn.show;

    $.fn.show = function(speed, oldCallback) {
      return $(this).each(function() {
        var
          obj         = $(this),
          newCallback = function() {
            if ($.isFunction(oldCallback)) {
              oldCallback.apply(obj);
            }

            obj.trigger('afterShow');
          };

        // you can trigger a before show if you want
        obj.trigger('beforeShow');

        // now use the old function to show the element passing the new callback
        _oldShow.apply(obj, [speed, newCallback]);
      });
    }

    //Just the map
    new Maplace().Load();

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
      locations: LocsB
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
      afterShowCurrent: function(index, location, marker) {
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
      locations: LocsA,
      type: 'polyline'
    });

    //Polygon Example
    var polygon = new Maplace({
      map_div: '#gmap-7',
      controls_div: '#controls-7',
      controls_type: 'list',
      show_markers: false,
      locations: LocsA,
      type: 'polygon',
      draggable: true
    });

    //Directions route Example
    var directions = new Maplace({
      map_div: '#gmap-8',
      generate_controls: false,
      show_markers: false,
      locations: LocsD,
      type: 'directions',
      draggable: true,
      directions_panel: '#route',
      afterRoute: function(distance) {
        $('#km').text(': '+(distance/1000)+'km');
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
          locations: data.points,
          view_all_text: data.title,
          type: data.type
        });
      });
    }
    $('#mixed a').click(function(e) {
      e.preventDefault();
      var index = $(this).attr('data-load');
      showGroup(index);
    });
    

    //Big Data Example
    var bigdata = new Maplace({
      map_div: '#gmap-10',
      locations: big4k,
      commons: {
        zoom: 5,
        html: '%index'
      }
    });
    $('#load_bigdata').click(function(e) {
      e.preventDefault();
      $('#panel').fadeOut(10, function() {
        $('#gmap-10').fadeIn(10);
        bigdata.Load();
      });
    });



    
    $('#markers').bind('inview', function(event, isInView) {
      if (isInView) {
        !dropdown.Loaded() && dropdown.Load();
        !ullist.Loaded() && ullist.Load();
      } 
    }); 

    $('#menu').bind('inview', function(event, isInView) {
      if (isInView) {
        !menu.Loaded() && menu.Load();
      } 
    }); 

    $('#dtabs').bind('inview', function(event, isInView) {
      if (isInView) {
        !tabs.Loaded() && tabs.Load();
      } 
    }); 

    $('#polyline').bind('inview', function(event, isInView) {
      if (isInView) {
        !polyline.Loaded() && polyline.Load();
      } 
    }); 

    $('#polygon').bind('inview', function(event, isInView) {
      if (isInView) {
        !polygon.Loaded() && polygon.Load();
      } 
    }); 

    $('#directions').bind('inview', function(event, isInView) {
      if (isInView) {
        !directions.Loaded() && directions.Load();
      } 
    }); 

    $('#dmixed').bind('inview', function(event, isInView) {
      if (isInView) {
        !mixed.Loaded() && showGroup(0);
      } 
    });     



  });//ready

})(jQuery, this);
