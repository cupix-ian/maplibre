import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const map = new maplibregl.Map({
  container: "map",
  style:
    "https://api.maptiler.com/maps/streets/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL", // style URL
  center: [-77.132, 37.413],
  zoom: 7
});

const origin = map.getCenter().toArray();

// Washington DC
const destination = [-77.032, 38.913];

// A simple line from origin to destination.
const route = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [origin],
      },
    },
  ],
};

const fullRoute = {
  type: "Feature",
  geometry: {
      type: "LineString",
      coordinates: [origin, destination]
  }
};

const lineDistance = turf.lineDistance(fullRoute, "kilometers");

const steps = 100;

const incrementDistance = lineDistance / steps;

let counter = 0;

map.on("load", () => {
  map.addSource("route", {
    type: "geojson",
    data: route,
  });

  map.addLayer({
    id: "route",
    source: "route",
    type: "line",
    paint: {
      "line-width": 2,
      "line-color": "black",
    },
  });

  function animate() {

    const currentSegment = turf.along(fullRoute, incrementDistance * counter,  "kilometers");
    route.features[0].geometry.coordinates.push(currentSegment.geometry.coordinates);

    map.getSource("route").setData(route);

    if (counter < steps) {
      requestAnimationFrame(animate);
    }

    ++counter;
  }

  document.getElementById("replay").addEventListener("click", () => {
    route.features[0].geometry.coordinates = [origin];
    map.getSource("route").setData(route);
    counter = 0;
    animate();
  });

  animate();
});
