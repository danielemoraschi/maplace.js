
var P1 = [
    {
        lat: 45.468945,
        lon: 45.73684365,
        title: 'Title',
        html: 'Content',
        zoom: 10,
        animation: google.maps.Animation.DROP
    }
];

var LocsA = [
    {
        lat: 45.9,
        lon: 10.9,
        title: 'Title A1',
        html: '<h3>Content A1</h3>',
        icon: 'http://www.google.com/mapfiles/markerA.png'
    },
    {
        lat: 44.8,
        lon: 1.7,
        title: 'Title B1',
        html: '<h3>Content B1</h3>',
        icon: 'http://www.google.com/mapfiles/markerB.png',
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
        icon: 'http://www.google.com/mapfiles/markerC.png'
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


var LocsAB = LocsA.concat(LocsB);


var LocsC = [
    {
        lat: 45.4654,
        lon: 9.1866,
        title: 'Milan, Italy'
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



