SL = sugarLab;

var SCREEN_SIZE = new SL.Vec2(document.documentElement.clientWidth, document.documentElement.clientHeight),
	TILE_SIZE = new SL.Vec2(64, 64),
	PLATFORM_SHIELD_SIZE = 384,
	PLATFORM_INITIAL_MAX_SHIELD = 100;

function logPlay() {
	_gaq.push(['_trackEvent', 'Button', 'Play']);
}

function start() {
	var startLoad = new Date;

	window.app = new SL.Game({
		canvas: document.getElementById('GameCanvas')
	});

	app.fullscreen();

	app.assetCollection = new SL.AssetCollection('res/assets.json', app, function() {
		_gaq.push(['_trackEvent', 'Game', 'Load', '', (new Date - startLoad) /
			1000
		]);
		$('.canvas-container').append(domjs.build(templates.modal));

		var loadingScene = new SL.Scene('loading', [], function() {}, app);

		loadingScene.addEntity(new SL.Loader({
			assetCollection: app.assetCollection,
			screenSize: SCREEN_SIZE,
			loadCallback: function() {
				app.transitionScene('menu');
			},
			barColor: 'blue',
			textColor: 'green'
		}));

		var menuScene = new SL.Scene('menu', [], function() {
			var modal = $('.modal');

			modal.append(domjs.build(templates.menu));

			$('.menu .button').on('click', function() {
				modal.empty();
				modal.off();
				app.transitionScene($(this).attr('id'));
			});
		}, app);

		var gameScene = new SL.Scene('game', [], function() {
			var modal = $('.modal');
			modal.empty();
			modal.off();
			modal.hide();

			app.currentScene.addEntity({
				type: 'background',
				sprite: new PIXI.Sprite(app.assetCollection.getTexture('background')),
				update: function() {}
			});

			app.currentScene.addEntity(new Player());
			app.currentScene.addEntity(new Platform({
				position: new SL.Vec2(SCREEN_SIZE.x / 2, SCREEN_SIZE.y - 256),
				type: 'basic'
			}));
			app.currentScene.addEntity(new Platform({
				position: new SL.Vec2(SCREEN_SIZE.x / 2, 192),
				type: 'basic',
				rotation: 180
			}));
		}, app);

		var scoreScene = new SL.Scene('score', [], function(entities) {
			var modal = $('.modal');

			modal.append(domjs.build(templates.score));
			modal.show();

			$('.menu .button').on('click', function() {
				modal.empty();
				modal.off();
				app.transitionScene($(this).attr('id'));
			});
		}, app);

		app.addScene(loadingScene);
		app.addScene(menuScene);
		app.addScene(gameScene);
		app.addScene(scoreScene);
		app.transitionScene('loading');

		app.start();
	});
}

function Projectile (config) {
	var _this = this,
		assetConfig = app.currentScene.assetCollection.assets.projectiles[config.type];

	_this.sprite = new PIXI.Sprite(app.assetCollection.getTexture(config.type));
	_this.sprite.position = config.position.clone();
	_this.sprite.origin = new Vec2(_this.sprite.texture.width / 2, _this.sprite.texture.height / 2);
	_this.sprite.rotation = config.rotation;
	_this.sprite.shader = new ColorReplaceFilter(0xFFFFFF, 0xFF0000, 0.1);
	_this.collider = new SL.Circle(_this.sprite.origin.getTranslated(new SL.Vec2(0, -_this.sprite.texture.height / 2)).rotate(_this.sprite.origin, _this.sprite.rotation), 2);
	_this.silo = config.silo;
	_this.state = 'idle';
	_this.tag = 'projectile';

	for (var key in assetConfig) {
		if (assetConfig.hasOwnProperty(key)) {
			_this[key] = assetConfig[key];
		}
	}

	_this.update = function () {
		var platforms = app.currentScene.getEntitiesByTag('platform'),
			buildings = app.currentScene.getEntitiesByTag('building');

		if (_this.state !== 'exploding' && _this.state !== 'exploded') {
			_this.sprite.position.translateAlongRotation(_this.speed * app.deltaTime, _this.sprite.rotation);
			_this.collider.location.translateAlongRotation(_this.speed * app.deltaTime, _this.sprite.rotation);

			for (var i = 0; i < platforms.length; i++) {
				if (platforms[i].entityID !== _this.silo.platform.entityID &&
				_this.collider.intersects(platforms[i].collider)) {
					platforms[i].shield -= _this.damage;

					_this.state = 'exploding';
					break;
				}
			}

			if (_this.state !== 'exploding') {
				for (i = 0; i < buildings.length; i++) {
					if (buildings[i].entityID !== _this.silo.platform.entityID &&
					_this.collider.intersects(buildings[i].collider)) {
						buildings[i].health -= _this.damage;

						_this.state = 'exploding';
						break;
					}
				}
			}
		}
	};
}

function Tile (config) {
	var _this = this;

	_this.sprite = new PIXI.Sprite(app.assetCollection.getTexture('tile'));
	_this.sprite.position = config.position.clone();
	_this.tag = 'tile';
	_this.collider = new SL.Rect(config.position, TILE_SIZE);
	_this.platform = config.platform;
	_this.building = null;
	_this.state = 'idle';

	_this.update = function () {
		if (_this.state === 'active') {
			_this.sprite.setTexture(app.assetCollection.getTexture('tile-active'));
		} else {
			_this.sprite.setTexture(app.assetCollection.getTexture('tile'));
		}

		_this.state = 'idle';
	};
}

