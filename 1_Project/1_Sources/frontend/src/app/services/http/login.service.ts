// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { HttpHeaders } from '@angular/common/http';

// import { Observable, throwError } from 'rxjs';
// import { catchError, retry } from 'rxjs/operators';

// // import { Http, Headers } from '@angular/http';
// import { Router } from '@angular/router';

// import 'rxjs/add/operator/map';
// // import { map } from 'rxjs/operators';

// import { GLOBAL } from '../global';

// // Modelos
// // import { UserModel } from '../../models/user.model';

// @Injectable()
// export class LoginService {
//   public token: string;
//   public headers: any;
//   public url: string;

//   constructor(
//     private http: HttpClient,
//     // private http: Http,
//     private router: Router
//   ) {
//     this.headers = new HttpHeaders({ 'Content-Type': 'application/json'});
//     this.headers.append('Authorization', 'Bearer ' + this.token);

//     // this.getToken();

//     this.url = GLOBAL.url;
//   }

//   postLogin(user: Login): Observable<any> {
//     const params = JSON.stringify(user);
//     const url = this.url + '/login';

//     return this.http.post(url, params, {headers: this.headers});
//     // return this.http.post(url, params, {headers: this.headers}).map(res => res.json());
//   }

//   // logout() {
//   //   this.token = '';

//   //   localStorage.removeItem('token');
//   //   localStorage.removeItem('id');

//   //   this.headers.delete('Authorization');

//   //   this.router.navigate(['/login']);
//   // }

//   // getToken() {
//   //   this.token = localStorage.getItem('token') || '';
//   //   this.headers = new Headers({ 'Content-Type': 'application/json'});
//   //   this.headers.append('Authorization', 'Bearer ' + this.token);
//   // }

//   // estalogueado() {
//   //   this.getToken();
//   //   return (this.token.length > 5) ? true : false;
//   // }

//   // renovartoken() {
//   //   const url = this.url + 'renovartoken';
//   //   this.getToken();

//   //   return this.http.get(url, {headers: this.headers}).map( (respuesta: any) => {
//   //     const res = respuesta.json();
//   //     this.token = res.token;

//   //     localStorage.setItem('token', this.token);

//   //     return true;
//   //   });
//   // }

// }

// interface Login {
//   email: string;
//   password: string;
// }
