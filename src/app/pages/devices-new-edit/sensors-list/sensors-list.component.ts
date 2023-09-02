import { Component, OnInit, HostListener} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Injectable } from '@angular/core';
import { DataSharingService } from '../../../services/data_sharing.service';
import { environment } from "../../../../../environments/environment"

@Injectable({
  providedIn: 'root'
})

@Component({
  selector: 'app-sensors-list',
  templateUrl: './sensors-list.component.html',
  styleUrls: ['../../../app.component.css']
})

export class SensorsListComponent  implements OnInit{

  @HostListener('window:resize', ['$event'])
    onResize(event: any) {
    window.resizeBy(-1, 0);
    this.resize();
  }

  constructor(private rutaActiva: ActivatedRoute,public dataSharingService: DataSharingService) { 
    this.resize();
  }
  
  get_sensors: string = 'http://localhost:5172/api/sensors_types/get';
  id_device_sensors_devices: string = 'http://localhost:5172/api/sensors_devices/id';
  id_sensors: string = 'http://localhost:5172/api/sensors_types/id';
  id= parseInt(this.rutaActiva.snapshot.params['id']);

  numerito= 1;
  view_can= -1;
  leng_name= environment.lenguaje_name;
  leng_lang= environment.lenguaje_lang;
  activeLang = environment.lenguaje_lang[0];
  search_1='orden';
  search_2='id';
  show_map= true;
  delete_it: any;
  show_large= true;
  duplicate= false;
  width= 0;

  select_sensors = {
    sensors : [
      {
        id: 1, 
        type: '',    
        metric: '', 
        description: '',
        errorvalue: 1,
        valuemax: 1,
        valuemin: 1,
        position: 0,
        correction_general: '',
        correction_time_general: '',
      }]
  }

  sensors = {
    sensors : [
      {
        id: 1, 
        enable: 0, 
        id_device: this.id,
        id_type_sensor: 1,
        datafield: '',
        nodata: true,
        orden: 1,
        type_name: 1,
        correction_specific: '',
        correction_time_specific: '',
      }]
  }

  ngOnInit(): void { // Inicialización
    this.sensors.sensors= [];
    this.getDevices('id');
    setTimeout(() => {
      this.updatesharedList();
    }, 100);

    setInterval(() => {
      this.dataSharingService.sharedAmp$.subscribe(data => {
        this.show_large= data;
      });
      this.dataSharingService.sharedList$.subscribe(data => {
        if(data==this.numerito){
          fetch(`${this.id_device_sensors_devices}/${this.id}/${this.search_1}`)
          .then(response => response.json())
          .then(data => {
            this.sensors.sensors= data;
          })
          .catch(error => {
            console.error(error); 
          });
          setTimeout(() => {
            this.updatesharedList();
          }, 10);
          this.numerito= data+1;
        }
      });
      this.readStorage()
    }, 10);
  }

  readStorage() { // Recupera datos
    this.activeLang = localStorage.getItem('activeLang') ?? 'es';
  }

  resize(): void{ // Redimensionar pantalla
    this.width = window.innerWidth;
  }

  getOrden(num: any){ // Asocia un order al sensor segun su type
    fetch(`${this.id_sensors}/${this.sensors.sensors[num].id_type_sensor}`)
    .then(response => response.json())
    .then(data => {
      this.sensors.sensors[num].orden= data[0].position;
    })
  }

  getDevices(id: any){ // Obtener datos del dispositivo
    if(id!='id'){
      this.search_1= id;
    }
    fetch(`${this.id_device_sensors_devices}/${this.id}/${this.search_1}`)
    .then(response => response.json())
    .then(data => {
      this.sensors.sensors= data;
    })
    .catch(error => {
      console.error(error); 
    });
    let search_1= 'Buscar';
    let order= 'ASC';
    fetch(`${this.get_sensors}/${search_1}/${this.search_2}/${order}`)
    .then((response) => response.json())
    .then(data => {
      this.select_sensors.sensors= data;
    })
  }

  addSensor(){ // Añadir a lista compartida
    let sensors_aux = {
      id: this.sensors.sensors.length, 
      enable: 0, 
      id_device: this.id,
      id_type_sensor: 1,
      datafield: '',
      nodata: true,
      orden: 1,
      type_name: 1,
      correction_specific: '',
      correction_time_specific: '',
    }
    this.sensors.sensors.push(sensors_aux);
    this.show_map= true;
    this.updatesharedList();
    this.dataSharingService.updatesharedAct(true);
  }

  deleteSensor(id: any){ // Añadir a lista compartida
    this.delete_it= id;
    this.sensors.sensors= this.sensors.sensors.filter((item) => item.id != this.delete_it)
    this.updatesharedList();
    this.dataSharingService.updatesharedAct(true);
  }
  
  updatesharedList() { // Enviar sensores a device-edit
    this.dataSharingService.updatesharedList(this.sensors.sensors);
  }

}
