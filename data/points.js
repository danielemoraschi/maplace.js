
var LocsA = [
    {
        lat: 45.9,
        lon: 10.9,
        title: 'Title A1',
        html: '<h3>Content A1</h3>',
        icon: 'http://maps.google.com/mapfiles/markerA.png',
        animation: google.maps.Animation.DROP
    },
    {
        lat: 44.8,
        lon: 1.7,
        title: 'Title B1',
        html: '<h3>Content B1</h3>',
        icon: 'http://maps.google.com/mapfiles/markerB.png',
        show_infowindow: false
    },
    {
        lat: 51.5,
        lon: -1.1,
        title: 'Title C1',
        html: [
            '<h3>Content C1</h3>',
            '<p>Lorem Ipsum..</p>'
        ].join(''),
        zoom: 8,
        icon: 'http://maps.google.com/mapfiles/markerC.png'
    }
];

var LocsAv2 = [
    {
        lat: 45.9,
        lon: 10.9,
        title: 'Zone A1',
        html: '<h3>Content A1</h3>',
        type : 'circle',
        circle_options: {
            radius: 200000
        },
        draggable: true
    },
    {
        lat: 44.8,
        lon: 1.7,
        title: 'Draggable',
        html: '<h3>Content B1</h3>',
        show_infowindow: false,
        visible: true,
        draggable: true
    },
    {
        lat: 51.5,
        lon: -1.1,
        title: 'Title C1',
        html: [
            '<h3>Content C1</h3>',
            '<p>Lorem Ipsum..</p>'
        ].join(''),
        zoom: 8,
        visible: true
    }
];


var LocsB = [
    {
        lat: 52.1,
        lon: 11.3,
        title: 'Title A2',
        html: [
            '<h3>Content A2</h3>',
            '<p>Lorem Ipsum..</p>'
        ].join(''),
        zoom: 8
    },
    {
        lat: 51.2,
        lon: 22.2,
        title: 'Title B2',
        html: [
            '<h3>Content B2</h3>',
            '<p>Lorem Ipsum..</p>'
        ].join(''),
        zoom: 8
    },
    {
        lat: 49.4,
        lon: 35.9,
        title: 'Title C2',
        html: [
            '<h3>Content C2</h3>',
            '<p>Lorem Ipsum..</p>'
        ].join(''),
        zoom: 4
    },
    {
        lat: 47.8,
        lon: 15.6,
        title: 'Title D2',
        html: [
            '<h3>Content D2</h3>',
            '<p>Lorem Ipsum..</p>'
        ].join(''),
        zoom: 6
    }
];


var LocsBv2 = [
    {
        lat: 52.1,
        lon: 11.3,
        title: 'Title A2',
        html: [
            '<h3>Content A2</h3>',
            '<p>Lorem Ipsum..</p>'
        ].join(''),
        zoom: 8
    },
    {
        lat: 51.2,
        lon: 22.2,
        title: 'Title B2',
        html: [
            '<h3>Content B2</h3>',
            '<p>Lorem Ipsum..</p>'
        ].join(''),
        zoom: 8,
        type : 'circle',
        circle_options: {
            radius: 100000
        }
    },
    {
        lat: 49.4,
        lon: 35.9,
        title: 'Title C2',
        html: [
            '<h3>Content C2</h3>',
            '<p>Lorem Ipsum..</p>'
        ].join(''),
        zoom: 4
    },
    {
        lat: 47.8,
        lon: 15.6,
        title: 'Title D2',
        html: [
            '<h3>Content D2</h3>',
            '<p>Lorem Ipsum..</p>'
        ].join(''),
        zoom: 6
    }
];


var LocsAB = LocsA.concat(LocsB);


var LocsC = [
    {
        lat: 45.4654,
        lon: 9.1866,
        title: 'Milan, Italy',
        type : 'circle',
        circle_options: {
            radius: 1000
        },
        visible: false
    },
    {
        lat: 47.36854,
        lon: 8.53910,
        title: 'Zurich, Switzerland'
    },
    {
        lat: 48.892,
        lon: 2.359,
        title: 'Paris, France'
    },
    {
        lat: 48.13654,
        lon: 11.57706,
        title: 'Munich, Germany'
    }
];

var LocsD = [
    {
        lat: 45.4654,
        lon: 9.1866,
        title: 'Milan, Italy',
        html: '<h3>Milan, Italy</h3>'
    },
    {
        lat: 47.36854,
        lon: 8.53910,
        title: 'Zurich, Switzerland',
        html: '<h3>Zurich, Switzerland</h3>',
        visible: false
    },
    {
        lat: 48.892,
        lon: 2.359,
        title: 'Paris, France',
        html: '<h3>Paris, France</h3>',
        stopover: true
    },
    {
        lat: 48.13654,
        lon: 11.57706,
        title: 'Munich, Germany',
        html: '<h3>Munich, Germany</h3>'
    }
];

var Circles = [
    {
        lat: 51.51386,
        lon: -0.09559,
        title: 'Draggable marker',
        circle_options: {
            radius: 160
        },
        stroke_options: {
            strokeColor: '#aaaa00',
            fillColor: '#eeee00'
        },
        draggable: true
    },
    {
        lat: 51.51420,
        lon: -0.09303,
        title: 'Draggable circle',
        circle_options: {
            radius: 50
        },
        stroke_options: {
            strokeColor: '#aa0000',
            fillColor: '#ee0000'
        },
        visible: false,
        draggable: true
    },
    {
        lat: 51.51498,
        lon: -0.09097,
        circle_options: {
            radius: 80
        },
        visible: false,
        draggable: true
    },
    {
        lat: 51.51328,
        lon: -0.09021,
        circle_options: {
            radius: 160,
            editable: true
        },
        title: 'Editable circle',
        html: 'Change my size',
        visible: false,
        draggable: true
    },
    {
        lat: 51.51211,
        lon: -0.09050,
        circle_options: {
            radius: 130
        },
        stroke_options: {
            strokeColor: '#00aa00',
            fillColor: '#00aa00'
        },
        visible: false
    },
    {
        lat: 51.51226,
        lon: -0.09435,
        circle_options: {
            radius: 100
        },
        draggable: true
    },
    {
        lat: 51.513,
        lon: -0.08410,
        type: 'marker',
        title: 'Simple marker',
        html: 'I\'m a simple marker.'
    }
];
