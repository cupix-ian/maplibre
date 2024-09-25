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

const arrow = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: origin,
      },
    },
  ],
};

map.on("load", () => {
  map.addSource("route", {
    type: "geojson",
    data: route,
  });

  map.addSource("arrow", {
    type: "geojson",
    data: arrow,
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

  // 화살표 아이콘을 추가하는 symbol 레이어
  map.addLayer({
    id: "arrow",
    source: "arrow",
    type: "symbol",
    layout: {
      "icon-image": "airport_15",
      "icon-size": 1.2,
      "icon-rotate": ["get", "bearing"],
      "icon-rotation-alignment": "map",
      "icon-anchor": "center",
    }
  });

  function animate() {
    const currentSegment = turf.along(fullRoute, incrementDistance * counter,  "kilometers");
    route.features[0].geometry.coordinates.push(currentSegment.geometry.coordinates);

    // 현재 라인의 마지막 점을 화살표의 위치로 설정
    arrow.features[0].geometry.coordinates = currentSegment.geometry.coordinates;

    // 화살표가 향하는 방향을 계산
    if (counter > 0) {
      const previousSegment = turf.along(fullRoute, incrementDistance * (counter - 1), "kilometers");
      const bearing = turf.bearing(previousSegment, currentSegment);
      arrow.features[0].properties = { bearing: bearing };
    }

    map.getSource("route").setData(route);
    map.getSource("arrow").setData(arrow);

    if (counter < steps) {
      requestAnimationFrame(animate);
    }

    ++counter;
  }

  document.getElementById("replay").addEventListener("click", () => {
    route.features[0].geometry.coordinates = [origin];
    arrow.features[0].geometry.coordinates = origin;
    map.getSource("route").setData(route);
    map.getSource("arrow").setData(arrow);
    counter = 0;
    animate();
  });

  animate();
});