import {AfterViewInit,Component,ElementRef,OnDestroy,ViewChild,Injectable,} from "@angular/core";
import * as mapboxgl from "mapbox-gl";
import { ActivatedRoute } from "@angular/router";
import { DataSharingService } from "../../../services/data_sharing.service";
import { Router } from "@angular/router";
import { environment } from "../../../environments/environment";
import { HttpClient } from '@angular/common/http';

interface MarkerAndColor {
  color: string;
  marker: mapboxgl.Marker;
}

(mapboxgl as any).accessToken =environment.accessTokenMap;
@Component({
  selector: "app-devices-map",
  templateUrl: "./devices-map.component.html",
  styleUrls: ["../../../app.component.css"],
})

@Injectable({
  providedIn: "root",
})

export class DevicesMapComponent implements AfterViewInit, OnDestroy {

  rute = "";
  ruteAux: any;
  sharedLat: any = 38.3855908932305;
  sharedLon: any = -0.5098796883778505;
  sharedCota: any = 10;
  idDevice: string = environment.baseUrl+environment.deviceConfigurations+"/id";

  currentLngLat: mapboxgl.LngLat = new mapboxgl.LngLat(
    this.sharedLon,
    this.sharedLat
  );

  constructor(private http: HttpClient,private rutaActiva: ActivatedRoute,public rute1: Router,private dataSharingService: DataSharingService) {
    this.rute = this.rute1.routerState.snapshot.url;
    this.ruteAux = this.rute.split("/");
  }

  maxDevice: string = environment.baseUrl+environment.deviceConfigurations+"/max";

  @ViewChild("map") divMap?: ElementRef;
  map?: mapboxgl.Map;
  zoom: number = 10;
  markers: MarkerAndColor[] = [];
  colorMap = environment.defaultMapsStyle;

  id = parseInt(this.rutaActiva.snapshot.params["id"]);
  idMax = 1;
  state = -1; 

  ngOnInit(): void { // Inicialización
    this.http.get(this.maxDevice).subscribe(
      (data: any) => {
        this.idMax = parseInt(data.id) - 1;
        if (this.id <= this.idMax) {
          this.state = 1;
        } else {
          this.state = 0;
        }
        this.ngAfterViewInit();
      },
      (error:any) => {
        console.error(error);
      }
    );

      this.readStorage();
      this.rute = this.rute1.routerState.snapshot.url;
      this.ruteAux = this.rute.split("/");
  }

  /* AUX INIT */

