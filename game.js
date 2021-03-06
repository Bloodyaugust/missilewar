SL = sugarLab;

PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST;

var SCREEN_SIZE = new SL.Vec2(document.documentElement.clientWidth, document.documentElement.clientHeight),
	TILE_SIZE = new SL.Vec2(64, 64),
	PLATFORM_INITIAL_MAX_SHIELD = 100,
	PLATFORM_INITIAL_ENERGY = 500,
	PLATFORM_PASSIVE_ENERGY_INCOME = 2,
	CAMERA_PAN_SPEED = 200,
	DEGREES_TO_RADIANS = 0.0174532925,
	KEYS = {
		"up": 87,
		"down": 83,
		"left": 65,
		"right": 68
	};

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

			$('.game-ui').show();

			app.currentScene.addEntity(new Platform({
				position: new SL.Vec2(SCREEN_SIZE.x / 2, SCREEN_SIZE.y - 256),
				type: 'basic',
				trim: 0xFF0000
			}));
			app.currentScene.addEntity(new Platform({
				position: new SL.Vec2(SCREEN_SIZE.x / 2, 192),
				type: 'basic',
				facing: {x: 1, y: -1},
				trim: 0x0000FF
			}));
			app.currentScene.addEntity(new Platform({
				position: new SL.Vec2(256, SCREEN_SIZE.y / 2 - 128),
				type: 'basic',
				facing: {x: -1, y: -1},
				trim: 0x00FF00
			}));
			app.currentScene.addEntity(new Platform({
				position: new SL.Vec2(SCREEN_SIZE.x - 256, SCREEN_SIZE.y / 2 - 128),
				type: 'basic',
				facing: {x: -1, y: -1},
				trim: 0xFF2500
			}));
			app.currentScene.addEntity(new Platform({
				position: new SL.Vec2(SCREEN_SIZE.x - 256, SCREEN_SIZE.y / 2 + 256),
				type: 'basic',
				facing: {x: -1, y: 1},
				trim: 0x590059
			}));
			app.currentScene.addEntity(new Platform({
				position: new SL.Vec2(256, SCREEN_SIZE.y / 2 + 256),
				type: 'basic',
				facing: {x: -1, y: 1},
				trim: 0xFFFF00
			}));
			app.currentScene.addEntity(new Player());

			app.currentScene.stage.setBackgroundColor(0x000000);
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
		assetConfig = app.assetCollection.assets.projectiles[config.type];

	_this.silo = config.silo;
	_this.state = 'idle';
	_this.tag = 'projectile';
	_this.type = config.type;
	_this.target = config.target;
	_this.sprite = new PIXI.Sprite(app.assetCollection.getTexture('projectile-' + config.type));
	_this.sprite.position = _this.silo.collider.origin.clone();
	_this.sprite.origin = new SL.Vec2(0.5, 0.5);
	_this.sprite.rotation = (180 + _this.sprite.position.angleBetween(_this.target.collider.origin)) * DEGREES_TO_RADIANS;
	_this.sprite.shader = new ColorReplaceFilter(0xFFFFFF, config.silo.platform.trim, 0.1);
	_this.collider = new SL.Circle(_this.sprite.position, 2);
	_this.direction = _this.sprite.position.getDirectionVector(_this.target.collider.origin);

	for (var key in assetConfig) {
		if (assetConfig.hasOwnProperty(key)) {
			_this[key] = assetConfig[key];
		}
	}

	_this.update = function () {
		if ((!_this.target || _this.target.state === "exploding" || _this.target.state === "exploded" || _this.target.state === null) && _this.state !== 'exploded') {
			_this.state = 'exploding';
		}

		if (_this.state !== 'exploding' && _this.state !== 'exploded') {
			_this.sprite.position.translate(_this.direction.getScaled(_this.speed * app.deltaTime));
			_this.collider.translate(_this.direction.getScaled(_this.speed * app.deltaTime));

			if(_this.target.platform.collider.intersects(_this.collider) && _this.target.platform.shieldState === "active") {
				_this.state = 'exploding';
				_this.target.platform.shield -= _this.damage;
			} else if (_this.target.collider.intersects(_this.collider)) {
				_this.state = 'exploding';
				_this.target.health -= _this.damage;
			}
		} else if (_this.state === "exploding") {
			_this.state = "exploded";
		} else if (_this.state === "exploded") {
			app.currentScene.removeEntity(_this);
		}
	};
}

