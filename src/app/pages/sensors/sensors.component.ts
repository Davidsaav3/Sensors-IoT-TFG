import { Component , OnInit, HostListener} from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sensors',
  templateUrl: './sensors.component.html',
  styleUrls: ['../../app.component.css']
})

export class SensorsComponent implements OnInit{

  @HostListener('window:resize')
  public activeLang = 'es';

  constructor(public rutaActiva: Router) {
    this.resize();
  }

  max_sensors: string = 'http://localhost:5172/api/max/sensors_types';
  get_sensors: string = 'http://localhost:5172/api/get/sensors_types';
  post_sensors: string = 'http://localhost:5172/api/post/sensors_types';
  delete_sensors: string = 'http://localhost:5172/api/delete/sensors_types';
  update_sensors: string = 'http://localhost:5172/api/update/sensors_types';
  id_sensors: string = 'http://localhost:5172/api/id/sensors_types';

  alt_1_a=true;
  alt_1_b=false;
  alt_2_a=true;
  alt_2_b=false;
  alt_3_a=true;
  alt_3_b=false;  
  alt_4_a=true;
  alt_4_b=false;  
  alt_5_a=true;
  alt_5_b=false;
  alt_6_a=true;
  alt_6_b=false;  
  alt_7_a=true;
  alt_7_b=false;

  charging= false;
  data: any;
  width= 0;
  rute='';
  view_dup= 1000;
  pencil_dup= 1000;
  timeout: any = null;
  show=false;
  show_2= false;
  show_3= true;
  alert_delete: any= false;
  alert_new: any= false;
  not_delete: any= false;
  not_new: any= false;
  save_ok: any= false;
  save_not: any= false;
  dup= false;
  saved= false;
  edit_change= false;
  new_change= false;
  dup_ok=false;
  dup_not=false;
  id= 0;
  type_2='';

  search_1='Buscar';
  search_2='type';
  mark= 'orden';

  sensors = {
    id: '', 
    type: '',    
    metric: '', 
    description: '',
    errorvalue: null,
    valuemax: null,
    valuemin: null,
    orden: '',
    correction_general: null,
    correction_time_general: null,
  }

  sensors_new = {
    id: '', 
    type: '',    
    metric: '', 
    description: '',
    errorvalue: null,
    valuemax: null,
    valuemin: null,
    orden: '',
    correction_general: null,
    correction_time_general: null,
  }

  aux_1 = {
    id: '',
  }

  search = {
    value: '', 
  }

  ngOnInit(): void { // Inicializador
    this.getSensors('orden','ASC');
    this.openClouse();
  }

  getSensors(id: any,ord: any){ // Obtener todos los sensores
    this.mark= id;
    this.rute= this.rutaActiva.routerState.snapshot.url;
    if(id!='id'){
      this.search_2= id;
    }
    if(this.search.value==''){
      this.search_1= 'Buscar';
    }
    else{
      this.search_1= this.search.value;
    }
    this.charging= true;
    fetch(`${this.get_sensors}/${this.search_1}/${this.search_2}/${ord}`)
    .then((response) => response.json())
    .then(quotesData => {
      this.charging= false
      this.data = quotesData
    });
  }

  editSensor(form: any) { // Guardar datos de sensores editado
    if (form.valid) {
      fetch(this.update_sensors, {
        method: "POST",body: JSON.stringify(this.sensors),headers: {"Content-type": "application/json; charset=UTF-8"}
      })
      .then(response => response.json()) 
      this.save_ok= true;
      setTimeout(() => {
        this.save_ok= false;
      }, 2000);

      setTimeout(() => {
        this.getSensors('id','ASC');
      }, 50);
      this.saved= true;
    }
    this.new_change=false;
    this.edit_change=false;
  }

  newSensor(form: any) { // Guardar datos de sensores nuevo
    this.dup= false;
    if (form.valid) {
      fetch(this.post_sensors, {
        method: "POST",body: JSON.stringify(this.sensors_new),headers: {"Content-type": "application/json; charset=UTF-8"}
      })
      .then(response => response.json()) 
      this.alert_new= true;
      setTimeout(() => {
        this.alert_new= false;
      }, 2000);

      setTimeout(() => {
        this.getSensors('id','ASC');
      }, 50);
      this.openClouse();
  
      fetch(this.max_sensors)
      .then(response => response.json())
      .then(data => {
        this.id= parseInt(data[0].id+1);
      })
    }
    this.new_change=false;
    this.edit_change=false;
  }
  
