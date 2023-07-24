import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, Injectable } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { ActivatedRoute } from '@angular/router';
import { DataSharingService } from '../../../services/data_sharing.service';
import { Router } from '@angular/router';

interface MarkerAndColor {
  color: string;
  marker: mapboxgl.Marker;
}

interface PlainMarker {
  color: string;
  lngLat: number[]
}

(mapboxgl as any).accessToken= 'pk.eyJ1IjoiZGF2aWRzYWF2MyIsImEiOiJjbGl1cmZ4NG8wMTZqM2ZwNW1pcW85bGo4In0.ye1F3KfhnRZruosNYoAYYQ';

@Component({
  selector: 'app-devices-map',
  templateUrl: './devices-map.component.html',
  styleUrls: ['../../../app.component.css']
})

@Injectable({
  providedIn: 'root'
})

export class DevicesMapComponent implements AfterViewInit, OnDestroy{

  rute='';
  rute2: any;
  sharedLat: any = 38.3855908932305;
  sharedLon: any = -0.5098796883778505;
  currentLngLat: mapboxgl.LngLat= new mapboxgl.LngLat(this.sharedLon, this.sharedLat);

  constructor(private rutaActiva: ActivatedRoute,public rute1: Router,private dataSharingService: DataSharingService) {
    this.rute= this.rute1.routerState.snapshot.url;
    this.rute2 = this.rute.split('/');
    
    if(this.rute2[2]=='edit'){
      this.dataSharingService.sharedLat$.subscribe(data => {
        this.sharedLat = data;
      });
      this.dataSharingService.sharedLon$.subscribe(data => {
        this.sharedLon = data;
      }); 
      this.currentLngLat= new mapboxgl.LngLat(this.sharedLon, this.sharedLat);//setTimeout
    }
   }

  @ViewChild('map') divMap?: ElementRef;
  id_device: string = 'http://localhost:5172/api/id/device_configurations';
  max_device: string = 'http://localhost:5172/api/max/device_configurations';
  id= parseInt(this.rutaActiva.snapshot.params['id']);

  zoom: number = 10;
  map?: mapboxgl.Map;
  markers: MarkerAndColor[] = [];
  color_map= 'streets-v12';
  id_max= 1;
  state= 1;
  
  ngOnInit(): void { // Inicializador
    this.readStorage();
    this.rute= this.rute1.routerState.snapshot.url;
    this.rute2 = this.rute.split('/');

    if(this.rute2[2]=='new'){
        fetch(this.max_device)
        .then(response => response.json())
        .then(data => {
          this.id_max= parseInt(data[0].id)+1;    
          if(this.id<this.id_max){
            this.state= 1;
          }
          if(this.id>=this.id_max){
            this.state= 0;
          }
        })
        this.dataSharingService.sharedLat$.subscribe(data => {
          this.sharedLat = data;
        });
        this.dataSharingService.sharedLon$.subscribe(data => {
          this.sharedLon = data;
        });
    }
    //
    if(this.rute2[2]=='edit'){
        this.dataSharingService.sharedLat$.subscribe(data => {
          this.sharedLat = data;
        });
        this.dataSharingService.sharedLon$.subscribe(data => {
          this.sharedLon = data;
        });
        this.currentLngLat= new mapboxgl.LngLat(this.sharedLon, this.sharedLat);
    }

    setInterval(() => {
      if(this.map!=undefined){
        if(this.map!=undefined){
          this.map.resize();
        }
      }
    }, 50);
  }

