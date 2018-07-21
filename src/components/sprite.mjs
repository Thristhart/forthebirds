import * as THREE from "three";

import unlitSpriteShaderMaterial from "../vendor/unlitspriteshader.mjs";

import TextureCache from "./model/texture_cache.mjs";

const SPRITE_SCALE = 0.2;

class Sprite {
  constructor(path, sheetGridWidth, sheetGridHeight) {
    this.path = path;

    let cachedTexture = TextureCache.get(path);
    if(cachedTexture) {
      this.texture = cachedTexture;
      this.shadowMap = TextureCache.get(path + "_shadow");

      let next = () => {};
      if(this.texture.onUpdate) {
        next = this.texture.onUpdate;
      }
      this.texture.onUpdate = () => {
        this.onTextureLoad();
        next();
      };
    }
    else {
      this.texture = new THREE.TextureLoader().load(path, () => this.onTextureLoad());
      this.shadowMap = new THREE.TextureLoader().load(path);
      TextureCache.set(path, this.texture);
      TextureCache.set(path + "_shadow", this.shadowMap);
    }

    
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.RepeatWrapping;
    this.shadowMap.minFilter = THREE.NearestFilter;
    this.shadowMap.magFilter = THREE.NearestFilter;
    this.shadowMap.wrapS = THREE.RepeatWrapping;
    this.shadowMap.wrapT = THREE.RepeatWrapping;

    this.sheetGridWidth = sheetGridWidth;
    this.sheetGridHeight = sheetGridHeight;

    
    this.material = unlitSpriteShaderMaterial(this.texture, 0xffffff);
    this.material.side = THREE.DoubleSide;
    this.geometry = new THREE.PlaneGeometry(10, 10);
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: this.shadowMap,
      alphaTest: 0.1,
    });

    this.mesh.rotateY(Math.PI / 4);

    this.material.repeat.set(1 / this.sheetGridWidth, 1 / this.sheetGridHeight);

    this.frame = 0;
  }

  set frame(newFrame) {
    this.material.offset.set(newFrame / this.sheetGridWidth, 1 / this.sheetGridHeight);
    this.shadowMap.offset.copy(this.material.offset);
    this.shadowMap.repeat.copy(this.material.repeat);
  }

  onTextureLoad() {
    this.mesh.scale.set(
      this.texture.image.width / this.sheetGridWidth * SPRITE_SCALE,
      this.texture.image.height / this.sheetGridHeight * SPRITE_SCALE,
      1,
    );
  }
}

export default Sprite;