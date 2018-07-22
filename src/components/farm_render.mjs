import * as THREE from "three";
import Lines from "../vendor/lines.mjs";
const {LineGeometry, LineSegments2, LineMaterial} = Lines;
import Sprite from "./sprite.mjs";

import CONSTANTS from "../constants.mjs";

const ISO_ANGLE = Math.atan2(1, 1);
const ISO_CAMERA_RADIUS = 1 / Math.cos(ISO_ANGLE);

const GRID_UNIT_SIZE = 100;

const HALF_GRID = GRID_UNIT_SIZE / 2;

const SHADOW_LIGHT_DISTANCE = 30;

class FarmRenderer {
  constructor(canvas, grid) {
    this.canvas = canvas;
    this.grid = grid;
    this.sceneItems = [];
    this.activeSprites = [];

    this.sprites = {};

    this.getCurrentSize();

    let aspect = this.width / this.height;
    this._distance = 5 * GRID_UNIT_SIZE;
    this.cameraRadiusPercentage = 1;
    this.angle = 0;

    this.camera = new THREE.OrthographicCamera(
      -this._distance * aspect,
      this._distance * aspect,
      this._distance,
      -this._distance,
      -10 * GRID_UNIT_SIZE,
      100 * GRID_UNIT_SIZE
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
    });

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    this.buildScene();

    this.position = new THREE.Vector3(0, 0, 0);

