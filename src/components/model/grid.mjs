class Tile {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    this.stack = [];
  }
}
class Block {
  constructor(variant) {
    this.variant = variant;
    this.type = "block";
  }
}
class Plant {
  constructor(variant) {
    this.variant = variant;
    this.type = "sprite";
  }
  get mesh() {
    return this.sprite && this.sprite.mesh;
  }
}
class Grid {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.data = [];
    for(let x = 0; x < this.width; x++) {
      this.data[x] = [];
      for(let y = 0; y < this.height; y++) {
        this.data[x][y] = new Tile(x, y);
        this.data[x][y].stack.push(new Block(Math.random() < 0.3 ? "sand" : "grass"));
        if(Math.random() < 0.3) {
          this.data[x][y].stack.push(new Plant("corn"));
        }
      }
    }
  }
  resize(newWidth, newHeight) {
    let newGrid = [];
    for(let x = 0; x < newWidth; x++) {
      newGrid[x] = [];
      for(let y = 0; y < newHeight; y++) {
        if(this.data[x] && this.data[x][y]) {
          newGrid[x][y] = this.data[x][y];
        }
        else {
          newGrid[x][y] = new Tile(x, y);
        }
      }
    }

    this.data = newGrid;
    this.width = newWidth;
    this.height = newHeight;
  }
  get(x, y) {
    if(x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return undefined;
    }

    return this.data[x][y];
  }
  *[Symbol.iterator]() {
    for(let x = 0; x < this.width; x++) {
      for(let y = 0; y < this.height; y++) {
        yield this.data[x][y];
      }
    }
  }
}

export default Grid;