  ngAfterViewInit(): void { // Se ejecuta despues de ngOnInit
      if (this.ruteAux[2] == "new" && this.state == 0) {
        if (!this.divMap) throw "No hay mapa";
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              this.map = this.createMap([
                position.coords.longitude,
                position.coords.latitude,
              ]);
              this.auxInit();
            },
            (error) => {
              this.map = this.createMap([
                -3.7036360462944913, 40.41686882952129,
              ]);
              console.log("Error geo", error);
              this.auxInit();
            }
          );
        } 
        else {
          console.log('hola')
          this.map = this.createMap([-3.7036360462944913, 40.41686882952129]);
          console.log("Geo no compatible");
          this.auxInit();
        }
      }
      //
      if (this.ruteAux[2] == "edit" ||(this.ruteAux[2] == "new" && this.state == 1)) {
        this.http.get(`${this.idDevice}/${this.ruteAux[3]}`).subscribe(
          (data: any) => {
            this.sharedLon = data[0].lon;
            this.sharedLat = data[0].lat;
            this.currentLngLat = new mapboxgl.LngLat(this.sharedLon, this.sharedLat);
            this.map = this.createMap(this.currentLngLat);
            this.deleteMarker();
            this.createMarker(this.currentLngLat);
            this.auxInit();
          },
          (error) => {
            console.error(error);
          }
        );
      }
  }

  auxInit() { // Auxiliar de ngOnInit
    if (this.map != undefined) {
      this.map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
          showUserHeading: true,
        })
      );
      this.map.addControl(new mapboxgl.NavigationControl());

      this.map.on("click", (e) => {
        this.deleteMarker();
        this.createMarker(e.lngLat.wrap());
        this.updateSharedAct();
      });

      let layerList = document.getElementById("menu");
      if (layerList != null) {
        let inputs = layerList.getElementsByTagName("input");
        if (inputs != null) {
          const inputArray = Array.from(inputs);

          for (const input of inputArray) {
            input.onclick = (layer: any) => {
              if (this.map != null) {
                this.map.setStyle("mapbox://styles/mapbox/" + this.colorMap);
              }
            };
          }
        }
      }
    }

    if (this.map != undefined) {
      this.map.on("style.load", () => {
        if (this.map != undefined) {
          let layers;
          if (this.map != null) {
            layers = this.map.getStyle().layers;
          }
          let labelLayerId;
          if (layers !== undefined) {
            const labelLayer = layers.find(
              (layer) =>
                layer.type == "symbol" &&
                layer.layout &&
                layer.layout["text-field"]
            );
            if (labelLayer) {
              labelLayerId = labelLayer.id;
            }
            if (this.map != undefined) {
              this.map.addLayer(
                {
                  id: "add-3d-buildings",
                  source: "composite",
                  "source-layer": "building",
                  filter: ["==", "extrude", "true"],
                  type: "fill-extrusion",
                  minzoom: 15,
                  paint: {
                    "fill-extrusion-color": "#aaa",
                    "fill-extrusion-height": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      15,
                      0,
                      15.05,
                      ["get", "height"],
                    ],
                    "fill-extrusion-base": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      15,
                      0,
                      15.05,
                      ["get", "min_height"],
                    ],
                    "fill-extrusion-opacity": 0.6,
                  },
                },
                labelLayerId
              );
            }
          }
        }
      });
    }

    setInterval(() => {
      try {
        this.dataSharingService.sharedLat$.subscribe((data) => {
          if(data!=0)
            this.sharedLat = data;
        });
        this.dataSharingService.sharedLon$.subscribe((data) => {
          if(data!=0)
            this.sharedLon = data;
        });
        if (this.sharedLat != this.currentLngLat.lat ||this.sharedLon != this.currentLngLat.lng) {
          this.deleteMarker();
          this.currentLngLat = new mapboxgl.LngLat(
            this.sharedLon,
            this.sharedLat
          );
          this.createMarker(this.currentLngLat);
        }
      } 
      catch (error) {
        //this.ngOnDestroy();
      }
    }, 50);
    //
    setInterval(() => {
      try {
        if (this.map) {
          this.map.resize();
        }
      } 
      catch (error) {
        //this.ngOnDestroy();
      }
    }, 10);
  }

  /* CREATE / DESTROY */

  createMap(pos: any) { // Crea el mapa
    if (!this.divMap) throw "No hay mapa";
    this.ngOnDestroy();
    this.map = new mapboxgl.Map({
      container: this.divMap.nativeElement,
      style: "mapbox://styles/mapbox/" + this.colorMap,
      center: pos,
      zoom: this.zoom,
    });
    return this.map;
  }

  ngOnDestroy() { // Destructor del mapa
    try {
      if (this.map) {
        this.map.remove();
      }
    } catch (error) {
      console.error("Error al eliminar el mapa:", error);
    }
  }

  /* MAP STYLE */
  
  changeMapStyle(event: any): void { // Cambiar el estilo del mapa
    if (this.map) {
      this.colorMap = event;
      this.saveStorage();
      this.map.setStyle("mapbox://styles/mapbox/" + event);
    }
  }

  /* MARKER */

  createMarker(marker: mapboxgl.LngLat) { // Crea chincheta al mapa
    if (!this.map) return;
    const color = "#0dcaf0";
    const lngLat = marker;
    this.addMarker(lngLat, color);
  }

  addMarker(lngLat: mapboxgl.LngLat, color: string) { // Añade chincheta al mapa
    if (!this.map) return;
    this.markers = [];
    this.markers.splice(0, 1);

    const marker = new mapboxgl.Marker({
      color: "#0dcaf0",
      draggable: false,
    })
      .setLngLat(lngLat)
      .addTo(this.map);
    this.markers.push({ color, marker });

    if (this.ruteAux[2] == "new") {
      this.saveStorage();
      marker.on("dragend", () => this.saveStorage());
    }

    this.sharedLat = lngLat.lat;
    this.sharedLon = lngLat.lng;
    this.updateSharedLat();
    this.updateSharedLon();
  }

  deleteMarker() {  // Elimina chincheta del mapa
    for (let index = 0; index < this.markers.length; index++) {
      this.markers[index].marker.remove();
    }
    let contenidoSuperpuesto = document.getElementsByClassName("marker_text");
    for (let i = 0; i < contenidoSuperpuesto.length; i++) {
      contenidoSuperpuesto[i].remove();
    }
  }

  /* LOCAL STORAGE */

  saveStorage() { // Guarda datos en local storage
    localStorage.setItem("colorMap", this.colorMap);
  }

  readStorage() { // Recupera datos del local storage
    this.colorMap = localStorage.getItem("colorMap") ?? environment.defaultMapsStyle;
  }

  /* SHARED */

  updateSharedAct() { // Actualiza activación (devices-new-edit)
    this.dataSharingService.updateSharedAct(true);
  }

  updateSharedLat() { // Actualiza latitud (devices-new-edit)
    this.dataSharingService.updateSharedLat(this.sharedLat);
  }

  updateSharedLon() { // Actualiza longitud (devices-new-edit)
    this.dataSharingService.updateSharedLon(this.sharedLon);
  }
}
