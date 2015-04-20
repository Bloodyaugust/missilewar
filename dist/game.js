/*! missilewar 19-04-2015 */
function logPlay(){_gaq.push(["_trackEvent","Button","Play"])}function start(){var a=new Date;window.app=new SL.Game({canvas:document.getElementById("GameCanvas")}),app.fullscreen(),app.assetCollection=new SL.AssetCollection("res/assets.json",app,function(){_gaq.push(["_trackEvent","Game","Load","",(new Date-a)/1e3]),$(".canvas-container").append(domjs.build(templates.modal));var b=new SL.Scene("loading",[],function(){},app);b.addEntity(new SL.Loader({assetCollection:app.assetCollection,screenSize:SCREEN_SIZE,loadCallback:function(){app.transitionScene("menu")},barColor:"blue",textColor:"green"}));var c=new SL.Scene("menu",[],function(){var a=$(".modal");a.append(domjs.build(templates.menu)),$(".menu .button").on("click",function(){a.empty(),a.off(),app.transitionScene($(this).attr("id"))})},app),d=new SL.Scene("game",[],function(){var a=$(".modal");a.empty(),a.off(),a.hide(),app.currentScene.addEntity({type:"background",sprite:new PIXI.Sprite(app.assetCollection.getTexture("background")),update:function(){}}),app.currentScene.addEntity(new Player),app.currentScene.addEntity(new Platform({position:new SL.Vec2(SCREEN_SIZE.x/2,SCREEN_SIZE.y-256),type:"basic"})),app.currentScene.addEntity(new Platform({position:new SL.Vec2(SCREEN_SIZE.x/2,192),type:"basic",rotation:180}))},app),e=new SL.Scene("score",[],function(a){var b=$(".modal");b.append(domjs.build(templates.score)),b.show(),$(".menu .button").on("click",function(){b.empty(),b.off(),app.transitionScene($(this).attr("id"))})},app);app.addScene(b),app.addScene(c),app.addScene(d),app.addScene(e),app.transitionScene("loading"),app.start()})}function Projectile(a){var b=this,c=app.currentScene.assetCollection.assets.projectiles[a.type];b.sprite=new PIXI.Sprite(app.assetCollection.getTexture(a.type)),b.sprite.position=a.position.clone(),b.sprite.origin=new Vec2(b.sprite.texture.width/2,b.sprite.texture.height/2),b.sprite.rotation=a.rotation,b.sprite.shader=new ColorReplaceFilter(16777215,16711680,.1),b.collider=new SL.Circle(b.sprite.origin.getTranslated(new SL.Vec2(0,-b.sprite.texture.height/2)).rotate(b.sprite.origin,b.sprite.rotation),2),b.silo=a.silo,b.state="idle",b.tag="projectile";for(var d in c)c.hasOwnProperty(d)&&(b[d]=c[d]);b.update=function(){var a=app.currentScene.getEntitiesByTag("platform"),c=app.currentScene.getEntitiesByTag("building");if("exploding"!==b.state&&"exploded"!==b.state){b.sprite.position.translateAlongRotation(b.speed*app.deltaTime,b.sprite.rotation),b.collider.location.translateAlongRotation(b.speed*app.deltaTime,b.sprite.rotation);for(var d=0;d<a.length;d++)if(a[d].entityID!==b.silo.platform.entityID&&b.collider.intersects(a[d].collider)){a[d].shield-=b.damage,b.state="exploding";break}if("exploding"!==b.state)for(d=0;d<c.length;d++)if(c[d].entityID!==b.silo.platform.entityID&&b.collider.intersects(c[d].collider)){c[d].health-=b.damage,b.state="exploding";break}}}}function Tile(a){var b=this;b.sprite=new PIXI.Sprite(app.assetCollection.getTexture("tile")),b.sprite.position=a.position.clone(),b.tag="tile",b.collider=new SL.Rect(a.position,TILE_SIZE),b.platform=a.platform,b.building=null,b.state="idle",b.update=function(){b.sprite.setTexture("active"===b.state?app.assetCollection.getTexture("tile-active"):app.assetCollection.getTexture("tile")),b.state="idle"}}function Building(a){var b=this,c=app.currentScene.assetCollection.assets.buildings[a.type];b.sprite=new PIXI.Sprite(app.assetCollection.getTexture("tile")),b.sprite.position=a.position.clone(),b.tag="building",b.platform=a.platform,b.tile=a.tile,b.type=a.type,b.state="idle",b.collider=new SL.Circle(b.tile.collider.origin,TILE_SIZE.x/2);for(var d in c)c.hasOwnProperty(d)&&(b[d]=c[d]);b.update=function(){}}function Platform(a){var b=this,c=app.assetCollection.assets.platforms[a.type];b.tag="platform",b.type=a.type,b.maxShield=PLATFORM_INITIAL_MAX_SHIELD,b.shield=b.maxShield,b.buildings=a.buildings||[],b.tiles=a.tiles||[],b.corePosition=a.position.clone(),b.collider=new SL.Circle(b.corePosition,PLATFORM_SHIELD_SIZE),b.rotation=a.rotation||0;for(var d=0;d<c.length;d++)b.tiles.push(new Tile({position:a.position.getTranslated(new SL.Vec2(c[d].x*TILE_SIZE.x,c[d].y*TILE_SIZE.y)),platform:b})),a.rotation&&(b.tiles[d].sprite.position.rotate(a.position,a.rotation),b.tiles[d].collider.setLocation(b.tiles[d].sprite.position)),app.currentScene.addEntity(b.tiles[d]);b.update=function(){}}function Player(){var a=this;a.buildings=app.assetCollection.assets.buildings,a.selection=null,a.previousSelection=null,a.uiRequests=[],a.update=function(){for(var b,c={rect:new SL.Rect(app.mouseLocation.getTranslated(app.currentScene.camera.position.getScaled(-1)),new SL.Vec2(1,1)),circle:new SL.Circle(app.mouseLocation.getTranslated(app.currentScene.camera.position.getScaled(-1)),1)},d=app.currentScene.getEntitiesByTag("tile"),e=0;e<d.length;e++)if(c.rect.intersects(d[e].collider)){d[e].state="active",b=d[e];break}!app.onMouseUp()||!b||a.selection&&a.selection.entityID===b.entityID||(!b.building||a.selection&&a.selection.entityID===b.building.entityID?(a.previousSelection=a.selection?a.selection:null,a.selection=b):(a.previousSelection=a.selection?a.selection:null,a.selection=b.building),a.updateUI())},a.updateUI=function(){a.selection.building},a.requestUIUpdate=function(){}}SL=sugarLab;var SCREEN_SIZE=new SL.Vec2(document.documentElement.clientWidth,document.documentElement.clientHeight),TILE_SIZE=new SL.Vec2(64,64),PLATFORM_SHIELD_SIZE=384,PLATFORM_INITIAL_MAX_SHIELD=100,ColorReplaceFilter=function(a,b,c){PIXI.AbstractFilter.call(this),this.uniforms={findColor:{type:"3f",value:null},replaceWithColor:{type:"3f",value:null},range:{type:"1f",value:null}},this.findColor=a,this.replaceWithColor=b,this.range=c,this.passes=[this],this.fragmentSrc=["precision mediump float;","varying vec2 vTextureCoord;","uniform sampler2D texture;","uniform vec3 findColor;","uniform vec3 replaceWithColor;","uniform float range;","void main(void) {","  vec4 currentColor = texture2D(texture, vTextureCoord);","  vec3 colorDiff = findColor - (currentColor.rgb / max(currentColor.a, 0.0000000001));","  float colorDistance = length(colorDiff);","  float doReplace = step(colorDistance, range);","  gl_FragColor = vec4(mix(currentColor.rgb, (replaceWithColor + colorDiff) * currentColor.a, doReplace), currentColor.a);","}"]};ColorReplaceFilter.prototype=Object.create(PIXI.AbstractFilter.prototype),ColorReplaceFilter.prototype.constructor=ColorReplaceFilter,Object.defineProperty(ColorReplaceFilter.prototype,"findColor",{set:function(a){var b=((16711680&a)>>16)/255,c=((65280&a)>>8)/255,d=(255&a)/255;this.uniforms.findColor.value={x:b,y:c,z:d},this.dirty=!0}}),Object.defineProperty(ColorReplaceFilter.prototype,"replaceWithColor",{set:function(a){var b=((16711680&a)>>16)/255,c=((65280&a)>>8)/255,d=(255&a)/255;this.uniforms.replaceWithColor.value={x:b,y:c,z:d},this.dirty=!0}}),Object.defineProperty(ColorReplaceFilter.prototype,"range",{set:function(a){this.uniforms.range.value=a,this.dirty=!0}});