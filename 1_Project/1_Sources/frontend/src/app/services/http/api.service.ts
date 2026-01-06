import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';

/**
 * Servicio para probar en test APIs
 */
@Injectable()
export class ApiService {
    public headers: any;
    public url: string;

    constructor(
        private http: HttpClient
    ) {
        this.headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        this.url = 'http://preproduccion:5555';
    }

    postLicApi(data: any) {
        const params = JSON.stringify(data);
        
        const url = this.url + '/lic';

        return this.http.post(url, params, { headers: this.headers });
    }

}
