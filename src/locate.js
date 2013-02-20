;(function ($, window, google, undefined) {
    'use strict';

    /**
    * Copyright (c) 2013 Daniele Moraschi
    * Licensed under the MIT license
    *
    * @author   Daniele Moraschi
    * @version  1.0
    */

    var html_dropdown,
        html_ullist,
        Locate;


    html_dropdown = (function() {

        function html_dropdown(locate) {
            this.Locate = locate;
            this.html_element = null;
        }

        html_dropdown.prototype.activateCurrent = function (index) {
            this.html_element.find('select').val(index);
        };

        html_dropdown.prototype.getHtml = function () {
            var self = this,
                html = '',
                title,
                a;

            if (this.Locate.ln > 1) {
                html += '<select class="dropdown controls ' + this.Locate.o.controls_cssclass + '">';

                if (this.Locate.ShowOnMenu(this.Locate.view_all_key)) {
                    html += '<option value="' + this.Locate.view_all_key + '">' + this.Locate.o.view_all_text + '</option>';
                }

                for (a = 0; a < this.Locate.ln; a += 1) {
                    if (this.Locate.ShowOnMenu(a)) {
                        html += '<option value="' + (a + 1) + '">' + (this.Locate.o.locations[a].title || ('#' + (a + 1))) + '</option>';
                    }
                }
                html += '</select>';

                html = $(html).bind('change', function () {
                    self.Locate.ViewOnMap(this.value);
                });
            }

            title = this.Locate.o.controls_title;
            if (this.Locate.o.controls_title) {
                title = $('<div class="controls_title"></div>').css(this.Locate.o.apply_style ? {
                    fontWeight: 'bold',
                    fontSize: this.Locate.o.controls_on_map ? '12px' : 'inherit',
                    padding: '3px 10px 5px 0'
                } : {}).append(this.Locate.o.controls_title);
            }

            this.html_element = $('<div class="wrap_controls"></div>').append(title).append(html);

            return this.html_element;
        };


        return html_dropdown;

    })();



    html_ullist = (function() {

        function html_ullist(locate) {
            this.Locate = locate;
            this.html_element = null;
        }

        html_ullist.prototype.html_a = function (i, hash, title) {
            var self = this,
                index = hash || (i + 1),
                title = title || this.Locate.o.locations[i].title,
                el_a = $('<a data-load="' + index + '" id="ullist_a_' + index + '" href="#' + index + '" title="' + title + '"><span>' + (title || ('#' + (i + 1))) + '</span></a>');
            
            el_a.css(this.Locate.o.apply_style ? {
                color: '#666',
                display: 'block',
                padding: '5px',
                fontSize: this.Locate.o.controls_on_map ? '12px' : 'inherit',
                textDecoration: 'none'
            } : {});

            el_a.on('click', function (e) {
                e.preventDefault();
                var i = $(this).attr('data-load');
                self.Locate.ViewOnMap(i);
            });

            return el_a;
        };

        html_ullist.prototype.activateCurrent = function (index) {
            this.html_element.find('li').removeClass('active');
            this.html_element.find('#ullist_a_' + index).parent().addClass('active');
        };

        html_ullist.prototype.getHtml = function () {
            var html = $("<ul class='ullist controls " + this.Locate.o.controls_cssclass + "'></ul>").css(this.Locate.o.apply_style ? {
                margin: 0,
                padding: 0,
                listStyleType: 'none'
            } : {}),
            title,
            a = 0;

            if (this.Locate.ShowOnMenu(this.Locate.view_all_key)) {
                html.append($('<li></li>').append(this.html_a(false, this.Locate.view_all_key, this.Locate.o.view_all_text)));
            }

            for (a; a < this.Locate.ln; a++) {
                if (this.Locate.ShowOnMenu(a)) {
                    html.append($('<li></li>').append(this.html_a(a)));
                }
            }

            title = this.Locate.o.controls_title;
            if (this.Locate.o.controls_title) {
                title = $('<div class="controls_title"></div>').css(this.Locate.o.apply_style ? {
                    fontWeight: 'bold',
                    padding: '3px 10px 5px 0',
                    fontSize: this.Locate.o.controls_on_map ? '12px' : 'inherit'
                } : {}).append(this.Locate.o.controls_title);
            }

            this.html_element = $('<div class="wrap_controls"></div>').append(title).append(html);

            return this.html_element;
        };


        return html_ullist;

    })();



    Locate = (function() {

        /**
        * Create a new instance of Locate
        *
        * @class Locate
        * @return {Locate} Returns a new Locate
        * @type {Object}
        * @constructor  
        */
        function Locate(args) {
        	this.errors = [];
            this.initialized = false;
        	this.dev = true;
        	this.infowindow;
            this.ln = 0;
        	this.oMap = false;
            this.oBounds = null;
            this.map_div = null;
            this.canvas_map = null;
            this.gm_active = false;
            this.controls_wrapper;
            this.current_control;
            this.current_index;
            this.view_all_key = 'all';
            this.markers = [];
            this.Polyline = null;
            this.Polygon = null;
            this.directionsService = null;
            this.directionsDisplay = null;

        	this.o = {
                map_div: '#gmap',
        	    controls_div: '#controls',
        	    generate_controls: true,
        	    controls_type: 'dropdown',
                controls_cssclass: '',
                controls_title: '',
                controls_on_map: true,
                type: 'marker',
                view_all: true,
                view_all_text: 'View All',
                start: 0,
        	    locations: [],
                commons: {},
        	    map_options: {
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    zoom: 1
                },   
                stroke_options: {
                    strokeColor: '#0000FF',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#0000FF',
                    fillOpacity: 0.4
                },
                directions_options: {
                    travelMode: google.maps.TravelMode.DRIVING,
                    unitSystem: google.maps.UnitSystem.METRIC,
                    optimizeWaypoints: false,
                    provideRouteAlternatives: false,
                    avoidHighways: false,
                    avoidTolls: false
                },
                directions_panel: null,
                draggable: false,  
                show_infowindows: true,
                show_markers: true,
        	    infowindow_type: 'bubble',
                apply_style: true,
                beforeViewAll: function () {},
                afterViewAll: function () {},
                beforeShowCurrent: function (index, marker, content) {},
                afterShowCurrent: function (index, marker, content) {},
                afterCreateMarker: function (index, marker, content) {},
                beforeCloseInfowindow: function (index, marker, content) {},
                afterCloseInfowindow: function (index, marker, content) {},
                beforeOpenInfowindow: function (index, marker, content) {},
                afterOpenInfowindow: function (index, marker, content) {},
                afterRoute: function (distance, status, result) {},
                onPolylineClick: function (obj) {}
        	};

            this.AddControl('dropdown', html_dropdown);    
            this.AddControl('list', html_ullist);

            this._init(args, true);
        }

        Locate.prototype._init = function (args, construct) {
            $.extend(true, this.o, args);

            this.ln = this.o.locations.length;

            for (var i=0; i < this.ln; i++) {
                $.extend(this.o.locations[i], this.o.commons);
            }
        };

        Locate.prototype.controls = {};

        Locate.prototype.create_objMap = function () {
            var self = this;

            if (!this.gm_active) {
                this.gm_active = true;
                try {
                    this.map_div.css({
                        position: 'relative',
                        overflow: 'hidden'
                    });
                    
                    this.canvas_map = $('<div>').addClass('canvas_map').css({
                        width: this.map_div.width(),
                        height: this.map_div.height()
                    }).appendTo( this.map_div );

                    this.oMap = new google.maps.Map(this.canvas_map.get(0), this.o.map_options);
                } 
                catch(err) { this.errors.push(err.toString()); }
            }
            else {
                self.oMap.setOptions(this.o.map_options);
            }

            this.debug('Locate.create_objMap');
        };

        Locate.prototype.add_markers_to_objMap = function () {
            var a = 0, 
                type = this.o.type || 'marker';

            switch (type) {
                case 'marker':
                    for (a; a<this.ln; a++) {
                        this.create.marker.apply(this, [a]);
                    }
                    break;
                default:
                    this.create[type].apply(this);
                    break;
            }
        };

        Locate.prototype.create = {

            marker: function (index) { 
                var self = this,
                    point = this.o.locations[index],
                    html = point.html || '',
                    marker, 
                    a, 
                    point_infow,
                    latlng = new google.maps.LatLng(point.lat, point.lon),
                    orig_visible = point.visible===false ? false : true;

                $.extend(point, {
                    position: latlng,
                    map: this.oMap,
                    zIndex: 10000,
                    visible: (this.o.show_markers===false ? false : orig_visible)
                });

                if (point.image) {
                    image_w = point.image_w || 32;
                    image_h = point.image_h || 32;
                    $.extend(point, {
                        icon: new google.maps.MarkerImage(point.image, new google.maps.Size(image_w, image_h), new google.maps.Point(0, 0), new google.maps.Point(image_w/2, image_h/2))
                    });
                }

                marker = new google.maps.Marker( point );
                a = google.maps.event.addListener(marker, 'click', function () {

                    self.o.beforeShowCurrent(index, marker, html);

                    point_infow = point.show_infowindows===false ? false : true;
                    if (self.o.show_infowindows && point_infow) {
                        self.open_infowindow(index, marker, {content: html, type: point.type || self.o.infowindow_type, 'oMap': self.oMap});
                    }
                    self.oMap.panTo(latlng);
                    if (point.zoom) {
                        self.oMap.setZoom(point.zoom);
                    }

                    if (self.current_control && self.o.generate_controls) {
                        self.current_control.activateCurrent(index+1);
                    }
                    self.current_index = index;

                    self.o.afterShowCurrent(index, marker, html);
                });

                this.oBounds.extend(latlng);
                this.markers.push(marker);

                this.o.afterCreateMarker(index, marker, html);

                point.visible = orig_visible;

                return marker;
            },


            polyline: function () {
                var self = this,
                    a,
                    latlng,
                    path = [];

                for (a = 0; a < this.ln; a++) {
                    latlng = new google.maps.LatLng(this.o.locations[a].lat, this.o.locations[a].lon);
                    path.push(latlng);

                    this.create.marker.apply(this, [a]);
                }

                $.extend(this.o.stroke_options, {
                    path: path,
                    map: this.oMap
                });

                this.Polyline ? this.Polyline.setOptions(this.o.stroke_options) : this.Polyline = new google.maps.Polyline(this.o.stroke_options);
            },


            polygon: function () {
                var self = this,
                    a,
                    latlng,
                    path = [];

                for (a = 0; a < this.ln; a++) {
                    latlng = new google.maps.LatLng(this.o.locations[a].lat, this.o.locations[a].lon);
                    path.push(latlng);

                    this.create.marker.apply(this, [a]);
                }

                $.extend(this.o.stroke_options, {
                    paths: path,
                    editable: this.o.draggable,
                    map: this.oMap
                });

                this.Polygon ? this.Polygon.setOptions(this.o.stroke_options) : this.Polygon = new google.maps.Polygon(this.o.stroke_options);

                google.maps.event.addListener(this.Polygon, 'click', function (obj) {
                    self.o.onPolylineClick(obj);
                });   
            },


            directions: function () {
                var self = this,
                    a,
                    stopover,
                    latlng,
                    origin,
                    destination,
                    waypoints = [],
                    distance = 0;

                for (a = 0; a < this.ln; a++) {
                    latlng = new google.maps.LatLng(this.o.locations[a].lat, this.o.locations[a].lon);
                    if (a===0) {
                        origin = latlng;
                    }
                    else if (a===(this.ln-1)) {
                        destination = latlng;
                    }
                    else {
                        stopover = this.o.locations[a].stopover===true ? true : false;
                        waypoints.push({
                            location: latlng,
                            stopover: stopover
                        });
                    }
                    this.create.marker.apply(this, [a]);
                }

                $.extend(this.o.directions_options, {
                    origin: origin,
                    destination: destination,
                    waypoints: waypoints
                });

                this.directionsService || (this.directionsService = new google.maps.DirectionsService());
                this.directionsDisplay ? this.directionsDisplay.setOptions({ draggable: this.o.draggable }) : this.directionsDisplay = new google.maps.DirectionsRenderer({ draggable: this.o.draggable });

                this.directionsDisplay.setMap(this.oMap);

                if (this.o.directions_panel) {
                    this.o.directions_panel = $(this.o.directions_panel);
                    this.directionsDisplay.setPanel(this.o.directions_panel.get(0));
                }

                if (this.o.draggable) {
                    google.maps.event.addListener(this.directionsDisplay, 'directions_changed', function () {
                        distance = self.compute_distance(self.directionsDisplay.directions);
                        self.o.afterRoute(distance);
                    });
                }

                this.directionsService.route(this.o.directions_options, function (result, status) {
                    if (status == google.maps.DirectionsStatus.OK) {
                        distance = self.compute_distance(result);
                        self.directionsDisplay.setDirections(result);
                    }

                    self.o.afterRoute(distance, status, result);
                });
            }
        };

        Locate.prototype.compute_distance = function (result) {
            var total = 0,
                i,
                myroute = result.routes[0],
                rlen = myroute.legs.length;

            for (i = 0; i < rlen; i++) {
                total += myroute.legs[i].distance.value;
            }

            return total;
        };

        Locate.prototype.type_to_open = {
        	bubble: function (omap, args) {
        		omap.infowindow = new google.maps.InfoWindow(args);
        	}
        };

        Locate.prototype.open_infowindow = function (index, marker, args) {
            this.CloseInfoWindow();        
            if ( args.content ) {
                if (this.type_to_open[args.type || this.o.infowindow_type]) {

                    this.o.beforeOpenInfowindow(index, marker, args.content);

                    this.type_to_open[args.type || this.o.infowindow_type](this, args);
                    this.infowindow.open(this.oMap, marker);

                    this.o.afterOpenInfowindow(index, marker, args.content);
                }
            }
        };

        Locate.prototype.get_html_controls = function () {
            this.current_control = new this.controls[this.o.controls_type](this);
            if (this.controls[this.o.controls_type]) {
                return this.current_control.getHtml();
            }
            return '';
        };

        Locate.prototype.generate_controls = function () {
            if (!this.o.controls_on_map) {
                this.controls_wrapper.empty();
                this.controls_wrapper.append( this.get_html_controls() );
                return;
            }

            var cntr = $('<div class="on_gmap ' + this.o.controls_type + ' gmap_controls"></div>').css(this.o.apply_style ? {
                margin: '5px'
            } : {}),

            inner = $(this.get_html_controls()).css(this.o.apply_style ? {
                background: '#fff',
                padding: '5px',
                border: '1px solid rgb(113,123,135)',
                boxShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 4px',
                maxHeight: this.map_div.find('.canvas_map').outerHeight()-80,
                minWidth: 100,
                overflowY: 'auto',
                overflowX: 'hidden'
            } : {});

            cntr.append(inner);

            this.oMap.controls[google.maps.ControlPosition.RIGHT_TOP].push(cntr.get(0));
        };

        Locate.prototype.reset_map = function () {      
        	var self = this,
                i = 0;

            if (this.Polyline) {
                this.Polyline.setMap(null);
            }
            if (this.Polygon) {
                this.Polygon.setMap(null);
            }
            if (this.directionsDisplay) {
                this.directionsDisplay.setMap(null);
            }

            if (this.markers) {
                for (i in this.markers) {
                    if (this.markers[i]) {
                        try{ this.markers[i].setMap(null); } catch(err){ self.errors.push(err); }
                    }
                }
                this.markers.length = 0;
                this.markers = [];
            }

            if (this.o.controls_on_map && this.oMap.controls) {
                this.oMap.controls[google.maps.ControlPosition.RIGHT_TOP].forEach(function (element, index) {
                    self.oMap.controls[google.maps.ControlPosition.RIGHT_TOP].removeAt(index);
                });
            }

            this.oBounds = new google.maps.LatLngBounds();

            this.debug('Locate.reset_map');
        }; 

        Locate.prototype.perform_load = function () {
            if (this.ln == 1) {
                this.ViewOnMap(1); 
            }
            else if (this.ln === 0) {
                if (this.o.map_options.set_center) {
                    this.oMap.setCenter(new google.maps.LatLng(this.o.map_options.set_center[0], this.o.map_options.set_center[1]));
                } else {
                    this.oMap.fitBounds(this.oBounds);
                }
                this.oMap.setZoom(this.o.map_options.zoom);
            }
            else {
                this.oMap.fitBounds(this.oBounds);

                if (typeof(this.o.start-0) == 'number' && this.o.start > 0 && this.o.start <= this.ln) {
                    this.ViewOnMap(this.o.start); 
                } else {
                    this.ViewOnMap(this.view_all_key);
                }
            }
        };

        Locate.prototype.debug = function (msg) {
            if (this.dev && this.errors.length) {
                console.log(msg + ': ', this.errors);
            }
        };



        /////////////////////////////////////////////////////////////////////////


        Locate.prototype.AddControl = function (name, func) {
            if (!name) {
                return false;
            }

            func = func || function (){};
            this.controls[name] = func;
            return true;
        };

        Locate.prototype.CloseInfoWindow = function () {
            if (this.infowindow && (this.current_index || this.current_index===0)) {
                this.o.beforeCloseInfowindow(this.current_index);        
                this.infowindow.close();
                this.infowindow = null;
                this.o.afterCloseInfowindow(this.current_index); 
            }
        };

        Locate.prototype.ShowOnMenu = function (index) {
            if (index == this.view_all_key && this.o.view_all && this.ln > 1) {
                return true;
            }

            index = parseInt(index, 10);
            if (typeof(index-0) == 'number' && index >= 0 && index < this.ln) {
                var visible = this.o.locations[index].visible === false ? false : true;
                if (visible) {
                    return true;
                }
            }

            return false;
        };

        Locate.prototype.ViewOnMap = function (index) {
            if (index == this.view_all_key) {
                this.o.beforeViewAll();
                this.current_index = index;
                if (this.o.locations.length > 0 && this.o.generate_controls) {
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
                index = parseInt(index, 10);
                if (typeof(index-0) == 'number' && index > 0 && index <= this.ln) {
                    try {
                        google.maps.event.trigger(this.markers[index-1], 'click');
                    } 
                    catch(err) { this.errors.push(err.toString()); }
                }
            }
            this.debug('Locate.ViewOnMap');
        };

        Locate.prototype.SetLocations = function (locs, reload) {
            this.o.locations = locs;

            if (reload) {
                this.Load();
            }
        };

        Locate.prototype.AddLocations = function (locs, reload) {
            var self = this;

            if ($.isArray(locs)) {
                $.each(locs, function (index, value) {
                    self.o.locations.push( value );
                });
            }

            if ($.isPlainObject(locs)) {
                this.o.locations.push( locs );
            }

            if (reload) {
                this.Load();
            }
        };

        Locate.prototype.RemoveLocations = function (locs, reload) {
            var self = this, 
                k = 0;

            if ($.isArray(locs)) {
                $.each(locs, function (index, value) {
                    if ((value-k) < self.ln) {
                        self.o.locations.splice(value-k, 1);
                    }
                    k++;
                });
            } 
            else {
                if (locs < this.ln) {
                    this.o.locations.splice(locs, 1);
                }
            }

            if (reload) {
                this.Load();
            }
        };

        Locate.prototype.Load = function (opt) {
            this._init(opt);
            
            this.map_div = $(this.o.map_div);
            this.controls_wrapper = $(this.o.controls_div);

            this.reset_map();
            this.create_objMap();
            this.add_markers_to_objMap();
            
            if (this.ln > 1 && this.o.generate_controls) {
                this.generate_controls();
            }
            else {
                this.o.generate_controls = false;
            }

            var self = this;
            if (!this.initialized) {
                google.maps.event.addListenerOnce(this.oMap, 'idle', function () {
                    self.perform_load();
                });
            }
            else {
                this.perform_load();
            }

            google.maps.event.addListener(this.oMap, 'resize', function () {
                self.canvas_map.css({
                    width: self.map_div.width(),
                    height: self.map_div.height()
                });
            });

            this.initialized = true;
        };


        return Locate;

    })();


    if (typeof define == 'function' && define.amd) {
        define(function() { return Locate; });
    }
    else {
        window.Locate = Locate;
    }

})(jQuery, this, google);

