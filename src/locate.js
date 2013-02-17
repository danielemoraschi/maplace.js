var html_dropdown = (function () {

    function html_dropdown(locate) {
        this.Locate = locate;
        this.html_element = null;
    }


    html_dropdown.prototype.activateCurrent = function(index) {
        this.html_element.find('select').val(index);
    };

    html_dropdown.prototype.getHtml = function() {
        var self = this,
            html = '',
            a = 0;

        if(this.Locate.ln>1) {
            html += '<select class="dropdown controls">';

            if(this.Locate.ShowOnMenu(this.Locate.view_all_key)) {
                html += '<option value="'+this.Locate.view_all_key+'">'+this.Locate.o.view_all_text+'</option>';
            }

            for (a; a < this.Locate.ln; a++) {
                if(this.Locate.ShowOnMenu(a)) html += '<option value="'+(a+1)+'">' + (this.Locate.o.locations[a].title||('#'+(a+1))) + '</option>';
            }
            html += '</select>';

            html = $(html).bind('change', function() {
                self.Locate.ViewOnMap(this.value); 
            });
        }

        this.html_element = $('<div class="wrap_controls"></div>').append($('<div class="controls_title">'+this.Locate.o.controls_title+'</div>')).append(html);
        
        return this.html_element;
    }

    return html_dropdown;
})();


var html_ullist = (function () {

    function html_ullist(locate) {
        this.Locate = locate;
        this.html_element = null;
    }

    html_ullist.prototype.html_a = function(i, hash, title) {
        var self = this;
        return $('<a id="ullist_a_'+(hash||(i+1))+'" href="#'+ (hash||(i+1)) +'" title="' + (title||this.Locate.o.locations[i].title) + '"><span>' + (title||this.Locate.o.locations[i].title||('#'+(i+1))) + '</span></a>').click(
            function() {
                return self.html_a_action(this);
            }
        );
    };

    html_ullist.prototype.html_a_action = function(obj, i) {
        i = i || $(obj).attr('href');
        i = (i.indexOf('#') == 0 ? i.substr(1) : i);

        this.Locate.ViewOnMap(i); 
        return false;
    };


    html_ullist.prototype.activateCurrent = function(index) {
        this.html_element.find('li').removeClass('active');
        this.html_element.find('#ullist_a_'+index).parent().addClass('active');
    };

    html_ullist.prototype.getHtml = function() {
        var html = $("<ul class='ullist controls'></ul>"),
            a = 0;

        if(this.Locate.ShowOnMenu(this.Locate.view_all_key)) {
            html.append( $('<li></li>').append( this.html_a(false, this.Locate.view_all_key, this.Locate.o.view_all_text) ) );
        }

        for (a; a < this.Locate.ln; a++) {
            if(this.Locate.ShowOnMenu(a)) html.append( $('<li></li>').append( this.html_a(a) ) );
        }

        this.html_element = $('<div class="wrap_controls"></div>').append($('<div class="controls_title">'+this.Locate.o.controls_title+'</div>')).append(html);

        return this.html_element;
    }

    return html_ullist;
})();




