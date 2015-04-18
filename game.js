SL = sugarLab;

var SCREEN_SIZE = new SL.Vec2(800, 600);

function logPlay() {
	_gaq.push(['_trackEvent', 'Button', 'Play']);
}

function moveModal() {
	var $modal = $('.modal'),
		gameOffset = $(app.canvas).offset();

	$modal.offset({
		top: gameOffset.top - 5,
		left: gameOffset.left - 5
	});
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
		moveModal();
		$(window).resize(function() {
			moveModal();
		});

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
			app.currentScene.addEntity(new Spawner());
			app.currentScene.addEntity(new Player());
		}, app);

		var scoreScene = new SL.Scene('score', [], function(entities) {
			var modal = $('.modal'),
				scoreText = new PIXI.Text('Score: ' + entities[0].score, {
					font: '18px Arial',
					fill: 'red'
				});

			modal.append(domjs.build(templates.score));
			modal.show();

			$('.menu .button').on('click', function() {
				modal.empty();
				modal.off();
				app.transitionScene($(this).attr('id'));
			});

			scoreText.position.x = 350;
			scoreText.position.y = 400;

			this.stage.addChild(scoreText);

			$('.twitter-share-button').attr('href',
				'https://twitter.com/share?url=http://synsugarstudio.com/ld31&hashtags=ld31,bahhumbug&text=I scored ' +
				entities[0].score + ' on Bah! Humbug!');
		}, app);

		app.addScene(loadingScene);
		app.addScene(menuScene);
		app.addScene(gameScene);
		app.addScene(scoreScene);
		app.transitionScene('loading');

		app.start();
	});
}

function Ship (config) {
	var _this = this;

	_this.shield = new Shield();
	_this.launchers = [];
	_this.corePosition = config.position.clone();
}