  resize(): void{ // Redimensionar pantalla
    this.width = window.innerWidth;
  }

  duplicateSensor(num: any, type: any){ // Duplicar sensor
    if(!this.edit_change && !this.new_change){
      this.aux_1 = {
        id: num,    
      }   
      this.search_1= 'Buscar';
      let ord= 'ASC';
      fetch(`${this.get_sensors}/${this.search_1}/${this.search_2}/${ord}`)
      .then((response) => response.json())
      .then(data => {
        let contador = 1;
        let nombresExistentes = new Set();
        for (let index = 0; index < data.length; index++) {
          nombresExistentes.add(data[index].type);
        }
        let type_2= type;
        while(nombresExistentes.has(type_2)) {
          type_2 = `${type}_${contador}`;
          contador++;
        }
        this.openNew();
        fetch(`${this.id_sensors}/${num}`)
        .then(response => response.json())
        .then(data => {
          this.sensors_new= data[0];
        })
        .catch(error => {
          console.error(error); 
        });
        setTimeout(() => {
          this.getSensors('id','ASC');
        }, 50);
        this.openClouse();
        //
        fetch(this.max_sensors)
        .then(response => response.json())
        .then(data => {
          this.id= parseInt(data[0].id);
          this.sensors_new.id= data[0].id;
          this.sensors_new.type= type_2;
        })
        this.edit_change= true;
        this.dup= true;
      })
    }
  }

  deleteSensor(id_actual: any){ // Eliminar sensor
    var sensors2 = {
      id: id_actual,    
    }
    fetch(this.delete_sensors, {
      method: "POST",body: JSON.stringify(sensors2),headers: {"Content-type": "application/json; charset=UTF-8"}
    })
    .then(response => response.json()) 
    this.show_2=false;
    this.alert_delete= true;
    setTimeout(() => {
      this.alert_delete= false;
    }, 2000);
    this.show_2= false;
    setTimeout(() => {
      this.getSensors('id','ASC');
    }, 50);
    this.openClouse();
  }

  hide(){ 
    this.alert_delete= false;
    this.alert_new= false;
  }

  update(){ // Guardar sensores en el popup de salir sin guardar
   if(this.show==true && this.show_2==false){
    this.newSensor(this.sensors_new);
   }
   if(this.show==false && this.show_2==true){
    this.editSensor(this.sensors);
   }
  }

  clouse(){ 
    this.show_2=false;
    this.openClouse();
    this.new_change=false;
    this.edit_change=false;
  }

  orderColumn(id_actual: any){ // Ordenar columnas
    if(!this.edit_change && !this.new_change){
       this.openEdit();
      this.show_2=true;
      fetch(`${this.id_sensors}/${id_actual}`)
      .then(response => response.json())
      .then(data => {
        this.sensors= data[0];
      })
      .catch(error => {
        console.error(error); 
      });
      setTimeout(() => {
        this.getSensors('id','ASC');
      }, 50);
      this.openClouse();
    }
  }
  
  textSearch(event: any) { // search por texto
    clearTimeout(this.timeout);
    var $this = this;
    this.timeout = setTimeout(function () {
      if (event.keyCode != 13) {
        $this.getSensors('id','ASC');
        $this.openClouse();
      }
    }, 500);
  }

  openClouse(){  // Logica abrir y cerrar tarjetas
    if (this.show==true || this.show_2==true) {
      this.show_3= false;
    }
    else{
      this.show_3= true;
    }
  }

  deleteSearch(){ // Borrar search
    this.search.value= '';
    this.getSensors('id','ASC');
  }

  openNew(){ // Abrir Nuevo sensor
    this.show= true;
    this.show_2= false;
    this.openClouse();
    this.dup= false;
  }

  openEdit(){ // Abrir Editar sensor
    this.show_2= true;
    this.show= false;
  }

  clouseAll(){ // Cerrar todas las pestañas
    this.show_2= false;
    this.show= false;
    this.openClouse();
    this.new_change=false;
    this.edit_change=false;
  }
}