  ngAfterViewInit(): void { // Despues de ngOnInit
    if(this.rute2[2]=='new'){
        if ( !this.divMap ) throw 'No hay mapa';
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(position => { 
              this.map= this.createMap([position.coords.longitude, position.coords.latitude]);
              this.auxInit();
            },
            (error) => {
              this.map= this.createMap([-3.7034137886912504,40.41697654880073]);
              console.log("Error geo", error);
              this.auxInit()
            }
          );
        } 
        else {
          this.map= this.createMap([-3.7034137886912504,40.41697654880073]);
          console.log("Geo no compatible");
          this.auxInit();
        }
    }
    //
    if(this.rute2[2]=='edit'){
        this.deleteMarker();
        this.map= this.createMap(this.currentLngLat);
        this.currentLngLat= new mapboxgl.LngLat(this.sharedLon,this.sharedLat);
        this.createMarker(this.currentLngLat);
        this.auxInit();
    }
  }

  auxInit(){ // Auxiliar de ngAfterViewInit [NO EN EDIT]
    if(this.map!=undefined){
      this.map.addControl(
        new mapboxgl.GeolocateControl({
        positionOptions: {
        enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
        })
      );
      
      this.map.addControl(new mapboxgl.NavigationControl());

      this.map.on('click', (e) => {
        //e.lngLat.lat= e.lngLat.lat-1;
        this.deleteMarker();
        this.createMarker(e.lngLat.wrap());
        this.updatesharedAct();
        //this.ngAfterViewInit();
      });
  
      let layerList = document.getElementById('menu');
      if (layerList != null) {
        let inputs = layerList.getElementsByTagName('input');
        if (inputs != null) {
          const inputArray = Array.from(inputs); 
          
          for (const input of inputArray) {
            input.onclick = (layer: any) => {
              const layerId = layer.target.id;
              if (this.map != null) {
                this.map.setStyle('mapbox://styles/mapbox/' + this.color_map);
              }
            };
          }
        }
      }
    }
    setInterval(() => {
      this.dataSharingService.sharedLat$.subscribe(data => {
        this.sharedLat = data;
      });
      this.dataSharingService.sharedLon$.subscribe(data => {
        this.sharedLon = data;
      });
      //console.log(this.sharedLat, this.currentLngLat.lat, this.sharedLon, this.currentLngLat.lng)
      if(this.sharedLat!=this.currentLngLat.lat || this.sharedLon!=this.currentLngLat.lng){
        this.deleteMarker();
        this.currentLngLat= new mapboxgl.LngLat(this.sharedLon,this.sharedLat);
        this.createMarker(this.currentLngLat);
        //this.auxInit();
      }
    }, 50);
  }

  createMap(pos: any){ // crea el mapa
    if ( !this.divMap ) throw 'No hay mapa';
      this.ngOnDestroy();
      this.map = new mapboxgl.Map({
        container: this.divMap.nativeElement,
        style: 'mapbox://styles/mapbox/'+this.color_map, 
        center: this.currentLngLat,
        zoom: this.zoom,
      });
      return this.map;
    
  }
  
  ngOnDestroy(): void { // Destructor del mapa
    this.map?.remove();
  }

  showMap(){ // Redimesiona mapa
    if (this.map)
      this.map.resize();
  }
  
  updatesharedLat() { // Actualizar Latitud
    this.dataSharingService.updatesharedLat(this.sharedLat);
  }
  updatesharedLon() { // ctualizar Longitud
    this.dataSharingService.updatesharedLon(this.sharedLon);
  }

  /* /////////////////////////// */

  createMarker(marker: mapboxgl.LngLat) { // Añade chincheta 1
    if ( !this.map ) return;
    const color= '#0dcaf0';
    const lngLat = marker;
    this.addMarker( lngLat, color );
  }

  updatesharedAct() { // Enviar act
    this.dataSharingService.updatesharedAct(true);
  }

  addMarker( lngLat: mapboxgl.LngLat, color: string ) { // Crear chincheta 2
    if ( !this.map ) return;
    this.markers = [];
    this.markers.splice( 0, 1 );

    const marker = new mapboxgl.Marker({
      color: '#0dcaf0',
      draggable: false
    })
    .setLngLat( lngLat )
    .addTo( this.map );
    this.markers.push({ color, marker, });

    if(this.rute2[2]=='new'){
      this.saveStorage();
      marker.on('dragend', () => this.saveStorage() );      
    }

    this.sharedLat= lngLat.lat;
    this.sharedLon= lngLat.lng;
    this.updatesharedLat();
    this.updatesharedLon();
  }

  deleteMarker() { // Quita chincheta
    for (let index = 0; index < this.markers.length; index++) {
      this.markers[index].marker.remove();
    }
    let contenidoSuperpuesto = document.getElementsByClassName('marker_text');
    for (let i = 0; i < contenidoSuperpuesto.length; i++) {
      contenidoSuperpuesto[i].remove();
    }
    if(this.map!=undefined){
      //this.map.removeSource('places');
    }
  }

  saveStorage() { // Guarda datos
    localStorage.setItem('color_map', this.color_map);
  }

  readStorage() { // Recupera datos
    this.color_map = localStorage.getItem('color_map') ?? '0';
  }

}
