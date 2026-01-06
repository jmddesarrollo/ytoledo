import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';

import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-redirect',
  templateUrl: './redirect.component.html',
  styleUrls: ['./redirect.component.css']
})
export class RedirectComponent implements OnInit {

  constructor(
    private router: Router,
    private websocketService: WebsocketService    
  ) { }

  ngOnInit(): void {
    if (this.websocketService.sessionOn) {
      this.router.navigate(['/my-profile']);
    } else {
      this.router.navigate(['/route-detail']);
    }    
  }

}
