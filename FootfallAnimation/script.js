jQuery(document).ready(main)

var access_api_token;
var mymap = L.map('mapid').setView([1.320270, 103.851959], 11);
var assetLayerGroup;
var area_code_mapping;
var info = L.control();
var myChart = L.control({
    position: 'bottomleft'
});

// Default style
var myStyle = {
    "color": "#FFFBE5",
    "weight": 1,
    "opacity": 0.1
};

// div to show hourly footfall
info.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
};

// update method for updating hourly footfall
info.update = function(time_bucket, ff_map) {
    if (time_bucket) {
        var dt = new Date(time_bucket);
    }
    if (ff_map) {
        var table = "<table id='results'><tr><th>Area Code</th><th>Footfall</th></tr>";
        footfall_array = [];
        var i = 0;
        for (var key in ff_map) {
            if (ff_map.hasOwnProperty(key)) {
                //table = table + "<tr class='results'><td class='results'>" + area_code_mapping[key] + "</td><td>" + ff_map[key] + "</td></tr>";
                footfall_array[i] = key + "-" + ff_map[key];
                i++;
            }
        }
        footfall_array.sort(function(a, b) {
            var a_val = a.split("-");
            var b_val = b.split("-");
            return b_val[1] - a_val[1]
        });

        for (j = 0; j < footfall_array.length; j++) {
            var arr = footfall_array[j].split("-")
            var area = area_code_mapping[arr[0]]
            if (area == null) {
                area = arr[0]
            }
            table = table + "<tr class='results'><td class='results'>" + area + "</td><td>" + arr[1] + "</td></tr>";
            if (j == 15) break;
        }

        table = table + "</table>";
        this._div.innerHTML = '<h3>SG Hourly Footfall</h3><hr><p> Showing Top 15 areas</p><h2>' + dt.toTimeString().substring(0, 8) + '</h2><p>' + table + '</p>';
    } else {
        this._div.innerHTML = '<h3>SG Hourly Footfall</h3><hr><p> Select Filters and click on Submit</p>';
    }
};

// div to show Hourly Chart
myChart.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'myChart');
    this.update();
    return this._div;
};

// div to update Hourly Chart
myChart.update = function(current_id, footfall_map) {
    this._div.innerHTML = '';
    if (footfall_map) {
        var data = [];
        counter = 0;
        for (var key in footfall_map) {
            if (footfall_map.hasOwnProperty(key)) {
                record = {};
                record["time"] = counter;
                record["value"] = footfall_map[key][current_id];
                data.push(record);
                counter = counter + 1;
            }
        }
        var margin = {
            top: 40,
            right: 20,
            bottom: 30,
            left: 50
        };
        var width = 300;
        var height = 200;
        var x = d3.scaleBand().range([0, width]).padding(0.1);
        var y = d3.scaleLinear().range([height, 0]);

        var svg = d3.select(".myChart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        x.domain(data.map(function(d) {
            return d.time;
        }));
        y.domain([0, d3.max(data, function(d) {
            return d.value;
        })]);

        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) {
                return x(d.time);
            })
            .attr("width", x.bandwidth())
            .attr("y", function(d) {
                return y(d.value);
            })
            .attr("height", function(d) {
                return height - y(d.value);
            })
            .attr("fill", "grey");

        // add the x Axis
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // add the y Axis
        svg.append("g")
            .call(d3.axisLeft(y));

        svg.append("text")
            .attr("x", (width / 2))
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("text-decoration", "underline")
            .text(current_id + " : Footfall Vs Hour of the day");
    }
};


