export class Node {

  private key:string = "";
  private out:Array<Node> = [];

  public constructor(key:string){
    this.key = key;
  }

  public getKey() : string{
    return this.key;
  }

  public setKey(key:string){
    this.key = key;
  }

  public getOut() : Array<Node>{
    return this.out;
  }

  public setOut(out:Array<Node>){
    this.out = out;
  }

  public addOut(node:Node){
    this.out.push(node);
  }

}
