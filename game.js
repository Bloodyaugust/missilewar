SL = sugarLab;

var SCREEN_SIZE = new SL.Vec2(document.documentElement.clientWidth, document.documentElement.clientHeight),
	TILE_SIZE = new SL.Vec2(64, 64),
	COLLIDER_SIZE = 64,
	SHIP_INITIAL_MAX_SHIELD = 100;

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

function Tile (config) {
	var _this = this;

	_this.sprite = new PIXI.Sprite(app.assetCollection.getTexture('tile'));
	_this.sprite.position = config.position.clone();
	_this.tag = 'tile';
	_this.collider = new SL.Circle(config.position, COLLIDER_SIZE);
	_this.ship = config.ship;
	_this.building = null;

	_this.update = function () {

	};
}

function Building (config) {
	var _this = this;

	_this.sprite = new PIXI.Sprite(app.assetCollection.getTexture('tile'));
	_this.sprite.position = config.position.clone();
	_this.tag = 'building';
	_this.ship = config.ship;
	_this.tile = config.tile;

	_this.update = function () {

	};
}

function Ship (config) {
	var _this = this,
		typeBase = app.assetCollection.assets.ships[config.type];

	_this.tag = 'ship';
	_this.type = config.type;
	_this.maxShield = SHIP_INITIAL_MAX_SHIELD;
	_this.shield = _this.maxShield;
	_this.buildings = config.buildings || [];
	_this.tiles = config.tiles || [];
	_this.corePosition = config.position.clone();

	for (var i = 0; i < typeBase.length; i++) {
		_this.tiles.push(new Tile({
			position: config.position.getTranslated(new SL.Vec2(typeBase[i].x * TILE_SIZE.x, typeBase[i].y * TILE_SIZE.y)),
			ship: _this
		}));
	}
}

function makeShip (config) {
	var newShip = new Ship({
		position: config.position,
		type: 'basic'
	});


}