var Locate = (function () {

    function Locate(args) {
    	this.errors = [];
    	this.dev = true;
    	this.infowindow;
        this.ln = 0;
    	this.oMap = false;
        this.oBounds = null;
        this.map_div = null;
        this.gm_active = false;
        this.controls_wrapper;
        this.current_control;
        this.current_index;
        this.view_all_key = 'all';
        this.markers = [];
        this.Polyline = null;
        this.def_stroke_options = {
            strokeColor:"#0000FF",
            strokeOpacity:0.8,
            strokeWeight:2,
            fillColor:"#0000FF",
            fillOpacity:0.4
        };
        this.directionsService = null;
        this.directionsDisplay = null;
        this.def_directions_options = {
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
            optimizeWaypoints: false,
            provideRouteAlternatives: false,
            avoidHighways: false,
            avoidTolls: false
        };
    	this.def_map_options = {
    	    mapTypeId: google.maps.MapTypeId.ROADMAP
    	};

    	this.o = {
    	    gmap: '#gmap',
            type: 'marker',
    	    controls: '#controls',
    	    generate_controls: true,
    	    controls_type: 'dropdown',
            controls_title: '',
            controls_on_map: true,
            view_all: true,
            view_all_text: 'View All',
            start: 0,
    	    locations: [],
    	    map_options: {},   
            stroke_options: {},
            directions_options: {},
            draggable: false,  
            show_infowindow: true,
    	    infowindow_type: 'bubble',
            beforeViewAll: function() {},
            afterViewAll: function() {},
            beforeShowCurrent: function(index, marker, content) {},
            afterShowCurrent: function(index, marker, content) {},
            afterCreateMarker: function(index, marker, content) {},
            beforeCloseInfowindow: function(index, marker, content) {},
            afterCloseInfowindow: function(index, marker, content) {},
            before_open_infowindow: function(index, marker, content) {},
            afterOpenInfowindow: function(index, marker, content) {},
            afterRoute: function(distance, status, result) {}
    	};

        this.Init( args );
    };

    Locate.prototype.controls = {};

    Locate.prototype.create_objMap = function() {
        var self = this,
            m;

        if(!this.gm_active) {
            this.oBounds = new google.maps.LatLngBounds();
            this.gm_active = true;
            try {
                this.map_div.css({
                    position: 'relative',
                    overflow: 'hidden'
                });
                
                m = $('<div>').addClass('canvas_map').css({
                    width: this.map_div.width()+'px',
                    height: this.map_div.height()+'px'
                }).appendTo( this.map_div );

                this.oMap = new google.maps.Map(m.get(0), this.def_map_options);
                //google.maps.OverlayInfoWindow = _overlay_infowindow;
                if(self.def_map_options.zoom) google.maps.event.addListenerOnce(this.oMap, 'idle', function(){
                    self.oMap.setZoom(self.def_map_options.zoom);
                });
            } 
            catch(err) { this.errors.push(err.toString()); }
        }
        this.Debug('Locate.create_objMap');
    };

    Locate.prototype.add_markers_to_objMap = function() {
        var a = 0, 
            type = this.o.type || 'marker';

        switch (type) {
            case 'polyline':
                this.create_polyline(this.o.locations);
                break;
            case 'directions':
                this.create_directions(this.o.locations);
                break;
            case 'marker':
            default:
                for (a; a < this.ln; a++) {
                    this.create_marker(a, this.o.locations[a]);
                }
                break;
        };
    };

    Locate.prototype.create_marker = function(index, point) {
        var self = this,
            marker, a, point_infow,
            latlng = new google.maps.LatLng(point.lat, point.lon);

        $.extend(point, {
            position: latlng,
            map: this.oMap,
            zIndex: 10000
        });

        if(point.image) {
            image_w = point.image_w || 32;
            image_h = point.image_h || 32;
            $.extend(point, {
                icon:  
                new google.maps.MarkerImage(
                    point.image,
                    new google.maps.Size(image_w, image_h),
                    new google.maps.Point(0, 0),
                    new google.maps.Point(image_w/2, image_h/2)
                )
            });
        }

        marker = new google.maps.Marker( point ),
        a = google.maps.event.addListener(marker, 'click', function() {

            self.o.beforeShowCurrent(index, marker, point.html||'');

            point_infow = point.show_infowindow===false ? false : true;
            if(self.o.show_infowindow && point_infow) {
                self.open_infowindow(index, marker, {content: point.html||'', type: point.type||self.o.infowindow_type, 'oMap': self.oMap});
            }
            self.oMap.panTo(latlng);
            if(point.zoom) self.oMap.setZoom(point.zoom);

            if(self.current_control) self.current_control.activateCurrent(index+1);
            self.current_index = index;

            self.o.afterShowCurrent(index, marker, point.html||'');
        });

        this.oBounds.extend(latlng);
        this.markers.push(marker);

        this.o.afterCreateMarker(index, marker, point.html||'');

        return marker;
    };

    Locate.prototype.create_polyline = function(points) {
        var self = this,
            a = 0,
            latlng,
            path = [];

        for (a; a < this.ln; a++) {
            latlng = new google.maps.LatLng(points[a].lat, points[a].lon);
            path.push(latlng);

            this.create_marker(a, points[a]);
        }

        $.extend(this.def_stroke_options, {
            path: path,
            map: this.oMap
        });

        this.Polyline = new google.maps.Polyline(this.def_stroke_options);
    };

    Locate.prototype.create_directions = function(points) {
        var self = this,
            a = 0,
            stopover,
            latlng,
            origin,
            destination,
            waypoints = [],
            distance = 0;

        for (a; a < this.ln; a++) {
            latlng = new google.maps.LatLng(points[a].lat, points[a].lon);
            if(a===0) {
                origin = latlng;
                this.create_marker(a, points[a]);
            }
            else if(a===(this.ln-1)) {
                destination = latlng;
                this.create_marker(a, points[a]);
            }
            else {
                stopover = points[a].stopover===true ? true : false;
                waypoints.push({
                    location: latlng,
                    stopover: stopover
                });
                this.create_marker(a, points[a]);
            }
        }

        $.extend(this.def_directions_options, {
            origin: origin,
            destination: destination,
            waypoints: waypoints
        });

        this.directionsService = new google.maps.DirectionsService();
        this.directionsDisplay = new google.maps.DirectionsRenderer({
            draggable: this.o.draggable
        });

        this.directionsDisplay.setMap(this.oMap);

        if(this.o.draggable) google.maps.event.addListener(this.directionsDisplay, 'directions_changed', function() {
            distance = self.compute_distance(self.directionsDisplay.directions);
            self.o.afterRoute(distance);
        });

        this.directionsService.route(this.def_directions_options, function(result, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                distance = self.compute_distance(result);
                self.directionsDisplay.setDirections(result);
            }

            self.o.afterRoute(distance, status, result);
        });
    };

    Locate.prototype.compute_distance = function(result) {
        var total = 0,
            i = 0,
            myroute = result.routes[0],
            rlen = myroute.legs.length;

        for (i; i < rlen; i++) {
            total += myroute.legs[i].distance.value;
        }

        return total;
    }

    Locate.prototype.type_to_open = {
    	bubble: function(omap, args) {
    		omap.infowindow = new google.maps.InfoWindow(args);
    	}
    };

    Locate.prototype.open_infowindow = function(index, marker, args) {

        this.CloseInfoWindow();        
        
        if( args.content ) {
            if(this.type_to_open[args.type||this.o.infowindow_type]) {

                this.o.before_open_infowindow(index, marker, args.content);

                this.type_to_open[args.type||this.o.infowindow_type](this, args);
                this.infowindow.open(this.oMap, marker);

                this.o.afterOpenInfowindow(index, marker, args.content);
            }
        }
    };

    Locate.prototype.get_html_controls = function() {
        this.current_control = new this.controls[this.o.controls_type]( this );
        if(this.controls[this.o.controls_type]) return this.current_control.getHtml();
        else return '';
    };

    Locate.prototype.generate_controls = function() {
        if(!this.o.controls_on_map) {
            this.controls_wrapper.empty();
            this.controls_wrapper.append( this.get_html_controls() );
            return;
        }
        this.oMap.controls[google.maps.ControlPosition.RIGHT_TOP].push( $('<div class="on_gmap '+this.o.controls_type+' gmap_controls"></div>').append(this.get_html_controls()).get(0) );
    };

    Locate.prototype.reset_map = function() {      
    	var self = this;

        if (this.markers) {
            for (i in this.markers) {
                if(this.markers[i]) {
                    try{ this.markers[i].setMap(null); } catch(err){ self.errors.push(err); }
                }
            }
            this.markers.length = 0;
            this.markers = [];
        }

        if(this.o.controls_on_map && this.oMap.controls) {
            this.oMap.controls[google.maps.ControlPosition.RIGHT_TOP].forEach(function(element, index) {
                self.oMap.controls[google.maps.ControlPosition.RIGHT_TOP].removeAt(index);
            });
        }
        this.Debug('Locate.reset_map');
    };     


    /****** // ******/

    Locate.prototype.AddControl = function( name, func ) {
        if(!name) return false;
        func = func || function(){};
        this.controls[name] = func;

        return true;
    };

    Locate.prototype.CloseInfoWindow = function() {
        if(this.infowindow && (this.current_index || this.current_index===0)) {
            this.o.beforeCloseInfowindow(this.current_index);        
            this.infowindow.close();
            this.infowindow = null;
            this.o.afterCloseInfowindow(this.current_index); 
        }
    };

    Locate.prototype.ShowOnMenu = function( index ) {
        if(index==this.view_all_key && this.o.view_all && this.ln>1) {
            return true;
        }

        index = parseInt(index);
        if(typeof(index-0) == 'number' && index>=0 && index<this.ln) {
            var visible = this.o.locations[index].visible===false ? false : true;
            if(visible) return true;
        }

        return false;
    };

    Locate.prototype.ViewOnMap = function( index ) {
        if(index==this.view_all_key) {
            this.o.beforeViewAll();
            this.current_index = index;
            if(this.o.locations.length>0) {
                this.current_control.activateCurrent(index);
                this.oMap.fitBounds(this.oBounds);
            }
            else {
                this.oMap.fitBounds(this.oBounds);
            }
            this.CloseInfoWindow();
            this.o.afterViewAll();
        }
        else {
            index = parseInt(index);
            if(typeof(index-0) == 'number' && index>0 && index<=this.ln) {
                try {
                    google.maps.event.trigger(this.markers[index-1], 'click');
                } 
                catch(err) { this.errors.push(err.toString()); }
            }
        }
        this.Debug('Locate.ViewOnMap');
    };

    Locate.prototype.SetMarkers = function( locs, reload ) {
        this.o.locations = locs;

        if(!reload) this.Load();
    };

    Locate.prototype.AddMarkers = function( locs, reload ) {
        var self = this;

        if($.isArray(locs)) {
            $.each(locs, function(index, value) {
                self.o.locations.push( value );
            });
        }

        if($.isPlainObject(locs)) {
            this.o.locations.push( locs );
        }

        if(!reload) this.Load();
    };

    Locate.prototype.RemoveMarkers = function( locs, reload ) {
        var self = this, 
            k = 0;

        if($.isArray(locs)) {
            $.each(locs, function(index, value) {
                if((value-k) < self.ln) self.o.locations.splice(value-k, 1);
                k++;
            });
        } 
        else {
            if(locs < this.ln) this.o.locations.splice(locs, 1);
        }

        if(!reload) this.Load();
    };

    Locate.prototype.Debug = function(msg) {
        if(this.dev && this.errors.length) console.log(msg+': ', this.errors);
    };

    Locate.prototype.Load = function(opt) {
        this.Init(opt);
        
        if(this.ln>1 && this.o.generate_controls) {
            this.generate_controls();
        }

        if(this.ln==1) {
            this.ViewOnMap(1); 
        }
        else {
            if(typeof(this.o.start-0) == 'number' && this.o.start>0 && this.o.start<=this.ln) {
                this.ViewOnMap(this.o.start); 
            } else {
                this.ViewOnMap(this.view_all_key);
            }
        }
    };

    Locate.prototype.Init = function(args) {
        if(args) {
            $.extend(this.o, args);
            $.extend(this.def_map_options, args.map_options);
            $.extend(this.def_stroke_options, args.stroke_options);
            $.extend(this.def_directions_options, args.directions_options);
        }

        this.controls['dropdown'] || this.AddControl('dropdown', html_dropdown);    
        this.controls['list'] || this.AddControl('list', html_ullist);

        this.ln = this.o.locations.length;
        this.map_div = $(this.o.gmap);
        this.controls_wrapper = $(this.o.controls);
        if(this.Polyline) this.Polyline.setMap(null);
        if(this.directionsDisplay) this.directionsDisplay.setMap(null);

        this.reset_map();
        this.create_objMap();
        this.add_markers_to_objMap();
    }


    return Locate;
})(); 

