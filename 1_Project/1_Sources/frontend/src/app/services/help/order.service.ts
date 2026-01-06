import { Injectable } from '@angular/core';

@Injectable()
export class OrderService {
  constructor() {}
  /**
   * Ordenación por campo 'name'
   */
   orderByName(arrObject) {
    // Ordenar por nombre
    arrObject.sort((a: any, b: any) =>
      a.name > b.name ? 1 :
        a.name < b.name ? -1 : 0
    );
    
    arrObject = [...arrObject];

    return arrObject;
  }

}

