
import { ThrowStmt } from '@angular/compiler';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Node } from './node';
import { nodeDrawer } from './nodeDrawer';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  title = 'SignalFlowGraph';

  input!: Node;
  output!: Node;
  forwardPathes: Array<string> = [];
  loops: Array<string> = [];
  nodesNumber: number = 0;
  started: boolean = false;
  finished:boolean = false;
  nodesDraw: nodeDrawer[] = [];
  startNode: string = "A";
  adjMatrix: number[][] = [[]];
  startingNode: number = 0;
  endingNode: number = 0;
  gain: number = 0;
  nodes: Array<Node> = [];
  overAllTF:number = 0;



  loopsGainMap = new Map<string, number>();
  forwardpathesGainMap = new Map<string, number>();
  deltaValuesArray: Array<number> = [];
  delta: number = 0;

  @ViewChild('myCanvas', { static: true }) myCanvas: ElementRef = {} as ElementRef;
  ctx: CanvasRenderingContext2D = {} as CanvasRenderingContext2D;

  ///////////////////// my work ///////////////////////
  ngOnInit():void{
    this.ctx = this.myCanvas.nativeElement.getContext('2d');
  }
  processGraph(): number {
    
    this.extractInfo(this.nodes);

    //////// my work /////////


    // pahts gain
    for (let i = 0; i < this.forwardPathes.length; i++) {
      this.forwardpathesGainMap.set(this.forwardPathes[i], this.GainCalculator(this.forwardPathes[i]))
    }

    // print paths gain
    for (let [key, value] of this.forwardpathesGainMap) {
      console.log("path " + key + " with gain = " + value);
    }

    console.log("");

    // loops gain
    for (let i = 0; i < this.loops.length; i++) {
      this.loopsGainMap.set(this.loops[i], this.GainCalculator(this.loops[i]));
    }

    // print loops gain
    for (let [key, value] of this.loopsGainMap) {
      console.log("loop " + key + " with gain = " + value);
    }
    console.log("");


    // combined loops array
    let allLoopCombination = this.getCombinationLoops(this.loops);

    // delta calculation
    this.delta = this.deltaCalculator(allLoopCombination);
    console.log("delta = " + this.delta);

    // delta array calculation
    this.deltaArrayCalculator(allLoopCombination);
    console.log("delta value array = " + this.deltaValuesArray);

    // transfer function calculation
    let tf = this.transferFunctionCalculator();
    console.log("transfer fn = " + tf);
    return tf;
    //////// my work /////////
  }



  //////// my work ///////////

  transferFunctionCalculator() {
    let pathDeltaSum = 0;
    for (let i = 0; i < this.forwardPathes.length; i++) {
      // @ts-ignore
      pathDeltaSum += this.forwardpathesGainMap.get(this.forwardPathes[i]) * this.deltaValuesArray[i];
    }
    return pathDeltaSum / this.delta;
  }

  GainCalculator(forwardPath: string) {
    let pathGain = 1;
    for (let i = 0; i < forwardPath.length - 1; i++) {
      pathGain *= this.adjMatrix[forwardPath.charCodeAt(i) - 65][forwardPath.charCodeAt(i + 1) - 65];
    }
    // console.log("path gain of " + forwardPath + " = " + pathGain);
    return pathGain;
  }

  deltaArrayCalculator(subsetLoops: Array<Array<string>>) {
    for (let i = 0; i < this.forwardPathes.length; i++) {
      let deltaLoops = this.getDeltaLoops(this.forwardPathes[i]);
      let deltaCombinedLoops = this.getCombinationLoops(deltaLoops);
      this.deltaValuesArray.push(this.deltaCalculator(deltaCombinedLoops));
    }
  }

  getDeltaLoops(path: string) {
    let removedPathMap = new Map<string, boolean>();
    let deltaLoops = [];
    let found = false;
    for (let i = 0; i < path.length; i++)
      removedPathMap.set(path.charAt(i), false);
    for (let i = 0; i < this.loops.length; i++) {
      found = false;
      for (let j = 0; j < this.loops[i].length; j++) {
        if (removedPathMap.has(this.loops[i].charAt(j))) {
          found = true;
          break;
        }
      }
      if (!found)
        deltaLoops.push(this.loops[i]);
    }
    return deltaLoops;

  }


  deltaCalculator(subsetLoops: Array<Array<string>>) {
    // length --> gain to add summation
    let nonTouchingLenGain = new Map<number, number>();
    let deltaValue = 1;
    for (let i = 0; i < subsetLoops.length; i++) {
      if (this.checkTouchingValidity(subsetLoops[i])) {
        let gain = 1;
        for (let j = 0; j < subsetLoops[i].length; j++)
          // @ts-ignore
          gain *= this.loopsGainMap.get(subsetLoops[i][j]);
        if (nonTouchingLenGain.has(subsetLoops[i].length)) {
          // @ts-ignore
          nonTouchingLenGain.set(subsetLoops[i].length, nonTouchingLenGain.get(subsetLoops[i].length) + gain);
        }
        else
          nonTouchingLenGain.set(subsetLoops[i].length, gain);

      }
    }

    // print non touching loops and their values

    // get delta = 1 - ind + 2 non-touch ............
    for (let [key, value] of nonTouchingLenGain) {
      if (key % 2 == 0)
        deltaValue += value;
      else
        deltaValue -= value;
    }
    return deltaValue;
  }

  checkTouchingValidity(loops: Array<string>) {
    let concatenatedLoop = "";
    let nodesOfLoopMap = new Map<string, number>();
    if (loops.length == 0) return false;
    for (let i = 0; i < loops.length; i++) {
      concatenatedLoop += loops[i].substring(0, loops[i].length - 1);
    }
    for (let i = 0; i < concatenatedLoop.length; i++) {
      if (nodesOfLoopMap.has(concatenatedLoop.charAt(i)))
        return false;
      else
        nodesOfLoopMap.set(concatenatedLoop.charAt(i), 0);
    }
    return true;
  }



  getCombinationLoops(loopArr: Array<string>) {
    let result = [];

    result.push([]);

    for (let i = 0; i < loopArr.length; i++) {

      let currentNum = loopArr[i];
      let len = result.length;

      for (let j = 0; j < len; j++) {
        let cloneData = result[j].slice();
        // @ts-ignore
        cloneData.push(currentNum);
        result.push(cloneData)
      }
    }

    return result;
  }


  ///////// my work ///////////


  extractInfo(nodes: Array<Node>) {
    nodes.forEach((node) => {
      this.pathTraverse(node.getKey(), node);
    });

    var clippedSortedLoops: Array<string> = [];
    this.loops.forEach(function (element) {
      if (element.length > 2)
        clippedSortedLoops.push(element.substring(1, element.length)
          .split("").sort().join(""));
      else
        clippedSortedLoops.push(element);
    });

    var finalLoops: Array<string> = [];
    for (let i = 0; i < this.loops.length; i++) {
      if (clippedSortedLoops.indexOf(clippedSortedLoops[i]) == i)
        finalLoops.push(this.loops[i]);
    }
    this.loops = finalLoops;
  }

  pathTraverse(path: string, node: Node) {
    if (node == this.output && path.charAt(0) == this.input.getKey()) {
      this.forwardPathes.push(path);
      return;
    }

    if (path.length > 1 && path.charAt(0) == path.charAt(path.length - 1)) {
      this.loops.push(path);
      return;
    }

    if (path.indexOf(node.getKey()) != path.length - 1)
      return;

    var out: Array<Node> = node.getOut();
    for (let i = 0; i < out.length; i++) {
      var nextNode: Node = out[i];
      this.pathTraverse(path + nextNode.getKey(), nextNode);
    }
  }

  /* My Functions */
  public takeInput(): void {
    this.started = true;
    for (let i = 0; i < this.nodesNumber; i++) {
      this.nodesDraw.push(new nodeDrawer(this.ctx, this.startNode));
      this.startNode = String.fromCodePoint(this.startNode.charCodeAt(0) + 1);
    }
    for (let i = 0; i < this.nodesNumber; i++) {
      this.adjMatrix[i] = [];
      for (let j = 0; j < this.nodesNumber; j++) {
        this.adjMatrix[i][j] = 0;
      }
    }
  }
  setGain(): void {
    if (this.gain != 0) {
      if (!(this.startingNode < 1 || this.startingNode > this.nodesNumber ||
        this.endingNode < 1 || this.endingNode > this.nodesNumber)) {
        if (this.drawGain(this.startingNode - 1, this.endingNode - 1) == 0) {
          return;
        }
        this.adjMatrix[this.startingNode - 1][this.endingNode - 1] = this.gain;
      }
    }
  }
  drawGain(first: number, second: number): number {
    let offset = 1;
    let clockWise = true;
    let node1 = this.nodesDraw[first];
    let node2 = this.nodesDraw[second];
    let help_x = (node1.myCenter_x + node2.myCenter_x) / 2;
    let help_y = node1.myCenter_y;
    let rad = Math.abs(help_x - node1.myCenter_x) + 10;

    if (this.adjMatrix[first][second] != 0) {
      return 0;
    }
    if (first > second) {
      clockWise = false;
      rad = rad * -1;
      offset = -1;
    }
    if (first == second) {
      if (this.adjMatrix[first][second] == 0) {
        this.ctx.beginPath();
        this.ctx.ellipse(node1.myCenter_x, node1.myCenter_y, nodeDrawer.radius, nodeDrawer.radius + 10, Math.PI / 2, Math.PI, 0, true);
        this.ctx.strokeStyle = "black";
        this.ctx.fillText(this.gain.toString(), node1.myCenter_x - nodeDrawer.radius - 30, node1.myCenter_y);
        this.ctx.stroke();
        this.nodesDraw[first].reDraw();

        this.ctx.beginPath();
        this.ctx.strokeStyle = "black";
        this.ctx.moveTo(node1.myCenter_x - nodeDrawer.radius - 10, node1.myCenter_y);
        this.ctx.lineTo(node1.myCenter_x - nodeDrawer.radius - 10 - 5, node1.myCenter_y + 10);
        this.ctx.moveTo(node1.myCenter_x - nodeDrawer.radius - 10, node1.myCenter_y);
        this.ctx.lineTo(node1.myCenter_x - nodeDrawer.radius - 10 + 5, node1.myCenter_y + 10);
        this.ctx.stroke();
        return 1;
      }
      else {
        return 0;
      }
    }



    this.ctx.beginPath();
    this.ctx.strokeStyle = "black";
    this.ctx.arc(help_x, help_y, Math.abs(rad), Math.PI, 0, clockWise);
    this.ctx.fillText(this.gain.toString(), help_x, help_y + rad + 10 * offset);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(help_x, help_y + rad);
    this.ctx.lineTo(help_x - 5 * offset, help_y + 5 + rad);
    this.ctx.moveTo(help_x, help_y + rad);
    this.ctx.lineTo(help_x - 5 * offset, help_y + rad - 5);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(node1.myCenter_x, node1.myCenter_y, nodeDrawer.radius, 0, 2 * Math.PI);
    this.ctx.fillStyle = "white";
    this.ctx.fill();


    this.ctx.beginPath();
    this.ctx.arc(node2.myCenter_x, node2.myCenter_y, nodeDrawer.radius, 0, 2 * Math.PI);
    this.ctx.fillStyle = "white";
    this.ctx.fill();
    this.nodesDraw[first].reDraw();
    this.nodesDraw[second].reDraw();
    return 1;
  }

  calculate():void{
    let no = "A";
    for (let i=0; i<this.nodesNumber; i++){
      let node:Node = new Node ((String.fromCodePoint(no.charCodeAt(0)+i)));
      this.nodes.push(node);
    }
    for (let i=0; i<this.nodesNumber; i++){
      let outNoeds = [];
      for (let j=0; j<this.nodesNumber; j++){
        if (this.adjMatrix[i][j] != 0){
          outNoeds.push(this.nodes[j]);
        }
        this.nodes[i].setOut(outNoeds);
      }
    }
    this.input = this.nodes[0]
    this.output = this.nodes[this.nodesNumber-1];
    this.overAllTF = this.processGraph();
    this.finished = true;
    this.ctx.clearRect(0, 0, 2000, 2000);
    this.drawFinal();
  }

  drawFinal():void{
    this.ctx.beginPath();
    this.ctx.strokeStyle = nodeDrawer.color;
    this.ctx.arc(200, 200, 100, 0, 2 * Math.PI, false)
    this.ctx.fillText("A", 200, 200);
    this.ctx.stroke();
    this.ctx.closePath();

    this.ctx.beginPath();
    this.ctx.strokeStyle = nodeDrawer.color;
    this.ctx.arc(500, 200, 100, 0, 2 * Math.PI, false)
    this.ctx.fillText(String.fromCodePoint(65+this.nodesNumber), 500, 200);
    this.ctx.stroke();
    this.ctx.closePath();

    this.ctx.beginPath();
    this.ctx.moveTo(300, 200);
    this.ctx.lineTo(400, 200);

    this.ctx.moveTo(350, 200);
    this.ctx.lineTo(345, 195);

    this.ctx.moveTo(350, 200);
    this.ctx.lineTo(345, 205);

    this.ctx.stroke();
    this.ctx.fillText(this.overAllTF.toString(), 350, 100);
    console.log("OverAll = "+this.overAllTF);
    
  }
}
