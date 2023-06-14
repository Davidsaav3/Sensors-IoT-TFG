import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';

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
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['../../../app.component.css']
})
export class MapComponent implements AfterViewInit, OnDestroy{
  @ViewChild('map') divMap?: ElementRef;

  public zoom: number = 10;
  public map?: mapboxgl.Map;
  public currentLngLat: mapboxgl.LngLat = new mapboxgl.LngLat(-0.5098796883778505, 38.3855908932305);
  public markers: MarkerAndColor[] = [];

  timeout: any = null;
  dup_ok=false;
  dup_not=false;
  buscar='Buscar';
  buscar1= 'id';
  buscar2= 'id';
  buscar3= 'Nada';
  buscar4= 'Nada';
  private url: string = 'http://localhost:5172/api/get/device_configurations';
  data: any;

  busqueda = {
    value: '', 
    sel_type: 'Nada',
    sel_enable: 2
  }

  contenido = {
    sensors : [{
      uid: '',    
      alias: '', 
      origin: '',
      description_origin: '',
      application_id: '',
      topic_name: '',
      typemeter: '',
      lat: 0,
      lon: 0,
      cota: 10,
      timezone: '+01:00',
      enable: 0,
      organizationid: '',
    }]
  }

  ngAfterViewInit(): void {

    if ( !this.divMap ) throw 'El elemento HTML no fue encontrado';

    this.map = new mapboxgl.Map({
      container: this.divMap.nativeElement, // container ID
      style: 'mapbox://styles/mapbox/streets-v12', // style URL
      center: this.currentLngLat,
      zoom: this.zoom, // starting zoom
    });

    this.mapListeners();
    this.readFromLocalStorage();
    // const markerHtml = document.createElement('div');
    // markerHtml.innerHTML = 'Fernando Herrera'

    // const marker = new Marker({
    //   // color: 'red',
    //   element: markerHtml
    // })
    //   .setLngLat( this.currentLngLat )
    //   .addTo( this.map );
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  mapListeners() {
    if ( !this.map ) throw 'Mapa no inicializado';

    this.map.on('zoom', (ev) => {
      this.zoom = this.map!.getZoom();
    });

    this.map.on('zoomend', (ev) => {
      if ( this.map!.getZoom() < 18 ) return;
      this.map!.zoomTo(18);
    });

    this.map.on('move', () => {
      this.currentLngLat = this.map!.getCenter();
    });

  }

  zoomIn() {
    this.map?.zoomIn();
  }

  zoomOut() {
    this.map?.zoomOut();
  }

  zoomChanged( value: string ) {
    this.zoom = Number(value);
    this.map?.zoomTo( this.zoom );
  }

  /* /////////////////////////// */

  createMarker() {
    if ( !this.map ) return;

    const color = '#xxxxxx'.replace(/x/g, y=>(Math.random()*16|0).toString(16));
    const lngLat = this.map.getCenter();

    this.addMarker( lngLat, color );
  }


  addMarker( lngLat: mapboxgl.LngLat, color: string ) {
    if ( !this.map ) return;

    const marker = new mapboxgl.Marker({
      color: color,
      draggable: true,
    })
      .setLngLat( lngLat )
      .addTo( this.map );

    this.markers.push({ color, marker, });
    this.saveToLocalStorage();

    marker.on('dragend', () => this.saveToLocalStorage() );

    // dragend
  }

  deleteMarker( index: number ) {
    this.markers[index].marker.remove();
    this.markers.splice( index, 1 );
  }

  flyTo( marker: mapboxgl.Marker ) {

    this.map?.flyTo({
      zoom: 14,
      center: marker.getLngLat()
    });

  }


  saveToLocalStorage() {
    const plainMarkers: PlainMarker[] = this.markers.map( ({ color, marker }) => {
      return {
        color,
        lngLat: marker.getLngLat().toArray()
      }
    });

    localStorage.setItem('plainMarkers', JSON.stringify( plainMarkers ));

  }

  readFromLocalStorage() {
    const plainMarkersString = localStorage.getItem('plainMarkers') ?? '[]';
    const plainMarkers: PlainMarker[] = JSON.parse( plainMarkersString ); //! OJO!

    plainMarkers.forEach( ({ color, lngLat }) => {
      const [ lng, lat ] = lngLat;
      const coords = new mapboxgl.LngLat( lng, lat );

      this.addMarker( coords, color );
    })

  }

  ngOnInit(): void {
    console.log("HOLA")

    const url2 = `${this.url}/${this.buscar}/${this.buscar1}/${this.busqueda.sel_type}/${this.busqueda.sel_enable}`;
    //console.log(url2)
    fetch(url2)
    .then((response) => response.json())
    .then(data => {
      this.contenido.sensors= data;
      console.log(this.contenido.sensors)
      for(let quote of this.contenido.sensors) {
        console.log(quote.lon)
        let color = '#xxxxxx'.replace(/x/g, y=>(Math.random()*16|0).toString(16));
        let coords = new mapboxgl.LngLat( quote.lon, quote.lat );
        this.addMarker( coords, color );
      }
    })
  }

}