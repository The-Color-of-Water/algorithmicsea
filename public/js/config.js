//CONFIG
const enumColor = { R: 'R', G: 'G', B: 'B', H: 'H', S: 'S', L: 'L' }

let config = {
	bgColor: '#FFFFFF',

	//grid
	gridSize: 20,
	plotX: 'S',
	plotY: 'L',
	plotZ: 'H',
	showImage: false,
	moviment: false,
	intensity: 0.45,
	contour: 2,
	waveAmplitude: -100,

	//mapping
	mappingEnabled: false,
	mappingSquare1: true,
	mappingSquare2: true,
	mappingSquare3: true,
	mappingPosX: 0,
	mappingPosY: 0,
	mappingPosZ: 0,
	mappingScale: 1,

	//fog
	fogX: 0,
	fogY: -0.3,
	fogSizeX: 0.1,
	fogSizeY: 1,
	fogPower: 2
};

function initGui(mapping){
	let gui = new dat.GUI({closeOnTop:true, hideable:true});

	//grid
	var gridFolder = gui.addFolder("grid");
	gridFolder.add(config, 'gridSize', 10, 100, 5);

	var plotX = gridFolder.add(config, 'plotX', enumColor);
	var plotY = gridFolder.add(config, 'plotY', enumColor);
	var plotZ = gridFolder.add(config, 'plotZ', enumColor);

	gridFolder.add(config, 'showImage');
	gridFolder.add(config, 'moviment');
	gridFolder.add(config, 'intensity', 0, 1, 0.01);
	gridFolder.add(config, 'contour', 0, 3, 0.1);
	gridFolder.add(config, 'waveAmplitude', -500, 500, 1);

	gridFolder.close();

	//mapping
	var mappingFolder = gui.addFolder("mapping");

	var mappingEnabled = mappingFolder.add(config, 'mappingEnabled');
	mappingEnabled.onChange(() => mapping.toggleMapping());
	
	mappingFolder.add(config, 'mappingSquare1');
	mappingFolder.add(config, 'mappingSquare2');
	mappingFolder.add(config, 'mappingSquare3');
	
	mappingFolder.add(config, 'mappingPosX', -1000, 1000, 1);
	mappingFolder.add(config, 'mappingPosY', -1000, 1000, 1);
	mappingFolder.add(config, 'mappingPosZ', -1000, 1000, 1);
	mappingFolder.add(config, 'mappingScale', 0, 3, 0.01);

	//fog
	var fogFolder = gui.addFolder("fog");
	fogFolder.addColor(config, 'bgColor');
	fogFolder.add(config, 'fogX', -1, 1, 0.1);
	fogFolder.add(config, 'fogY', -1, 1, 0.1);
	fogFolder.add(config, 'fogSizeX', 0.1, 5, 0.1);
	fogFolder.add(config, 'fogSizeY', 0.1, 5, 0.1);
	fogFolder.add(config, 'fogPower', 0.1, 8, 0.1);

	//general
	config.save = () => mapping.saveMapping();
	gui.add(config, 'save');

	config.load = () => mapping.loadMapping();
	gui.add(config, 'load');

	config.reset = () => mapping.resetMapping();
	gui.add(config, 'reset');

	gui.__proto__.constructor.toggleHide();
}