// function called on submit button action
function myFunction() {
    // Read the form
    var date_selected_obj = $("#datepicker").datepicker("getDate");
    date_selected = $.datepicker.formatDate('yy-mm-dd', date_selected_obj);

    var roi_level_e = document.getElementById("mandatory_roi_level");
    var roi_level = roi_level_e.options[roi_level_e.selectedIndex].value;
    var gender_e = document.getElementById("gender");
    var gender = gender_e.options[gender_e.selectedIndex].value;
    var agent_race_e = document.getElementById("agent_race");
    var agent_race = agent_race_e.options[agent_race_e.selectedIndex].value;
    var agent_age_group_e = document.getElementById("agent_age_group");
    var agent_age_group = agent_age_group_e.options[agent_age_group_e.selectedIndex].value;
    var roi_group_e = document.getElementById("roi_group_by");
    var roi_group = roi_group_e.options[roi_group_e.selectedIndex].value;

    var elements = document.getElementById("myForm").elements;
    var other_filters = {};
    for (var i = 0; i < elements.length; i++) {
        var item = elements.item(i);
        other_filters[item.name] = item.value;
    }
    var roi_value = $('#roi_vals').val();
    var agent_nationality = other_filters['agent_nationality'];

    console.log("Date: " + date_selected);
    console.log("roi_level: " + roi_level);
    console.log("roi_value: " + roi_value);
    console.log("gender: " + gender);
    console.log("agent_nationality: " + agent_nationality);
    console.log("agent_race: " + agent_race);
    console.log("agent_age_group: " + agent_age_group);
    console.log("roi_group: " + roi_group);
    if (roi_value == "") {
        alert("ROI Value is a mandatory field");
        return false;
    }

    // Create the JSON Request
    var request_data = {}
    request_data["date"] = date_selected;
    location_data = {};
    location_data["locationType"] = "locationHierarchyLevel";
    location_data["levelType"] = roi_level;
    location_data["id"] = roi_value;
    request_data["location"] = location_data;
    queryGranularity = {};
    queryGranularity["type"] = "period";
    queryGranularity["period"] = "PT1H";
    request_data["queryGranularity"] = queryGranularity;
    if (roi_group != "") {
        dimensionFacets = [];
        dimensionFacets[0] = roi_group;
        request_data["dimensionFacets"] = dimensionFacets;
    }
    var num_filters = 0
    all_filters = [];

    if (gender != "") {
        filter = {};
        filter["type"] = "selector";
        filter["dimension"] = "agent_gender";
        filter["value"] = gender;
        //request_data["filter"] = filter;
        all_filters[num_filters] = filter;
        num_filters++;
    }
    if (agent_race != "") {
        filter = {};
        filter["type"] = "selector";
        filter["dimension"] = "agent_race";
        filter["value"] = agent_race;
        all_filters[num_filters] = filter;
        num_filters++;
    }
    if (agent_nationality != "") {
        filter = {};
        filter["type"] = "selector";
        filter["dimension"] = "agent_nationality";
        filter["value"] = agent_nationality;
        all_filters[num_filters] = filter;
        num_filters++;
    }
    if (agent_age_group != "") {
        filter = {};
        var cur_year = (new Date()).getFullYear();
        var age_group = agent_age_group.split("_")
        var upper_bound = cur_year - parseInt(age_group[0]);
        var lower_bound = ""
        if (age_group[1] != "plus") {
            lower_bound = cur_year - parseInt(age_group[1]);
        }
        filter["type"] = "bound";
        filter["dimension"] = "agent_year_of_birth";
        if (lower_bound != "") {
            filter["lower"] = lower_bound;
        }
        filter["upper"] = upper_bound;
        filter["ordering"] = "alphanumeric"
        all_filters[num_filters] = filter;
        num_filters++;
    }

    if (all_filters.length == 1) {
        request_data["filter"] = all_filters[0];
    } else if (all_filters.length > 1) {
        filter = {};
        filter["type"] = "and";
        filter["fields"] = all_filters;
        request_data["filter"] = all_filters[0];
        request_data["filter"] = filter;
    }

    aggregations = [];
    metric_unique = {};
    metric_unique["metric"] = "unique_agents";
    metric_unique["type"] = "hyperUnique";
    metric_unique["describedAs"] = "footfall";
    aggregations[0] = metric_unique;
    request_data["aggregations"] = aggregations;

    console.log("Request_data: " + JSON.stringify(request_data));

    $.getJSON('../conf/area_code_mapping.json', function(data) {
        area_code_mapping = data;
    });

    render(request_data, roi_group, roi_level);
}

// main method to render main components
function main() {

    $(function() {
        $("#datepicker").datepicker();
    });

    // Read proprty file footfall_dashboard.properties
    d3.json("../conf/footfall_dashboard.properties", function(data) {
        var auth_string = data.consumer_key + ":" + data.consumer_secret;
        var auth_string_encoded = btoa(auth_string);
        var token_end_point = data.token_end_point;
        var username = data.username;
        var password = data.password;
        var data_auth = "grant_type=password&username=" + username + "&password=" + password;

        // Obtain the access token
        d3.request(token_end_point)
            .header("Authorization", "Basic " + auth_string_encoded)
            .header("Content-Type", "application/x-www-form-urlencoded")
            .post(data_auth, function(data) {
                var resp = JSON.parse(data.response);
                access_api_token = resp.access_token;
                console.log("Got token" + access_api_token);
            });



    });

    // add google map to mymap
    L.tileLayer('https://mts0.google.com/vt/lyrs=m@289000001&hl=en&src=app&x={x}&y={y}&z={z}&s=Gal&apistyle=s.t%3A3|s.e%3Al|p.v%3Aoff', {
        attribution: 'Map data: Google',
        maxZoom: 15
    }).addTo(mymap);

    assetLayerGroup = L.layerGroup().addTo(mymap);
    info.addTo(mymap);
    myChart.addTo(mymap);
}

// Function to get geo Json URL based on roi group and level
function getGeoJsonURL(roi_group, roi_level) {
    var roi = roi_group;
    if (roi_group == "") {
        roi = roi_level;
    }
    part = roi.substring(15, roi.length);
    return "../conf/" + part + ".geojson";
}