function Building (config) {
	var _this = this,
		assetConfig = app.currentScene.assetCollection.assets.buildings[config.type];

	_this.sprite = new PIXI.Sprite(app.assetCollection.getTexture('tile'));
	_this.sprite.position = config.position.clone();
	_this.tag = 'building';
	_this.platform = config.platform;
	_this.tile = config.tile;
	_this.type = config.type;
	_this.state = 'idle';
	_this.collider = new SL.Circle(_this.tile.collider.origin, TILE_SIZE.x / 2);

	for (var key in assetConfig) {
		if (assetConfig.hasOwnProperty(key)) {
			_this[key] = assetConfig[key];
		}
	}

	_this.update = function () {

	};
}

function Platform (config) {
	var _this = this,
		typeBase = app.assetCollection.assets.platforms[config.type];

	_this.tag = 'platform';
	_this.type = config.type;
	_this.maxShield = PLATFORM_INITIAL_MAX_SHIELD;
	_this.shield = _this.maxShield;
	_this.buildings = config.buildings || [];
	_this.tiles = config.tiles || [];
	_this.corePosition = config.position.clone();
	_this.collider = new SL.Circle(_this.corePosition, PLATFORM_SHIELD_SIZE);
	_this.rotation = config.rotation || 0;

	for (var i = 0; i < typeBase.length; i++) {
		_this.tiles.push(new Tile({
			position: config.position.getTranslated(new SL.Vec2(typeBase[i].x * TILE_SIZE.x, typeBase[i].y * TILE_SIZE.y)),
			platform: _this
		}));
		 if (config.rotation) {
			_this.tiles[i].sprite.position.rotate(config.position, config.rotation);
			_this.tiles[i].collider.setLocation(_this.tiles[i].sprite.position);
		}

		app.currentScene.addEntity(_this.tiles[i]);
	}

	_this.update = function () {

	};
}

function Player () {
	var _this = this;

	_this.buildings = app.assetCollection.assets.buildings;
	_this.selection = null;
	_this.previousSelection = null;
	_this.uiRequests = [];

	_this.update = function () {
		var mouseCollider = {
				rect: new SL.Rect(app.mouseLocation.getTranslated(app.currentScene.camera.position.getScaled(-1)), new SL.Vec2(1, 1)),
				circle: new SL.Circle(app.mouseLocation.getTranslated(app.currentScene.camera.position.getScaled(-1)), 1)
			},
			tiles = app.currentScene.getEntitiesByTag('tile'),
			hoverTile;

		for (var i = 0; i < tiles.length; i++) {
			if (mouseCollider.rect.intersects(tiles[i].collider)) {
				tiles[i].state = 'active';
				hoverTile = tiles[i];
				break;
			}
		}

		if (app.onMouseUp() && hoverTile && (!_this.selection || _this.selection.entityID !== hoverTile.entityID)) {
			if (hoverTile.building && (!_this.selection || _this.selection.entityID !== hoverTile.building.entityID)) {
				_this.previousSelection = _this.selection ? _this.selection : null;
				_this.selection = hoverTile.building;
			} else {
				_this.previousSelection = _this.selection ? _this.selection : null;
				_this.selection = hoverTile;
			}
			_this.updateUI();
		}
	}

	_this.updateUI = function () {
		if (_this.selection.building) {

		} else {

		}
	};

	_this.requestUIUpdate = function () {

	};
}

var ColorReplaceFilter = function (findColor, replaceWithColor, range) {
	PIXI.AbstractFilter.call(this);

	this.uniforms = {
		findColor: {type: '3f', value: null},
		replaceWithColor: {type: '3f', value: null},
		range: {type: '1f', value: null}
	};

	this.findColor = findColor;
	this.replaceWithColor = replaceWithColor;
	this.range = range;

	this.passes = [this];

	this.fragmentSrc = [
	'precision mediump float;',
	'varying vec2 vTextureCoord;',
	'uniform sampler2D texture;',
	'uniform vec3 findColor;',
	'uniform vec3 replaceWithColor;',
	'uniform float range;',
	'void main(void) {',
	'  vec4 currentColor = texture2D(texture, vTextureCoord);',
	'  vec3 colorDiff = findColor - (currentColor.rgb / max(currentColor.a, 0.0000000001));',
	'  float colorDistance = length(colorDiff);',
	'  float doReplace = step(colorDistance, range);',
	'  gl_FragColor = vec4(mix(currentColor.rgb, (replaceWithColor + colorDiff) * currentColor.a, doReplace), currentColor.a);',
	'}'
	];

	//console.log(this.fragmentSrc.join(''));
};

ColorReplaceFilter.prototype = Object.create(PIXI.AbstractFilter.prototype);
ColorReplaceFilter.prototype.constructor = ColorReplaceFilter;


Object.defineProperty(ColorReplaceFilter.prototype, 'findColor', {
	set: function (value) {
		var r = ((value & 0xFF0000) >> 16) / 255,
		g = ((value & 0x00FF00) >> 8) / 255,
		b = (value & 0x0000FF) / 255;
		this.uniforms.findColor.value = {x: r, y: g, z: b};
		this.dirty = true;
	}
});

Object.defineProperty(ColorReplaceFilter.prototype, 'replaceWithColor', {
	set: function (value) {
		var r = ((value & 0xFF0000) >> 16) / 255,
		g = ((value & 0x00FF00) >> 8) / 255,
		b = (value & 0x0000FF) / 255;
		this.uniforms.replaceWithColor.value = {x: r, y: g, z: b};
		this.dirty = true;
	}
});


Object.defineProperty(ColorReplaceFilter.prototype, 'range', {
	set: function (value) {
		this.uniforms.range.value = value;
		this.dirty = true;
	}
});
