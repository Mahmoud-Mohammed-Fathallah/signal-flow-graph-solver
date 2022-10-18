import { ElementRef, Injectable, ViewChild } from "@angular/core";

@Injectable({
  providedIn: 'root'
})

export class nodeDrawer {
  static num:number = 0;
  static radius:number = 30;
  static center_x = 100;
  static center_y = 100;
  myCenter_x:number = 0;
  myCenter_y:number = 0;
  static color:string = "#0d41d1";
  id:string = "";

  @ViewChild('myCanvas', { static: true }) myCanvas: ElementRef = {} as ElementRef;
  ctx: CanvasRenderingContext2D = {} as CanvasRenderingContext2D;

  constructor (ctx:CanvasRenderingContext2D, id:String) {
    this.id = id.valueOf();
    this.ctx = ctx;
    this.myCenter_x = nodeDrawer.center_x;
    this.myCenter_y = nodeDrawer.center_y;
    this.draw();
  }

  draw():void{
    this.ctx.beginPath();
    this.ctx.strokeStyle = nodeDrawer.color;
    this.ctx.arc(nodeDrawer.center_x, nodeDrawer.center_y, nodeDrawer.radius, 0, 2 * Math.PI, false)
    this.ctx.fillText(this.id, nodeDrawer.center_x, nodeDrawer.center_y);
    this.ctx.stroke();
    this.ctx.closePath();
    nodeDrawer.center_x += 3*nodeDrawer.radius;
  }
  reDraw():void{
    this.ctx.beginPath();
    this.ctx.strokeStyle = nodeDrawer.color;
    this.ctx.arc(this.myCenter_x, this.myCenter_y, nodeDrawer.radius, 0, 2 * Math.PI, false);
    this.ctx.fillStyle = "black";
    this.ctx.fillText(this.id, this.myCenter_x, this.myCenter_y);
    this.ctx.stroke();
    this.ctx.closePath();
  }
}