// Function to get ROI name in geo JSON based on roi group and level
function getROINameInGeoJSON(roi_group, roi_level) {
    var roi = roi_group;
    if (roi_group == "") {
        roi = roi_level;
    }
    switch (roi) {
        case 'discrete_visit_planningregion':
            return "REGION_N";
        case 'discrete_visit_planningarea':
            return "PLN_AREA_N";
        case 'discrete_visit_subzone':
            return "SUBZONE_N";
    }
}

// Function to get ROI ID in geo JSON based on roi group and level
function getROIIdInGeoJSON(roi_group, roi_level) {
    var roi = roi_group;
    if (roi_group == "") {
        roi = roi_level;
    }
    switch (roi) {
        case 'discrete_visit_planningregion':
            return "REGION_C";
        case 'discrete_visit_planningarea':
            return "PLN_AREA_C";
        case 'discrete_visit_subzone':
            return "SUBZONE_C";
    }
}

// Custom style based on footfall count (min count = green , max count = red)
function customStyle(feature, roi_id, ff_map, minCount, maxCount) {

    var color_pallete = d3.scaleLinear().range(["green", "red"]).domain([minCount, maxCount]);
    if (ff_map[feature.properties[roi_id]]) {
        return {
            color: color_pallete(ff_map[feature.properties[roi_id]]),
            "weight": 2,
            "opacity": 0.8,
            fillOpacity: 0.5
        }
    } else {
        return myStyle;
    }
}

// updates feature Style based on footfall count
function updateFeaturesStyle(geojson, minCount, maxCount, roi_id, ff_map, time_bucket) {
    info.update(time_bucket, ff_map);
    geojson.eachLayer(function(l) {
        geojson.resetStyle(l);
    });

    geojson.eachLayer(function(l) {
        var style_f = customStyle(l.feature, roi_id, ff_map, minCount, maxCount);
        l.setStyle(style_f);
    });

}

// function to render map , geojson and style geojson based on API response
function render(request_data, roi_group, roi_level) {
    // Clear old layers
    assetLayerGroup.clearLayers();
    var geoJsonUrl = getGeoJsonURL(roi_group, roi_level);
    var roi_id = getROIIdInGeoJSON(roi_group, roi_level);
    var roi_name = getROINameInGeoJSON(roi_group, roi_level);

    // Making API post request
    d3.request("https://apistore.datasparkanalytics.com:8243/discretevisit/v2/query")
        .header("Authorization", "Bearer " + access_api_token)
        .header("Content-Type", "application/json")
        .post(JSON.stringify(request_data), function(data) {
            var resp = JSON.parse(data.response);
            // Create a look up map to store footfall
            footfall_map = [];
            var current_id;
            time_bucket_array = [];
            maxCount = 0;
            minCount = 90000000;
            for (var i = 0; i < resp.length; i++) {
                var time_bucket = resp[i].timestamp;
                var key = resp[i].event[roi_group];
                var footfall = resp[i].event.footfall;
                if (maxCount < footfall) maxCount = footfall;
                if (minCount > footfall) minCount = footfall;
                if (!footfall_map[time_bucket]) {
                    footfall_map[time_bucket] = {};
                    time_bucket_array.push(time_bucket);
                }
                footfall_map[time_bucket][key] = footfall;
            }
            if(resp.length==0){
                alert("No data for the Date or Filters selected!")
            }

            cur_feature = "";
            // Handle click on each feature
            function onEachFeature(feature, layer) {
                firstHourMap = footfall_map[time_bucket_array[0]];

                if (feature.properties && firstHourMap[feature.properties[roi_id]]) {
                    //myChart.update(footfall_map);
                    cur_feature = feature.properties[roi_id];
                    layer.bindPopup(feature.properties[roi_name] + " ( " + feature.properties[roi_id] + " ) : " + "<a onClick='myChart.update(\"" + feature.properties[roi_id] + "\",footfall_map); return false;'>View Chart</a>");
                } else {
                    layer.bindPopup(feature.properties[roi_name] + " ( " + feature.properties[roi_id] + " ) ");
                }
            }

            // Add the geoJSON layer to map
            d3.json(geoJsonUrl, function(collection) {
                geojson = L.geoJSON(collection, {
                    style: function(feature) {
                        return myStyle;
                    },
                    onEachFeature: onEachFeature
                }).addTo(assetLayerGroup);
            })

            // Animate the footfall for each hour by calling updateFeaturesStyle every 0.5 seconds
            var callCount = 0;
            var repeater = setInterval(function() {
                if (callCount < 24) {
                    ff_map = footfall_map[time_bucket_array[callCount]]
                    updateFeaturesStyle(geojson, minCount, maxCount, roi_id, ff_map, time_bucket_array[callCount])
                    callCount += 1;
                } else {
                    clearInterval(repeater);
                }
            }, 500);
        });
}