function Tile (config) {
	var _this = this;

	_this.idleTexture = app.assetCollection.getTexture('tile');
	_this.activeTexture = app.assetCollection.getTexture('tile-active');
	_this.sprite = new PIXI.Sprite(app.assetCollection.getTexture('tile'));
	_this.sprite.position = config.position.clone();
	_this.sprite.shader = new ColorReplaceFilter(0xFFFFFF, 0xFFFFFF, 0.1);
	_this.tag = 'tile';
	_this.type = 'tile';
	_this.collider = new SL.Rect(config.position, TILE_SIZE);
	_this.platform = config.platform;
	_this.building = null;
	_this.state = 'idle';

	_this.update = function () {

	};

	_this.setState = function (state) {
		_this.state = state;

		if (_this.state === 'active') {
			_this.sprite.setTexture(_this.activeTexture);
		} else {
			_this.sprite.setTexture(_this.idleTexture);
		}
	};
}

function Building (config) {
	var _this = this,
		assetConfig;

	_this.tag = 'building';
	_this.platform = config.platform;
	_this.tile = config.tile;
	_this.type = config.type;
	_this.subType = config.subType || null;
	_this.sprite = new PIXI.Sprite(app.assetCollection.getTexture(config.subType ? config.type + '-' + config.subType : config.type));
	_this.sprite.position = _this.tile.collider.origin.clone();
	_this.sprite.shader = new ColorReplaceFilter(0xFFFFFF, config.platform.trim, 0.1);
	_this.sprite.anchor = new SL.Vec2(0.5, 0.5);
	_this.state = 'idle';
	_this.collider = new SL.Circle(_this.tile.collider.origin, TILE_SIZE.x / 4);

	if (_this.subType) {
		assetConfig = app.assetCollection.assets.buildings[_this.type][_this.subType];
	} else {
		assetConfig = app.assetCollection.assets.buildings[_this.type];
	}

	for (var key in assetConfig) {
		if (assetConfig.hasOwnProperty(key)) {
			_this[key] = assetConfig[key];

			if (key === "interval") {
				_this.timeToEvent = assetConfig[key];
			}
		}
	}

	if (_this.type === "booster") {
		_this.platform.maxShield += _this.boostAmount;
	}

	if (_this.type === "silo") {
		_this.projectileQueue = [_this.autofire];
		_this.timeToFire = _this.fireDelay;
		_this.target = null;
	}

	_this.update = function () {
		if (_this.health <= 0 && _this.state !== "exploded") {
			_this.state = "exploding";
		}

		if (_this.state === "idle") {
			_this.timeToEvent !== undefined && _this.timeToEvent !== null ? _this.timeToEvent -= app.deltaTime : null;
		}

		if (_this.state !== "exploding" && _this.state !== "exploded") {
			if (_this.timeToEvent !== undefined && _this.timeToEvent !== null && _this.timeToEvent <= 0) {
				if (_this.type === "generator") {
					_this.platform.energy += _this.amount;
				} else if (_this.type === "silo") {
					_this.target = _this.platform.findTarget();
					_this.state = "firing";
					_this.timeToFire = 0;
				} else if (_this.type === "booster") {
					_this.platform.regenShield(_this.regenAmount);
				}

				_this.timeToEvent = _this.interval;
			}

			if (_this.state === "firing") {
				_this.timeToFire -= app.deltaTime;

				 if (_this.timeToFire <= 0) {
					if (_this.projectileQueue.length === 0) {
						_this.state = "idle";
						_this.queueProjectile(_this.autofire);
						_this.timeToFire = 0;
					} else {
						_this.fire();
						_this.timeToFire = _this.fireDelay;
					}
				}
			}
		} else if (_this.state !== "exploded") {
			_this.state = "exploded";
		} else {
			if (_this.type !== "command") {
				_this.tile.building = null;
				app.currentScene.removeEntity(_this);
			}
		}
	};

	_this.upgrade = function (subType) {
		var hasUpgrade = false,
			assetConfig;

		for (var i = 0; i < _this.upgrades.length; i++) {
			if (_this.upgrades[i] === subType) {
				hasUpgrade = true;
				break;
			}
		}

		if (hasUpgrade) {
			_this.platform.maxShield -= _this.type === "booster" ? _this.boostAmount : 0;

			_this.subType = subType;
			_this.sprite.setTexture(app.assetCollection.getTexture(_this.type + '-' + _this.subType));
			assetConfig = app.assetCollection.assets.buildings[_this.type][_this.subType];

			for (var key in assetConfig) {
				if (assetConfig.hasOwnProperty(key)) {
					_this[key] = assetConfig[key];
				}
			}

			_this.platform.maxShield += _this.type === "booster" ? _this.boostAmount : 0;
		}
	};

	_this.queueProjectile = function (type) {
		if (_this.projectileQueue.length < _this.capacity && _this.state !== "firing" && _this.platform.energy - app.assetCollection.assets.projectiles[type].cost > 0) {
			_this.projectileQueue.push(type);
			_this.platform.energy -= app.assetCollection.assets.projectiles[type].cost;
		}
	};

	_this.fire = function () {
		var type = _this.projectileQueue.pop();

		if (_this.target.type === null) {
			_this.target = _this.platform.findTarget();
		}

		app.currentScene.addEntity(new Projectile({
			silo: _this,
			type: type,
			target: _this.target
		}));
	};

	_this.sell = function () {

	};
}

