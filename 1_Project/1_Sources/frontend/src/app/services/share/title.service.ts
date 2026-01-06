import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable()
export class TitleShareService {

  private objTitle = new BehaviorSubject<any>('');
  currentTitle = this.objTitle.asObservable();

  constructor() {}

  changeTitle(title: any): any {
    this.objTitle.next(title);
  }
}