    this.cameraAngle = 0;
  }

  getCurrentSize() {
    let boundingBox = this.canvas.getBoundingClientRect();

    this.width = boundingBox.width;
    this.height = boundingBox.height;
  }

  getCurrentFacing() {
    let vector = new THREE.Vector3();
    this.camera.getWorldDirection(vector);
    return vector;
  }
  getFlatFacing() {
    let realFacing = this.getCurrentFacing();
    realFacing.y = 0;
    return realFacing;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.updateCameraDistance();
    let rect = this.canvas.getBoundingClientRect();
    this.scaledWidth = rect.width;
    this.scaledHeight = rect.height;
  }

  updateCameraProjection() {
    let cameraPos = new THREE.Cylindrical(ISO_CAMERA_RADIUS * this.distance * this.cameraRadiusPercentage, ISO_ANGLE + this.angle, this.distance * 0.8);
    let position = new THREE.Vector3();
    position.setFromCylindrical(cameraPos);
    position.add(this.position);
    this.camera.position.copy(position);
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.position);
  }
  updateCameraDistance() {
    let aspect = this.width / this.height;
    this.camera.left = -this._distance * aspect;
    this.camera.right = this._distance * aspect;
    this.camera.top = this._distance;
    this.camera.bottom = -this._distance;
    this.updateCameraProjection();
  }

  translateGridPosToWorldPos(gridPos) {
    let gridCenterOffset = GRID_UNIT_SIZE / 2;
    let worldX = gridPos.x * GRID_UNIT_SIZE + gridCenterOffset;
    let worldY = gridPos.y * GRID_UNIT_SIZE + gridCenterOffset;

    let widthOffset = (this.grid.width * GRID_UNIT_SIZE) / 2;
    let heightOffset = (this.grid.height * GRID_UNIT_SIZE) / 2;

    let translatedX = worldX - widthOffset;
    let translatedY = worldY - heightOffset;

    return new THREE.Vector3(
      translatedY,
      GRID_UNIT_SIZE / 2,
      -translatedX
    );
  }

  translateWorldPosToGridPos(worldPos) {
    let gridCenterOffset = GRID_UNIT_SIZE / 2;
    let widthOffset = (this.grid.width * GRID_UNIT_SIZE) / 2;
    let heightOffset = (this.grid.height * GRID_UNIT_SIZE) / 2;

    let x = worldPos.z * -1;
    let y = worldPos.x;

    x += widthOffset;
    y += heightOffset;

    x = Math.floor(x / GRID_UNIT_SIZE);
    y = Math.floor(y / GRID_UNIT_SIZE);

    return {x, y};
  }

  raycastMousePosition(mouseX, mouseY) {
    let mouseVector = new THREE.Vector3();
    mouseVector.x = 2 * (mouseX / this.scaledWidth) - 1;
    mouseVector.y = 1 - 2 * (mouseY / this.scaledHeight);

    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouseVector, this.camera);
    let intersection = raycaster.intersectObjects(this.sceneItems);
    if(intersection.length === 0) {
      return false;
    }
    return intersection[0];
  }

  get distance() {
    return this._distance;
  }

  set distance(newDistance) {
    this._distance = newDistance;
    this.updateCameraDistance();
  }

  set cameraAngle(angle) {
    this.angle = angle;
    this.updateCameraProjection();
  }
  get cameraAngle() {
    return this.angle;
  }

  buildScene() {
    this.scene = new THREE.Scene();

    const gridGeometry = new THREE.PlaneGeometry(
      // dimensions
      GRID_UNIT_SIZE * this.grid.width * 2,
      GRID_UNIT_SIZE * this.grid.height * 2,
      // segments
      this.grid.width * 2, this.grid.height * 2
    );
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x00cc00,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });

    this.grassTexture = new THREE.TextureLoader().load('./assets/images/tileGrass1.png');
    this.sandTexture = new THREE.TextureLoader().load('./assets/images/tileSand1.png');
    this.sandToGrassTexture = new THREE.TextureLoader().load('./assets/images/tileGrass_transitionS.png');

    this.grassMaterial = new THREE.MeshLambertMaterial({map: this.grassTexture});
    this.sandMaterial = new THREE.MeshLambertMaterial({map: this.sandTexture});
    this.sandToGrassMaterial = new THREE.MeshLambertMaterial({map: this.sandToGrassTexture});

    this.loadSprites();

    let lineGeo = new LineGeometry();
    lineGeo.setPositions([
      -HALF_GRID,
      HALF_GRID,
      -HALF_GRID,

      HALF_GRID,
      HALF_GRID,
      -HALF_GRID,

      HALF_GRID,
      HALF_GRID,
      HALF_GRID,

      -HALF_GRID,
      HALF_GRID,
      HALF_GRID,

      -HALF_GRID,
      HALF_GRID,
      -HALF_GRID,
    ]);
    let line = new LineSegments2( lineGeo, new LineMaterial( { color: 0xffffff, linewidth: 0.005 } ) );
    this.scene.add(line);

    this.selectionLine = line;


    let shadowLight = new THREE.DirectionalLight(0xffffff, 1);
    shadowLight.position.set(-4 * GRID_UNIT_SIZE, 9 * GRID_UNIT_SIZE, -4 * GRID_UNIT_SIZE);
    shadowLight.castShadow = true;
    shadowLight.shadow.camera.top = this.grid.height * GRID_UNIT_SIZE;
    shadowLight.shadow.camera.bottom = -this.grid.height * GRID_UNIT_SIZE;
    shadowLight.shadow.camera.left = -this.grid.width * GRID_UNIT_SIZE;
    shadowLight.shadow.camera.right = this.grid.width * GRID_UNIT_SIZE;
    shadowLight.shadow.camera.far = SHADOW_LIGHT_DISTANCE * 2 * GRID_UNIT_SIZE;

    shadowLight.shadow.mapSize.width = 1024;
    shadowLight.shadow.mapSize.height = 1024;

    var helper = new THREE.CameraHelper( shadowLight.shadow.camera );
    //this.scene.add( helper );

    this.shadowLight = shadowLight;

    this.scene.add(shadowLight);

    let ambient = new THREE.AmbientLight( 0xffffbb, 0.2 );
    this.ambientLight = ambient;
    this.scene.add(ambient);

    this.scene.background = new THREE.Color(0x6495ed);

    let materials = [
      this.sandMaterial,
      this.sandMaterial,
      this.sandMaterial,
      this.sandMaterial,
      this.sandMaterial,
      this.sandMaterial,
    ];
    const boxGeometry = new THREE.BoxGeometry(GRID_UNIT_SIZE, GRID_UNIT_SIZE, GRID_UNIT_SIZE);
    const box = new THREE.Mesh(boxGeometry, materials);
    box.castShadow = true;
    this.scene.add(box);
    const position = this.translateGridPosToWorldPos({x: 0, y: 0});
    position.z = 3;
    box.position.copy(position);
  }

  updateScene() {
    let first = 0;
    for(let tile of this.grid) {
      for(const [index, item] of tile.stack.entries()) {

        let height = index;

        if(!item.mesh) {
          if(item.type === "sprite") {
            item.sprite = this.cloneSprite(this.sprites[item.variant]);
            item.sprite.frame = 5;
            this.sceneItems.push(item.mesh);
            item.mesh.castShadow = true;
            this.activeSprites.push(item.sprite);
            this.scene.add(item.mesh);
          }
          if(item.type === "block") {
            let materials = [];
            
            if(item.variant === "sand") {
              materials = [
                this.sandMaterial,
                this.sandMaterial,
                this.sandMaterial,
                this.sandMaterial,
                this.sandMaterial,
                this.sandMaterial,
              ];
            }
            if(item.variant === "grass") {
              materials = [
                this.sandToGrassMaterial,
                this.sandToGrassMaterial,
                this.grassMaterial,
                this.sandToGrassMaterial,
                this.sandToGrassMaterial,
                this.sandToGrassMaterial,
              ];
            }

            const boxGeometry = new THREE.BoxGeometry(GRID_UNIT_SIZE, GRID_UNIT_SIZE, GRID_UNIT_SIZE);
            const box = new THREE.Mesh(boxGeometry, materials);
            if(height > 0) {
              box.castShadow = true;
            }
            else {
              box.receiveShadow = true;
            }

            item.mesh = box;
            this.sceneItems.push(box);
            this.scene.add(box);
          }
        }

        const position = this.translateGridPosToWorldPos(tile);
        position.y = GRID_UNIT_SIZE / 2 + GRID_UNIT_SIZE * height;

        if(item.type === "sprite") {
          position.y += GRID_UNIT_SIZE / 8;
        }

        if(item.mesh) {
          item.mesh.position.copy(position);
        }

        if(this.grid.hovered === tile) {
          this.scene.add(this.selectionLine);
          this.selectionLine.position.copy(position);
          this.selectionLine.position.y += GRID_UNIT_SIZE / 50;
        }
      }
    }
  }

  cloneSprite(base) {
    let sprite = new Sprite(base.path, base.sheetGridWidth, base.sheetGridHeight);
    return sprite;
  }

  async loadSprites() {
    this.sprites.corn = new Sprite("./assets/images/corn.png", 6, 1);
  }

  update(dt, state) {
    let timeOfDay = state.timestamp % CONSTANTS.DAY_LENGTH;
    const dayPercentage = timeOfDay / CONSTANTS.DAY_LENGTH;

    let sunAngle = dayPercentage * Math.PI * 2;

    sunAngle -= Math.PI;

    let brightness = Math.max(0.1, Math.cos(sunAngle));

    this.shadowLight.position.set(Math.sin(sunAngle) * GRID_UNIT_SIZE * SHADOW_LIGHT_DISTANCE, Math.cos(sunAngle) * GRID_UNIT_SIZE * SHADOW_LIGHT_DISTANCE, 0);
    this.shadowLight.intensity = brightness;
    const spriteLighting = brightness;
    this.activeSprites.forEach(sprite => {
      sprite.material.color.set(new THREE.Color(spriteLighting, spriteLighting, spriteLighting));
    });

    this.renderer.render(this.scene, this.camera);
  }
}

export default FarmRenderer;