function Platform (config) {
	var _this = this,
		typeBase = app.assetCollection.assets.platforms[config.type],
		maxDistance = 0,
		building;

	_this.tag = 'platform';
	_this.type = config.type;
	_this.trim = config.trim;
	_this.maxShield = PLATFORM_INITIAL_MAX_SHIELD;
	_this.shield = _this.maxShield;
	_this.shieldState = 'active';
	_this.shieldSprite = new PIXI.Sprite(app.assetCollection.getTexture('shield'));
	_this.shieldSprite.anchor = new SL.Vec2(0.5, 0.5);
	_this.energy = PLATFORM_INITIAL_ENERGY;
	_this.buildings = config.buildings || [];
	_this.tiles = config.tiles || [];
	_this.corePosition = config.position.clone();
	_this.facing = config.facing || {x: 1, y: 1};
	_this.command = null;

	for (var i = 0; i < typeBase.length; i++) {
		maxDistance = Math.abs(typeBase[i].x) > maxDistance ? Math.abs(typeBase[i].x) : maxDistance;
		maxDistance = Math.abs(typeBase[i].y) > maxDistance ? Math.abs(typeBase[i].y) : maxDistance;

		_this.tiles.push(new Tile({
			position: config.position.getTranslated(new SL.Vec2(_this.facing.x * typeBase[i].x * TILE_SIZE.x, _this.facing.y * typeBase[i].y * TILE_SIZE.y)),
			platform: _this
		}));

		if (typeBase[i].building) {
			_this.tiles[i].building = new Building({
				type: typeBase[i].building.type,
				subType: typeBase[i].building.subType,
				platform: _this,
				tile: _this.tiles[i]
			});

			if (typeBase[i].building.type === "command") {
				_this.command = _this.tiles[i].building;
			}
		}

		app.currentScene.addEntity(_this.tiles[i]);
		if (typeBase[i].building) {
			app.currentScene.addEntity(_this.tiles[i].building);
		}
	}

	_this.collider = new SL.Circle(_this.command.collider.origin, (maxDistance + 2) * TILE_SIZE.x);
	_this.shieldSprite.width = _this.collider.diameter;
	_this.shieldSprite.height = _this.collider.diameter;
	_this.shieldSprite.position = _this.command.collider.origin.clone();

	app.currentScene.camera.addChild(_this.shieldSprite);

	_this.update = function () {
		_this.energy += PLATFORM_PASSIVE_ENERGY_INCOME * app.deltaTime;

		if (_this.shieldState === "active") {
			_this.shieldSprite.alpha = SL.Tween.lerp(0, 1, _this.shield/_this.maxShield);
		}

		if (_this.shield <= 0) {
			_this.shieldState = 'recharging';
			_this.shieldSprite.alpha = 0;
		} else if (_this.shieldState === 'recharging') {
			if (_this.shield >= _this.maxShield * 0.25) {
				_this.shieldState = 'active';
			}
		}
	};

	_this.regenShield = function (amount) {
		_this.shield = _this.shield + amount > _this.maxShield ? _this.maxShield : _this.shield + amount;
	};

	_this.findTarget = function () {
		var platforms = app.currentScene.getEntitiesByTag('platform'),
			targetPlatform, targetBuilding, commandBuilding;

		for (var i = 0; i < platforms.length; i++) {
			if (platforms[i].entityID !== _this.entityID) {
				targetPlatform = platforms[i];
				break;
			}
		}

		for (i = 0; i < targetPlatform.tiles.length; i++) {
			if (targetPlatform.tiles[i].building) {
				if (targetPlatform.tiles[i].building.type === "command") {
					commandBuilding = targetPlatform.tiles[i].building;
				} else {
					targetBuilding = targetPlatform.tiles[i].building;
					break;
				}
			}
		}

		targetBuilding = targetBuilding ? targetBuilding : commandBuilding;

		return targetBuilding;
	};
}

