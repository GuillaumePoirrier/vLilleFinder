import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
declare var ol: any;

@Component({
  selector: 'app-carte',
  templateUrl: './carte.component.html',
  styleUrls: ['./carte.component.css']
})
export class CarteComponent implements OnInit {
  vlilleurl = 'https://opendata.lillemetropole.fr/api/records/1.0/search/?dataset=vlille-realtime&rows=1000&facet=libelle&facet=nom&facet=etat';
  VlilleList: any[];
  vlilleStationList: VLilleStation[];
  longitude: number;
  latitude: number;

  map: any;
  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.getData();

  }
  public getData() {
  

    this.VlilleList = [];
    this.vlilleStationList = [];
    this.http.get(this.vlilleurl)
      .subscribe((data: any[]) => {
        this.VlilleList = data['records'];
        this.fillList(this.VlilleList);
      });


  }
  private fillList(VlilleList: any[]) {
    for (let i = 0; i < VlilleList.length; i++) {
      let data = VlilleList[i]['fields'];
      this.vlilleStationList.push(new VLilleStation(
        data['libelle'],
        data['etat'],
        data['nbvelosdispo'],
        data['nbplacesdispo'],
        data['nom'],
        data['geo'][0],
        data['geo'][1]
      ))
    }
    this.getPosition();

  }
  
 
  private getPosition() {
    
    navigator.geolocation.getCurrentPosition((position) => {
      this.longitude = position.coords.longitude;
      this.latitude = position.coords.latitude;
      this.sortListByDistance();
    },this.getPosition,{timeout: 4000, enableHighAccuracy:true});
  
    

  }
  sortListByDistance() {
    
    for (let i = 0; i < this.vlilleStationList.length; i++) {
      let vlille = this.vlilleStationList[i];
      let distance = this.getDistance(this.latitude, this.longitude, vlille.latitude, vlille.longitude);
      vlille.distance = distance;
    }
    this.vlilleStationList.sort(function (a, b) {
      return a.distance - b.distance;
    });
    //console.log(this.vlilleStationList);
  
    this.showMaps();

  }
  private showMaps() {
    //document.getElementById("mapfull").innerHTML = null;
    this.map = new ol.Map({

      target: 'mapfull',
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM()
        })
      ],
      view: new ol.View({
        center: ol.proj.fromLonLat([this.longitude, this.latitude]),
        zoom: 15
      })
    });


    var marker = new ol.Feature({
      geometry: new ol.geom.Point(
        ol.proj.fromLonLat([this.longitude, this.latitude])
      ),
    });
    marker.setStyle(new ol.style.Style({
      image: new ol.style.Icon({
        color: '#8959A8',
        crossOrigin: 'anonymous',
        src: './assets/img/me.png',
        anchor: [0.45, 0.8],
        scale: 0.015
      })
    }));

    var vectorSource = new ol.source.Vector({
      features: [marker]
    });
    var markerVectorLayer = new ol.layer.Vector({
      source: vectorSource,
    });
    this.map.addLayer(markerVectorLayer);

    for (let i = 0; i < this.vlilleStationList.length; i++) {

      var marker = new ol.Feature({
        geometry: new ol.geom.Point(
          ol.proj.fromLonLat([this.vlilleStationList[i].longitude, this.vlilleStationList[i].latitude])
        )

      });

        marker.setStyle(new ol.style.Style({
          image: new ol.style.Icon({
            color: '#ff92c1',
            crossOrigin: 'anonymous',
            src: './assets/img/station.svg',
            anchor: [0.45, 0.8],
            scale: 0.2
          })
        }));
      

      var vectorSource = new ol.source.Vector({
        features: [marker]
      });
      var markerVectorLayer = new ol.layer.Vector({
        source: vectorSource,
      });
      this.map.addLayer(markerVectorLayer);

    }




  }

  private getDistance(lat1, lon1, lat2, lon2) {
    var R = 6371; // km (change this constant to get miles)
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
  }
}
export class VLilleStation {
  libelle: number;
  etat: string;
  nbvelosdispo: number;
  nbplacesdispo: number;
  nom: string;
  latitude: number;
  longitude: number;
  distance: number;
  selected: boolean;
  constructor(libelle: number, etat: string, nbvelosdispo: number, nbplacesdispo: number, nom: string, latitude: number, longitude: number, distance?: number, selected?: boolean) {
    this.libelle = libelle;
    this.etat = etat;
    this.nbplacesdispo = nbplacesdispo;
    this.nbvelosdispo = nbvelosdispo;
    this.nom = nom;
    this.latitude = latitude;
    this.longitude = longitude;
    this.distance = distance;
    this.selected = selected;
  }

}

