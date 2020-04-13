import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

declare var ol: any;

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  vlilleurl = 'https://opendata.lillemetropole.fr/api/records/1.0/search/?dataset=vlille-realtime&rows=1000&facet=libelle&facet=nom&facet=etat';
  VlilleList: any[];
  vlilleStationList: VLilleStation[];
  longitude: number;
  latitude: number;
  isLoaded = false;
  isLocated = false;
  isLocatedFound = true;

  map: any;
  markerSource = new ol.source.Vector();



  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.getData();

  }
  public getData() {
    this.isLoaded = false;
    this.isLocated = false;
    this.isLocatedFound = true;

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
      this.isLocatedFound = true;
      this.sortListByDistance();
    },this.getPosition,{timeout: 4000, enableHighAccuracy:true});
    setTimeout(() => { this.isLocatedFound = false }, 4000);
    

  }
  sortListByDistance() {
    this.isLocated = true;
    for (let i = 0; i < this.vlilleStationList.length; i++) {
      let vlille = this.vlilleStationList[i];
      let distance = this.getDistance(this.latitude, this.longitude, vlille.latitude, vlille.longitude);
      vlille.distance = distance;
    }
    this.vlilleStationList.sort(function (a, b) {
      return a.distance - b.distance;
    });
    //console.log(this.vlilleStationList);
    this.isLoaded = true;
    this.showMaps();

  }
  private showMaps() {
    document.getElementById("map").innerHTML = null;
    this.map = new ol.Map({

      target: 'map',
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM()
        })
      ],
      view: new ol.View({
        center: ol.proj.fromLonLat([this.longitude, this.latitude]),
        zoom: 15
      }),
      interactions: ol.interaction.defaults({
        doubleClickZoom: false,
        dragAndDrop: false,
        dragPan: false,
        keyboardPan: false,
        keyboardZoom: false,
        mouseWheelZoom: false,
        pointer: false,
        select: false
      }),
      controls: []
    });


    var marker = new ol.Feature({
      geometry: new ol.geom.Point(
        ol.proj.fromLonLat([this.longitude, this.latitude])
      ),
    });
    marker.setStyle(new ol.style.Style({
      image: new ol.style.Icon({
        crossOrigin: 'anonymous',
        src: './assets/img/me.svg',
        anchor: [0.45, 0.8],
        scale: 0.25
      })
    }));

    var vectorSource = new ol.source.Vector({
      features: [marker]
    });
    var markerVectorLayer = new ol.layer.Vector({
      source: vectorSource,
    });
    this.map.addLayer(markerVectorLayer);

    for (let i = 0; i < 10; i++) {

      var marker = new ol.Feature({
        geometry: new ol.geom.Point(
          ol.proj.fromLonLat([this.vlilleStationList[i].longitude, this.vlilleStationList[i].latitude])
        )

      });

      if (this.vlilleStationList[i].selected == true) {
        marker.setStyle(new ol.style.Style({
          image: new ol.style.Icon({
            color: '#00ff00',
            crossOrigin: 'anonymous',
            src: './assets/img/station.svg',
            anchor: [0.45, 0.8],
            scale: 0.2
          })
        }));
      } else {
        marker.setStyle(new ol.style.Style({
          image: new ol.style.Icon({
            color: '#ff92c1',
            crossOrigin: 'anonymous',
            src: './assets/img/station.svg',
            anchor: [0.45, 0.8],
            scale: 0.2
          })
        }));
      }

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
  private selectStation(libelle) {

    for (let i = 0; i < 10; i++) {
      if (this.vlilleStationList[i].selected == true) {
        this.vlilleStationList[i].selected = false;
      }
      if (this.vlilleStationList[i].libelle == libelle) {
        this.vlilleStationList[i].selected = true;
      }
    }
    this.showMaps();

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