function Player () {
	var _this = this,
		tileBuildables = ["silo-rocket", "generator-solar", "booster-small"];

	_this.buildings = app.assetCollection.assets.buildings;
	_this.selection = null;
	_this.previousSelection = null;
	_this.time = 0;
	_this.platform = app.currentScene.getEntitiesByTag('platform')[0];

	$('.build-option').on('click', handleBuild);

	_this.update = function () {
		var mouseCollider = {
				rect: new SL.Rect(app.mouseLocation.getTranslated(app.currentScene.camera.position.getScaled(-1)), new SL.Vec2(1, 1)),
				circle: new SL.Circle(app.mouseLocation.getTranslated(app.currentScene.camera.position.getScaled(-1)), 1)
			},
			tiles = app.currentScene.getEntitiesByTag('tile'),
			hoverTile;

		_this.updateUI();

		if (app.isKeyDown(KEYS.up)) {
			app.currentScene.camera.position.translate(new SL.Vec2(0, CAMERA_PAN_SPEED * app.deltaTime));
		} else if (app.isKeyDown(KEYS.down)) {
			app.currentScene.camera.position.translate(new SL.Vec2(0, -CAMERA_PAN_SPEED * app.deltaTime));
		}
		if (app.isKeyDown(KEYS.left)) {
			app.currentScene.camera.position.translate(new SL.Vec2(CAMERA_PAN_SPEED * app.deltaTime, 0));
		} else if (app.isKeyDown(KEYS.right)) {
			app.currentScene.camera.position.translate(new SL.Vec2(-CAMERA_PAN_SPEED * app.deltaTime, 0));
		}

		for (var i = 0; i < tiles.length; i++) {
			if (mouseCollider.rect.intersects(tiles[i].collider) && tiles[i].platform.entityID === _this.platform.entityID) {
				tiles[i].state = 'active';
				hoverTile = tiles[i];
				break;
			}
		}

		if (app.onMouseUp() && hoverTile) {
			if (!_this.selection) {
				if (hoverTile.building) {
					_this.selection = hoverTile.building;
				} else {
					_this.selection = hoverTile;
					hoverTile.setState('active');
				}
				_this.previousSelection = null;
			} else {
				if (hoverTile.building && _this.selection.entityID !== hoverTile.building.entityID) {
					_this.previousSelection = _this.selection;
					_this.selection = hoverTile.building;
				} else {
					if (!hoverTile.building) {
						_this.previousSelection = _this.selection;
						_this.selection = hoverTile;
						_this.selection.setState('active');
					}
				}
			}
			_this.updateSelectionUI();

			if (_this.previousSelection && _this.previousSelection.type === 'tile' && _this.selection.entityID !== _this.previousSelection.entityID) {
				_this.previousSelection.setState('idle');
			}
		}
	}

	function handleBuild(e) {
		var newBuilding;

		if (_this.selection.type === 'tile') {
			newBuilding = new Building({
				type: e.currentTarget.dataset.type,
				subType: e.currentTarget.dataset.subtype,
				platform: _this.platform,
				tile: _this.selection
			});

			_this.selection.building = newBuilding;
			_this.selection.setState('idle');
			app.currentScene.addEntity(newBuilding);

			_this.previousSelection = _this.selection;
			_this.selection = newBuilding;

			_this.updateSelectionUI();
		} else if (e.currentTarget.dataset.type !== 'projectile') {
			_this.selection.upgrade(e.currentTarget.dataset.subtype);
			_this.previousSelection = null;

			_this.updateSelectionUI();
		} else {
			_this.selection.queueProjectile(e.currentTarget.dataset.subtype);
		}
	};

	_this.updateUI = function () {
		_this.time += app.deltaTime;
		window['play-time'].innerHTML = Math.floor(_this.time / 60).toString() + ':' + (_this.time % 60 < 10 ? '0' + Math.floor(_this.time % 60) : Math.floor(_this.time % 60));
		window['player-platform-shield'].innerHTML = Math.floor(_this.platform.shield) + '/' + Math.floor(_this.platform.maxShield);
		window['player-platform-energy'].innerHTML = Math.floor(_this.platform.energy);

		//TODO: write selection stat update code
		/*if (_this.selection) {
			window['selection-item-' + _this.selection.type + (_this.selection.subType ? '-' + _this.selection.subType : '')].health = _this.selection.health;
		}*/
	};

	_this.updateSelectionUI = function () {
		$('.build-option').hide();
		$('.selection-item').hide();

		if (_this.previousSelection && _this.previousSelection.type !== 'tile') {
			window['selection-item-' + _this.previousSelection.type + (_this.previousSelection.subType ? '-' + _this.previousSelection.subType : '')].style.display = 'none';
		}

		if (_this.selection) {
			if (_this.selection.type === 'tile') {
				for (var i = 0; i < tileBuildables.length; i++) {
					window['build-option-' + tileBuildables[i]].style.display = 'initial';
				}
			} else {
				window['selection-item-' + _this.selection.type + (_this.selection.subType ? '-' + _this.selection.subType : '')].style.display = 'initial';

				if (_this.selection.upgrades) {
					for (i = 0; i < _this.selection.upgrades.length; i++) {
						window['build-option-' + _this.selection.type + '-' + _this.selection.upgrades[i]].style.display = 'initial';
					}
				}

				if (_this.selection.fires) {
					for (i = 0; i < _this.selection.fires.length; i++) {
						window['build-option-projectile-' + _this.selection.fires[i]].style.display = 'initial';
					}
				}
			}
		}
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
