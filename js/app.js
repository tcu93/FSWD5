// Set Foursquare URL for API call
var fsUrl = 'https://api.foursquare.com/v2/venues/';
var fsClient = '/?&client_id=OGD4VA1G305RFASOTOMTAK2COWF4YXX3VVLQWCNBL1A1OGNK';
var fsSecret = '&client_secret=1L3BR4DUPGNLATFWIKWANNP0T3JZQC1KXC5PCFZQY2LDAIXD';
var fsVersion = '&v=20180101';

// Google variables
var map;
var bounds;
var infowindow;

// Callback from Google API
function initMap() {
    // Create map
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 32.8132,
            lng: -96.7934
        },
        mapTypeControl: true,
        zoom: 12
    });

    // Map InfoWindow
    infowindow = new google.maps.InfoWindow({
        maxWidth: 150,
        content: ""
    });

    // Bounds of Map
    bounds = new google.maps.LatLngBounds();

    // Reset Map when clicked
    map.addListener('click', function () {
        infowindow.close(infowindow);
        map.setCenter({
            lat: 32.8132,
            lng: -96.7934
        });
        map.setZoom(14);
    });

    // Resize Map
    window.onresize = function () {
        map.fitBounds(bounds);
    };

    /********** VIEW **********/

    var View = function (venue) {
        var self = this;
        this.name = ko.observable(venue.name);
        this.location = venue.location;
        this.marker = "";
        this.id = venue.id;
        this.shortUrl = "";
        this.photoUrl = "";
    };

    // Foursquare data to pass to Map InfoWindow
    function getContent(view) {
        var contentString = "<h3>" + view.name +
            "</h3><br><div style='width:150px;min-height:120px'><img src=" + '"' +
            view.photoUrl + '"></div><div><a href="' + view.shortUrl +
            '" target="_blank">More info at Foursquare</a>';
        let errorString = "Foursquare content unavailable.";
        if (view.name.length > 0) {
            return contentString;
        } else {
            return errorString;
        }
    }

    // Animate location markers (bounce effect)
    function toggleBounce(marker) {
        if (marker.getAnimation() !== null) {
            marker.setAnimation(null);
        } else {
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function () {
                marker.setAnimation(null);
            }, 700);
        }
    }

    /********** VIEW MODEL **********/

    function ViewModel() {
        var self = this;
        // Navigation Bar
        this.isNavOpen = ko.observable(true);
        this.navClick = function () {
            self.isNavOpen(!self.isNavOpen());
        };

        // Trigger a marker when it's clicked
        this.itemClicked = function (view) {
            google.maps.event.trigger(view.marker, "click");
        };

        // Observable to hold list of venues
        this.viewList = ko.observableArray([]);

      // Add each venue (venues.js) to list (array) of View objects
        Venues.forEach(function (item) {
            self.viewList().push(new View(item));
        });

        // Add a marker for each venue in list of View objects
        self.viewList().forEach(function (view) {
            var marker = new google.maps.Marker({
                map: map,
                position: view.location,
                animation: google.maps.Animation.DROP
            });
            view.marker = marker;
            bounds.extend(marker.position);
            // when a marker is clicked, pan to it, populate & open its IW & bounce its marker
            marker.addListener("click", function (e) {
                map.panTo(this.position);
                infowindow.setContent(getContent(view));
                infowindow.open(map, marker);
                toggleBounce(marker);
            });
        });

        // AJAX call to retrieve Foursquare Info
        this.getFSInfo = ko.computed(function () {
            self.viewList().forEach(function (view) {
                var VenueId = view.id;
                var FourSqUrl = fsUrl + VenueId + fsClient + fsSecret + fsVersion;
                $.ajax({
                    type: "GET",
                    url: FourSqUrl,
                    dataType: "json"
                }).done(function (data) {
                        let response = data.response ? data.response : "";
                        let venue = response.venue ? data.venue : "";
                        view.name = response.venue.name;
                        view.shortUrl = response.venue.shortUrl;
                        view.photoUrl = response.venue.bestPhoto.prefix + "120x120" +
                            response.venue.bestPhoto.suffix;
                }).fail(function () {
                        alert("An error occurred while trying to fetch data from Foursquare");
                });
            });
        });

        // Observable to hold text input for search
        self.filter = ko.observable("");

        // Allow user to filter locations - if location exists, show its marker only
        this.filteredViewList = ko.computed(function () {
            var search = this.filter().toLowerCase();
            if (!search) {
                // if search is empty, return all markers
                return ko.utils.arrayFilter(self.viewList(), function (item) {
                    item.marker.setVisible(true);
                    return true;
                });
            } else {
                // if location exists in list, display its marker only
                return ko.utils.arrayFilter(this.viewList(), function (item) {
                    if (item.name.toLowerCase().indexOf(search) >= 0) {
                        item.marker.setVisible(true);
                        return true;
                    } else {
                        item.marker.setVisible(false);
                        return false;
                    }
                });
            }
        }, this);
    }
    ko.applyBindings(new ViewModel());
}

// Map error handling
function ErrorOccurred() {
    document.getElementById('MapError').style.display = 'block';
}
